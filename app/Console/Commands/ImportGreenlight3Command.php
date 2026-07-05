<?php

// SPDX-FileCopyrightText: 2026 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\RoomLobby;
use App\Enums\RoomUserRole;
use App\Models\Meeting;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomFile;
use App\Models\RoomType;
use App\Models\User;
use App\Settings\GeneralSettings;
use Illuminate\Console\Command;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\File\Exception\FileNotFoundException;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\progress;
use function Laravel\Prompts\select;
use function Laravel\Prompts\text;

class ImportGreenlight3Command extends Command
{
    protected $signature = 'import:greenlight-v3
                            {host : ip or hostname of postgres database server}
                            {port : port of postgres database server}
                            {database : Greenlight database name, see Greenlight .env variable DB_NAME}
                            {username : Greenlight database username, see Greenlight .env variable DB_USERNAME}
                            {password : Greenlight database password, see Greenlight .env variable DB_PASSWORD}
                            {--no-confirm : do not ask if the import should be committed}
                            {--default-role= : name of the default role for imported local users}
                            {--room-prefix= : prefix for imported room names (empty string is allowed)}
                            {--room-type= : name of the room type for imported rooms}
                            {--presentation-path= : path to room presentations, relative to /storage/app}
                            ';

    protected $description = 'Connect to Greenlight PostgreSQL database to import users, rooms and shared room accesses';

    protected $importedPresentationFiles = [];

    public function handle()
    {
        try {
            // Ask user what room type the imported rooms should get
            $roomType = ! is_null($this->option('room-type'))
                ? RoomType::whereLike('name', $this->option('room-type'))->firstOrFail()->id
                : select(
                    label: 'What room type should the rooms be assigned to?',
                    options: RoomType::pluck('name', 'id'),
                    scroll: 10
                );

            // Ask user to add prefix to room names
            $prefix = ! is_null($this->option('room-prefix'))
                ? $this->option('room-prefix')
                : text(
                    label: 'Prefix for room names',
                    placeholder: 'E.g. (Imported)',
                    hint: '(Optional).'
                );
            $prefix = $prefix !== '' ? $prefix : null;

            // Ask user what role to assign to imported local users
            $defaultRole = ! is_null($this->option('default-role'))
                ? Role::whereLike('name', $this->option('default-role'))->firstOrFail()->id
                : select(
                    'Please select the default role for new imported local users',
                    options: Role::pluck('name', 'id'),
                    scroll: 10
                );

            // Ask user for presentation path and validate it is a directory
            $presentationPath = ! is_null($this->option('presentation-path'))
                ? $this->option('presentation-path')
                : text(
                    label: 'Path to GL3 room presentations',
                    placeholder: 'E.g. migration/presentations',
                );
            if (! Storage::directoryExists($presentationPath)) {
                throw new \Exception('Cannot read presentation directory at '.$presentationPath);
            }
        } catch (\Exception $e) {
            $this->error('Import failed: '.$e->getMessage());

            return 2;
        }

        // Read Greenlight 3 data from database
        config(['database.connections.greenlight' => [
            'driver' => 'pgsql',
            'host' => $this->argument('host'),
            'database' => $this->argument('database'),
            'username' => $this->argument('username'),
            'password' => $this->argument('password'),
            'port' => $this->argument('port'),
            'charset' => 'utf8',
            'prefix' => '',
            'prefix_indexes' => true,
            'schema' => 'public',
            'sslmode' => 'prefer',
        ]]);

        $users = DB::connection('greenlight')->table('users')->where('provider', 'greenlight')->get(['id', 'name', 'email', 'external_id', 'password_digest']);
        $rooms = DB::connection('greenlight')->table('rooms')->get(['id', 'friendly_id', 'meeting_id', 'user_id', 'name']);
        $sharedAccesses = DB::connection('greenlight')->table('shared_accesses')->get(['room_id', 'user_id']);

        // Start transaction to rollback if import fails or user cancels
        DB::beginTransaction();

        try {
            $userMap = $this->importUsers($users, $defaultRole);
            $roomMap = $this->importRooms($rooms, $roomType, $userMap, $prefix);
            $this->importPresentations($roomMap, $presentationPath);
            $this->importSharedAccesses($sharedAccesses, $roomMap, $userMap);

            if ($this->option('no-confirm') || confirm('Do you wish to commit the import?')) {
                DB::commit();
                $this->info('Import completed');
            } else {
                $this->rollback();
                $this->warn('Import canceled; nothing was imported');
            }
        } catch (\Exception $e) {
            $this->rollback();
            $this->error('Import failed: '.$e->getMessage());

            return 1;
        }
    }

    /**
     * Rollback an import
     */
    protected function rollback()
    {
        foreach ($this->importedPresentationFiles as $file) {
            try {
                Storage::delete($file);
            } catch (\Exception $e) {
                $this->error('Deleting imported presentation '.$file.' failed: '.$e->getMessage());
            }
        }
        DB::rollBack();
    }

    /**
     * Process greenlight user collection and try to import users
     *
     * @param  Collection  $users  Collection with all users found in the greenlight database
     * @param  int  $defaultRole  IDs of the role that should be assigned to new local users
     * @return array<string, int> Array map of greenlight user ids as key and id of the found/created user as value
     */
    protected function importUsers(Collection $users, int $defaultRole): array
    {
        $this->line('Importing users');
        $userMap = [];

        $bar = progress(label: 'Importing users', steps: $users->count());
        $bar->start();

        // counter of user ids that already exists
        $existed = 0;
        // counter of users that are created
        $created = 0;

        foreach ($users as $user) {
            // check if user with this email exists
            $dbUser = User::where('email', $user->email)->first();
            if ($dbUser != null) {
                // user found, link greenlight user id to id of found user
                $existed++;
            } else {
                // create new user
                $dbUser = new User;
                $dbUser->authenticator = $user->external_id ? 'oidc' : 'local';
                $dbUser->external_id = $user->external_id;
                $dbUser->email = $user->email;
                // as greenlight doesn't split the name in first and lastname,
                // we have to import it as firstname and ask the users or admins to correct it later if desired
                $dbUser->firstname = $user->name;
                $dbUser->lastname = '';
                $dbUser->password = $user->external_id ? Hash::make(Str::random()) : $user->password_digest;
                $dbUser->locale = config('app.locale');
                $dbUser->timezone = app(GeneralSettings::class)->default_timezone;
                $dbUser->save();

                if (! $user->external_id) {
                    $dbUser->roles()->attach($defaultRole);
                }

                // user was successfully created, link greenlight user id to id of new user
                $created++;
            }
            $userMap[$user->id] = $dbUser->id;
            $bar->advance();
        }

        $bar->finish();

        // show import results
        $this->line('');
        $this->info($created.' created, '.$existed.' skipped (already existed)');

        $this->line('');

        return $userMap;
    }

    /**
     *  Process greenlight room collection and create the rooms if not already existing
     *
     * @param  Collection  $rooms  Collection with rooms users found in the greenlight database
     * @param  int  $roomType  ID of the roomtype the rooms should be assigned to
     * @param  array<string, int>  $userMap  Array map of greenlight user ids as key and id of the found/created user as value
     * @param  string|null  $prefix  Prefix to add to room names
     * @return array<string, int> Array map of greenlight room ids as key and id of the created room as value
     */
    protected function importRooms(Collection $rooms, int $roomType, array $userMap, ?string $prefix): array
    {
        $this->line('Importing rooms');

        $bar = $this->output->createProgressBar($rooms->count());
        $bar->start();

        // counter of room ids that already exists
        $existed = 0;
        // counter of rooms that are created
        $created = 0;
        // list of rooms that could not be created, e.g. room owner not found
        $failed = [];
        // array with the key being the greenlight id and value the new object id
        $roomMap = [];

        // walk through all found greenlight rooms
        foreach ($rooms as $room) {
            // check if a room with the same id exists
            $dbRoom = Room::find($room->friendly_id);
            if ($dbRoom != null) {
                // if found add counter but not add to room map
                // this also prevents adding shared access, as we can't know if this id collision belongs to the same room
                // and a shared access import is desired
                $existed++;
                $bar->advance();

                continue;
            }

            // try to find owner of this room
            if (! isset($userMap[$room->user_id])) {
                // if owner was not found, eg. missing in the greenlight db or user import failed, don't import room
                array_push($failed, [$room->name, $room->friendly_id]);
                $bar->advance();

                continue;
            }

            // create room with same id, same name, access code
            $dbRoom = new Room;
            $dbRoom->expert_mode = true; // set expert mode to true for imported rooms, as many settings are considered expert mode settings and have not effect is expert mode is disabled
            $dbRoom->id = $room->friendly_id;
            $dbRoom->name = Str::limit((! is_null($prefix) ? ($prefix.' ') : '').$room->name, 253); // if prefix given, add prefix separated by a space from the title; truncate after 253 chars to prevent too long room names
            $roomOptions = DB::connection('greenlight')->table('room_meeting_options')->join('meeting_options', 'meeting_option_id', '=', 'meeting_options.id')->where('room_id', $room->id)->get(['name', 'value']);

            // set room settings
            foreach ($roomOptions as $option) {
                switch ($option->name) {
                    case 'glAnyoneCanStart':
                        $dbRoom->everyone_can_start = $option->value === 'true';
                        break;
                    case 'glAnyoneJoinAsModerator':
                        $dbRoom->default_role = $option->value === 'true' ? RoomUserRole::MODERATOR : RoomUserRole::USER;
                        break;
                    case 'glRequireAuthentication':
                        $dbRoom->allow_guests = $option->value === 'false';
                        break;
                    case 'glViewerAccessCode':
                        $dbRoom->access_code = $option->value;
                        break;
                    case 'guestPolicy':
                        $dbRoom->lobby = $option->value == 'ASK_MODERATOR' ? RoomLobby::ENABLED : RoomLobby::DISABLED;
                        break;
                    case 'muteOnStart':
                        $dbRoom->mute_on_start = $option->value === 'true';
                        break;
                    case 'record':
                        $dbRoom->record = $option->value === 'true';
                        break;
                }
            }

            // associate room with the imported or found user
            $dbRoom->owner()->associate($userMap[$room->user_id]);
            // set room type to given roomType for this import batch
            $dbRoom->roomType()->associate($roomType);
            $dbRoom->save();

            // Create meeting
            $dbMeeting = new Meeting;
            $dbMeeting->id = $room->meeting_id;
            $dbMeeting->room()->associate($dbRoom);
            $dbMeeting->save();

            // increase counter and add room to room map (key = greenlight db id, value = new db id)
            $created++;
            $roomMap[$room->id] = $room->friendly_id;
            $bar->advance();
        }

        // show import results
        $this->line('');
        $this->info($created.' created, '.$existed.' skipped (already existed)');

        // if any room imports failed, show room name, id and access code
        if (count($failed) > 0) {
            $this->line('');

            $this->error('Room import failed for the following '.count($failed).' rooms, because no room owner was found:');
            $this->table(
                ['Name', 'Friendly ID'],
                $failed
            );
        }
        $this->line('');

        return $roomMap;
    }

    /**
     *  Process room mapping and import the rooms' presentations
     *
     * @param  array  $roomMap  Array map of greenlight room ids as key and id of the created room as value
     * @param  string  $presentationPath  Path to GL3 presentation files in default storage
     */
    protected function importPresentations(array $roomMap, string $presentationPath): void
    {
        $this->line('Importing presentations for rooms');

        $bar = $this->output->createProgressBar(count($roomMap));
        $bar->start();

        // counter of successfully imported presentations
        $created = 0;
        // counter of failed imports
        $failed = 0;

        foreach ($roomMap as $gl3RoomId => $pilosRoomId) {
            $blobs = DB::connection('greenlight')->table('active_storage_blobs')
                ->join('active_storage_attachments', 'active_storage_blobs.id', '=', 'active_storage_attachments.blob_id')
                ->where([
                    'active_storage_attachments.name' => 'presentation',
                    'active_storage_attachments.record_type' => 'Room',
                    'active_storage_attachments.record_id' => $gl3RoomId,
                ])
                ->get(['filename', 'key']);
            foreach ($blobs as $blob) {
                // Read file path from GL3 database
                $path = $presentationPath.'/'.substr($blob->key, 0, 2).'/'.substr($blob->key, 2, 2).'/'.$blob->key;

                try {
                    // Prepare uploaded file
                    $presentation = new UploadedFile(Storage::path($path), $blob->filename);

                    // Construct RoomFile
                    $room = Room::find($pilosRoomId);
                    $file = new RoomFile;
                    $file->path = $presentation->store($room->id);
                    $file->filename = $blob->filename;
                    $file->use_in_meeting = true;

                    // Save file and room
                    $room->files()->save($file);
                    $room->updateDefaultFile();
                    $this->importedPresentationFiles[] = $file->path;

                    $created++;
                } catch (FileNotFoundException $e) {
                    $failed++;

                    continue;
                }
            }
            $bar->advance();
        }

        $this->line('');
        $this->info($created.' created, '.$failed.' skipped (file not found)');
        $this->line('');
    }

    /**
     * Process greenlight shared room access collection and try to create the room membership for the users and rooms
     * Each user get the moderator role, as that is the greenlight equivalent
     *
     * @param  Collection  $sharedAccesses  Collection of user and room ids for shared room access
     * @param  array<string, int>  $roomMap  Array map of greenlight room ids as key and id of the created room as value
     * @param  array<string, int>  $userMap  Array map of greenlight user ids as key and id of the found/created user as value
     */
    protected function importSharedAccesses(Collection $sharedAccesses, array $roomMap, array $userMap): void
    {
        $this->line('Importing shared room accesses');

        $bar = $this->output->createProgressBar($sharedAccesses->count());
        $bar->start();

        // counter of shared accesses that are created
        $created = 0;
        // counter of shared accesses that could not be created, eg. room or user not imported
        $failed = 0;

        // walk through all found greenlight shared accesses
        foreach ($sharedAccesses as $sharedAccess) {
            $room = $sharedAccess->room_id;
            $user = $sharedAccess->user_id;

            // check if user id and room id are found in the imported rooms
            if (! isset($userMap[$user]) || ! isset($roomMap[$room])) {
                // one or both are not found
                $bar->advance();
                $failed++;

                continue;
            }

            // find room object and add user as moderator to the room
            $dbRoom = Room::find($roomMap[$room]);
            $dbRoom->members()->syncWithoutDetaching([$userMap[$user] => ['role' => RoomUserRole::MODERATOR]]);
            $bar->advance();
            $created++;
        }

        // show import result
        $this->line('');
        $this->info($created.' created, '.$failed.' skipped (user or room not found)');
    }
}

<?php

namespace App\Console\Commands;

use App\Enums\RoomLobby;
use App\Enums\RoomUserRole;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use App\Settings\GeneralSettings;
use Config;
use DB;
use Hash;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Str;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\progress;
use function Laravel\Prompts\select;
use function Laravel\Prompts\text;

class ImportGreenlight2Command extends Command
{
    protected $signature = 'import:greenlight-v2
                             {host : ip or hostname of postgres database server}
                             {port : port of postgres database server}
                             {database : greenlight database name, see greenlight .env variable DB_NAME}
                             {username : greenlight database username, see greenlight .env variable DB_USERNAME}
                             {password : greenlight database password, see greenlight .env variable DB_PASSWORD}';

    protected $description = 'Connect to greenlight PostgreSQL database to import users, rooms and shared room accesses';

    public function handle()
    {
        Config::set('database.connections.greenlight', [
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
        ]);

        $requireAuth = DB::connection('greenlight')->table('features')->where('name', 'Room Authentication')->first('value')?->value == true;
        $users = DB::connection('greenlight')->table('users')->where('deleted', false)->get(['id', 'provider', 'username', 'social_uid', 'email', 'name', 'password_digest']);
        $rooms = DB::connection('greenlight')->table('rooms')->where('deleted', false)->get(['id', 'uid', 'user_id', 'name', 'room_settings', 'access_code']);
        $sharedAccesses = DB::connection('greenlight')->table('shared_accesses')->get(['room_id', 'user_id']);

        $availableAuthenticators = ['shibboleth'];
        $socialProviders = DB::connection('greenlight')->table('users')->select('provider')->whereNotIn('provider', ['greenlight', 'ldap'])->distinct()->get();
        $providerAuthenticatorMap = [];

        foreach ($socialProviders as $socialProvider) {
            $authenticator = select(
                label: 'Please select the authenticator for the social provider: '.$socialProvider->provider,
                options: $availableAuthenticators,
                scroll: 10
            );
            $providerAuthenticatorMap[$socialProvider->provider] = $authenticator;
        }

        // ask user what room type the imported rooms should get
        $roomType = select(
            label: 'What room type should the rooms be assigned to?',
            options: RoomType::pluck('name', 'id'),
            scroll: 10
        );

        // ask user to add prefix to room names
        $prefix = text(
            label: 'Prefix for room names',
            placeholder: 'E.g. (Imported)',
            hint: '(Optional).'
        );

        // ask user what room type the imported rooms should get
        $defaultRole = select(
            'Please select the default role for new imported non-ldap users',
            options: Role::pluck('name', 'id'),
            scroll: 10
        );

        // Start transaction to rollback if import fails or user cancels
        DB::beginTransaction();

        try {
            $userMap = $this->importUsers($users, $defaultRole, $providerAuthenticatorMap);
            $roomMap = $this->importRooms($rooms, $roomType, $userMap, ! $requireAuth, $prefix);
            $this->importSharedAccesses($sharedAccesses, $roomMap, $userMap);

            if (confirm('Do you wish to commit the import?')) {
                DB::commit();
                $this->info('Import completed');
            } else {
                DB::rollBack();
                $this->warn('Import canceled; nothing was imported');
            }
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('Import failed: '.$e->getMessage());
        }
    }

    /**
     * Process greenlight user collection and try to import users
     *
     * @param  Collection  $users  Collection with all users found in the greenlight database
     * @param  int  $defaultRole  IDs of the role that should be assigned to new non-ldap users
     * @return array Array map of greenlight user ids as key and id of the found/created user as value
     */
    protected function importUsers(Collection $users, int $defaultRole, array $providerAuthenticatorMap): array
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
            // import greenlight users
            if ($user->provider == 'greenlight') {
                // check if user with this email exists
                $dbUser = User::where('email', $user->email)->where('authenticator', 'local')->first();
                if ($dbUser != null) {
                    // user found, link greenlight user id to id of found user
                    $existed++;
                    $userMap[$user->id] = $dbUser->id;
                    $bar->advance();
                } else {
                    // create new user
                    $dbUser = new User();
                    $dbUser->authenticator = 'local';
                    $dbUser->email = $user->email;
                    // as greenlight doesn't split the name in first and lastname,
                    // we have to import it as firstname and ask the users or admins to correct it later if desired
                    $dbUser->firstname = $user->name;
                    $dbUser->lastname = '';
                    $dbUser->password = $user->password_digest;
                    $dbUser->locale = config('app.locale');
                    $dbUser->timezone = app(GeneralSettings::class)->default_timezone;
                    $dbUser->save();

                    $dbUser->roles()->attach($defaultRole);

                    // user was successfully created, link greenlight user id to id of new user
                    $created++;
                    $userMap[$user->id] = $dbUser->id;
                    $bar->advance();
                }
            }
            // import ldap users
            elseif ($user->provider == 'ldap') {
                // check if user with this username exists
                $dbUser = User::where('external_id', $user->username)->where('authenticator', 'ldap')->first();
                if ($dbUser != null) {
                    // user found, link greenlight user id to id of found user
                    $existed++;
                    $userMap[$user->id] = $dbUser->id;
                    $bar->advance();
                } else {
                    // create new user
                    $dbUser = new User();
                    $dbUser->authenticator = 'ldap';
                    $dbUser->email = $user->email;
                    $dbUser->external_id = $user->username;
                    // as greenlight doesn't split the name in first and lastname,
                    // we have to import it as firstname, should be corrected during next login
                    $dbUser->firstname = $user->name;
                    $dbUser->lastname = '';
                    $dbUser->password = Hash::make(Str::random());
                    $dbUser->locale = config('app.locale');
                    $dbUser->timezone = app(GeneralSettings::class)->default_timezone;
                    $dbUser->save();

                    // user was successfully imported, link greenlight user id to id of new user
                    $created++;
                    $userMap[$user->id] = $dbUser->id;
                    $bar->advance();
                }
            } else {
                // check if user with this social uid exists
                $dbUser = User::where('external_id', $user->social_uid)->where('authenticator', $providerAuthenticatorMap[$user->provider])->first();
                if ($dbUser != null) {
                    // user found, link greenlight user id to id of found user
                    $existed++;
                    $userMap[$user->id] = $dbUser->id;
                    $bar->advance();
                } else {
                    // create new user
                    $dbUser = new User();
                    $dbUser->authenticator = $providerAuthenticatorMap[$user->provider];
                    $dbUser->email = $user->email;
                    $dbUser->external_id = $user->social_uid;
                    // as greenlight doesn't split the name in first and lastname,
                    // we have to import it as firstname, should be corrected during next login
                    $dbUser->firstname = $user->name;
                    $dbUser->lastname = '';
                    $dbUser->password = Hash::make(Str::random());
                    $dbUser->locale = config('app.locale');
                    $dbUser->timezone = app(GeneralSettings::class)->default_timezone;
                    $dbUser->save();

                    // user was successfully imported, link greenlight user id to id of new user
                    $created++;
                    $userMap[$user->id] = $dbUser->id;
                    $bar->advance();
                }
            }
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
     * @param  array  $userMap  Array map of greenlight user ids as key and id of the found/created user as value
     * @param  bool  $allowGuests  Are guests allowed to access the room
     * @param  string|null  $prefix  Prefix to add to room names
     * @return array Array map of greenlight room ids as key and id of the created room as value
     */
    protected function importRooms(Collection $rooms, int $roomType, array $userMap, bool $allowGuests, ?string $prefix): array
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
            // convert room settings from json string to object
            $room->room_settings = json_decode($room->room_settings);

            // check if a room with the same id exists
            $dbRoom = Room::find($room->uid);
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
                array_push($failed, [$room->name, $room->uid, $room->access_code]);
                $bar->advance();

                continue;
            }

            // create room with same id, same name, access code
            $dbRoom = new Room();
            $dbRoom->id = $room->uid;
            $dbRoom->name = Str::limit(($prefix != null ? ($prefix.' ') : '').$room->name, 253); // if prefix given, add prefix separated by a space from the title; truncate after 253 chars to prevent too long room names
            $dbRoom->access_code = $room->access_code == '' ? null : $room->access_code;
            $dbRoom->allow_guests = $allowGuests;

            // set room settings
            if (isset($room->room_settings->muteOnStart)) {
                $dbRoom->mute_on_start = $room->room_settings->muteOnStart;
            }
            if (isset($room->room_settings->anyoneCanStart)) {
                $dbRoom->everyone_can_start = $room->room_settings->anyoneCanStart;
            }

            if (isset($room->room_settings->joinModerator)) {
                // in greenlight all shared accesses result in the users being moderators in the meeting
                $dbRoom->default_role = $room->room_settings->joinModerator ? RoomUserRole::MODERATOR : RoomUserRole::USER;
            }
            if (isset($room->room_settings->requireModeratorApproval)) {
                // in greenlight the lobby setting applies to all non-moderator users
                $dbRoom->lobby = $room->room_settings->requireModeratorApproval ? RoomLobby::ENABLED : RoomLobby::DISABLED;
            }

            // associate room with the imported or found user
            $dbRoom->owner()->associate($userMap[$room->user_id]);
            // set room type to given roomType for this import batch
            $dbRoom->roomType()->associate($roomType);
            $dbRoom->save();

            // increase counter and add room to room map (key = greenlight db id, value = new db id)
            $created++;
            $roomMap[$room->id] = $room->uid;
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
                ['Name', 'ID', 'Access code'],
                $failed
            );
        }
        $this->line('');

        return $roomMap;
    }

    /**
     * Process greenlight shared room access collection and try to create the room membership for the users and rooms
     * Each user get the moderator role, as that is the greenlight equivalent
     *
     * @param  Collection  $sharedAccesses  Collection of user and room ids for shared room access
     * @param  array  $roomMap  Array map of greenlight room ids as key and id of the created room as value
     * @param  array  $userMap  Array map of greenlight user ids as key and id of the found/created user as value
     */
    protected function importSharedAccesses(Collection $sharedAccesses, array $roomMap, array $userMap)
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

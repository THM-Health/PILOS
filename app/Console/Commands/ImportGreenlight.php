<?php

namespace App\Console\Commands;

use App\Enums\RoomLobby;
use App\Enums\RoomUserRole;
use App\Room;
use App\RoomType;
use App\User;
use Config;
use DB;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;

class ImportGreenlight extends Command
{
    protected $signature = 'import:greenlight
                             {host : ip or hostname of postgres database server}
                             {port : port of postgres database server}
                             {database : greenlight database name, see greenlight .env variable DB_NAME}
                             {username : greenlight database username, see greenlight .env variable DB_USERNAME}
                             {password : greenlight database password, see greenlight .env variable DB_PASSWORD}';

    protected $description = 'Connect to greenlight PostgreSQL database to import users, rooms and shared room accesses';

    public function handle()
    {
        Config::set('database.connections.greenlight', [
            'driver'         => 'pgsql',
            'host'           => $this->argument('host'),
            'database'       => $this->argument('database'),
            'username'       => $this->argument('username'),
            'password'       => $this->argument('password'),
            'port'           => $this->argument('port'),
            'charset'        => 'utf8',
            'prefix'         => '',
            'prefix_indexes' => true,
            'schema'         => 'public',
            'sslmode'        => 'prefer',
        ]);

        $requireAuth    = DB::connection('greenlight')->table('features')->where('name', 'Room Authentication')->first('value');
        $users          = DB::connection('greenlight')->table('users')->where('deleted', false)->get(['id','provider','username','email','name','password_digest']);
        $rooms          = DB::connection('greenlight')->table('rooms')->where('deleted', false)->get(['id','uid','user_id','name','room_settings','access_code']);
        $sharedAccesses = DB::connection('greenlight')->table('shared_accesses')->get(['room_id','user_id']);

        // ask user what room type the imported rooms should get
        $roomTypeShort = $this->choice(
            'What room type should the rooms be assigned to?',
            RoomType::all()->pluck('short')->toArray(),
            0,
            $maxAttempts = null,
            $allowMultipleSelections = false
        );
        // find id of the selected roomtype
        $roomType = RoomType::where('short', $roomTypeShort)->first()->id;

        $userMap = $this->importUsers($users);
        $roomMap = $this->importRooms($rooms, $roomType, $userMap, !$requireAuth);
        $this->importSharedAccesses($sharedAccesses, $roomMap, $userMap);
    }

    /**
     * Process greenlight user collection and try to import users
     *
     * @param  Collection $users Collection with all users found in the greenlight database
     * @return array      Array map of greenlight user ids as key and id of the found/created user as value
     */
    protected function importUsers(Collection $users): array
    {
        $userMap  = [];
        foreach ($users as $user) {

            // import greenlight users
            if ($user->provider == 'greenlight') {

                // check if user with this email exists
                $dbUser = User::where('email', $user->email)->where('authenticator', 'users')->first();
                if ($dbUser != null) {
                    // user found, link greenlight user id to id of found user
                    $this->info('user '.$user->email.' already exits');
                    $userMap[$user->id] = $dbUser->id;

                    continue;
                }

                // create new user
                $dbUser                = new User();
                $dbUser->authenticator = 'users';
                $dbUser->email         = $user->email;
                $dbUser->firstname     = $user->name;
                $dbUser->lastname      = '';
                $dbUser->password      = $user->password_digest;
                $dbUser->save();

                // user was successfully created, link greenlight user id to id of new user
                $this->info('imported user '.$user->email);
                $userMap[$user->id] = $dbUser->id;
            }
            // import ldap users
            if ($user->provider == 'ldap') {

                // check if user with this username exists
                $dbUser = User::where('username', $user->username)->first();
                if ($dbUser != null) {
                    // user found, link greenlight user id to id of found user
                    $this->info('ldap user '.$user->username.' already exits');
                    $userMap[$user->id] = $dbUser->id;

                    continue;
                }
                // try to import user with this username
                $this->callSilent('ldap:import', ['provider'=>'ldap','user'=>$user->username,'--no-interaction','--no-log']);

                // check if user is found after import
                $dbUser = User::where('username', $user->username)->first();

                // user not found, import failed
                if ($dbUser == null) {
                    $this->error('importing ldap user '.$user->username.' failed');

                    continue;
                }
                // user was successfully imported, link greenlight user id to id of new user
                $this->info('imported ldap user '.$user->username);
                $userMap[$user->id] = $dbUser->id;
            }
        }

        return $userMap;
    }

    /**
     *  Process greenlight room collection and create the rooms if not already existing
     *
     * @param  Collection $rooms    Collection with rooms users found in the greenlight database
     * @param  int        $roomType ID of the roomtype the rooms should be assigned to
     * @param  array      $userMap  Array map of greenlight user ids as key and id of the found/created user as value
     * @return array      Array map of greenlight room ids as key and id of the created room as value
     */
    protected function importRooms(Collection $rooms, int $roomType, array $userMap, bool $allowGuests): array
    {
        $roomMap  = [];
        foreach ($rooms as $room) {
            $room->room_settings = json_decode($room->room_settings);

            $dbRoom = Room::find($room->uid);
            if ($dbRoom != null) {
                $this->warn('room with id '.$room->uid.' already exits');

                continue;
            }

            if (!isset($userMap[$room->user_id])) {
                $this->error('room owner not found for '.$room->uid);

                continue;
            }

            $dbRoom              = new Room();
            $dbRoom->id          = $room->uid;
            $dbRoom->name        = $room->name;
            $dbRoom->accessCode  = $room->access_code == '' ? null : $room->access_code;
            $dbRoom->allowGuests = $allowGuests;

            $dbRoom->muteOnStart      = $room->room_settings->muteOnStart;
            $dbRoom->everyoneCanStart = $room->room_settings->anyoneCanStart;
            $dbRoom->defaultRole      = $room->room_settings->joinModerator ? RoomUserRole::MODERATOR : RoomUserRole::USER;
            $dbRoom->muteOnStart      = $room->room_settings->requireModeratorApproval ? RoomLobby::ENABLED : RoomLobby::DISABLED;

            $dbRoom->owner()->associate($userMap[$room->user_id]);
            $dbRoom->roomType()->associate($roomType);
            $dbRoom->save();

            $this->info('created room with id '.$room->uid);

            $roomMap[$room->id] = $room->uid;
        }

        return $roomMap;
    }

    /**
     * Process greenlight shared room access collection and try to create the room membership for the users and rooms
     * Each user get the moderator role, as that is the greenlight equivalent
     *
     * @param Collection $sharedAccesses Collection of user and room ids for shared room access
     * @param array      $roomMap        Array map of greenlight room ids as key and id of the created room as value
     * @param array      $userMap        Array map of greenlight user ids as key and id of the found/created user as value
     */
    protected function importSharedAccesses(Collection $sharedAccesses, array $roomMap, array $userMap)
    {
        foreach ($sharedAccesses as $sharedAccess) {
            $room = $sharedAccess->room_id;
            $user = $sharedAccess->user_id;

            if (!isset($userMap[$user]) || !isset($roomMap[$room])) {
                echo 'not found';

                continue;
            }

            $dbRoom = Room::find($roomMap[$room]);
            $dbRoom->members()->syncWithoutDetaching([$userMap[$user] => ['role' => RoomUserRole::MODERATOR]]);
        }
    }
}

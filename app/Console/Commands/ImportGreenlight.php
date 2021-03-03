<?php

namespace App\Console\Commands;

use App\Enums\RoomUserRole;
use App\Room;
use App\RoomType;
use App\User;
use Illuminate\Console\Command;

class ImportGreenlight extends Command
{
    protected $signature = 'import:greenlight {dir}';

    protected $description = 'Import users and rooms from greenlight';

    public function handle()
    {
        // directory of exported greenlight data
        $dir = $this->argument('dir');

        // check if users file exists
        $usersFile = $dir.'/users.csv';
        if (!file_exists($usersFile)) {
            $this->error("users import file 'users.csv' missing");

            return;
        }

        // check if rooms file exists
        $roomFile = $dir.'/rooms.csv';
        if (!file_exists($usersFile)) {
            $this->error("rooms import file 'rooms.csv' missing");

            return;
        }

        // check if shared_accesses file exists
        $sharedAccessesFile = $dir.'/shared_accesses.csv';
        if (!file_exists($usersFile)) {
            $this->error("shared accesses import file 'shared_accesses.csv' missing");

            return;
        }

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

        $users = $this->importUsers($usersFile);
        $rooms = $this->importRooms($roomFile, $roomType, $users);
        $this->importSharedAccesses($sharedAccessesFile, $rooms, $users);
    }

    /**
     * Read user csv file and try to import users
     *
     * @param  string $file Path to csv file with users
     * @return array  Array map of greenlight user ids as key and id of the found/created user as value
     */
    protected function importUsers(string $file): array
    {
        // read csv file and extract header
        $rows   = array_map('str_getcsv', file($file));
        $header = array_shift($rows);

        $users  = [];
        foreach ($rows as $row) {
            $user = array_combine($header, $row);

            // skip deleted user
            if ($user['deleted'] == 't') {
                continue;
            }

            // import greenlight users
            if ($user['provider'] == 'greenlight') {

                // get email
                $email = $user['email'];

                // check if user with this email exists
                $dbUser = User::where('email', $email)->where('authenticator', 'users')->first();
                if ($dbUser != null) {
                    // user found, link greenlight user id to id of found user
                    $this->info('ldap user '.$email.' already exits');
                    $users[$user['id']] = $dbUser->id;

                    continue;
                }

                // create new user
                $dbUser                = new User();
                $dbUser->authenticator = 'users';
                $dbUser->email         = $email;
                $dbUser->firstname     = $user['name'];
                $dbUser->lastname      = '';
                $dbUser->password      = $user['password_digest'];
                $dbUser->save();

                // user was successfully created, link greenlight user id to id of new user
                $this->info('imported user '.$email);
                $users[$user['id']] = $dbUser->id;
            }
            // import ldap users
            if ($user['provider'] == 'ldap') {
                // get username
                $username = $user['username'];

                // check if user with this username exists
                $dbUser = User::where('username', $username)->first();
                if ($dbUser != null) {
                    // user found, link greenlight user id to id of found user
                    $this->info('ldap user '.$username.' already exits');
                    $users[$user['id']] = $dbUser->id;

                    continue;
                }
                // try to import user with this username
                $this->callSilent('ldap:import', ['provider'=>'ldap','user'=>$username,'--no-interaction','--no-log']);

                // check if user is found after import
                $dbUser = User::where('username', $username)->first();

                // user not found, import failed
                if ($dbUser == null) {
                    $this->error('importing ldap user '.$username.' failed');

                    continue;
                }
                // user was successfully imported, link greenlight user id to id of new user
                $this->info('imported ldap user '.$username);
                $users[$user['id']] = $dbUser->id;
            }
        }

        return $users;
    }

    /**
     * Read rooms csv file and create the rooms if not already existing
     *
     * @param  string $file     Path to csv file with rooms
     * @param  int    $roomType ID of the roomtype the rooms should be assigned to
     * @param  array  $users    Array map of greenlight user ids as key and id of the found/created user as value
     * @return array  Array map of greenlight room ids as key and id of the created room as value
     */
    protected function importRooms(string $file, int $roomType, array $users): array
    {
        // read csv file and extract header
        $rows   = array_map('str_getcsv', file($file));
        $header = array_shift($rows);

        $rooms  = [];
        foreach ($rows as $row) {
            $room = array_combine($header, $row);

            // skip deleted room
            if ($room['deleted'] == 't') {
                continue;
            }

            $uid  = $room['uid'];

            $dbRoom = Room::find($uid);
            if ($dbRoom != null) {
                $this->warn('room with id '.$uid.' already exits');

                continue;
            }

            $userId = intval($room['user_id']);

            if (!isset($users[$userId])) {
                $this->error('room owner not found for '.$uid);

                continue;
            }

            $dbRoom             = new Room();
            $dbRoom->id         = $uid;
            $dbRoom->name       = $room['name'];
            $dbRoom->accessCode = $room['access_code'] == '' ? null : $room['access_code'];
            $dbRoom->owner()->associate($users[$userId]);
            $dbRoom->roomType()->associate($roomType);
            $dbRoom->save();

            $this->info('created room with id '.$uid);

            $rooms[$room['id']] = $uid;
        }

        return $rooms;
    }

    /**
     * Read shared accesses file and try to create the room membership for the users and rooms
     * Each user get the moderator role, as that is the greenlight equivalent
     *
     * @param string $file  Path to csv file with shared accesses
     * @param array  $rooms Array map of greenlight room ids as key and id of the created room as value
     * @param array  $users Array map of greenlight user ids as key and id of the found/created user as value
     */
    protected function importSharedAccesses(string $file, array $rooms, array $users)
    {
        // read csv file and extract header
        $rows   = array_map('str_getcsv', file($file));
        $header = array_shift($rows);

        foreach ($rows as $row) {
            $sharedAccesses = array_combine($header, $row);

            $room = intval($sharedAccesses['room_id']);
            $user = intval($sharedAccesses['user_id']);

            if (!isset($users[$user]) || !isset($rooms[$room])) {
                continue;
            }

            $dbRoom = Room::find($rooms[$room]);
            $dbRoom->members()->syncWithoutDetaching([$users[$user] => ['role' => RoomUserRole::MODERATOR]]);
        }
    }
}

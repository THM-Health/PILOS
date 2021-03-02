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
        $dir = $this->argument('dir');

        $usersFile = $dir.'/users.csv';
        if (!file_exists($usersFile)) {
            $this->error("users import file 'users.csv' missing");

            return;
        }

        $roomFile = $dir.'/rooms.csv';
        if (!file_exists($usersFile)) {
            $this->error("rooms import file 'rooms.csv' missing");

            return;
        }

        $sharedAccessesFile = $dir.'/shared_accesses.csv';
        if (!file_exists($usersFile)) {
            $this->error("shared accesses import file 'shared_accesses.csv' missing");

            return;
        }

        $roomType = $this->choice(
            'What room type should the rooms be assigned to?',
            RoomType::all()->pluck('short')->toArray(),
            0,
            $maxAttempts = null,
            $allowMultipleSelections = false
        );
        $roomType = RoomType::where('short', $roomType)->first()->id;

        // import users
        $rows   = array_map('str_getcsv', file($usersFile));
        $header = array_shift($rows);
        $users  = [];
        foreach ($rows as $row) {
            $user = array_combine($header, $row);

            if ($user['provider'] == 'greenlight') {
                $this->info('ignoring non-ldap user '.$user['email']);

                continue;
            }

            $uid = explode('=', explode(',', $user['social_uid'])[0])[1];

            $dbUser = User::where('username', $uid)->first();
            if ($dbUser != null) {
                $this->info('ldap user '.$uid.' already exits');
                $users[$user['id']] = $dbUser->id;

                continue;
            }
            $this->callSilent('ldap:import', ['provider'=>'ldap','user'=>$uid,'--no-interaction','--no-log']);
            $dbUser = User::where('username', $uid)->first();

            if ($dbUser == null) {
                $this->error('importing ldap user '.$uid.' failed');

                continue;
            }
            $this->info('imported ldap user '.$uid);
            $users[$user['id']] = $dbUser->id;
        }

        // import rooms
        $rows   = array_map('str_getcsv', file($roomFile));
        $header = array_shift($rows);
        $rooms  = [];
        foreach ($rows as $row) {
            $room = array_combine($header, $row);
            $uid  = $room['uid'];

            $dbRoom = Room::find($uid);
            if ($dbRoom != null) {
                $this->info('room with id '.$uid.' already exits');

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

            $rooms[$room['id']] = $uid;
        }

        // import rooms shared
        $rows   = array_map('str_getcsv', file($sharedAccessesFile));
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

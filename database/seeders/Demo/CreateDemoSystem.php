<?php

namespace Database\Seeders\Demo;

use App\Enums\RoomUserRole;
use App\Enums\ServerStatus;
use App\Models\Meeting;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomFile;
use App\Models\RoomType;
use App\Models\Server;
use App\Models\ServerPool;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class CreateDemoSystem extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'demo:create {--force}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Ask if the user is sure as this will overwrite the database if the --force option is not set
        if (! $this->option('force') && ! $this->confirm('This will overwrite the database. Are you sure you want to continue?')) {
            return;
        }

        $this->callSilent('migrate:fresh', ['--seed' => true, '--force' => true]);

        Model::unguard();

        $host = config('bigbluebutton.test_server.host');
        $secret = config('bigbluebutton.test_server.secret');

        // If host or secret are not set, skip
        if (! $host || ! $secret) {
            return;
        }

        $server = Server::create([
            'base_url' => $host,
            'secret' => $secret,
            'name' => 'Test Server',
            'status' => ServerStatus::ENABLED,
            'error_count' => 0,
            'recover_count' => config('bigbluebutton.server_online_threshold'),
            'load' => 0,
        ]);

        // Attach the server to all server pools
        foreach (ServerPool::all() as $serverPool) {
            $serverPool->servers()->attach($server);
        }

        // Copy storage
        File::copyDirectory(__DIR__.'/storage', Storage::path(''));

        // Create users
        $john = User::create(['firstname' => 'John', 'lastname' => 'Doe', 'email' => 'john.doe@example.org', 'password' => \Hash::make('johndoe'), 'locale' => 'en', 'image' => 'profile_images/john-doe.jpg']);
        $daniel = User::create(['firstname' => 'Daniel', 'lastname' => 'Osorio', 'email' => 'daniel.osorio@example.org', 'password' => \Hash::make('danielosorio'), 'locale' => 'en', 'image' => 'profile_images/daniel-osorio.jpg']);
        $angela = User::create(['firstname' => 'Angela', 'lastname' => 'Jones', 'email' => 'angela.jones@example.org', 'password' => \Hash::make('angelajones'), 'locale' => 'en', 'image' => 'profile_images/angela-jones.jpg']);
        $hoyt = User::create(['firstname' => 'Hoyt', 'lastname' => 'Hastings', 'email' => 'hoyt.hastings@example.org', 'password' => \Hash::make('hoythastings'), 'locale' => 'en']);
        $william = User::create(['firstname' => 'William', 'lastname' => 'White', 'email' => 'william.white@example.org', 'password' => \Hash::make('williamwhite'), 'locale' => 'en']);
        $thomas = User::create(['firstname' => 'Thomas', 'lastname' => 'Bolden', 'email' => 'thomas.bolden@example.org', 'password' => \Hash::make('thomasbolden'), 'locale' => 'en']);

        // Create roles
        $superuser = Role::where('superuser', true)->first();
        $teacher = Role::create(['name' => 'teacher', 'room_limit' => 10]);
        $student = Role::create(['name' => 'student', 'room_limit' => 0]);

        // Attach roles to users
        $john->roles()->attach($superuser);
        $daniel->roles()->attach($teacher);
        $angela->roles()->attach($teacher);
        $hoyt->roles()->attach($student);
        $william->roles()->attach($student);
        $thomas->roles()->attach($student);

        // Room types
        $lecture = RoomType::where('name', 'Lecture')->first();
        $meeting = RoomType::where('name', 'Meeting')->first();
        $exam = RoomType::where('name', 'Exam')->first();
        $seminar = RoomType::where('name', 'Seminar')->first();

        // Create rooms
        $anatomyRoom = new Room;
        $anatomyRoom->id = 'abc-def-123';
        $anatomyRoom->name = 'Anatomy';
        $anatomyRoom->description = 'Anatomy class';
        $anatomyRoom->access_code = 123456789;
        $anatomyRoom->owner()->associate($daniel);
        $anatomyRoom->roomType()->associate($lecture);
        $anatomyRoom->save();

        $mathRoom = new Room;
        $mathRoom->id = 'abc-def-234';
        $mathRoom->name = 'Math';
        $mathRoom->description = 'Math class';
        $mathRoom->access_code = 123456789;
        $mathRoom->allow_guests = true;
        $mathRoom->owner()->associate($daniel);
        $mathRoom->roomType()->associate($lecture);
        $mathRoom->save();

        $meetingRoom = new Room;
        $meetingRoom->id = 'abc-def-345';
        $meetingRoom->name = 'Meeting Room';
        $meetingRoom->description = 'Meeting room';
        $meetingRoom->access_code = 123456789;
        $meetingRoom->owner()->associate($angela);
        $meetingRoom->roomType()->associate($meeting);
        $meetingRoom->save();

        $examRoom = new Room;
        $examRoom->id = 'abc-def-456';
        $examRoom->name = 'Exam Room';
        $examRoom->description = 'Exam room';
        $examRoom->access_code = 123456789;
        $examRoom->owner()->associate($angela);
        $examRoom->roomType()->associate($exam);
        $examRoom->save();

        $seminarRoom = new Room;
        $seminarRoom->id = 'abc-def-567';
        $seminarRoom->name = 'Seminar Room';
        $seminarRoom->description = 'Seminar room';
        $seminarRoom->access_code = 123456789;
        $seminarRoom->owner()->associate($angela);
        $seminarRoom->roomType()->associate($seminar);
        $seminarRoom->save();

        // Attach users to rooms
        $anatomyRoom->members()->attach($hoyt, ['role' => RoomUserRole::USER]);
        $anatomyRoom->members()->attach($william, ['role' => RoomUserRole::USER]);
        $mathRoom->members()->attach($hoyt, ['role' => RoomUserRole::USER]);
        $mathRoom->members()->attach($william, ['role' => RoomUserRole::USER]);
        $mathRoom->members()->attach($thomas, ['role' => RoomUserRole::MODERATOR]);
        $meetingRoom->members()->attach($daniel, ['role' => RoomUserRole::USER]);
        $examRoom->members()->attach($daniel, ['role' => RoomUserRole::CO_OWNER]);
        $seminarRoom->members()->attach($daniel, ['role' => RoomUserRole::MODERATOR]);
        $seminarRoom->members()->attach($thomas, ['role' => RoomUserRole::MODERATOR]);

        // Add files to room
        $introduction = new RoomFile;
        $introduction->path = 'abc-def-123/anatomy-introduction.pdf';
        $introduction->filename = 'anatomy-introduction.pdf';
        $introduction->download = true;
        $introduction->use_in_meeting = true;
        $introduction->default = false;
        $introduction->room()->associate($anatomyRoom);
        $introduction->save();

        $foot = new RoomFile;
        $foot->path = 'abc-def-123/anatomy-foot.pdf';
        $foot->filename = 'anatomy-foot.pdf';
        $foot->download = false;
        $foot->use_in_meeting = true;
        $foot->default = true;
        $foot->room()->associate($anatomyRoom);
        $foot->save();

        // Add meetings to rooms
        $meeting = new Meeting;
        $meeting->start = '2021-01-01 10:00:00';
        $meeting->end = '2021-01-01 11:00:00';
        $meeting->room()->associate($meetingRoom);
        $meeting->server()->associate($server);
        $meeting->save();
        $meetingRoom->latestMeeting()->associate($meeting);
        $meetingRoom->save();

        // Add meetings to rooms
        $meeting = new Meeting;
        $meeting->start = '2024-01-01 10:00:00';
        $meeting->end = '2024-01-01 11:00:00';
        $meeting->room()->associate($anatomyRoom);
        $meeting->server()->associate($server);
        $meeting->save();
        $anatomyRoom->latestMeeting()->associate($meeting);
        $anatomyRoom->participant_count = 30;
        $anatomyRoom->listener_count = 10;
        $anatomyRoom->voice_participant_count = 20;
        $anatomyRoom->video_count = 1;
        $anatomyRoom->save();

        $meeting = new Meeting;
        $meeting->start = '2024-01-01 10:00:00';
        $meeting->end = '2024-01-01 12:00:00';
        $meeting->room()->associate($mathRoom);
        $meeting->server()->associate($server);
        $meeting->save();
        $mathRoom->latestMeeting()->associate($meeting);
        $mathRoom->participant_count = 30;
        $mathRoom->listener_count = 10;
        $mathRoom->voice_participant_count = 20;
        $mathRoom->video_count = 1;
        $mathRoom->save();

        $meeting = new Meeting;
        $meeting->start = '2024-01-01 08:00:00';
        $meeting->end = null;
        $meeting->room()->associate($meetingRoom);
        $meeting->server()->associate($server);
        $meeting->save();
        $meetingRoom->latestMeeting()->associate($meeting);
        $meetingRoom->participant_count = 2;
        $meetingRoom->listener_count = 0;
        $meetingRoom->voice_participant_count = 2;
        $meetingRoom->video_count = 2;
        $meetingRoom->save();

        $this->table(['Name', 'Role', 'Email', 'Password'], [
            ['John Doe', 'admin', 'john.doe@example.org', 'johndoe'],
            ['Daniel Osorio', 'teacher', 'daniel.osorio@example.org', 'danielosorio'],
            ['Angela Jones', 'teacher',  'angela.jones@example.org', 'angelajones'],
            ['Hoyt Hastings', 'student', 'hoyt.hastings@example.org', 'hoythastings'],
            ['William White', 'student', 'william.white@example.org', 'williamwhite'],
            ['Thomas Bolden', 'student', 'thomas.bolden@example.org', 'thomasbolden'],
        ]);

        Model::reguard();
    }
}

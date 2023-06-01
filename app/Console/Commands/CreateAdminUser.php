<?php

namespace App\Console\Commands;

use App\Http\Requests\UserRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

/**
 * Command class that makes it possible to create an new admin user.
 * @package App\Console\Commands
 */
class CreateAdminUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:create:admin';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Creates an new admin user.';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $roles = Role::where(['name' => 'admin'])->pluck('id')->all();

        if (empty($roles)) {
            $this->error('The admin role does not exist. Please seed the database and then retry!');

            return 1;
        }

        $this->info('Creating an new admin user, please notify your inputs.');

        $data                          = [];
        $data['firstname']             = $this->ask('Firstname');
        $data['lastname']              = $this->ask('Lastname');
        $data['email']                 = $this->ask('E-Mail');
        $data['user_locale']           = $this->ask('Locale (possible values: ' . join(',', config('app.enabled_locales')) . ')');
        $data['password']              = $this->secret('Password');
        $data['password_confirmation'] = $this->secret('Password Confirmation');
        $data['generate_password']     = false;
        $data['bbb_skip_check_audio']  = $this->confirm('Skip audio check on joining rooms?');
        $data['roles']                 = $roles;
        $data['timezone']              = 'UTC';

        $validator = Validator::make($data, (new UserRequest())->rules());

        if ($validator->fails()) {
            $this->info('Something went wrong, please see the error messages below for more information.');

            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return 1;
        }

        $user = new User();

        $user->firstname         = $data['firstname'];
        $user->lastname          = $data['lastname'];
        $user->email             = $data['email'];
        $user->locale            = $data['user_locale'];
        $user->password          = Hash::make($data['password']);
        $user->email_verified_at = $user->freshTimestamp();

        $user->save();
        $user->roles()->sync($roles);

        $this->info('New admin user created successfully.');

        return 0;
    }
}

<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\User;
use App\Rules\Password;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

use function Laravel\Prompts\password;
use function Laravel\Prompts\select;
use function Laravel\Prompts\text;

/**
 * Command class that makes it possible to create an new superuser.
 */
class CreateSuperuserCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:create:superuser';

    protected $aliases = ['users:create:admin'];

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Creates an new superuser.';

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
        // Check if local login is enabled
        if (! config('auth.local.enabled')) {
            $this->error('Local login is not enabled. Please enable it in the .env with the option LOCAL_AUTH_ENABLED and then retry!');

            return 1;
        }

        $superuserRole = Role::where(['superuser' => true])->first();

        if ($superuserRole === null) {
            $this->error('The superuser role does not exist. Please seed the database and then retry!');

            return 1;
        }

        $this->info('Creating an new superuser, please notify your inputs.');

        $data = [];
        $firstname = text('Firstname', validate: ['firstname' => 'required|max:255']);
        $lastname = text('Lastname', validate: ['lastname' => 'required|max:255']);
        $email = text('E-Mail', validate: ['email' => ['required', 'max:255', 'email', Rule::unique('users', 'email')->where('authenticator', 'local')]]);
        $locale = select('Locale', array_keys(config('app.enabled_locales')));
        $password = password('Password', required: true, validate: ['min:8', new Password]);

        $user = new User;

        $user->firstname = $firstname;
        $user->lastname = $lastname;
        $user->email = $email;
        $user->locale = $locale;
        $user->password = Hash::make($password);
        $user->email_verified_at = $user->freshTimestamp();

        $user->save();
        $user->roles()->attach($superuserRole);

        $this->info('New superuser created successfully.');

        return 0;
    }
}

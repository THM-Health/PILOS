<?php

namespace App\Auth\LDAP;

use Illuminate\Auth\EloquentUserProvider;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Hashing\Hasher;
use LdapRecord\Models\Model;

class LDAPProvider extends EloquentUserProvider
{
    /**
     * The eloquent user provider.
     *
     * @var EloquentUserProvider
     */
    protected $eloquent;

    /**
     * The authenticating LDAP user.
     *
     * @var Model|null
     */
    protected $user;

    /**
     * Create a new ldap user provider.
     *
     * @param  string  $model
     * @return void
     */
    public function __construct(Hasher $hasher, $model)
    {
        $this->eloquent = new EloquentUserProvider($hasher, $model);
    }

    /**
     * Retrieve a user by their unique identifier.
     *
     * @param  mixed  $identifier
     * @return \Illuminate\Contracts\Auth\Authenticatable|null
     */
    public function retrieveById($identifier)
    {
        return $this->eloquent->retrieveById($identifier);
    }

    /**
     * Retrieve a user by their unique identifier and "remember me" token.
     *
     * @param  mixed  $identifier
     * @param  string  $token
     * @return \Illuminate\Contracts\Auth\Authenticatable|null
     */
    public function retrieveByToken($identifier, $token)
    {
        return $this->eloquent->retrieveByToken($identifier, $token);
    }

    /**
     * Update the "remember me" token for the given user in storage.
     *
     * @param  string  $token
     * @return void
     */
    public function updateRememberToken(Authenticatable $user, $token)
    {
        $this->eloquent->updateRememberToken($user, $token);
    }

    public function rehashPasswordIfRequired(Authenticatable $user, array $credentials, bool $force = false): void
    {
        $this->eloquent->rehashPasswordIfRequired($user, $credentials, $force);
    }

    /**
     * Retrieve a user by the given credentials.
     *
     * @return \Illuminate\Contracts\Auth\Authenticatable|null
     */
    public function retrieveByCredentials(array $credentials)
    {
        // Find ldap user by username
        $user = LDAPUserObject::where(config('ldap.login_attribute'), $credentials['username'])->first();

        // User not found
        if (! $user) {
            return null;
        }

        // Save ldap user for later use in validateCredentials()
        $this->user = $user;

        // Find or create eloquent user by ldap user's uid
        $ldap_user = new LDAPUser($this->user);

        return $ldap_user->createOrFindEloquentModel('ldap');
    }

    /**
     * Validate a user against the given credentials.
     *
     * @return bool
     */
    public function validateCredentials(Authenticatable $user, array $credentials)
    {
        // Bind to LDAP with user credentials
        if (! $this->user->getConnection()->auth()->attempt($this->user->getDn(), $credentials['password'], true)) {
            return false;
        }

        // If attributes should be loaded as user, refresh the user model
        // The previous bind (with the user's credentials) will be used
        if (config('ldap.load_attributes_as_user')) {
            $this->user->refresh();
        }

        // Sync LDAP user attributes with eloquent user model
        $ldap_user = new LDAPUser($this->user);
        $ldap_user->syncWithEloquentModel($user, config('ldap.mapping')->roles);

        return true;
    }
}

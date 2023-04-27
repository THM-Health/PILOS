<?php

namespace App\Auth;

use App\Models\User;
use Hash;
use Log;
use Str;

/**
 * ExternalUser is an abstract class that represents an external user.
 * This class contains methods to manage attributes and interact with
 * the User Eloquent model.
 */
abstract class ExternalUser
{
    /**
     * @var array $attributes An associative array to store attribute names and their values.
     */
    private array $attributes = [];

    /**
     * @var User $user An instance of the User Eloquent model.
     */
    private User $user;

    /**
     * Add a value to an attribute.
     *
     * @param string $name  The name of the attribute.
     * @param mixed  $value The value to add to the attribute.
     */
    public function addAttributeValue($name, $value)
    {
        if (!isset($this->attributes[$name])) {
            $this->attributes[$name] = [];
        }
        $this->attributes[$name][] = $value;
    }

    /**
     * Get all attributes and their values.
     *
     * @return array The attributes array.
     */
    public function getAttributes()
    {
        return $this->attributes;
    }

    /**
     * Get the first value of an attribute.
     *
     * @param  string     $name The name of the attribute.
     * @return mixed|null The first value of the attribute, or null if not set.
     */
    public function getFirstAttributeValue($name)
    {
        return $this->attributes[$name][0] ?? null;
    }

    /**
     * Get all values of an attribute.
     *
     * @param  string     $name The name of the attribute.
     * @return array|null The array of values for the attribute, or null if not set.
     */
    public function getAttributeValues($name)
    {
        return $this->attributes[$name] ?? null;
    }

    public function __construct()
    {
        $this->validate();
    }

    /**
     * Create or find an Eloquent User model based on the external_id attribute.
     * New users will be created with default values for locale and timezone.
     * 
     * @return User The User Eloquent model.
     */
    public function createOrFindEloquentModel(): User
    {
        $this->user = User::firstOrNew(
            [
                'authenticator' => 'external',
                'external_id'   => $this->getFirstAttributeValue('external_id')
            ],
            [
                'password' => Hash::make(Str::random()),
                'locale'   => config('app.locale'),
                'timezone' => setting('default_timezone')
            ]
        );

        return $this->user;
    }

    /**
     * Validate the required attributes.
     * Throws a MissingAttributeException if the attribute is not set.
     */
    public function validate()
    {
        $requiredAttributes = [
            'external_id',
            'first_name',
            'last_name',
            'email'
        ];

        foreach ($requiredAttributes as $attribute) {
            if ($this->getFirstAttributeValue($attribute) == null) {
                Log::error('Required attribute missing', ['attribute' => $attribute, 'attributes' => $this->getAttributes()]);

                throw new MissingAttributeException($attribute);
            }
        }
    }

    public function syncWithEloquentModel(): User
    {
        $this->user->firstname = $this->getFirstAttributeValue('first_name');
        $this->user->lastname  = $this->getFirstAttributeValue('last_name');
        $this->user->email     = $this->getFirstAttributeValue('email');

        return $this->user;
    }
}

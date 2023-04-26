<?php

namespace App\Auth;

use App\Models\User;
use Hash;
use Log;
use Str;

abstract class ExternalUser
{
    private array $attributes = [];
    private User $user;

    public function addAttributeValue($name, $value)
    {
        if (!isset($this->attributes[$name])) {
            $this->attributes[$name] = [];
        }
        $this->attributes[$name][] = $value;
    }

    public function getAttributes()
    {
        return $this->attributes;
    }

    public function getFirstAttributeValue($name)
    {
        return $this->attributes[$name][0] ?? null;
    }

    public function getAttributeValues($name)
    {
        return $this->attributes[$name] ?? null;
    }

    public function __construct()
    {
        $this->validate();
    }

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

    public function validate()
    {
        if ($this->getFirstAttributeValue('external_id') == null) {
            Log::error('External-ID attribute missing', ['attributes' => $this->getAttributes()]);

            throw new MissingAttributeException('external_id');
        }

        if ($this->getFirstAttributeValue('first_name') == null) {
            Log::error('First name attribute missing', ['attributes' => $this->getAttributes()]);

            throw new MissingAttributeException('first_name');
        }

        if ($this->getFirstAttributeValue('last_name') == null) {
            Log::error('Last name attribute missing', ['attributes' => $this->getAttributes()]);

            throw new MissingAttributeException('last_name');
        }

        if ($this->getFirstAttributeValue('email') == null) {
            Log::error('Email attribute missing', ['attributes' => $this->getAttributes()]);

            throw new MissingAttributeException('email');
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

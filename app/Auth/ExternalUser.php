<?php

namespace App\Auth;

use App\Models\Role;
use App\Models\User;
use App\Settings\GeneralSettings;
use Hash;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Log;
use Spatie\Image\Enums\Fit;
use Spatie\Image\Image;
use Str;

/**
 * ExternalUser is an abstract class that represents an external user.
 * This class contains methods to manage attributes and interact with
 * the User Eloquent model.
 */
abstract class ExternalUser
{
    /**
     * @var array An associative array to store attribute names and their values.
     */
    private array $attributes = [];

    /**
     * Create or find an Eloquent User model based on the external_id attribute.
     * New users will be created with default values for locale and timezone.
     *
     * @return User The User Eloquent model.
     */
    public function createOrFindEloquentModel(string $authenticator): User
    {
        return User::firstOrNew(
            [
                'authenticator' => $authenticator,
                'external_id' => $this->getFirstAttributeValue('external_id'),
            ],
            [
                'password' => Hash::make(Str::random()),
                'locale' => config('app.locale'),
                'timezone' => app(GeneralSettings::class)->default_timezone,
            ]
        );
    }

    /**
     * Add a value to an attribute.
     *
     * @param  string  $name  The name of the attribute.
     * @param  mixed  $value  The value to add to the attribute.
     */
    public function addAttributeValue($name, $value)
    {
        if (! isset($this->attributes[$name])) {
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
     * @param  string  $name  The name of the attribute.
     * @return mixed|null The first value of the attribute, or null if not set.
     */
    public function getFirstAttributeValue($name)
    {
        return $this->attributes[$name][0] ?? null;
    }

    /**
     * Get all values of an attribute.
     *
     * @param  string  $name  The name of the attribute.
     * @return array|null The array of values for the attribute, or null if not set.
     */
    public function getAttributeValues($name)
    {
        return $this->attributes[$name] ?? null;
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
            'email',
        ];

        foreach ($requiredAttributes as $attribute) {
            if ($this->getFirstAttributeValue($attribute) == null) {
                Log::error('Required attribute missing', ['attribute' => $attribute, 'attributes' => $this->getAttributes()]);

                throw new MissingAttributeException($attribute);
            }
        }
    }

    public function syncWithEloquentModel(User $eloquentUser, array $roles): User
    {
        // Validate attributes
        $this->validate();

        // Sync attributes
        $eloquentUser->firstname = $this->getFirstAttributeValue('first_name');
        $eloquentUser->lastname = $this->getFirstAttributeValue('last_name');
        $eloquentUser->email = $this->getFirstAttributeValue('email');

        // Save/update user
        $eloquentUser->save();

        // Sync profile image
        $this->syncImage($eloquentUser);

        // Map roles
        $this->mapRoles($eloquentUser, $roles);

        return $eloquentUser;
    }

    /**
     * Import profile image
     */
    public function syncImage($eloquentUser): void
    {
        $image = $this->getFirstAttributeValue('image');
        if ($image) {
            // External authenticator provided an image

            try {
                // Get hash of image
                $imageHash = hash('sha256', $image);

                // Check if profile image is already set to the same file
                if ($eloquentUser->external_image_hash == $imageHash) {
                    return;
                }

                // Write image to temporary location
                $tempFile = tempnam(sys_get_temp_dir(), 'profile_image');
                file_put_contents($tempFile, $image);

                $uploadedImage = new UploadedFile($tempFile, 'profile_image.jpg');

                // Validate image
                if ($uploadedImage->getMimeType() != 'image/jpeg') {
                    throw new \Exception('Invalid image type: '.$uploadedImage->getMimeType());
                }

                // Save new image and crop it to 100x100
                $filename = $uploadedImage->storePublicly('profile_images', 'public');
                Image::load(Storage::disk('public')->path($filename))
                    ->fit(fit: Fit::Crop, desiredWidth: 100, desiredHeight: 100)
                    ->save();

                // Remove temporary file
                unlink($tempFile);

                // Clean up old image if exists
                if ($eloquentUser->image) {
                    Storage::disk('public')->delete($eloquentUser->image);
                }

                // Update user with new image and hash of the image (before cropping)
                $eloquentUser->image = $filename;
                $eloquentUser->external_image_hash = $imageHash;
                $eloquentUser->save();
                Log::info('Image updated for user ({user}): {filename}.', ['user' => $eloquentUser->getLogLabel(), 'filename' => $filename]);
            } catch (\Exception $e) {
                Log::error('Failed to save image for user ({user}): {error}', [
                    'user' => $eloquentUser->getLogLabel(),
                    'error' => $e->getMessage(),
                ]);
            }
        } else {
            // No image provided by external authenticator

            // Check if image was previously set by external authenticator
            if ($eloquentUser->hasExternalImage) {
                // Clean up old image if exists
                if ($eloquentUser->image) {
                    Storage::disk('public')->delete($eloquentUser->image);
                }
                $eloquentUser->image = null;
                $eloquentUser->external_image_hash = null;
                $eloquentUser->save();

                Log::info('Image removed for user ({user}).', ['user' => $eloquentUser->getLogLabel()]);
            }
        }
    }

    /**
     * Maps user attributes to roles based on the provided config
     *
     * @param  User  $user  The user the roles should be applied to
     * @param  array  $roles  The configuration object containing the roles and rules
     */
    public function mapRoles(User $eloquentUser, array $roles)
    {
        // Array of all roles the user should get based on the mapping config
        $matchedRoles = [];

        // Loop through the roles
        foreach ($roles as $role) {
            // Check if the role is enabled
            if ($role->disabled ?? false) {
                continue;
            }

            // If rules are fulfilled, add to array of matched roles
            if ($this->areRulesFulfilled($role)) {
                $matchedRoles[] = $role->name;
            }
        }

        Log::info('Roles found for user ({user}): {roles}.', ['user' => $eloquentUser->external_id, 'roles' => implode(', ', $matchedRoles)]);

        $roleIds = [];

        foreach ($matchedRoles as $roleName) {
            $role = Role::whereLike('name', $roleName)->first();

            if (! empty($role)) {
                $roleIds[$role->id] = ['automatic' => true];
            }
        }

        $eloquentUser->roles()->syncWithoutDetaching($roleIds);
        $eloquentUser->roles()->detach($eloquentUser->roles()->wherePivot('automatic', '=', true)->whereNotIn('role_id', array_keys($roleIds))->pluck('role_id')->toArray());
    }

    private function areRulesFulfilled(mixed $role): bool
    {
        // Results of checking each rule
        $rulesFulfilled = [];

        // Loop through the rules for this role to check if rule is fulfilled
        foreach ($role->rules as $rule) {
            $attributeValues = $this->getAttributeValues($rule->attribute);

            if ($attributeValues == null) {
                $rulesFulfilled[] = false;

                continue;
            }

            $rulesFulfilled[] = $this->isRuleFulfilled($attributeValues, $rule);
        }

        if ($role->all ?? false) {
            // If all rules must be fulfilled, check if all rules are fulfilled (no rule is false)
            if (in_array(false, $rulesFulfilled)) {
                // At least one rule is not fulfilled, therefore the role should not be applied
                return false;
            }
        } else {
            // If any rules must be fulfilled, check if any rule is fulfilled
            if (! in_array(true, $rulesFulfilled)) {
                // No rule is fulfilled, therefore the role should not be applied
                return false;
            }
        }

        return true;
    }

    /**
     * @param  array  $values
     */
    private function isRuleFulfilled($values, mixed $rule): bool
    {
        // Results of the regex for each entry of the value array
        $matches = [];

        // Loop through all values and try to match the regex and save the result
        foreach ($values as $value) {
            $matches[] = preg_match($rule->regex, $value);
        }

        // Check if regex has to (not) match with all array entries
        if ($rule->all ?? false) {
            // If the rule is negated, check if regex never matches any of the entries (no entry is true)
            if ($rule->not ?? false) {
                return ! in_array(true, $matches);
            }

            // Check if regex matches all the entries (no entry is false)
            return ! in_array(false, $matches);
        } // Check if regex has to (not) match with any array entries
        else {
            // If the rule is negated, check if regex doesn't match on any entry (any entry is false)
            if ($rule->not ?? false) {
                return in_array(false, $matches);
            }

            // Check if regex matches any the entries (any entry is true)
            return in_array(true, $matches);
        }
    }
}

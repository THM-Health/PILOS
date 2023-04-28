<?php

namespace App\Auth;

use App\Models\Role;
use App\Models\User;

class RoleMapping
{
    /**
     * Maps user attributes to roles based on the provided config
     *
     * @param array $userAttributes An array of user attributes
     * @param User  $user           The user the roles should be applied to
     * @param array $roles          The configuration object containing the roles and rules
     */
    public function mapRoles(ExternalUser $externalUser, User $eloquentUser, array $roles)
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
            if ($this->areRulesFulfilled($role, $externalUser)) {
                $matchedRoles[] = $role->name;
            }
        }

        if (config('auth.log.roles')) {
            \Log::debug('Roles found for user ['.$eloquentUser->external_id.'].', $matchedRoles);
        }

        $roleIds   = [];

        foreach ($matchedRoles as $roleName) {
            $role = Role::where('name', $roleName)->first();

            if (!empty($role)) {
                $roleIds[$role->id] = ['automatic' => true];
            }
        }

        $eloquentUser->roles()->syncWithoutDetaching($roleIds);
        $eloquentUser->roles()->detach($eloquentUser->roles()->wherePivot('automatic', '=', true)->whereNotIn('role_id', array_keys($roleIds))->pluck('role_id')->toArray());
    }

    /**
     * @param mixed $role
     * @param $userAttributes
     * @return bool
     */
    private function areRulesFulfilled(mixed $role, ExternalUser $externalUser): bool
    {
        // Results of checking each rule
        $rulesFulfilled = [];

        // Loop through the rules for this role to check if rule is fulfilled
        foreach ($role->rules as $rule) {
            $attributeValues = $externalUser->getAttributeValues($rule->attribute);

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
            if (!in_array(true, $rulesFulfilled)) {
                // No rule is fulfilled, therefore the role should not be applied
                return false;
            }
        }

        return true;
    }

    /**
     * @param  array $values
     * @param  mixed $rule
     * @return bool
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
                return !in_array(true, $matches);
            }

            // Check if regex matches all the entries (no entry is false)
            return !in_array(false, $matches);
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

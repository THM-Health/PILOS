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
    public function mapRoles(array $userAttributes, User $user, array $roles)
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
            if ($this->areRulesFulfilled($role, $userAttributes)) {
                $matchedRoles[] = $role->name;
            }
        }

        if (config('auth.log.roles')) {
            \Log::debug('Roles found for user ['.$user->external_id.'].', $matchedRoles);
        }

        $roleIds   = [];

        foreach ($matchedRoles as $roleName) {
            $role = Role::where('name', $roleName)->first();

            if (!empty($role)) {
                $roleIds[$role->id] = ['automatic' => true];
            }
        }

        $user->roles()->syncWithoutDetaching($roleIds);
        $user->roles()->detach($user->roles()->wherePivot('automatic', '=', true)->whereNotIn('role_id', array_keys($roleIds))->pluck('role_id')->toArray());
    }

    /**
     * @param mixed $role
     * @param $userAttributes
     * @return bool
     */
    private function areRulesFulfilled(mixed $role, $userAttributes): bool
    {
        // Results of checking each rule
        $rulesFulfilled = [];

        // Loop through the rules for this role to check if rule is fulfilled
        foreach ($role->rules as $rule) {
            if (!isset($userAttributes[$rule->attribute])) {
                $rulesFulfilled[] = false;

                continue;
            }

            $rulesFulfilled[] = $this->isRuleFulfilled($userAttributes[$rule->attribute], $rule);
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
     * @param $userAttributes
     * @param  mixed $rule
     * @return bool
     */
    private function isRuleFulfilled($value, mixed $rule): bool
    {
        // If the value is not an array, simply check if it matches the regex
        if (!is_array($value)) {
            // Check if value matches the regex
            $ruleFulfilled = preg_match($rule->regex, $value);

            // If the rule is negated, toggle result
            if ($rule->not ?? false) {
                return !$ruleFulfilled;
            }

            return $ruleFulfilled;
        }

        // For arrays check all entries

        // Results of the regex for each entry of the value array
        $matches = [];

        // Loop through all entries and try to match the regex and save the result
        foreach ($value as $entries) {
            $matches[] = preg_match($rule->regex, $entries);
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

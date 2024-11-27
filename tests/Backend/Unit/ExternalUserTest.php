<?php

namespace Tests\Backend\Unit;

use App\Auth\ExternalUser;
use App\Auth\MissingAttributeException;
use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Log;
use Tests\Backend\TestCase;
use TiMacDonald\Log\LogEntry;
use TiMacDonald\Log\LogFake;

class ExternalUserTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Log::swap(new LogFake);
    }

    public function test_missing_external_id_attributes()
    {
        $this->expectException(MissingAttributeException::class);
        $this->expectExceptionMessage('Missing attribute: external_id');

        $user = new class extends ExternalUser
        {
            public function __construct()
            {
                $this->addAttributeValue('external_id', null);
                $this->addAttributeValue('first_name', 'John');
                $this->addAttributeValue('last_name', 'Doe');
                $this->addAttributeValue('email', 'john.doe@domain.org');
            }
        };

        try {
            $user->validate();
        } catch (MissingAttributeException $e) {
            Log::assertLogged(
                fn (LogEntry $log) => $log->level === 'error'
                    && $log->message == 'Required attribute missing'
                    && $log->context['attribute'] == 'external_id'
            );

            throw $e;
        }
    }

    public function test_missing_firstname_attributes()
    {
        $this->expectException(MissingAttributeException::class);
        $this->expectExceptionMessage('Missing attribute: first_name');

        $user = new class extends ExternalUser
        {
            public function __construct()
            {
                $this->addAttributeValue('external_id', 'jdoe');
                $this->addAttributeValue('first_name', null);
                $this->addAttributeValue('last_name', 'Doe');
                $this->addAttributeValue('email', 'john.doe@domain.org');
            }
        };

        try {
            $user->validate();
        } catch (MissingAttributeException $e) {
            Log::assertLogged(
                fn (LogEntry $log) => $log->level === 'error'
                    && $log->message == 'Required attribute missing'
                    && $log->context['attribute'] == 'first_name'
            );

            throw $e;
        }
    }

    public function test_missing_lastname_attributes()
    {
        $this->expectException(MissingAttributeException::class);
        $this->expectExceptionMessage('Missing attribute: last_name');

        $user = new class extends ExternalUser
        {
            public function __construct()
            {
                $this->addAttributeValue('external_id', 'jdoe');
                $this->addAttributeValue('first_name', 'John');
                $this->addAttributeValue('last_name', null);
                $this->addAttributeValue('email', 'john.doe@domain.org');
            }
        };

        try {
            $user->validate();
        } catch (MissingAttributeException $e) {
            Log::assertLogged(
                fn (LogEntry $log) => $log->level === 'error'
                    && $log->message == 'Required attribute missing'
                    && $log->context['attribute'] == 'last_name'
            );

            throw $e;
        }
    }

    public function test_missing_email_attributes()
    {
        $this->expectException(MissingAttributeException::class);
        $this->expectExceptionMessage('Missing attribute: email');

        $user = new class extends ExternalUser
        {
            public function __construct()
            {
                $this->addAttributeValue('external_id', 'jdoe');
                $this->addAttributeValue('first_name', 'John');
                $this->addAttributeValue('last_name', 'Doe');
                $this->addAttributeValue('email', null);
            }
        };

        try {
            $user->validate();
        } catch (MissingAttributeException $e) {
            Log::assertLogged(
                fn (LogEntry $log) => $log->level === 'error'
                    && $log->message == 'Required attribute missing'
                    && $log->context['attribute'] == 'email'
            );

            throw $e;
        }
    }

    public function test_empty_role_config()
    {
        Role::firstOrCreate(['name' => 'role_a']);
        Role::firstOrCreate(['name' => 'role_b']);

        $externalUser = new class extends ExternalUser
        {
            public function __construct()
            {
                $this->addAttributeValue('external_id', 'jdoe');
                $this->addAttributeValue('first_name', 'John');
                $this->addAttributeValue('last_name', 'Doe');
                $this->addAttributeValue('email', 'john.doe@university.org');
                $this->addAttributeValue('roles', 'administrator');
            }
        };

        // Empty mapping, no roles should be assigned
        $mapping = json_decode('{
            "roles": []
        }');

        $eloquentUser = $externalUser->createOrFindEloquentModel('ldap');
        $externalUser->syncWithEloquentModel($eloquentUser, $mapping->roles);

        $eloquentUser->unsetRelation('roles');
        $this->assertCount(0, $eloquentUser->roles);
    }

    public function test_wildcard_regex_rule()
    {
        Role::firstOrCreate(['name' => 'role_a']);
        Role::firstOrCreate(['name' => 'role_b']);

        $externalUser = new class extends ExternalUser
        {
            public function __construct()
            {
                $this->addAttributeValue('external_id', 'jdoe');
                $this->addAttributeValue('first_name', 'John');
                $this->addAttributeValue('last_name', 'Doe');
                $this->addAttributeValue('email', 'john.doe@university.org');
                $this->addAttributeValue('roles', 'administrator');
            }
        };

        // Role A is given to all users (wildcard regex)
        $mapping = json_decode('{
            "roles": [
                {
                  "name": "role_a",
                  "disabled": false,
                  "rules": [
                    {
                      "attribute": "external_id",
                      "regex": "/^.*/im"
                    }
                  ]
                }
            ]
        }');

        $eloquentUser = $externalUser->createOrFindEloquentModel('ldap');
        $externalUser->syncWithEloquentModel($eloquentUser, $mapping->roles);

        $eloquentUser->unsetRelation('roles');
        $this->assertCount(1, $eloquentUser->roles);
        $this->assertEquals('role_a', $eloquentUser->roles()->first()->name);
    }

    public function test_disabled_role()
    {
        Role::firstOrCreate(['name' => 'role_a']);
        Role::firstOrCreate(['name' => 'role_b']);

        $externalUser = new class extends ExternalUser
        {
            public function __construct()
            {
                $this->addAttributeValue('external_id', 'jdoe');
                $this->addAttributeValue('first_name', 'John');
                $this->addAttributeValue('last_name', 'Doe');
                $this->addAttributeValue('email', 'john.doe@university.org');
                $this->addAttributeValue('roles', 'administrator');
            }
        };

        // Role A is disabled, so it should not be assigned
        $mapping = json_decode('{
            "roles": [
                {
                  "name": "role_a",
                  "disabled": true,
                  "rules": [
                    {
                      "attribute": "external_id",
                      "regex": "/^.*/im"
                    }
                  ]
                }
            ]
        }');

        $eloquentUser = $externalUser->createOrFindEloquentModel('ldap');
        $externalUser->syncWithEloquentModel($eloquentUser, $mapping->roles);

        $eloquentUser->unsetRelation('roles');
        $this->assertCount(0, $eloquentUser->roles);
    }

    public function test_all_rules()
    {
        Role::firstOrCreate(['name' => 'role_a']);
        Role::firstOrCreate(['name' => 'role_b']);

        $externalUser = new class extends ExternalUser
        {
            public function __construct()
            {
                $this->addAttributeValue('external_id', 'jdoe');
                $this->addAttributeValue('first_name', 'John');
                $this->addAttributeValue('last_name', 'Doe');
                $this->addAttributeValue('email', 'john.doe@university.org');
                $this->addAttributeValue('roles', 'administrator');
            }
        };

        // Give the user role_a if they have the administrator role and their email is from university.org
        // Give the user role_b if they have the administrator role and their email is from demo.org
        $mapping = json_decode('{
            "roles": [
                {
                  "name": "role_a",
                  "all": true,
                  "rules": [
                    {
                      "attribute": "roles",
                      "regex": "/^administrator$/im"
                    },
                    {
                        "attribute": "email",
                        "regex": "/@university.org$/im"
                    }
                  ]
                },
                {
                    "name": "role_b",
                    "all": true,
                    "rules": [
                      {
                        "attribute": "roles",
                        "regex": "/^administrator$/im"
                      },
                      {
                          "attribute": "email",
                          "regex": "/@demo.org$/im"
                      }
                    ]
                  }
            ]
        }');

        $eloquentUser = $externalUser->createOrFindEloquentModel('ldap');
        $externalUser->syncWithEloquentModel($eloquentUser, $mapping->roles);

        $eloquentUser->unsetRelation('roles');
        $this->assertCount(1, $eloquentUser->roles);
        $this->assertEquals('role_a', $eloquentUser->roles()->first()->name);
    }

    public function test_any_rules()
    {
        Role::firstOrCreate(['name' => 'role_a']);
        Role::firstOrCreate(['name' => 'role_b']);

        $externalUser = new class extends ExternalUser
        {
            public function __construct()
            {
                $this->addAttributeValue('external_id', 'jdoe');
                $this->addAttributeValue('first_name', 'John');
                $this->addAttributeValue('last_name', 'Doe');
                $this->addAttributeValue('email', 'john.doe@university.org');
                $this->addAttributeValue('roles', 'administrator');
            }
        };

        // Give the user role_a if he has an email from university.org or demo.org
        $mapping = json_decode('{
            "roles": [
                {
                  "name": "role_a",
                  "rules": [
                    {
                        "attribute": "email",
                        "regex": "/@university.org$/im"
                    },
                    {
                        "attribute": "email",
                        "regex": "/@demo.org$/im"
                    }
                  ]
                }
            ]
        }');

        $eloquentUser = $externalUser->createOrFindEloquentModel('ldap');
        $externalUser->syncWithEloquentModel($eloquentUser, $mapping->roles);

        $eloquentUser->unsetRelation('roles');
        $this->assertCount(1, $eloquentUser->roles);
        $this->assertEquals('role_a', $eloquentUser->roles()->first()->name);
    }

    public function test_not_rules()
    {
        Role::firstOrCreate(['name' => 'role_a']);
        Role::firstOrCreate(['name' => 'role_b']);

        $externalUser = new class extends ExternalUser
        {
            public function __construct()
            {
                $this->addAttributeValue('external_id', 'jdoe');
                $this->addAttributeValue('first_name', 'John');
                $this->addAttributeValue('last_name', 'Doe');
                $this->addAttributeValue('email', 'john.doe@university.org');
                $this->addAttributeValue('roles', 'administrator');
            }
        };

        // Give the user role_a if the email is from university.org
        // Give the user role_b if the email is not from university.org
        $mapping = json_decode('{
            "roles": [
                {
                  "name": "role_a",
                  "rules": [
                    {
                        "attribute": "email",
                        "regex": "/@university.org$/im"
                    }
                  ]
                },
                {
                    "name": "role_b",
                    "rules": [
                      {
                          "attribute": "email",
                          "not": true,
                          "regex": "/@university.org$/im"
                      }
                    ]
                  }
            ]
        }');

        $eloquentUser = $externalUser->createOrFindEloquentModel('ldap');
        $externalUser->syncWithEloquentModel($eloquentUser, $mapping->roles);

        $eloquentUser->unsetRelation('roles');
        $this->assertCount(1, $eloquentUser->roles);
        $this->assertEquals('role_a', $eloquentUser->roles()->first()->name);
    }

    public function test_array_not_rules()
    {
        Role::firstOrCreate(['name' => 'role_a']);
        Role::firstOrCreate(['name' => 'role_b']);

        $externalUser = new class extends ExternalUser
        {
            public function __construct()
            {
                $this->addAttributeValue('external_id', 'jdoe');
                $this->addAttributeValue('first_name', 'John');
                $this->addAttributeValue('last_name', 'Doe');
                $this->addAttributeValue('email', 'john.doe@university.org');
                $this->addAttributeValue('roles', 'user');
                $this->addAttributeValue('roles', 'banned');
            }
        };

        // Give user role "role_a" if he is not banned (does not have role "banned")
        // Give user role "role_b" if he has any other role than "banned"
        $mapping = json_decode('{
            "roles": [
                {
                  "name": "role_a",
                  "rules": [
                    {
                        "attribute": "roles",
                        "not": true,
                        "all": true,
                        "regex": "/^banned$/im"
                    }
                  ]
                },
                {
                    "name": "role_b",
                    "rules": [
                      {
                          "attribute": "roles",
                          "not": true,
                          "regex": "/^banned$/im"
                      }
                    ]
                  }
            ]
        }');

        $eloquentUser = $externalUser->createOrFindEloquentModel('ldap');
        $externalUser->syncWithEloquentModel($eloquentUser, $mapping->roles);

        $eloquentUser->unsetRelation('roles');
        $this->assertCount(1, $eloquentUser->roles);
        $this->assertEquals('role_b', $eloquentUser->roles()->first()->name);
    }

    public function test_array_rules()
    {
        Role::firstOrCreate(['name' => 'role_a']);
        Role::firstOrCreate(['name' => 'role_b']);
        Role::firstOrCreate(['name' => 'role_c']);

        $externalUser = new class extends ExternalUser
        {
            public function __construct()
            {
                $this->addAttributeValue('external_id', 'jdoe');
                $this->addAttributeValue('first_name', 'John');
                $this->addAttributeValue('last_name', 'Doe');
                $this->addAttributeValue('email', 'john.doe@university.org');
                $this->addAttributeValue('email', 'john.doe@university.com');
                $this->addAttributeValue('roles', 'user');
                $this->addAttributeValue('roles', 'administrator');
            }
        };

        // Give user role "role_a" if all his emails are from university.org or university.com
        // Give user role "role_b" if he has at least one email from university.org or university.com
        // Give user role "role_c" if all his emails are from university.org
        $mapping = json_decode('{
            "roles": [
                {
                  "name": "role_a",
                  "rules": [
                    {
                        "attribute": "email",
                        "all": true,
                        "regex": "/@university.(org|com)$/im"
                    }
                  ]
                },
                {
                    "name": "role_b",
                    "rules": [
                      {
                          "attribute": "email",
                          "regex": "/@university.(org|com)$/im"
                      }
                    ]
                  },
                {
                    "name": "role_c",
                    "rules": [
                      {
                          "attribute": "email",
                          "all": true,
                          "regex": "/@university.org$/im"
                      }
                    ]
                }
            ]
        }');

        $eloquentUser = $externalUser->createOrFindEloquentModel('ldap');
        $externalUser->syncWithEloquentModel($eloquentUser, $mapping->roles);

        $eloquentUser->unsetRelation('roles');
        $this->assertCount(2, $eloquentUser->roles);
        $roles = $eloquentUser->roles()->orderBy('name')->get();
        $this->assertEquals('role_a', $roles->shift()->name);
        $this->assertEquals('role_b', $roles->shift()->name);
    }

    public function test_ingore_invalid_attributes_in_rules()
    {
        Role::firstOrCreate(['name' => 'role_a']);
        Role::firstOrCreate(['name' => 'role_b']);
        Role::firstOrCreate(['name' => 'role_c']);

        $externalUser = new class extends ExternalUser
        {
            public function __construct()
            {
                $this->addAttributeValue('external_id', 'jdoe');
                $this->addAttributeValue('first_name', 'John');
                $this->addAttributeValue('last_name', 'Doe');
                $this->addAttributeValue('email', 'john.doe@university.org');
                $this->addAttributeValue('roles', 'administrator');
            }
        };

        // Check that invalid attributes in rules are ignored (rule is not fullfilled)
        // If not all rules have to be fullfilled and another rule is valid, the role is assigned
        $mapping = json_decode('{
            "roles": [
                {
                  "name": "role_a",
                  "rules": [
                    {
                      "attribute": "invalid_attribute",
                      "regex": "/^.*/im"
                    },
                    {
                        "attribute": "email",
                        "regex": "/@university.org$/im"
                    }
                  ]
                },
                {
                    "name": "role_b",
                    "all": true,
                    "rules": [
                      {
                        "attribute": "invalid_attribute",
                        "regex": "/^.*/im"
                      },
                      {
                          "attribute": "email",
                          "regex": "/@university.org$/im"
                      }
                    ]
                  },
                {
                    "name": "role_c",
                    "rules": [
                      {
                        "attribute": "invalid_attribute",
                        "regex": "/^.*/im"
                      }
                    ]
                  }
            ]
        }');

        $eloquentUser = $externalUser->createOrFindEloquentModel('ldap');
        $externalUser->syncWithEloquentModel($eloquentUser, $mapping->roles);

        $eloquentUser->unsetRelation('roles');
        $this->assertCount(1, $eloquentUser->roles);
        $this->assertEquals('role_a', $eloquentUser->roles()->first()->name);
    }

    public function test_ingore_invalid_roles()
    {
        Role::firstOrCreate(['name' => 'role_a']);

        $externalUser = new class extends ExternalUser
        {
            public function __construct()
            {
                $this->addAttributeValue('external_id', 'jdoe');
                $this->addAttributeValue('first_name', 'John');
                $this->addAttributeValue('last_name', 'Doe');
                $this->addAttributeValue('email', 'john.doe@university.org');
                $this->addAttributeValue('roles', 'administrator');
            }
        };

        // Test if invalid roles are ignored
        $mapping = json_decode('{
            "roles": [
                {
                    "name": "role_a",
                    "rules": [
                    {
                        "attribute": "external_id",
                        "regex": "/^.*/im"
                    }
                    ]
                },
                {
                    "name": "role_b",
                    "rules": [
                        {
                        "attribute": "external_id",
                        "regex": "/^.*/im"
                        }
                    ]
                }
            ]
        }');

        $eloquentUser = $externalUser->createOrFindEloquentModel('ldap');
        $externalUser->syncWithEloquentModel($eloquentUser, $mapping->roles);

        $eloquentUser->unsetRelation('roles');
        $this->assertCount(1, $eloquentUser->roles);
        $this->assertEquals('role_a', $eloquentUser->roles()->first()->name);
    }
}

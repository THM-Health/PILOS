<?php

namespace Tests\Unit;

use App\Auth\ExternalUser;
use App\Auth\RoleMapping;
use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Log;
use Tests\TestCase;
use TiMacDonald\Log\LogFake;

class RoleMappingTest extends TestCase
{
    use RefreshDatabase;

    public function setUp(): void
    {
        parent::setUp();

        Log::swap(new LogFake());
    }

    public function testEmptyConfig()
    {
        Role::firstOrCreate(['name' => 'role_a']);
        Role::firstOrCreate(['name' => 'role_b']);

        $externalUser = new class extends ExternalUser {
            public function __construct()
            {
                $this->addAttributeValue('external_id', 'jdoe');
                $this->addAttributeValue('first_name', 'John');
                $this->addAttributeValue('last_name', 'Doe');
                $this->addAttributeValue('email', 'john.doe@university.org');
                $this->addAttributeValue('roles', 'administrator');
                parent::__construct();
            }
        };

        $eloquentUser = $externalUser->createOrFindEloquentModel();
        $externalUser->syncWithEloquentModel();
        $eloquentUser->save();
        
        // Empty mapping, no roles should be assigned
        $mapping = json_decode('{
            "roles": []
        }');

        $roleMapping = new RoleMapping();
        $roleMapping->mapRoles($externalUser, $eloquentUser, $mapping->roles);

        $eloquentUser->unsetRelation('roles');
        $this->assertCount(0, $eloquentUser->roles);
    }

    public function testWildcardRegexRule()
    {
        Role::firstOrCreate(['name' => 'role_a']);
        Role::firstOrCreate(['name' => 'role_b']);

        $externalUser = new class extends ExternalUser {
            public function __construct()
            {
                $this->addAttributeValue('external_id', 'jdoe');
                $this->addAttributeValue('first_name', 'John');
                $this->addAttributeValue('last_name', 'Doe');
                $this->addAttributeValue('email', 'john.doe@university.org');
                $this->addAttributeValue('roles', 'administrator');
                parent::__construct();
            }
        };

        $eloquentUser = $externalUser->createOrFindEloquentModel();
        $externalUser->syncWithEloquentModel();
        $eloquentUser->save();
        
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

        $roleMapping = new RoleMapping();
        $roleMapping->mapRoles($externalUser, $eloquentUser, $mapping->roles);

        $eloquentUser->unsetRelation('roles');
        $this->assertCount(1, $eloquentUser->roles);
        $this->assertEquals('role_a', $eloquentUser->roles()->first()->name);
    }

    public function testDisabledRole()
    {
        Role::firstOrCreate(['name' => 'role_a']);
        Role::firstOrCreate(['name' => 'role_b']);

        $externalUser = new class extends ExternalUser {
            public function __construct()
            {
                $this->addAttributeValue('external_id', 'jdoe');
                $this->addAttributeValue('first_name', 'John');
                $this->addAttributeValue('last_name', 'Doe');
                $this->addAttributeValue('email', 'john.doe@university.org');
                $this->addAttributeValue('roles', 'administrator');
                parent::__construct();
            }
        };

        $eloquentUser = $externalUser->createOrFindEloquentModel();
        $externalUser->syncWithEloquentModel();
        $eloquentUser->save();
        
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

        $roleMapping = new RoleMapping();
        $roleMapping->mapRoles($externalUser, $eloquentUser, $mapping->roles);

        $eloquentUser->unsetRelation('roles');
        $this->assertCount(0, $eloquentUser->roles);
    }

    public function testAllRules()
    {
        Role::firstOrCreate(['name' => 'role_a']);
        Role::firstOrCreate(['name' => 'role_b']);

        $externalUser = new class extends ExternalUser {
            public function __construct()
            {
                $this->addAttributeValue('external_id', 'jdoe');
                $this->addAttributeValue('first_name', 'John');
                $this->addAttributeValue('last_name', 'Doe');
                $this->addAttributeValue('email', 'john.doe@university.org');
                $this->addAttributeValue('roles', 'administrator');
                parent::__construct();
            }
        };

        $eloquentUser = $externalUser->createOrFindEloquentModel();
        $externalUser->syncWithEloquentModel();
        $eloquentUser->save();
        
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

        $roleMapping = new RoleMapping();
        $roleMapping->mapRoles($externalUser, $eloquentUser, $mapping->roles);

        $eloquentUser->unsetRelation('roles');
        $this->assertCount(1, $eloquentUser->roles);
        $this->assertEquals('role_a', $eloquentUser->roles()->first()->name);
    }

    public function testAnyRules()
    {
        Role::firstOrCreate(['name' => 'role_a']);
        Role::firstOrCreate(['name' => 'role_b']);

        $externalUser = new class extends ExternalUser {
            public function __construct()
            {
                $this->addAttributeValue('external_id', 'jdoe');
                $this->addAttributeValue('first_name', 'John');
                $this->addAttributeValue('last_name', 'Doe');
                $this->addAttributeValue('email', 'john.doe@university.org');
                $this->addAttributeValue('roles', 'administrator');
                parent::__construct();
            }
        };

        $eloquentUser = $externalUser->createOrFindEloquentModel();
        $externalUser->syncWithEloquentModel();
        $eloquentUser->save();
        
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

        $roleMapping = new RoleMapping();
        $roleMapping->mapRoles($externalUser, $eloquentUser, $mapping->roles);

        $eloquentUser->unsetRelation('roles');
        $this->assertCount(1, $eloquentUser->roles);
        $this->assertEquals('role_a', $eloquentUser->roles()->first()->name);
    }

    public function testNotRules()
    {
        Role::firstOrCreate(['name' => 'role_a']);
        Role::firstOrCreate(['name' => 'role_b']);

        $externalUser = new class extends ExternalUser {
            public function __construct()
            {
                $this->addAttributeValue('external_id', 'jdoe');
                $this->addAttributeValue('first_name', 'John');
                $this->addAttributeValue('last_name', 'Doe');
                $this->addAttributeValue('email', 'john.doe@university.org');
                $this->addAttributeValue('roles', 'administrator');
                parent::__construct();
            }
        };

        $eloquentUser = $externalUser->createOrFindEloquentModel();
        $externalUser->syncWithEloquentModel();
        $eloquentUser->save();
        
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

        $roleMapping = new RoleMapping();
        $roleMapping->mapRoles($externalUser, $eloquentUser, $mapping->roles);

        $eloquentUser->unsetRelation('roles');
        $this->assertCount(1, $eloquentUser->roles);
        $this->assertEquals('role_a', $eloquentUser->roles()->first()->name);
    }

    public function testArrayNotRules()
    {
        Role::firstOrCreate(['name' => 'role_a']);
        Role::firstOrCreate(['name' => 'role_b']);

        $externalUser = new class extends ExternalUser {
            public function __construct()
            {
                $this->addAttributeValue('external_id', 'jdoe');
                $this->addAttributeValue('first_name', 'John');
                $this->addAttributeValue('last_name', 'Doe');
                $this->addAttributeValue('email', 'john.doe@university.org');
                $this->addAttributeValue('roles', 'user');
                $this->addAttributeValue('roles', 'banned');
                parent::__construct();
            }
        };

        $eloquentUser = $externalUser->createOrFindEloquentModel();
        $externalUser->syncWithEloquentModel();
        $eloquentUser->save();
        
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

        $roleMapping = new RoleMapping();
        $roleMapping->mapRoles($externalUser, $eloquentUser, $mapping->roles);

        $eloquentUser->unsetRelation('roles');
        $this->assertCount(1, $eloquentUser->roles);
        $this->assertEquals('role_b', $eloquentUser->roles()->first()->name);
    }

    public function testArrayRules()
    {
        Role::firstOrCreate(['name' => 'role_a']);
        Role::firstOrCreate(['name' => 'role_b']);
        Role::firstOrCreate(['name' => 'role_c']);

        $externalUser = new class extends ExternalUser {
            public function __construct()
            {
                $this->addAttributeValue('external_id', 'jdoe');
                $this->addAttributeValue('first_name', 'John');
                $this->addAttributeValue('last_name', 'Doe');
                $this->addAttributeValue('email', 'john.doe@university.org');
                $this->addAttributeValue('email', 'john.doe@university.com');
                $this->addAttributeValue('roles', 'user');
                $this->addAttributeValue('roles', 'administrator');
                parent::__construct();
            }
        };

        $eloquentUser = $externalUser->createOrFindEloquentModel();
        $externalUser->syncWithEloquentModel();
        $eloquentUser->save();
        
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

        $roleMapping = new RoleMapping();
        $roleMapping->mapRoles($externalUser, $eloquentUser, $mapping->roles);

        $eloquentUser->unsetRelation('roles');
        $this->assertCount(2, $eloquentUser->roles);
        $roles = $eloquentUser->roles()->orderBy('name')->get();
        $this->assertEquals('role_a', $roles->shift()->name);
        $this->assertEquals('role_b', $roles->shift()->name);
    }

    public function testIngoreInvalidAttributesInRules()
    {
        Role::firstOrCreate(['name' => 'role_a']);
        Role::firstOrCreate(['name' => 'role_b']);
        Role::firstOrCreate(['name' => 'role_c']);

        $externalUser = new class extends ExternalUser {
            public function __construct()
            {
                $this->addAttributeValue('external_id', 'jdoe');
                $this->addAttributeValue('first_name', 'John');
                $this->addAttributeValue('last_name', 'Doe');
                $this->addAttributeValue('email', 'john.doe@university.org');
                $this->addAttributeValue('roles', 'administrator');
                parent::__construct();
            }
        };

        $eloquentUser = $externalUser->createOrFindEloquentModel();
        $externalUser->syncWithEloquentModel();
        $eloquentUser->save();
        
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

        $roleMapping = new RoleMapping();
        $roleMapping->mapRoles($externalUser, $eloquentUser, $mapping->roles);

        $eloquentUser->unsetRelation('roles');
        $this->assertCount(1, $eloquentUser->roles);
        $this->assertEquals('role_a', $eloquentUser->roles()->first()->name);
    }

    public function testIngoreInvalidRoles()
    {
        Role::firstOrCreate(['name' => 'role_a']);

        $externalUser = new class extends ExternalUser {
            public function __construct()
            {
                $this->addAttributeValue('external_id', 'jdoe');
                $this->addAttributeValue('first_name', 'John');
                $this->addAttributeValue('last_name', 'Doe');
                $this->addAttributeValue('email', 'john.doe@university.org');
                $this->addAttributeValue('roles', 'administrator');
                parent::__construct();
            }
        };

        $eloquentUser = $externalUser->createOrFindEloquentModel();
        $externalUser->syncWithEloquentModel();
        $eloquentUser->save();
        
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

        $roleMapping = new RoleMapping();
        $roleMapping->mapRoles($externalUser, $eloquentUser, $mapping->roles);

        $eloquentUser->unsetRelation('roles');
        $this->assertCount(1, $eloquentUser->roles);
        $this->assertEquals('role_a', $eloquentUser->roles()->first()->name);
    }
}

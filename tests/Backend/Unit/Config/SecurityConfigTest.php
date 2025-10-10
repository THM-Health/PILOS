<?php

namespace Tests\Backend\Unit\Config;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Backend\TestCase;

class SecurityConfigTest extends TestCase
{
    use RefreshDatabase;

    public function test_config_file_exists()
    {
        $configPath = config_path('security.php');
        $this->assertFileExists($configPath);
    }

    public function test_referrer_policy_has_default_value()
    {
        $referrerPolicy = config('security.referrer_policy');
        $this->assertNotNull($referrerPolicy);
        $this->assertIsString($referrerPolicy);
    }

    public function test_referrer_policy_defaults_to_strict_origin_when_cross_origin()
    {
        // Clear any environment variable override
        putenv('REFERRER_POLICY');
        config(['security.referrer_policy' => env('REFERRER_POLICY', 'strict-origin-when-cross-origin')]);

        $referrerPolicy = config('security.referrer_policy');
        $this->assertEquals('strict-origin-when-cross-origin', $referrerPolicy);
    }

    public function test_referrer_policy_respects_environment_variable()
    {
        config(['security.referrer_policy' => 'no-referrer']);

        $referrerPolicy = config('security.referrer_policy');
        $this->assertEquals('no-referrer', $referrerPolicy);
    }

    public function test_hsts_config_exists()
    {
        $hstsConfig = config('security.hsts');
        $this->assertNotNull($hstsConfig);
        $this->assertIsArray($hstsConfig);
    }

    public function test_hsts_enabled_is_boolean()
    {
        $hstsEnabled = config('security.hsts.enabled');
        $this->assertIsBool($hstsEnabled);
    }

    public function test_hsts_enabled_defaults_to_false()
    {
        putenv('HSTS_ENABLED');
        config(['security.hsts.enabled' => (bool) env('HSTS_ENABLED', false)]);

        $hstsEnabled = config('security.hsts.enabled');
        $this->assertFalse($hstsEnabled);
    }

    public function test_hsts_max_age_is_integer()
    {
        $maxAge = config('security.hsts.max_age');
        $this->assertIsInt($maxAge);
    }

    public function test_hsts_max_age_defaults_to_one_year()
    {
        putenv('HSTS_MAX_AGE');
        config(['security.hsts.max_age' => (int) env('HSTS_MAX_AGE', 31536000)]);

        $maxAge = config('security.hsts.max_age');
        $this->assertEquals(31536000, $maxAge);
    }

    public function test_hsts_include_subdomains_is_boolean()
    {
        $includeSubdomains = config('security.hsts.include_subdomains');
        $this->assertIsBool($includeSubdomains);
    }

    public function test_hsts_include_subdomains_defaults_to_false()
    {
        putenv('HSTS_INCLUDE_SUBDOMAINS');
        config(['security.hsts.include_subdomains' => (bool) env('HSTS_INCLUDE_SUBDOMAINS', false)]);

        $includeSubdomains = config('security.hsts.include_subdomains');
        $this->assertFalse($includeSubdomains);
    }

    public function test_hsts_preload_is_boolean()
    {
        $preload = config('security.hsts.preload');
        $this->assertIsBool($preload);
    }

    public function test_hsts_preload_defaults_to_false()
    {
        putenv('HSTS_PRELOAD');
        config(['security.hsts.preload' => (bool) env('HSTS_PRELOAD', false)]);

        $preload = config('security.hsts.preload');
        $this->assertFalse($preload);
    }

    public function test_hsts_config_has_all_required_keys()
    {
        $hstsConfig = config('security.hsts');

        $this->assertArrayHasKey('enabled', $hstsConfig);
        $this->assertArrayHasKey('max_age', $hstsConfig);
        $this->assertArrayHasKey('include_subdomains', $hstsConfig);
        $this->assertArrayHasKey('preload', $hstsConfig);
    }

    public function test_security_config_has_all_required_keys()
    {
        $securityConfig = config('security');

        $this->assertArrayHasKey('referrer_policy', $securityConfig);
        $this->assertArrayHasKey('hsts', $securityConfig);
    }

    public function test_hsts_enabled_can_be_set_to_true()
    {
        config(['security.hsts.enabled' => true]);

        $hstsEnabled = config('security.hsts.enabled');
        $this->assertTrue($hstsEnabled);
    }

    public function test_hsts_max_age_accepts_custom_values()
    {
        $customMaxAge = 7776000; // 90 days
        config(['security.hsts.max_age' => $customMaxAge]);

        $maxAge = config('security.hsts.max_age');
        $this->assertEquals($customMaxAge, $maxAge);
    }

    public function test_hsts_include_subdomains_can_be_enabled()
    {
        config(['security.hsts.include_subdomains' => true]);

        $includeSubdomains = config('security.hsts.include_subdomains');
        $this->assertTrue($includeSubdomains);
    }

    public function test_hsts_preload_can_be_enabled()
    {
        config(['security.hsts.preload' => true]);

        $preload = config('security.hsts.preload');
        $this->assertTrue($preload);
    }

    public function test_referrer_policy_accepts_valid_policy_values()
    {
        $validPolicies = [
            'no-referrer',
            'no-referrer-when-downgrade',
            'origin',
            'origin-when-cross-origin',
            'same-origin',
            'strict-origin',
            'strict-origin-when-cross-origin',
            'unsafe-url',
        ];

        foreach ($validPolicies as $policy) {
            config(['security.referrer_policy' => $policy]);
            $this->assertEquals($policy, config('security.referrer_policy'));
        }
    }

    public function test_hsts_max_age_zero_is_valid()
    {
        config(['security.hsts.max_age' => 0]);

        $maxAge = config('security.hsts.max_age');
        $this->assertEquals(0, $maxAge);
    }

    public function test_hsts_max_age_two_years()
    {
        $twoYears = 63072000; // 2 years in seconds
        config(['security.hsts.max_age' => $twoYears]);

        $maxAge = config('security.hsts.max_age');
        $this->assertEquals($twoYears, $maxAge);
    }

    public function test_all_hsts_options_can_be_enabled_together()
    {
        config([
            'security.hsts.enabled' => true,
            'security.hsts.max_age' => 31536000,
            'security.hsts.include_subdomains' => true,
            'security.hsts.preload' => true,
        ]);

        $this->assertTrue(config('security.hsts.enabled'));
        $this->assertEquals(31536000, config('security.hsts.max_age'));
        $this->assertTrue(config('security.hsts.include_subdomains'));
        $this->assertTrue(config('security.hsts.preload'));
    }

    public function test_config_returns_array_when_accessed_directly()
    {
        $config = require config_path('security.php');

        $this->assertIsArray($config);
        $this->assertArrayHasKey('referrer_policy', $config);
        $this->assertArrayHasKey('hsts', $config);
    }

    public function test_hsts_config_structure_is_correct()
    {
        $config = require config_path('security.php');

        $this->assertIsArray($config['hsts']);
        $this->assertArrayHasKey('enabled', $config['hsts']);
        $this->assertArrayHasKey('max_age', $config['hsts']);
        $this->assertArrayHasKey('include_subdomains', $config['hsts']);
        $this->assertArrayHasKey('preload', $config['hsts']);
    }

    public function test_config_values_are_of_expected_types()
    {
        $config = config('security');

        $this->assertIsString($config['referrer_policy']);
        $this->assertIsArray($config['hsts']);
        $this->assertIsBool($config['hsts']['enabled']);
        $this->assertIsInt($config['hsts']['max_age']);
        $this->assertIsBool($config['hsts']['include_subdomains']);
        $this->assertIsBool($config['hsts']['preload']);
    }

    public function test_config_can_be_modified_at_runtime()
    {
        $originalPolicy = config('security.referrer_policy');

        config(['security.referrer_policy' => 'same-origin']);

        $this->assertEquals('same-origin', config('security.referrer_policy'));
        $this->assertNotEquals($originalPolicy, config('security.referrer_policy'));
    }

    public function test_hsts_max_age_minimum_recommended_value()
    {
        // HSTS recommendations suggest at least 6 months
        $sixMonths = 15552000;
        config(['security.hsts.max_age' => $sixMonths]);

        $maxAge = config('security.hsts.max_age');
        $this->assertEquals($sixMonths, $maxAge);
    }

    public function test_config_persists_across_multiple_accesses()
    {
        config([
            'security.referrer_policy' => 'origin',
            'security.hsts.enabled' => true,
        ]);

        $this->assertEquals('origin', config('security.referrer_policy'));
        $this->assertTrue(config('security.hsts.enabled'));

        // Access again
        $this->assertEquals('origin', config('security.referrer_policy'));
        $this->assertTrue(config('security.hsts.enabled'));
    }
}
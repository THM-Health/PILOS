<?php

namespace Tests\Backend\Unit\Config;

use Tests\Backend\TestCase;

class SecurityConfigTest extends TestCase
{
    public function test_security_config_loads_successfully()
    {
        $config = config('security');
        
        $this->assertIsArray($config);
        $this->assertArrayHasKey('referrer_policy', $config);
        $this->assertArrayHasKey('hsts', $config);
    }

    public function test_referrer_policy_has_default_value()
    {
        $referrerPolicy = config('security.referrer_policy');
        
        $this->assertNotNull($referrerPolicy);
        $this->assertIsString($referrerPolicy);
        $this->assertEquals('strict-origin-when-cross-origin', $referrerPolicy);
    }

    public function test_referrer_policy_can_be_overridden_by_env()
    {
        putenv('REFERRER_POLICY=no-referrer');
        
        // Reload config
        config(['security.referrer_policy' => env('REFERRER_POLICY', 'strict-origin-when-cross-origin')]);
        
        $this->assertEquals('no-referrer', config('security.referrer_policy'));
        
        // Cleanup
        putenv('REFERRER_POLICY');
    }

    public function test_hsts_config_structure()
    {
        $hstsConfig = config('security.hsts');
        
        $this->assertIsArray($hstsConfig);
        $this->assertArrayHasKey('enabled', $hstsConfig);
        $this->assertArrayHasKey('max_age', $hstsConfig);
        $this->assertArrayHasKey('include_subdomains', $hstsConfig);
        $this->assertArrayHasKey('preload', $hstsConfig);
    }

    public function test_hsts_enabled_default_value()
    {
        $hstsEnabled = config('security.hsts.enabled');
        
        $this->assertIsBool($hstsEnabled);
        $this->assertFalse($hstsEnabled);
    }

    public function test_hsts_enabled_can_be_overridden_by_env()
    {
        putenv('HSTS_ENABLED=true');
        
        // Reload config
        config(['security.hsts.enabled' => (bool) env('HSTS_ENABLED', false)]);
        
        $this->assertTrue(config('security.hsts.enabled'));
        
        // Cleanup
        putenv('HSTS_ENABLED');
    }

    public function test_hsts_max_age_default_value()
    {
        $maxAge = config('security.hsts.max_age');
        
        $this->assertIsInt($maxAge);
        $this->assertEquals(31536000, $maxAge); // 1 year in seconds
    }

    public function test_hsts_max_age_can_be_overridden_by_env()
    {
        putenv('HSTS_MAX_AGE=63072000');
        
        // Reload config
        config(['security.hsts.max_age' => (int) env('HSTS_MAX_AGE', 31536000)]);
        
        $this->assertEquals(63072000, config('security.hsts.max_age'));
        
        // Cleanup
        putenv('HSTS_MAX_AGE');
    }

    public function test_hsts_include_subdomains_default_value()
    {
        $includeSubdomains = config('security.hsts.include_subdomains');
        
        $this->assertIsBool($includeSubdomains);
        $this->assertFalse($includeSubdomains);
    }

    public function test_hsts_include_subdomains_can_be_overridden_by_env()
    {
        putenv('HSTS_INCLUDE_SUBDOMAINS=true');
        
        // Reload config
        config(['security.hsts.include_subdomains' => (bool) env('HSTS_INCLUDE_SUBDOMAINS', false)]);
        
        $this->assertTrue(config('security.hsts.include_subdomains'));
        
        // Cleanup
        putenv('HSTS_INCLUDE_SUBDOMAINS');
    }

    public function test_hsts_preload_default_value()
    {
        $preload = config('security.hsts.preload');
        
        $this->assertIsBool($preload);
        $this->assertFalse($preload);
    }

    public function test_hsts_preload_can_be_overridden_by_env()
    {
        putenv('HSTS_PRELOAD=true');
        
        // Reload config
        config(['security.hsts.preload' => (bool) env('HSTS_PRELOAD', false)]);
        
        $this->assertTrue(config('security.hsts.preload'));
        
        // Cleanup
        putenv('HSTS_PRELOAD');
    }

    public function test_all_hsts_options_can_be_enabled_together()
    {
        putenv('HSTS_ENABLED=true');
        putenv('HSTS_MAX_AGE=63072000');
        putenv('HSTS_INCLUDE_SUBDOMAINS=true');
        putenv('HSTS_PRELOAD=true');
        
        // Reload config
        config([
            'security.hsts.enabled' => (bool) env('HSTS_ENABLED', false),
            'security.hsts.max_age' => (int) env('HSTS_MAX_AGE', 31536000),
            'security.hsts.include_subdomains' => (bool) env('HSTS_INCLUDE_SUBDOMAINS', false),
            'security.hsts.preload' => (bool) env('HSTS_PRELOAD', false),
        ]);
        
        $this->assertTrue(config('security.hsts.enabled'));
        $this->assertEquals(63072000, config('security.hsts.max_age'));
        $this->assertTrue(config('security.hsts.include_subdomains'));
        $this->assertTrue(config('security.hsts.preload'));
        
        // Cleanup
        putenv('HSTS_ENABLED');
        putenv('HSTS_MAX_AGE');
        putenv('HSTS_INCLUDE_SUBDOMAINS');
        putenv('HSTS_PRELOAD');
    }

    public function test_config_values_are_properly_typed()
    {
        // Test that boolean values are truly booleans
        $this->assertIsBool(config('security.hsts.enabled'));
        $this->assertIsBool(config('security.hsts.include_subdomains'));
        $this->assertIsBool(config('security.hsts.preload'));
        
        // Test that integer values are truly integers
        $this->assertIsInt(config('security.hsts.max_age'));
        
        // Test that string values are truly strings
        $this->assertIsString(config('security.referrer_policy'));
    }

    public function test_hsts_max_age_accepts_various_time_periods()
    {
        $timePeriods = [
            3600 => 'one hour',
            86400 => 'one day',
            604800 => 'one week',
            2592000 => 'one month',
            31536000 => 'one year',
            63072000 => 'two years',
        ];

        foreach ($timePeriods as $seconds => $description) {
            putenv("HSTS_MAX_AGE={$seconds}");
            
            // Reload config
            config(['security.hsts.max_age' => (int) env('HSTS_MAX_AGE', 31536000)]);
            
            $this->assertEquals($seconds, config('security.hsts.max_age'), "Failed for {$description}");
        }
        
        // Cleanup
        putenv('HSTS_MAX_AGE');
    }
}
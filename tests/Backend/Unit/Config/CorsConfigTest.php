<?php

namespace Tests\Backend\Unit\Config;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Backend\TestCase;

class CorsConfigTest extends TestCase
{
    use RefreshDatabase;

    public function test_cors_config_file_exists()
    {
        $configPath = config_path('cors.php');
        $this->assertFileExists($configPath);
    }

    public function test_cors_paths_is_array()
    {
        $paths = config('cors.paths');
        $this->assertIsArray($paths);
    }

    public function test_cors_paths_is_empty_by_default()
    {
        $paths = config('cors.paths');
        $this->assertEmpty($paths);
    }

    public function test_cors_allowed_methods_configured()
    {
        $methods = config('cors.allowed_methods');
        $this->assertNotNull($methods);
        $this->assertIsArray($methods);
    }

    public function test_cors_config_has_required_keys()
    {
        $corsConfig = config('cors');

        $this->assertArrayHasKey('paths', $corsConfig);
        $this->assertArrayHasKey('allowed_methods', $corsConfig);
    }

    public function test_cors_config_structure()
    {
        $config = require config_path('cors.php');

        $this->assertIsArray($config);
        $this->assertArrayHasKey('paths', $config);
    }

    public function test_cors_paths_can_be_modified()
    {
        config(['cors.paths' => ['api/*', 'sanctum/csrf-cookie']]);

        $paths = config('cors.paths');
        $this->assertContains('api/*', $paths);
        $this->assertContains('sanctum/csrf-cookie', $paths);
    }

    public function test_cors_paths_accepts_empty_array()
    {
        config(['cors.paths' => []]);

        $paths = config('cors.paths');
        $this->assertIsArray($paths);
        $this->assertCount(0, $paths);
    }

    public function test_cors_paths_accepts_multiple_patterns()
    {
        $customPaths = ['api/v1/*', 'api/v2/*', 'webhooks/*'];
        config(['cors.paths' => $customPaths]);

        $paths = config('cors.paths');
        $this->assertCount(3, $paths);
        $this->assertEquals($customPaths, $paths);
    }

    public function test_cors_config_returns_correct_type()
    {
        $config = config('cors');
        $this->assertIsArray($config);
    }

    public function test_cors_allowed_methods_wildcard()
    {
        $methods = config('cors.allowed_methods');
        $this->assertContains('*', $methods);
    }
}
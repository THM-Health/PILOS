<?php

declare(strict_types=1);

namespace Tests\Backend\Feature;

use App\Http\Middleware\TrustHosts;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpFoundation\Exception\SuspiciousOperationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\Backend\TestCase;

class ApplicationUrlTest extends TestCase
{
    protected function tearDown(): void
    {
        Request::setTrustedHosts([]);

        parent::tearDown();
    }

    /**
     * Test that only the exact host of APP_URL is trusted.
     */
    public function test_exact_host_is_trusted(): void
    {
        $this->assertSame('pilos.example.org', $this->resolveHostWithTrustedHosts('pilos.example.org'));
        $this->assertSame('pilos.example.org', $this->resolveHostWithTrustedHosts('PILOS.EXAMPLE.ORG:443'));
    }

    /**
     * @return array<string, array{string}>
     */
    public static function untrustedHosts(): array
    {
        return [
            'application host as prefix' => ['pilos.example.org.attacker.test'],
            'application host as suffix' => ['attacker-pilos.example.org'],
            'subdomain' => ['sub.pilos.example.org'],
            'unescaped dot' => ['pilosXexample.org'],
        ];
    }

    /**
     * Test that hosts that only contain or resemble the host of APP_URL are rejected.
     */
    #[DataProvider('untrustedHosts')]
    public function test_lookalike_host_is_rejected(string $host): void
    {
        $this->expectException(SuspiciousOperationException::class);

        $this->resolveHostWithTrustedHosts($host);
    }

    /**
     * @return array<string, array{mixed}>
     */
    public static function applicationUrlsWithoutHost(): array
    {
        return [
            'empty' => [''],
            'null' => [null],
            'missing scheme' => ['pilos.example.org'],
            'missing host' => ['https://'],
        ];
    }

    /**
     * Test that an APP_URL without a host is logged and aborts with status 500 instead of trusting all hosts.
     */
    #[DataProvider('applicationUrlsWithoutHost')]
    public function test_application_url_without_host_logs_critical_and_aborts_with_500(mixed $applicationUrl): void
    {
        Log::shouldReceive('critical')->once()->withArgs(fn (string $message) => str_contains($message, 'APP_URL'));

        config(['app.url' => $applicationUrl]);

        try {
            (new TrustHosts($this->app))->hosts();
            $this->fail('An APP_URL without a host must not return trusted host patterns.');
        } catch (HttpException $exception) {
            $this->assertSame(500, $exception->getStatusCode());
        }
    }

    /**
     * Resolve the host of a request using the patterns of the TrustHosts middleware.
     *
     * The middleware does not apply them on its own while running tests.
     */
    private function resolveHostWithTrustedHosts(string $host): string
    {
        config(['app.url' => 'https://pilos.example.org']);
        Request::setTrustedHosts((new TrustHosts($this->app))->hosts());

        $request = Request::create('https://placeholder.test/');
        $request->headers->set('HOST', $host);

        return $request->getHost();
    }
}

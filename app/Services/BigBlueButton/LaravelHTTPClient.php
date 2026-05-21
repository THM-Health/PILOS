<?php

declare(strict_types=1);

namespace App\Services\BigBlueButton;

use BigBlueButton\Exceptions\NetworkException;
use BigBlueButton\Exceptions\RuntimeException;
use BigBlueButton\Http\Transport\TransportInterface;
use BigBlueButton\Http\Transport\TransportRequest;
use BigBlueButton\Http\Transport\TransportResponse;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Allows to send requests to the BBB server with a Laravel HTTP Client contract implementation.
 */
final class LaravelHTTPClient implements TransportInterface
{
    private PendingRequest $httpClient;

    public function __construct()
    {
        $this->httpClient = self::httpClient();
    }

    public static function httpClient(): PendingRequest
    {
        return Http::timeout(config('bigbluebutton.server_timeout'))
            ->connectTimeout(config('bigbluebutton.server_connect_timeout'))
            ->withOptions([
                'debug' => true
            ])
            ->retry(config('bigbluebutton.server_retry'), config('bigbluebutton.server_retry_sleep'), function (Throwable $exception, PendingRequest $request) {
                $request->beforeSending(function (Request $request) use ($exception) {
                    Log::warning('BigBlueButton API request to url {url} failed with a connection error. Retrying', [
                        'url' => $request->url(),
                        'message' => $exception->getMessage(),
                    ]);
                });

                return $exception instanceof ConnectionException;
            }, throw: false);
    }

    /**
     * {@inheritDoc}
     */
    public function request(TransportRequest $request): TransportResponse
    {
        try {
            ob_start();
            if ('' !== $payload = $request->getPayload()) {
                $httpResponse = $this->httpClient
                    ->withBody($payload)
                    ->contentType($request->getContentType())
                    ->post($request->getUrl());
            } else {
                $httpResponse = $this->httpClient
                    ->get($request->getUrl());
            }
        } catch (ConnectionException $e) {
            $debug = ob_get_contents();
            ob_end_clean();

            Log::error('BigBlueButton API request to url {url} failed with a connection error.', [
                'url' => $request->getUrl(),
                'message' => $e->getMessage(),
                'debug' => $debug,
            ]);

            throw new RuntimeException(sprintf('HTTP request failed: %s', $e->getMessage()), 0, $e);
        } finally {
            $debug = ob_get_contents();
            ob_end_clean();
        }

        if ($httpResponse->failed()) {
            Log::error('BigBlueButton API request to url {url} failed with status {status}.', [
                'url' => $request->getUrl(),
                'status' => $httpResponse->status(),
                'debug' => $debug,
            ]);

            throw new NetworkException('Bad response.', $httpResponse->status());
        }

        return new TransportResponse($httpResponse->body(), $httpResponse->cookies()->getCookieByName('JSESSIONID'));
    }
}

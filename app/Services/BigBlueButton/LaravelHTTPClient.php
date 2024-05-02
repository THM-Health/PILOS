<?php

namespace App\Services\BigBlueButton;

use BigBlueButton\Exceptions\NetworkException;
use BigBlueButton\Exceptions\RuntimeException;
use BigBlueButton\Http\Transport\TransportInterface;
use BigBlueButton\Http\Transport\TransportRequest;
use BigBlueButton\Http\Transport\TransportResponse;
use Http;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Log;

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
        return Http::timeout(config('bigbluebutton.server_timeout'))->connectTimeout(config('bigbluebutton.server_connect_timeout'));
    }

    /**
     * {@inheritDoc}
     */
    public function request(TransportRequest $request): TransportResponse
    {
        try {
            if ('' !== $payload = $request->getPayload()) {
                $httpResponse = $this->httpClient
                    ->withBody($payload)
                    ->contentType($request->getContentType())
                    ->post($request->getUrl());
            } else {
                $httpResponse = $this->httpClient
                    ->contentType($request->getContentType())
                    ->get($request->getUrl());
            }
        } catch (ConnectionException $e) {
            Log::error('BigBlueButton API request to url {url} failed with a connection error.', [
                'url'     => $request->getUrl(),
                'message' => $e->getMessage()
            ]);

            throw new RuntimeException(sprintf('HTTP request failed: %s', $e->getMessage()), 0, $e);
        }

        if ($httpResponse->failed()) {
            Log::error('BigBlueButton API request to url {url} failed with status {status}.', [
                'url'    => $request->getUrl(),
                'status' => $httpResponse->status(),
            ]);

            throw new NetworkException('Bad response.', $httpResponse->status());
        }

        return new TransportResponse($httpResponse->body(), $httpResponse->cookies()->getCookieByName('JSESSIONID'));
    }
}

<?php

namespace Tests\Backend\Utils;

use Http;
use Illuminate\Http\Client\Request;

/**
 * Fake BigBlueButton server responses
 */
class BigBlueButtonServerFaker
{
    // List of requests and responses
    protected $requests = [];

    // Number of requests
    protected $requestCount = 0;

    /**
     * Create a fake BBB-Server to validate checksums and fake responses
     *
     * @param  string  $host  Hostname of the BBB-Server
     * @param  string  $secret  Secret of the BBB-Server
     */
    public function __construct(string $host, string $secret)
    {
        // Respond to all requests to the Host of the BBB-Server
        Http::stubUrl($host.'*', function (Request $request) use ($secret, $host) {
            $uri = $request->toPsrRequest()->getUri();

            // Get the BBB api endpoint and parameters
            $apiCallName = explode('api/', explode('?', explode($host, $request->url(), 2)[1], 2)[0])[1];
            parse_str($uri->getQuery(), $params);

            // Get the checksum of the request
            $requestChecksum = $params['checksum'];

            // Remove the checksum from the list of parameters
            unset($params['checksum']);

            // Create the hash base
            $query = http_build_query($params, '', '&', \PHP_QUERY_RFC3986);
            $hashBase = $apiCallName.$query.$secret;

            // Check what hash algorithm was used in the request and create the hash
            switch (strlen($requestChecksum)) {
                case 40:
                    $checksum = sha1($hashBase);

                    break;
                case 64:
                    $checksum = hash('sha256', $hashBase);

                    break;
                case 96:
                    $checksum = hash('sha384', $hashBase);

                    break;
                case 128:
                    $checksum = hash('sha512', $hashBase);

                    break;
            }

            // Return error if no checksum was calculated and if it doesn't matches the checksum of the request
            if ($checksum == null || strtolower($requestChecksum) != strtolower($checksum)) {
                return Http::response(file_get_contents(__DIR__.'/../Fixtures/ChecksumError.xml'));
            }

            // Save the request for inspection
            $this->requests[$this->requestCount]['request'] = $request;

            // Increase the request counter
            $this->requestCount++;

            // Respond to the request using the stored response for this request
            return call_user_func($this->requests[$this->requestCount - 1]['response'], $request);
        });
    }

    /**
     * Add a response for a request
     * Requests are returned in the order they are added
     *
     * @return void
     */
    public function addRequest(mixed $response)
    {
        $this->requests[] = ['request' => null, 'response' => $response];
    }

    /**
     * Add a response for a create meeting request
     *
     * @return void
     */
    public function addCreateMeetingRequest()
    {
        $response = function (Request $request) {
            return BigBlueButtonServerFaker::createCreateMeetingResponse($request);
        };

        $this->requests[] = ['request' => null, 'response' => $response];
    }

    /**
     * Get the request data for a request
     *
     * @param  int  $id  Number of the request (starting with 0)
     * @return mixed
     */
    public function getRequest(int $id)
    {
        return $this->requests[$id]['request'];
    }

    public static function createCreateMeetingResponse(Request $request): \GuzzleHttp\Promise\PromiseInterface
    {
        $uri = $request->toPsrRequest()->getUri();
        parse_str($uri->getQuery(), $params);
        $xml = '
                <response>
                    <returncode>SUCCESS</returncode>
                    <meetingID>'.$params['meetingID'].'</meetingID>
                    <internalMeetingID>5756487f8952a40879db59f8fe4085798cb79ccc-1695892370102</internalMeetingID>
                    <parentMeetingID>bbb-none</parentMeetingID>
                    <createTime>1695892370102</createTime>
                    <voiceBridge>92443</voiceBridge>
                    <dialNumber>613-555-1234</dialNumber>
                    <createDate>Thu Sep 28 09:12:50 UTC 2023</createDate>
                    <hasUserJoined>false</hasUserJoined>
                    <duration>0</duration>
                    <hasBeenForciblyEnded>false</hasBeenForciblyEnded>
                    <messageKey></messageKey>
                    <message></message>
                </response>';

        return Http::response($xml);
    }
}

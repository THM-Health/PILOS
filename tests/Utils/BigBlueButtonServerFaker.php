<?php

namespace Tests\Utils;

use Http;
use Illuminate\Http\Client\Request;
use Str;

class BigBlueButtonServerFaker
{
    protected $requests     = [];
    protected $requestCount = 0;

    public function __construct($host, $secret)
    {
        Http::fake(function (Request $request) use ($secret, $host) {
            $uri = $request->toPsrRequest()->getUri();

            if (!Str::startsWith($request->url(), $host)) {
                return Http::response(null, 404);
            }

            $apiCallName = explode('api/', explode('?', explode($host, $request->url(), 2)[1], 2)[0])[1];
            parse_str($uri->getQuery(), $params);

            $checksum = $params['checksum'];
            unset($params['checksum']);

            $query = http_build_query($params, '', '&', \PHP_QUERY_RFC3986);
            
            $hashBase = $apiCallName . $query . $secret;

            switch(strlen($checksum)) {
                case 40:
                    $hash = sha1($hashBase);

                    break;
                case 64:
                    $hash = hash('sha256', $hashBase);

                    break;
                case 96:
                    $hash = hash('sha384', $hashBase);

                    break;
                case 128:
                    $hash = hash('sha384', $hashBase);

                    break;
            }

            if ($hash == null || strtolower($checksum) != strtolower($hash)) {
                return Http::response(file_get_contents(__DIR__.'/../Fixtures/ChecksumError.xml'));
            }

            $this->requests[$this->requestCount]['request'] = $request;
            $response                                       = call_user_func($this->requests[$this->requestCount]['response'], $request);

            $this->requestCount++;

            return $response;
        });
    }

    public function addRequest($response)
    {
        $this->requests[] = ['request' => null, 'response' => $response];
    }

    public function addCreateMeetingRequest()
    {
        $response = function (Request $request) {
            $uri = $request->toPsrRequest()->getUri();
            parse_str($uri->getQuery(), $params);
            $xml = '
                <response>
                    <returncode>SUCCESS</returncode>
                    <meetingID>'.$params['meetingID'].'</meetingID>
                    <internalMeetingID>5756487f8952a40879db59f8fe4085798cb79ccc-1695892370102</internalMeetingID>
                    <parentMeetingID>bbb-none</parentMeetingID>
                    <attendeePW>'.$params['attendeePW'].'</attendeePW>
                    <moderatorPW>'.$params['moderatorPW'].'</moderatorPW>
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
        };

        $this->requests[] = ['request' => null, 'response' => $response];
    }

    public function getRequest($id)
    {
        return $this->requests[$id]['request'];
    }
}

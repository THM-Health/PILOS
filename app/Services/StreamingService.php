<?php

namespace App\Services;

use App\Models\Meeting;
use BigBlueButton\Enum\Role;
use BigBlueButton\Parameters\JoinMeetingParameters;
use Illuminate\Support\Facades\Http;

class StreamingService
{
    private ServerService $serverService;

    public function __construct(public Meeting $meeting)
    {
        $this->serverService = new ServerService($meeting->server);
    }

    public function getJoinUrl(): string
    {
        $joinMeetingParams = new JoinMeetingParameters($this->meeting->id, 'Livestream', Role::MODERATOR);
        $joinMeetingParams->setRedirect(true);
        $joinMeetingParams->setUserID('b-streaming');

        $joinMeetingParams->addUserData('bbb_hide_nav_bar', 'true');
        $joinMeetingParams->addUserData('bbb_hide_actions_bar', 'true');
        $joinMeetingParams->addUserData('bbb_show_public_chat_on_login', 'false');
        $joinMeetingParams->addUserData('bbb_show_participants_on_login', 'false');
        $joinMeetingParams->addUserData('bbb_ask_for_feedback_on_logout', 'true');

        $style =
            ':root {
    --color-background: #000;
    --color-content-background: var(--color-background);
    --loader-bg: var(--color-background);
}

#video-player div:nth-child(2) {
    display: none;
}

.Toastify {
    display: none;
}

aside[data-test="pollingContainer"] {
    display: none;
}

body {
    background-color: var(--color-background) !important;
}';

        $joinMeetingParams->addUserData('bbb_custom_style', $style);
        $joinMeetingParams->setAvatarURL(url('/images/livestream_avatar.png'));

        return $this->serverService->getBigBlueButton()->getJoinMeetingURL($joinMeetingParams);
    }

    public function getHttpClient()
    {
        $client = Http::baseUrl(config('streaming.api'));
        if (config('streaming.auth.type') === 'basic') {
            $client->withBasicAuth(config('streaming.auth.basic.username'), config('streaming.auth.basic.password'));
        }

        return $client;
    }

    public function getJobId(): string
    {
        $host = parse_url($this->meeting->server->base_url)['host'];

        return hash('sha256', $this->meeting->id.'@'.$host);
    }

    private function handleResponse($response)
    {
        if ($response->status() === 404) {
            $this->meeting->room->streaming->status = null;
            $this->meeting->room->streaming->fps = null;
            $this->meeting->room->streaming->save();

            return true;
        }
        if ($response->status() === 400 || $response->successful()) {

            $data = $response->json('progress');

            $this->meeting->room->streaming->status = $data['status'];
            $this->meeting->room->streaming->fps = $data['fps'];
            $this->meeting->room->streaming->save();

            return true;
        }

        return false;
    }

    public function getStatus()
    {
        $response = $this->getHttpClient()->get($this->getJobId());

        return $this->handleResponse($response);
    }

    public function start($pauseImageUrl, $rtmpUrl)
    {
        // Fallback if no pause image is configured in room settings
        if ($pauseImageUrl === null) {

            // Fallback to default pause image from room type
            $pauseImageUrl = $this->meeting->room->roomType->streamingSettings->default_pause_image;

            // Fallback to default pause image from system settings
            if ($pauseImageUrl === null) {
                $streamingSettings = app(\App\Settings\StreamingSettings::class);
                $pauseImageUrl = $streamingSettings->default_pause_image;
            }
        }

        $response = $this->getHttpClient()->post('', [
            'joinUrl' => $this->getJoinUrl(),
            'pauseImageUrl' => $pauseImageUrl,
            'rtmpUrl' => $rtmpUrl,
        ]);

        return $this->handleResponse($response);
    }

    public function stop()
    {
        $response = $this->getHttpClient()->post($this->getJobId().'/stop');

        return $this->handleResponse($response);
    }

    public function resume()
    {
        $response = $this->getHttpClient()->post($this->getJobId().'/resume');

        return $this->handleResponse($response);
    }

    public function pause()
    {
        $response = $this->getHttpClient()->post($this->getJobId().'/pause');

        return $this->handleResponse($response);
    }
}

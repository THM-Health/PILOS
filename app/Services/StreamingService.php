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
        $settings = app(\App\Settings\StreamingSettings::class);

        $joinMeetingParams = new JoinMeetingParameters($this->meeting->id, 'Livestream', Role::MODERATOR);

        // Apply custom join parameters
        if ($settings->join_parameters != null) {

            $result = MeetingService::setCustomJoinMeetingParameters($joinMeetingParams, $settings->join_parameters);

            // If setting custom parameters failed, we have to recreate the parameter object to reset it
            if (count($result) > 0) {
                $joinMeetingParams = new JoinMeetingParameters($this->meeting->id, 'Livestream', Role::MODERATOR);
            }
        }

        // Set some parameters, that should always be set and never be overridden
        $joinMeetingParams->setRedirect(true);
        $joinMeetingParams->setUserID('b-streaming');
        $joinMeetingParams->setExcludeFromDashboard(true);
        $joinMeetingParams->addUserData('bbb_hide_actions_bar', 'true');
        $joinMeetingParams->addUserData('bbb_ask_for_feedback_on_logout', 'true');

        if ($settings->css_file != null) {
            $joinMeetingParams->addUserData('bbb_custom_style_url', $settings->css_file);
        }
        $joinMeetingParams->setAvatarURL(url('/images/livestream_avatar.png'));

        return $this->serverService->getBigBlueButton()->getJoinMeetingURL($joinMeetingParams);
    }

    public function getHttpClient()
    {
        $client = Http::timeout(config('streaming.server_timeout'))
            ->connectTimeout(config('streaming.server_connect_timeout'))
            ->baseUrl(config('streaming.api'));

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
        try {
            $response = $this->getHttpClient()->get($this->getJobId());
        } catch (\Exception $exception) {
            return false;
        }

        return $this->handleResponse($response);
    }

    public function start()
    {
        $pauseImageUrl = $this->meeting->room->streaming->pause_image;

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

        try {
            $response = $this->getHttpClient()->post('', [
                'joinUrl' => $this->getJoinUrl(),
                'pauseImageUrl' => $pauseImageUrl,
                'rtmpUrl' => $this->meeting->room->streaming->url,
            ]);
        } catch (\Exception $exception) {
            return false;
        }

        return $this->handleResponse($response);
    }

    public function stop()
    {
        try {
            $response = $this->getHttpClient()->post($this->getJobId().'/stop');
        } catch (\Exception $exception) {
            return false;
        }

        return $this->handleResponse($response);
    }

    public function resume()
    {
        try {
            $response = $this->getHttpClient()->post($this->getJobId().'/resume');
        } catch (\Exception $exception) {
            return false;
        }

        return $this->handleResponse($response);
    }

    public function pause()
    {
        try {
            $response = $this->getHttpClient()->post($this->getJobId().'/pause');
        } catch (\Exception $exception) {
            return false;
        }

        return $this->handleResponse($response);
    }
}

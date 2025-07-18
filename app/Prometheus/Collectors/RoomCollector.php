<?php

namespace App\Prometheus\Collectors;

use App\Models\Room;
use App\Prometheus\CollectorRegistry;
use App\Prometheus\Counter;
use App\Prometheus\Gauge;

class RoomCollector implements Collector
{
    public function register(CollectorRegistry $registry): void
    {
        Gauge::register($registry, 'rooms_total', 'Total number of rooms');
        Counter::register($registry, 'room_authentication_errors_total', 'Total number of room authentication errors', ['error_type']);
        Counter::register($registry, 'room_started_total', 'Total number of rooms started');
        Counter::register($registry, 'room_start_errors_total', 'Total number of errors when starting a room', ['error_type']);
        Counter::register($registry, 'room_joined_total', 'Total number of rooms joined');
        Counter::register($registry, 'room_join_errors_total', 'Total number of errors when joining a room', ['error_type']);
    }

    public function collect(): void
    {
        Gauge::get('rooms_total')
            ->set(Room::count());
        Counter::get('room_authentication_errors_total')
            ->init(['access_code_invalid', 'guest_access', 'token']);
        Counter::get('room_started_total')
            ->init();
        Counter::get('room_start_errors_total')
            ->init(['no_server_found', 'start_failed']);
        Counter::get('room_joined_total')
            ->init();
        Counter::get('room_join_errors_total')
            ->init(['checking_meeting_running_on_server_error', 'meeting_not_running_on_server']);
    }
}

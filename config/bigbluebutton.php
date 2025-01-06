<?php

return [
    'test_server' => [
        'host' => env('BBB_TEST_SERVER_HOST'),
        'secret' => env('BBB_TEST_SERVER_SECRET'),
    ],
    'max_filesize' => (int) env('BBB_MAX_FILESIZE', 30),
    'allowed_file_mimes' => env('BBB_ALLOWED_FILE_MIMES', 'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,rtf,odt,ods,odp,odg,odc,odi,jpg,jpeg,png'),
    'welcome_message_limit' => (int) env('WELCOME_MESSAGE_LIMIT', 500), // max 5000
    'room_name_limit' => (int) env('ROOM_NAME_LIMIT', 50),
    'room_id_max_tries' => (int) env('BBB_ROOM_ID_MAX_TRIES', 1000),
    'user_search_limit' => (int) env('USER_SEARCH_LIMIT', 10),
    'server_timeout' => (int) env('BBB_SERVER_TIMEOUT', 10),
    'server_connect_timeout' => (int) env('BBB_SERVER_CONNECT_TIMEOUT', 20),
    'room_refresh_rate' => (int) env('ROOM_REFRESH_RATE', 30),
    'server_online_threshold' => (int) env('BBB_SERVER_ONLINE_THRESHOLD', 3),
    'server_offline_threshold' => (int) env('BBB_SERVER_OFFLINE_THRESHOLD', 3),

    'load_new_meeting_min_user_count' => (int) env('BBB_LOAD_MIN_USER_COUNT', 15),
    'load_new_meeting_min_user_interval' => (int) env('BBB_LOAD_MIN_USER_INTERVAL', 15),

    'allowed_name_characters' => env('BBB_ALLOWED_NAME_CHARACTERS', "\w ,.'\-+\/&()"),
];

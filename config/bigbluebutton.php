<?php

return [

    'testserver' => json_decode(env('TESTING_BBB','[]')),
    'max_filesize' => env('BBB_MAX_FILESIZE',30)*1000,
    'allowed_file_mimes' => env('BBB_ALLOWED_FILE_MIMES','pdf,doc,docx,xls,xlsx,ppt,pptx,txt,rtf,odt,ods,odp,odg,odc,odi,jpg,jpeg,png'),
    'welcome_message_limit' => env('MIX_WELCOME_MESSAGE_LIMIT',500),
    'room_name_limit' => env('MIX_ROOM_NAME_LIMIT',50),
    'room_id_max_tries' =>  env('BBB_ROOM_ID_MAX_TRIES',1000),
    'user_search_limit' =>  env('USER_SEARCH_LIMIT',10),
];

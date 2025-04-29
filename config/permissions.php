<?php

return [
    'restrictions' => explode(',', (string) env('PERMISSION_RESTRICTIONS', '')),
];

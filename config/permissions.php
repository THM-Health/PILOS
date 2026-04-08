<?php

declare(strict_types=1);

return [
    'restrictions' => explode(',', env('PERMISSION_RESTRICTIONS', '')),
];

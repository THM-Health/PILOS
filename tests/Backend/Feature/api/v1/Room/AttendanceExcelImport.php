<?php

namespace Tests\Backend\Feature\api\v1\Room;

use Maatwebsite\Excel\Concerns\Importable;
use Maatwebsite\Excel\Concerns\ToModel;

/**
 * Class AttendanceExcelImport
 * Helper to validate attendance excel download, used in testAttendanceDownload (tests/Feature/api/v1/Room/RoomStatisticTest.php)
 */
class AttendanceExcelImport implements ToModel
{
    use Importable;

    public function model(array $row)
    {
        return $row;
    }
}

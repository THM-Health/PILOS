<?php

declare(strict_types=1);

namespace Tests\Backend\Unit\Exports;

use App\Exports\AttendanceExport;
use App\Models\Meeting;
use App\Models\MeetingAttendee;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use Tests\Backend\TestCase;

class AttendanceExportTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Formula-like names must be written as plain strings, not Excel formulas.
     */
    public function test_writes_formula_like_names_as_strings(): void
    {
        $formula = '=HYPERLINK("https://evil.example","Click")';

        $meeting = Meeting::factory()->create([
            'start' => '2020-01-01 08:12:45',
            'end' => '2020-01-01 08:35:23',
            'record_attendance' => true,
        ]);
        $meeting->room->name = $formula;
        $meeting->room->save();
        $meeting->attendees()->save(new MeetingAttendee([
            'name' => $formula,
            'session_id' => 'PogeR6XH8I2SAeCqc8Cp5y5bD9Qq70dRxe4DzBcb',
            'join' => '2020-01-01 08:13:11',
            'leave' => '2020-01-01 08:15:51',
        ]));

        $sheet = new AttendanceExport($meeting, 'UTC')->toSpreadsheet()->getActiveSheet();

        $this->assertSame(DataType::TYPE_STRING, $sheet->getCell('B1')->getDataType());
        $this->assertSame($formula, $sheet->getCell('B1')->getValue());
        $this->assertSame(DataType::TYPE_STRING, $sheet->getCell('A6')->getDataType());
        $this->assertSame($formula, $sheet->getCell('A6')->getValue());
    }
}

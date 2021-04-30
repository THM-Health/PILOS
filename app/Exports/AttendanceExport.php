<?php

namespace App\Exports;

use App\Meeting;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Class AttendanceExport
 * @package App\Exports
 */
class AttendanceExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
{
    /**
     * @var Meeting Meeting the attendance should be exported for
     */
    private $meeting;
    /**
     * @var string Timezone the datetimes should be shown in
     */
    private $timezone;

    /**
     * AttendanceExport constructor.
     * @param Meeting $meeting  Meeting the attendance should be exported for
     * @param string  $timezone Timezone the datetimes should be shown in
     */
    public function __construct(Meeting $meeting, string $timezone)
    {
        $this->meeting  = $meeting;
        $this->timezone = $timezone;
    }

    /**
     * Collection of the data to export into the excel file
     * @return \Illuminate\Database\Eloquent\Collection|Collection
     */
    public function collection()
    {
        return $this->meeting->attendance();
    }

    /**
     * Set style of the excel sheet
     * @param Worksheet $sheet
     */
    public function styles(Worksheet $sheet)
    {
        // set heading of the attendance table to bold text
        $sheet->getStyle('5')->getFont()->setBold(true);
        // enable multiple lines for the session column
        $sheet->getStyle('D')->getAlignment()->setWrapText(true);
    }

    /**
     * Heading of the spreadsheet, inserted before the data
     * @return array
     */
    public function headings(): array
    {
        return [
            [
                __('meetings.attendance.export.roomName'),
                $this->meeting->room->name,
            ],
            [
                __('meetings.attendance.export.start'),
                $this->meeting->start->setTimezone($this->timezone)->format('d.m.Y H:i:s'),
            ],
            [
                __('meetings.attendance.export.end'),
                $this->meeting->end->setTimezone($this->timezone)->format('d.m.Y H:i:s'),
            ],
            [],
            [
                __('meetings.attendance.export.name'),
                __('meetings.attendance.export.email'),
                __('meetings.attendance.export.duration'),
                __('meetings.attendance.export.sessions'),
        ]];
    }

    /**
     * Map attendance collection row to data for each row
     * @param  mixed $row
     * @return array
     */
    public function map($row): array
    {
        // build content for each session row
        $sessions = [];
        foreach ($row['sessions'] as $session) {
            array_push($sessions, $session['join']->setTimezone($this->timezone)->format('d.m.Y H:i:s').' -  '.$session['leave']->setTimezone($this->timezone)->format('d.m.Y H:i:s').' ('.__('meetings.attendance.export.durationMinute', ['duration' => $session['duration']]).')');
        }

        // build row content
        return [
            $row['name'],
            $row['email'],
            __('meetings.attendance.export.durationMinute', ['duration' => $row['duration']]),
            implode(PHP_EOL, $sessions),
        ];
    }
}

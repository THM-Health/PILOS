<?php

// SPDX-FileCopyrightText: 2021 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Exports;

use App\Models\Meeting;
use App\Services\MeetingService;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Class AttendanceExport
 */
class AttendanceExport
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
     *
     * @param  Meeting  $meeting  Meeting the attendance should be exported for
     * @param  string  $timezone  Timezone the datetimes should be shown in
     */
    public function __construct(Meeting $meeting, string $timezone)
    {
        $this->meeting = $meeting;
        $this->timezone = $timezone;
    }

    /**
     * Collection of the data to export into the excel file
     */
    public function collection(): \Illuminate\Database\Eloquent\Collection|Collection
    {
        return new MeetingService($this->meeting)->attendance();
    }

    /**
     * Set style of the excel sheet
     */
    public function styles(Worksheet $sheet): void
    {
        // set heading of the attendance table to bold text
        $sheet->getStyle('5')->getFont()->setBold(true);
        // enable multiple lines for the session column
        $sheet->getStyle('D')->getAlignment()->setWrapText(true);

        $sheet->getStyle('A:D')->getAlignment()->setVertical('top');
        $sheet->getStyle('A')->getAlignment()->setVertical(Alignment::VERTICAL_TOP);

        $sheet->getColumnDimension('A')->setAutoSize(true);
        $sheet->getColumnDimension('B')->setAutoSize(true);
        $sheet->getColumnDimension('C')->setAutoSize(true);
        $sheet->getColumnDimension('D')->setAutoSize(true);
    }

    /**
     * Heading of the spreadsheet, inserted before the data
     */
    public function headings(): array
    {
        return [
            [
                __('rooms.name'),
                $this->meeting->room->name,
            ],
            [
                __('meetings.start'),
                $this->meeting->start->setTimezone($this->timezone)->format('d.m.Y H:i:s'),
            ],
            [
                __('meetings.end'),
                $this->meeting->end->setTimezone($this->timezone)->format('d.m.Y H:i:s'),
            ],
            [],
            [
                __('app.user_name'),
                __('app.email'),
                __('meetings.attendance.duration'),
                __('meetings.attendance.sessions'),
            ]];
    }

    /**
     * Map attendance collection row to data for each row
     *
     * @param  mixed  $row
     */
    public function map($row): array
    {
        // build content for each session row
        $sessions = [];
        foreach ($row['sessions'] as $session) {
            array_push($sessions, $session['join']->setTimezone($this->timezone)->format('d.m.Y H:i:s').' -  '.$session['leave']->setTimezone($this->timezone)->format('d.m.Y H:i:s').' ('.__('meetings.attendance.duration_minute', ['duration' => $session['duration']]).')');
        }

        // build row content
        return [
            $row['name'],
            $row['email'],
            __('meetings.attendance.duration_minute', ['duration' => $row['duration']]),
            implode(PHP_EOL, $sessions),
        ];
    }

    public function toSpreadsheet(): Spreadsheet
    {
        $spreadsheet = new Spreadsheet;

        $spreadsheet->getProperties()
            ->setTitle(__('meetings.attendance.spreadsheet.title', ['room' => $this->meeting->room->name]))
            ->setCreator(config('app.name'))
            ->setLastModifiedBy(config('app.name'))
            ->setCreated(now()->timestamp)
            ->setModified(now()->timestamp);

        $activeSheet = $spreadsheet->getActiveSheet();

        $activeSheet->setTitle(__('meetings.attendance.spreadsheet.worksheet'));

        $headings = $this->headings();
        $offset = count($headings);

        $activeSheet->fromArray($headings);

        $rows = $this->collection()->map(function ($row) {
            return $this->map($row);
        })->toArray();

        $activeSheet->fromArray($rows, null, 'A'.($offset + 1));

        $this->styles($activeSheet);

        return $spreadsheet;
    }

    public function toResponse(): BinaryFileResponse
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'attendance_export');
        $fileName = __('meetings.attendance.filename').'.xlsx';

        $writer = new Xlsx($this->toSpreadsheet());
        $writer->save($tempFile);

        return response()->download($tempFile, $fileName)->deleteFileAfterSend();
    }
}

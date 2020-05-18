<?php

namespace App\Http\Controllers;


use App\Meeting;
use App\Room;
use App\Server;
use DateTime;
use DateTimeZone;
use Illuminate\Http\Request;


use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use JoisarJignesh\Bigbluebutton\Bbb;
use JoisarJignesh\Bigbluebutton\Bigbluebutton;

use Yajra\DataTables\Facades\DataTables;
use Yajra\DataTables\Html\Builder;

class MeetingController extends Controller
{

    public function __construct()
    {
        $this->authorizeResource(Meeting::class, 'meeting');
    }
    /**
     * Display a listing of the resource.
     *
     */
    public function index(Builder $builder) {
        if (request()->ajax()) {

            $target_time_zone = new DateTimeZone(config('app.displaytimezone'));
            $kolkata_date_time = new DateTime('now', $target_time_zone);
            $utc_offset = $kolkata_date_time->format('P');


            $query = DB::table('meetings')
                ->join('meeting_stats', 'meetings.id', '=', 'meeting_stats.meeting_id')
                ->join('rooms', 'rooms.id', '=', 'meetings.room_id')
                ->join('servers', 'servers.id', '=', 'meetings.server_id')
                ->leftJoin('users', 'users.id', '=', 'rooms.user_id')
                ->select([
                    'servers.description as description',
                    'meetings.id as id',
                    'users.name as name',
                    'users.email as email',
                    'rooms.name as roomname',
                    DB::raw("CONVERT_TZ(meetings.start,'+00:00','$utc_offset') as start"),
                     DB::raw("CONVERT_TZ(meetings.end,'+00:00','$utc_offset') as end"),
                    DB::raw('max(meeting_stats.participantCount) as max_participants'),
                    DB::raw('max(meeting_stats.voiceParticipantCount) as max_voice'),
                    DB::raw('max(meeting_stats.videoCount) as max_video'),
                    ])
                ->groupBy('meetings.id');

                if (!Auth::user()->can('viewAll', Meeting::class)) {
                    $query = $query->where('rooms.user_id',Auth::user()->id);
                }



            return DataTables::of($query)
                ->addColumn('action', '<a href="{{route("meetings.show",["meeting"=>$id])}}" class="btn btn-primary"><i class="fas fa-eye"></i></a>')
                ->rawColumns(['action'])
                ->editColumn('start', function ($meeting) {
                    return $meeting->start ? with(new Carbon($meeting->start))->format('d.m.Y H:i') : '';
                })
                ->editColumn('end', function ($meeting) {
                    return $meeting->end ? with(new Carbon($meeting->end))->format('d.m.Y H:i') : '';
                })
                ->filter(function ($query) use ($utc_offset) {

                    if(request()->has('search') && isset(request()->search['value'])){
                        $keyword = request()->search['value'];
                        $query->orWhere('servers.description', 'like', "%" . $keyword . "%");
                        $query->orWhere('users.name', 'like', "%" . $keyword . "%");
                        $query->orWhere('rooms.name', 'like', "%" . $keyword . "%");
                        $query->orWhere('users.email', 'like', "%" . $keyword . "%");
                        $query->orWhereRaw("DATE_FORMAT(CONVERT_TZ(meetings.start,'+00:00','$utc_offset'),'%d.%m.%Y %H:%i:%s') like ?", ["%$keyword%"]);
                        $query->orWhereRaw("DATE_FORMAT(CONVERT_TZ(meetings.end,'+00:00','$utc_offset'),'%d.%m.%Y %H:%i:%s') like ?", ["%$keyword%"]);

                    }



                })
                ->toJson();

        }
        $builder->parameters([
            'paging' => true,
            'searching' => true,
            'info' => true,
            'order' => [
                4,
                'desc'
             ],
            'searchDelay' => 350,

            'language' => [
                'url' => asset('vendor/datatables/German.json')
            ],
        ]);
        $html = $builder->columns([
            ['data' => 'description', 'name' => 'description', 'title' => __('meeting.server')],
            ['data' => 'roomname', 'name' => 'roomname', 'title' => __('meeting.description')],
            ['data' => 'name', 'name' => 'name', 'title' => __('meeting.owner_name')],
            ['data' => 'email', 'name' => 'email', 'title' => __('meeting.owner_email')],
            ['data' => 'start', 'name' => 'start', 'title' => __('meeting.start')],
            ['data' => 'end', 'name' => 'end', 'title' => __('meeting.end')],
            ['data' => 'max_participants', 'name' => 'max_participants', 'title' => __('meeting.max_participants')],
            ['data' => 'max_voice', 'name' => 'max_voice', 'title' => __('meeting.max_audio')],
            ['data' => 'max_video', 'name' => 'max_video', 'title' => __('meeting.max_video')],
            [
                'defaultContent' => '',
                'data'           => 'action',
                'name'           => 'action',
                'title'          => __('meeting.view'),
                'orderable'      => false,
                'searchable'     => false,
                'exportable'     => false,
                'printable'      => true,
                'footer'         => '',
            ]
            ]);

    return view('meetings.index', compact('html'));
}

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show(Meeting $meeting)
    {

        $stats = $meeting->stats()->get();
        return view('meetings.view',['meeting'=>$meeting,'stats'=>$stats]);


    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        //
    }
}

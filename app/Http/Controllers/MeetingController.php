<?php

namespace App\Http\Controllers;


use App\Meeting;
use App\Room;
use App\Server;
use Illuminate\Http\Request;


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

            $query = DB::table('meetings')
                ->join('meeting_stats', 'meetings.id', '=', 'meeting_stats.meeting_id')
                ->join('rooms', 'rooms.id', '=', 'meetings.room_id')
                ->join('servers', 'servers.id', '=', 'meetings.server_id')
                ->leftJoin('users', 'users.id', '=', 'rooms.user_id')
                ->select([
                    'servers.description',
                    'meetings.id',
                    'users.name',
                    'users.email',
                    'rooms.name as roomname',
                    'meetings.start',
                    'meetings.end',
                    DB::raw('max(meeting_stats.participantCount) as max_participants'),
                    DB::raw('max(meeting_stats.voiceParticipantCount) as max_voice'),
                    DB::raw('max(meeting_stats.videoCount) as max_video'),
                    ])
                ->groupBy('meetings.id');

                if (!Auth::user()->can('viewAll', Meeting::class)) {
                    $query = $query->where('rooms.user_id',Auth::user()->id);
                }

                $query = $query->get();

            return DataTables::of($query)
                ->addColumn('action', '<a href="{{route("meetings.show",["meeting"=>$id])}}" class="btn btn-primary"><i class="fas fa-eye"></i></a>')
                ->rawColumns(['action'])
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

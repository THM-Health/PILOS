<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Room;
use Auth;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        return ['data' => [
            'myRooms'     => Room::collection(Auth::user()->myRooms()->with('owner')->get()),
            'sharedRooms' => Room::collection(Auth::user()->sharedRooms()->with('owner')->get()),
            ]
        ];
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
     * @param  int                       $id
     * @return \Illuminate\Http\Response
     */
    public function show(\App\Room $room, Request $request)
    {
        // User calls room with guest token from email
        if ($request->has('guestToken')) {
        } else {
            // Joining room with code
            if ($request->has('code')) {
            } else {
                //if($room->owner->id == Auth::user()->id)
                //    echo "owner";
                return new Room($room);
            }
        }
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int                       $id
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
     * @param  int                       $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int                       $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        //
    }
}

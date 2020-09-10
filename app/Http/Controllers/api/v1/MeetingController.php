<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Meeting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * Class MeetingController
 * @package App\Http\Controllers\api\v1
 */
class MeetingController extends Controller
{
    /**
     * Display a listing of all currently running meetings
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        //@TODO Implement a list of all currently running meetings
    }

    /**
     * Callback from bbb-server to notify about the end of the meeting
     *
     * @param Request $request
     * @param Meeting $meeting
     */
    public function endMeetingCallback(Request $request, Meeting $meeting)
    {
        // Validate request
        if (!Hash::check($meeting->getCallbackHash(), $request->salt)) {
            abort(401);
        }

        // Only set end of meeting, if not set before
        if ($meeting->end == null) {
            // Set end of meeting
            $meeting->end = date('Y-m-d H:i:s');
            $meeting->save();
        }
    }
}

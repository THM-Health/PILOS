<?php

namespace App\Http\Controllers;

use App\RoomFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FileController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        //
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
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     *
     * @param RoomFile $roomFile
     * @return \Illuminate\Http\Response
     */
    public function show(Request $request, RoomFile $roomFile)
    {
        if($request->has('check') && $roomFile->download === false){
            abort(403);
        }

        return Storage::download($roomFile->path,$roomFile->filename,[
            'Content-Disposition' => 'inline; filename="'. $roomFile->filename .'"'
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param RoomFile $roomFile
     * @return \Illuminate\Http\Response
     */
    public function edit(RoomFile $roomFile)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param Request $request
     * @param RoomFile $roomFile
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, RoomFile $roomFile)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param RoomFile $roomFile
     * @return \Illuminate\Http\Response
     */
    public function destroy(RoomFile $roomFile)
    {
        //
    }
}

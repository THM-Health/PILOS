<?php

namespace App\Http\Controllers;

class ApplicationController extends Controller
{
    public function index()
    {
        return view('application');
    }

    public function health()
    {
        return response()->json(['status' => 'ok']);
    }
}

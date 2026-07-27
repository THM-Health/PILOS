<?php

declare(strict_types=1);

namespace App\Http\Controllers;

class ApplicationController extends Controller
{
    public function index()
    {
        return view('application');
    }
}

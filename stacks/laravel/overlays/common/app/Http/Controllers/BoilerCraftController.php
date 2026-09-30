<?php

namespace App\Http\Controllers;

class BoilerCraftController extends Controller
{
    public function index()
    {
        return view('boilercraft', [
            'laravelVersion' => app()->version(),
            'database' => config('database.default'),
        ]);
    }
}

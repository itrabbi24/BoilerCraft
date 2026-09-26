<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Home', [
            'appName' => '{{APP_TITLE}}',
            'description' => '{{APP_DESC}}',
            'author' => '{{AUTHOR}}',
            'framework' => 'Laravel 11.x',
            'frontend' => 'Vue 3 + Vite',
            'database' => '{{DB_TYPE}}'
        ]);
    }
}

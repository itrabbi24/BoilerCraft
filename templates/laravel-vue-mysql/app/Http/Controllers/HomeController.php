<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Home', [
            'appName' => '{{APP_TITLE}}',
            'description' => '{{APP_DESC}}',
            'author' => '{{AUTHOR}}',
            'database' => 'MySQL',
            'features' => [
                'Laravel 11 Enterprise Framework',
                'Vue 3 Composition API & Vite',
                'Tailwind CSS & Theme Switcher',
                'MySQL Eloquent ORM'
            ]
        ]);
    }
}

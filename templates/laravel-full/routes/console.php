<?php

use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment("Build remarkable apps with BoilerCraft by ARG RABBI.");
})->purpose('Display an inspiring quote');

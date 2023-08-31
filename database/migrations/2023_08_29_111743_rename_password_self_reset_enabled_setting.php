<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        //get value for self reset enabled if it exists with the old name
        $value = Setting::get('password_self_reset_enabled');
        if($value != null){
            //delete setting with the old name and add setting with the new name and the value
            Setting::forget('password_self_reset_enabled');
            Setting::set('password_change_allowed', $value);
            Setting::save();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};

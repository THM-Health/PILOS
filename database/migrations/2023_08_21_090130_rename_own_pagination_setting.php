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
        //get value for room pagination page size if it exists with the old name
        $value = Setting::get('own_rooms_pagination_page_size');
        if($value != null){
            //delete setting with the old name and add setting with the new name and the value
            Setting::forget('own_rooms_pagination_page_size');
            Setting::set('room_pagination_page_size', $value);
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

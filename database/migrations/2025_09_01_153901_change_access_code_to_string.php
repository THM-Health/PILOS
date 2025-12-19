<?php

use App\Models\Room;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->string('access_code')->nullable()->change();
        });

        Room::whereRaw('LENGTH(access_code) < 6')
            ->update(['access_code' => \DB::raw("LPAD(access_code, 6, '0')")]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::connection($this->getConnection())->getDriverName();

        switch ($driver) {
            case 'pgsql':
                DB::statement('ALTER TABLE rooms ALTER COLUMN access_code TYPE integer USING access_code::integer');
                break;
            default:
                Schema::table('rooms', function (Blueprint $table) {
                    $table->integer('access_code')->length(11)->nullable()->change();
                });
        }
    }
};

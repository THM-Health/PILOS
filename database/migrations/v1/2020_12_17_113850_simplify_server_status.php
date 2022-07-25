<?php

use App\Enums\ServerStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class SimplifyServerStatus extends Migration
{
    public function up()
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->smallInteger('status')->default(ServerStatus::DISABLED)->change();
        });

        foreach (\App\Models\Server::all() as $server){
            if($server->status == 0){
                $server->status = ServerStatus::DISABLED;
            }
            else{
                if($server->offline == 1){
                    $server->status = ServerStatus::OFFLINE;
                }
                else
                    $server->status = ServerStatus::ONLINE;
            }
            $server->save();
        }

        Schema::table('servers', function (Blueprint $table) {
            $table->dropColumn('offline');
        });
    }

    public function down()
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->boolean('offline')->default(true);

        });

        foreach (\App\Models\Server::all() as $server){
            if($server->status == ServerStatus::DISABLED){
                $server->status = false;
                $server->offline = true;
            }
            else{
                if($server->status == ServerStatus::OFFLINE){
                    $server->status = true;
                    $server->offline = true;
                }
                else {
                    $server->status = true;
                    $server->offline = false;
                }
            }
            $server->save();
        }

        Schema::table('servers', function (Blueprint $table) {
            $table->boolean('status')->default(false)->change();
        });
    }
}

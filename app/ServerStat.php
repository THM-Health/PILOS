<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class ServerStat extends Model
{
    /**
     * Server the statistical data belongs to
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function server()
    {
        return $this->belongsTo(Server::class);
    }
}

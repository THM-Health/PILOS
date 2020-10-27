<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class MeetingStat extends Model
{

    /**
     * Meeting the statistical data belongs to
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function meeting()
    {
        return $this->belongsTo(Meeting::class);
    }
}

<?php

namespace App;

use BigBlueButton\BigBlueButton;
use Illuminate\Database\Eloquent\Model;

class Server extends Model
{
    public $timestamps = false;

    /**
     * Get bigbluebutton api instance with the url and secret stored in the database fields
     * @return BigBlueButton
     * @throws \Exception
     */
    public function bbb()
    {
        return new BigBlueButton($this->baseUrl, $this->salt);
    }
}

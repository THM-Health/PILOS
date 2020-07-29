<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRoomFile extends FormRequest
{
    public function rules()
    {
        return [
            'file' => ['required','file','mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt,rtf,odt,ods,odp,odg,odc,odi,jpg,jpeg,png'] //https://github.com/bigbluebutton/bigbluebutton/blob/v2.2.x-release/bigbluebutton-html5/private/config/settings.yml
        ];
    }
}

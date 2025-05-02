<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateStreamingSettings;
use App\Http\Resources\StreamingSettings;
use Illuminate\Support\Facades\Storage;

class StreamingController extends Controller
{
    public function view()
    {
        return new StreamingSettings;
    }

    public function update(UpdateStreamingSettings $request)
    {
        $settings = app(\App\Settings\StreamingSettings::class);

        // Pause image
        if ($request->file('default_pause_image')) {
            $path = $request->file('default_pause_image')->store('images', 'public');
            $url = Storage::url($path);
            $settings->default_pause_image = url($url);
        } elseif ($request->has('default_pause_image') && $request->input('default_pause_image') == null) {
            // Note: Do not delete the file, so running livestreams depending on it are not affected
            $settings->default_pause_image = null;
        }

        // Custom css_file for streaming
        if ($request->has('css_file')) {
            if (! empty($request->file('css_file'))) {
                $path = $request->file('css_file')->storeAs('styles', 'streaming.css', 'public');
                $url = Storage::url($path);
                $settings->css_file = url($url);
            } else {
                Storage::disk('public')->delete('styles/streaming.css');
                $settings->css_file = null;
            }
        }

        // Join parameters
        $settings->join_parameters = $request->join_parameters;

        $settings->save();

        return new StreamingSettings;
    }
}

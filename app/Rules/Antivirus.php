<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class Antivirus implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Virus scan is disabled or no ClamAV server is configured
        if (! config('antivirus.enabled') || empty(config('antivirus.clamav.url'))) {
            return;
        }

        // Check if the value is an uploaded file
        if (! ($value instanceof UploadedFile)) {
            return;
        }

        // Open the file
        $file = fopen($value->path(), 'r');

        try {
            // Send the file to the ClamAV server
            $response = Http::attach(
                'file', $file, $value->getClientOriginalName()
            )->post(config('antivirus.clamav.url'));

            // File is clean
            if ($response->status() === 200) {
                return;
            }

            // Infected file
            if ($response->status() === 406) {
                $fail(__('validation.antivirus.virus', ['attribute' => $attribute]));

                return;
            }

            // Other clamav errors
            Log::log('error', 'Virus scan failed', ['status' => $response->status()]);
        } catch (\Exception $e) {
            // Error while streaming file to ClamAV or connection issues
            Log::log('error', 'Virus scan failed', ['exception' => $e->getMessage()]);
        } finally {
            fclose($file);
        }

        $fail(__('validation.antivirus.error', ['attribute' => $attribute]));
    }
}

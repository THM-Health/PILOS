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
        $fileName = $value->getClientOriginalName();

        try {
            // Send the file to the ClamAV server
            $response = Http::attach(
                'file', $file, $fileName
            )->post(config('antivirus.clamav.url'));

            // File is clean
            if ($response->status() === 200) {
                return;
            }

            // Infected file
            if ($response->status() === 406) {

                $description = $response->json('0.Description');

                Log::warning('Virus {virus_description} detected', [
                    'file_name' => $fileName,
                    'file_path' => $value->path(),
                    'virus_description' => $description,
                    'request_url' => url()->current(),
                ]);

                $fail(__('validation.antivirus.virus', ['file' => $fileName]));

                return;
            }

            // Other clamav errors
            Log::log('error', 'Virus scan failed', ['status' => $response->status()]);
        } catch (\Throwable $e) {
            // Error while streaming file to ClamAV or connection issues
            Log::log('error', 'Virus scan failed', ['exception' => $e->getMessage()]);
        } finally {
            fclose($file);
        }

        $fail(__('validation.antivirus.error', ['file' => $fileName]));
    }
}

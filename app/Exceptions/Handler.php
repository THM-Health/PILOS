<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Foundation\ViteException;
use Illuminate\Http\Request;
use Log;
use Spatie\LaravelIgnition\Exceptions\ViewException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of exception types with their corresponding custom log levels.
     *
     * @var array<class-string<\Throwable>, \Psr\Log\LogLevel::*>
     */
    protected $levels = [
        //
    ];

    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<\Throwable>>
     */
    protected $dontReport = [
        RecordingExtractionFailed::class,
    ];

    /**
     * A list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'new_password',
        'new_password_confirmation',
        'password',
        'password_confirmation',
    ];

    /**
     * Report or log an exception.
     *
     * @return void
     *
     * @throws \Exception
     */
    public function report(Throwable $exception)
    {
        parent::report($exception);
    }

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            if ($e->getPrevious() instanceof ViteException) {
                Log::error($e->getPrevious()->getMessage());

                return false;
            }
        });

        $this->renderable(function (ViewException $e, Request $request) {
            if ($e->getPrevious() instanceof ViteException) {
                return response()->view('frontend-error', [], 560);
            }

            return null;
        });
    }
}

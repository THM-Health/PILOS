<?php

// SPDX-FileCopyrightText: 2020 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Exceptions;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Foundation\ViteException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Psr\Log\LogLevel;
use Spatie\LaravelIgnition\Exceptions\ViewException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of exception types with their corresponding custom log levels.
     *
     * @var array<class-string<Throwable>, LogLevel::*>
     */
    protected $levels = [
        //
    ];

    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<Throwable>>
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

        $this->renderable(function (NotFoundHttpException $e, Request $request) {
            if ($request->expectsJson()) {
                $modelNotFoundException = $e->getPrevious() instanceof ModelNotFoundException ? $e->getPrevious() : null;

                if ($modelNotFoundException) {
                    $json = [
                        'message' => 'model_not_found',
                        'model' => Str::snake(class_basename($modelNotFoundException->getModel())),
                        'ids' => $modelNotFoundException->getIds(),
                    ];

                    return response()->json($json, 404);
                }
            }
        });
    }
}

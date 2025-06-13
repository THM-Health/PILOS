<?php

namespace App\Http\Controllers;

use App\Prometheus\CollectorRegistry;
use App\Providers\MetricsServiceProvider;
use Prometheus\RenderTextFormat;

class MetricsController extends Controller
{
    public function __invoke(CollectorRegistry $registry)
    {
        foreach (MetricsServiceProvider::$collectors as $collector) {
            (new $collector)->collect();
        }

        $renderer = new RenderTextFormat;
        $result = $renderer->render($registry->getMetricFamilySamples());

        return response($result)
            ->header('Content-Type', RenderTextFormat::MIME_TYPE);
    }
}

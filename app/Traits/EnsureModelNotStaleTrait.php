<?php

namespace App\Traits;

use App\Enums\CustomStatusCodes;
use Illuminate\Http\JsonResponse;

/**
 * Trait EnsureModelNotStaleTrait
 * @package App\Traits
 */
trait EnsureModelNotStaleTrait
{
    /**
     * @param $resource_class
     * @param $model
     * @param $updated_at_request
     * @return false|JsonResponse
     */
    public function isStale($resource_class, $model, $updated_at_request)
    {
        if ($updated_at_request < $model->updated_at) {
            return response()->json([
                'error' => CustomStatusCodes::STALE_MODEL,
                'message' => trans('app.errors.stale_model', ['model' => trans('app.model', $model->getTable())]),
                'new_model' => new $resource_class($model)
            ], CustomStatusCodes::STALE_MODEL);
        }

        return false;
    }
}

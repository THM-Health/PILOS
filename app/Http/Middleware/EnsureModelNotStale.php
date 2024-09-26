<?php

namespace App\Http\Middleware;

use App\Enums\CustomStatusCodes;
use Carbon\Carbon;
use Closure;
use Illuminate\Http\Request;

class EnsureModelNotStale
{
    /**
     * Checks that the updates from request only applied to a actual model. If the update_at field in the
     * request parameters is older than the updated_at of the model in the database, a error response with the
     * status code 428 will be returned containing the actual model.
     *
     * @param  Request  $request  Request to get the model and parameters from
     * @param  Closure  $next  Next to call if everything is ok
     * @param  string  $parameterName  Name of the parameter to get the model from
     * @param  string  $resourceClass  Resource class to cast the new model with
     * @param  mixed  ...$resourceFunctionsToCall  Additional functions to call on the resource of the updated model in the response
     * @return mixed
     */
    public function handle($request, Closure $next, $parameterName, $resourceClass, ...$resourceFunctionsToCall)
    {
        $request->validate([
            'updated_at' => 'nullable|date',
        ]);

        $model = $request->route($parameterName);

        if ($model->updated_at != null && ($request->updated_at == null || $model->updated_at->gt(Carbon::parse($request->updated_at)))) {
            $resource = new $resourceClass($model);
            foreach ($resourceFunctionsToCall as $function) {
                $resource = $resource->{$function}();
            }

            return response()->json([
                'error' => CustomStatusCodes::STALE_MODEL->value,
                'message' => __('app.errors.stale_model', ['model' => __('app.model.'.$model->getTable())]),
                'new_model' => $resource,
            ], CustomStatusCodes::STALE_MODEL->value);
        }

        return $next($request);
    }
}

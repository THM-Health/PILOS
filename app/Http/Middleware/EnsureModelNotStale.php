<?php

namespace App\Http\Middleware;

use App\Enums\CustomStatusCodes;
use Closure;
use Illuminate\Http\Request;

class EnsureModelNotStale
{
    /**
     * Checks that the updates from request only applied to a actual model. If the update_at field in the
     * request parameters is older than the updated_at of the model in the database, a error response with the
     * status code 466 will be returned containing the actual model.
     *
     * @param  Request $request       Request to get the model and parameters from
     * @param  Closure $next          Next to call if everything is ok
     * @param  String  $parameterName Name of the parameter to get the model from
     * @param  String  $resourceClass Resource class to cast the new model with
     * @return mixed
     */
    public function handle($request, Closure $next, $parameterName, $resourceClass)
    {
        $request->validate([
            'updated_at' => 'required|date'
        ]);

        $model = $request->route($parameterName);

        if ($request->updated_at < $model->updated_at) {
            return response()->json([
                'error'     => CustomStatusCodes::STALE_MODEL,
                'message'   => trans('app.errors.stale_model', ['model' => trans('app.model.' . $model->getTable())]),
                'new_model' => new $resourceClass($model)
            ], CustomStatusCodes::STALE_MODEL);
        }

        return $next($request);
    }
}

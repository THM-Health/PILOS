<?php

namespace App\Traits;

/**
 * This trait should be used for all models their data gets send to the
 * frontend.
 *
 * Since the model name is at least necessary to call the correct policy check
 * for the model instances. Also don't forget to add a `modeName` property to
 * the resource that transforms the response data for the model instance.
 *
 * @package App\Traits
 */
trait AddsModelNameTrait
{
    /**
     * Get the model name.
     *
     * @return string
     */
    public function getModelNameAttribute()
    {
        return class_basename(static::class);
    }
}

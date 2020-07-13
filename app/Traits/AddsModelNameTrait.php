<?php

namespace App\Traits;

trait AddsModelNameTrait
{
    /**
     * Get the model name.
     *
     * @return string
     */
    public function getModelNameAttribute()
    {
        return strtolower(class_basename(static::class));
    }
}

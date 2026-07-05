<?php

// SPDX-FileCopyrightText: 2020 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace Tests\Backend\Unit;

use App\Traits\AddsModelNameTrait;
use PHPUnit\Framework\TestCase;

class FooBarQux
{
    use AddsModelNameTrait;
}

class AddsModelNameTraitTest extends TestCase
{
    /**
     * Check that the model class name gets returned on calling the `getModelNameAttribute()`
     * method which can be accessed on real model by the attribute `model_name`.
     *
     * @return void
     */
    public function test_get_model_name_attribute()
    {
        $object = new FooBarQux;
        $this->assertEquals('FooBarQux', $object->getModelNameAttribute());
    }
}

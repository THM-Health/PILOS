<?php

namespace Tests\Unit\Rules;

use App\Rules\Color;
use Tests\TestCase;

class ColorTest extends TestCase
{
    public function testPasses()
    {
        $pw = new Color();

        $this->assertTrue($pw->passes('', '#fff'));
        $this->assertTrue($pw->passes('', '#ffffff'));
        $this->assertFalse($pw->passes('', '#ttt'));
        $this->assertFalse($pw->passes('', '#aaaa'));
        $this->assertFalse($pw->passes('', '#aa'));
        $this->assertFalse($pw->passes('', '#aaaaaaa'));
        $this->assertFalse($pw->passes('', '#tttttt'));
        $this->assertFalse($pw->passes('', '#taaaaa'));
        $this->assertFalse($pw->passes('', '#taa'));
    }

    public function testMessage()
    {
        $this->assertEquals(__('validation.custom.color'), (new Color())->message());
    }
}

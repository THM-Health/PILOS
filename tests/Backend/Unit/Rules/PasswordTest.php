<?php

namespace Tests\Backend\Unit\Rules;

use App\Rules\Password;
use Tests\Backend\TestCase;

class PasswordTest extends TestCase
{
    /**
     * A basic unit test example.
     *
     * @return void
     */
    public function test_passes()
    {
        $pw = new Password;

        $this->assertTrue($pw->passes('', '1_aA'));
        $this->assertTrue($pw->passes('', 'A_a1'));
        $this->assertTrue($pw->passes('', 'Aa_1Aa1_'));
        $this->assertFalse($pw->passes('', 'Aa1'));
        $this->assertFalse($pw->passes('', 'äA'));
        $this->assertFalse($pw->passes('', '1_a'));
    }

    public function test_message()
    {
        $this->assertEquals(__('validation.custom.password'), (new Password)->message());
    }
}

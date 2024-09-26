<?php

namespace Backend\Unit\Rules;

use App\Rules\CustomCreateMeetingParameters;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\Backend\TestCase;
use Validator;

class CustomCreateMeetingParametersTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function testInvalidParameter()
    {
        $validator = Validator::make(['param' => 'invalidName=true'], ['param' => new CustomCreateMeetingParameters]);
        $this->assertFalse($validator->passes());

        $this->assertEquals('The invalidName parameter does not exist.', $validator->errors()->get('param')[0]);
    }

    public function testMissingValue()
    {
        $validator = Validator::make(['param' => 'record'], ['param' => new CustomCreateMeetingParameters]);
        $this->assertFalse($validator->passes());

        $this->assertEquals('The record parameter is missing a value.', $validator->errors()->get('param')[0]);
    }

    public function testNotBoolean()
    {
        $validator = Validator::make(['param' => 'record=foo'], ['param' => new CustomCreateMeetingParameters]);
        $this->assertFalse($validator->passes());

        $this->assertEquals('The record parameter must be true or false.', $validator->errors()->get('param')[0]);
    }

    public function testNotInteger()
    {
        $validator = Validator::make(['param' => 'endWhenNoModeratorDelayInMinutes=foo'], ['param' => new CustomCreateMeetingParameters]);
        $this->assertFalse($validator->passes());

        $this->assertEquals('The endWhenNoModeratorDelayInMinutes parameter must be an integer.', $validator->errors()->get('param')[0]);
    }

    public function testNotEnum()
    {
        $validator = Validator::make(['param' => 'meetingLayout=foo'], ['param' => new CustomCreateMeetingParameters]);
        $this->assertFalse($validator->passes());

        $this->assertEquals('The meetingLayout parameter value is not in the list of allowed values.', $validator->errors()->get('param')[0]);
    }

    public function testInvalidFeatures()
    {
        $validator = Validator::make(['param' => 'disabledFeatures=foo,baa,externalVideos'], ['param' => new CustomCreateMeetingParameters]);
        $this->assertFalse($validator->passes());

        $this->assertEquals('The disabledFeatures parameter value is not in the list of allowed values.', $validator->errors()->get('param')[0]);
    }
}

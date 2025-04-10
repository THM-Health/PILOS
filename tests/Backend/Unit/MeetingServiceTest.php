<?php

namespace Tests\Backend\Unit;

use App\Services\MeetingService;
use BigBlueButton\BigBlueButton;
use BigBlueButton\Enum\Role;
use BigBlueButton\Parameters\CreateMeetingParameters;
use BigBlueButton\Parameters\JoinMeetingParameters;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Log;
use Tests\Backend\TestCase;
use TiMacDonald\Log\LogEntry;
use TiMacDonald\Log\LogFake;

class MeetingServiceTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    /**
     * Test setting custom create meeting parameters
     */
    public function test_set_custom_create_meeting_parameters()
    {
        LogFake::bind();
        $bbb = new BigBlueButton('http://bbb.example.com/', 'secret');

        // Check with valid create parameters
        $parameters = "autoStartRecording=false\nduration=10\nmeetingLayout=PRESENTATION_FOCUS\nmeta_category=FINANCE\ndisabledFeatures=learningDashboard,virtualBackgrounds";
        $createMeetingParameters = new CreateMeetingParameters('1234', 'Test');
        MeetingService::setCustomCreateMeetingParameters($createMeetingParameters, $parameters);

        $createUrl = $bbb->getCreateMeetingUrl($createMeetingParameters);
        $createUrlParsed = parse_url($createUrl);
        parse_str($createUrlParsed['query'], $createUrlParams);

        // Check if custom parameters are set
        $this->assertEquals('false', $createUrlParams['autoStartRecording']);
        $this->assertEquals('10', $createUrlParams['duration']);
        $this->assertEquals('PRESENTATION_FOCUS', $createUrlParams['meetingLayout']);
        $this->assertEquals('FINANCE', $createUrlParams['meta_category']);
        $this->assertEquals('learningDashboard,virtualBackgrounds', $createUrlParams['disabledFeatures']);

        // Check if nothing was logged
        Log::assertNothingLogged();

        // Check with invalid create parameters
        $parameters = "meta_foo=baa\nrecord=invalid\nmaxParticipants=10.5\nmeetingLayout=invalid\ndisabledFeatures=learningDashboard,invalid\nmeetingCameraCap\nfoo=bar";
        $createMeetingParameters = new CreateMeetingParameters('1234', 'Test');
        $errors = MeetingService::setCustomCreateMeetingParameters($createMeetingParameters, $parameters);

        $createUrl = $bbb->getCreateMeetingUrl($createMeetingParameters);
        $createUrlParsed = parse_url($createUrl);
        parse_str($createUrlParsed['query'], $createUrlParams);

        // Check if invalid parameters are not set
        $this->assertArrayNotHasKey('record', $createUrlParams);
        $this->assertArrayNotHasKey('maxParticipants', $createUrlParams);
        $this->assertArrayNotHasKey('meetingLayout', $createUrlParams);
        $this->assertArrayNotHasKey('disabledFeatures', $createUrlParams);
        $this->assertArrayNotHasKey('meetingCameraCap', $createUrlParams);

        // Check if valid parameters are kept
        $this->assertEquals('baa', $createUrlParams['meta_foo']);

        // Check errors
        $this->assertCount(6, $errors);
        $this->assertEquals('The record parameter must be true or false.', $errors[0]);
        $this->assertEquals('The maxParticipants parameter must be an integer.', $errors[1]);
        $this->assertEquals('The meetingLayout parameter value is not in the list of allowed values.', $errors[2]);
        $this->assertEquals('The disabledFeatures parameter value is not in the list of allowed values.', $errors[3]);
        $this->assertEquals('The meetingCameraCap parameter is missing a value.', $errors[4]);
        $this->assertEquals('The foo parameter does not exist.', $errors[5]);

        // Check log entries
        Log::assertLogged(
            fn (LogEntry $log) => $log->level == 'warning'
                && $log->message == 'Custom create parameter {parameter} has no value'
                && $log->context['parameter'] == 'meetingCameraCap'
        );

        Log::assertLogged(
            fn (LogEntry $log) => $log->level == 'warning'
                && $log->message == 'Custom create parameter {parameter} value {value} is not a boolean'
                && $log->context['parameter'] == 'record'
                && $log->context['value'] == 'invalid'
        );

        Log::assertLogged(
            fn (LogEntry $log) => $log->level == 'warning'
                && $log->message == 'Custom create parameter {parameter} can not be found'
                && $log->context['parameter'] == 'foo'
        );

        Log::assertLogged(
            fn (LogEntry $log) => $log->level == 'warning'
                && $log->message == 'Custom create parameter {parameter} has no value'
                && $log->context['parameter'] == 'meetingCameraCap'
        );

        Log::assertLogged(
            fn (LogEntry $log) => $log->level == 'warning'
                && $log->message == 'Custom create parameter {parameter} value {value} is not an enum value'
                && $log->context['parameter'] == 'meetingLayout'
                && $log->context['value'] == 'invalid'
        );

        Log::assertLogged(
            fn (LogEntry $log) => $log->level == 'warning'
                && $log->message == 'Custom create parameter {parameter} value {value} is not an enum value'
                && $log->context['parameter'] == 'disabledFeatures'
                && $log->context['value'][0] == 'learningDashboard'
                && $log->context['value'][1] == 'invalid'
        );
    }

    /**
     * Test setting custom join meeting parameters
     */
    public function test_set_custom_join_meeting_parameters()
    {
        LogFake::bind();
        $bbb = new BigBlueButton('http://bbb.example.com/', 'secret');

        // Check with valid join parameters
        $parameters = "enforceLayout=PRESENTATION_FOCUS\nuserdata-bbb_hide_nav_bar=true\nuserdata-bbb_show_participants_on_login=false\ncreateTime=1531155809613\nguest=true\nexcludeFromDashboard=false";
        $joinMeetingParameters = new JoinMeetingParameters('1234', 'Test', Role::MODERATOR);
        MeetingService::setCustomJoinMeetingParameters($joinMeetingParameters, $parameters);

        $joinUrl = $bbb->getJoinMeetingURL($joinMeetingParameters);
        $joinUrlParsed = parse_url($joinUrl);
        parse_str($joinUrlParsed['query'], $joinUrlParams);

        // Check if custom parameters are set
        $this->assertEquals('PRESENTATION_FOCUS', $joinUrlParams['enforceLayout']);
        $this->assertEquals('true', $joinUrlParams['userdata-bbb_hide_nav_bar']);
        $this->assertEquals('false', $joinUrlParams['userdata-bbb_show_participants_on_login']);
        $this->assertEquals('1531155809613', $joinUrlParams['createTime']);
        $this->assertEquals('true', $joinUrlParams['guest']);
        $this->assertEquals('false', $joinUrlParams['excludeFromDashboard']);

        // Check if nothing was logged
        Log::assertNothingLogged();

        // Check with invalid join parameters
        $parameters = "userdata-bbb_hide_nav_bar=true\nguest\nmeta_foo=baa\nexcludeFromDashboard=invalid\nenforceLayout=DEMO\ncreateTime=no_number";
        $joinMeetingParameters = new JoinMeetingParameters('1234', 'Test', Role::MODERATOR);
        $errors = MeetingService::setCustomJoinMeetingParameters($joinMeetingParameters, $parameters);

        $joinUrl = $bbb->getJoinMeetingURL($joinMeetingParameters);
        $joinUrlParsed = parse_url($joinUrl);
        parse_str($joinUrlParsed['query'], $joinUrlParams);

        // Check if invalid parameters are not set
        $this->assertArrayNotHasKey('meta_foo', $joinUrlParams);
        $this->assertArrayNotHasKey('excludeFromDashboard', $joinUrlParams);
        $this->assertArrayNotHasKey('enforceLayout', $joinUrlParams);
        $this->assertArrayNotHasKey('createTime', $joinUrlParams);

        // Check if valid parameters are kept
        $this->assertEquals('true', $joinUrlParams['userdata-bbb_hide_nav_bar']);

        // Check errors
        $this->assertCount(5, $errors);
        $this->assertEquals('The guest parameter is missing a value.', $errors[0]);
        $this->assertEquals('The meta_foo parameter does not exist.', $errors[1]);
        $this->assertEquals('The excludeFromDashboard parameter must be true or false.', $errors[2]);
        $this->assertEquals('The enforceLayout parameter value is not in the list of allowed values.', $errors[3]);
        $this->assertEquals('The createTime parameter must be an integer.', $errors[4]);

        // Check log entries
        Log::assertLogged(
            fn (LogEntry $log) => $log->level == 'warning'
                && $log->message == 'Custom join parameter {parameter} has no value'
                && $log->context['parameter'] == 'guest'
        );

        Log::assertLogged(
            fn (LogEntry $log) => $log->level == 'warning'
                && $log->message == 'Custom join parameter {parameter} value {value} is not a boolean'
                && $log->context['parameter'] == 'excludeFromDashboard'
                && $log->context['value'] == 'invalid'
        );

        Log::assertLogged(
            fn (LogEntry $log) => $log->level == 'warning'
                && $log->message == 'Custom join parameter {parameter} can not be found'
                && $log->context['parameter'] == 'meta_foo'
        );

        Log::assertLogged(
            fn (LogEntry $log) => $log->level == 'warning'
                && $log->message == 'Custom join parameter {parameter} value {value} is not an enum value'
                && $log->context['parameter'] == 'enforceLayout'
                && $log->context['value'] == 'DEMO'
        );
    }
}

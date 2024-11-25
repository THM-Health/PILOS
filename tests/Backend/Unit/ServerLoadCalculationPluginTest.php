<?php

namespace Tests\Backend\Unit;

use App\Plugins\Defaults\ServerLoadCalculationPlugin;
use BigBlueButton\Responses\GetMeetingsResponse;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Backend\TestCase;

class ServerLoadCalculationPluginTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test if the load is calculated correctly during the starting phase of a meeting.
     * If the meeting is in the starting phase the global min_user_count value is used instead of the real number of participants,
     * with a few exceptions (see other tests)
     *
     * @return void
     */
    public function test_load()
    {
        config([
            'bigbluebutton.load_new_meeting_min_user_count' => 10,
            'bigbluebutton.load_new_meeting_min_user_interval' => 5,
        ]);

        $getMeetingsResponse = new GetMeetingsResponse(simplexml_load_file(__DIR__.'/../Fixtures/GetMeetings-3.xml'));

        $this->travelTo(Carbon::createFromTimestampMsUTC($getMeetingsResponse->getMeetings()[1]->getCreationTime())->addMinute());

        $load = (new ServerLoadCalculationPlugin)->getLoad($getMeetingsResponse->getMeetings());
        $this->assertEquals(14, $load);
    }

    /**
     * Test if the real number of participants is used,if the meeting has more participants
     * than the min_user_count during the starting phase.
     *
     * @return void
     */
    public function test_load_higher_than_default()
    {
        config([
            'bigbluebutton.load_new_meeting_min_user_count' => 5,
            'bigbluebutton.load_new_meeting_min_user_interval' => 5,
        ]);

        $getMeetingsResponse = new GetMeetingsResponse(simplexml_load_file(__DIR__.'/../Fixtures/GetMeetings-Start.xml'));

        $this->travelTo(Carbon::createFromTimestampMsUTC($getMeetingsResponse->getMeetings()[0]->getCreationTime())->addMinute());

        $load = (new ServerLoadCalculationPlugin)->getLoad($getMeetingsResponse->getMeetings());
        $this->assertEquals(6, $load);
    }

    /**
     * Test if the max user limit of the meeting is used during the starting phase
     * if it is lower than the min_user_count value.
     *
     * @return void
     */
    public function test_load_with_max_user_lower_than_min_user()
    {
        config([
            'bigbluebutton.load_new_meeting_min_user_count' => 30,
            'bigbluebutton.load_new_meeting_min_user_interval' => 5,
        ]);

        $getMeetingsResponse = new GetMeetingsResponse(simplexml_load_file(__DIR__.'/../Fixtures/GetMeetings-MaxUsers.xml'));

        $this->travelTo(Carbon::createFromTimestampMsUTC($getMeetingsResponse->getMeetings()[0]->getCreationTime())->addMinute());

        $load = (new ServerLoadCalculationPlugin)->getLoad($getMeetingsResponse->getMeetings());
        $this->assertEquals(20, $load);

    }

    /**
     * Test if the min_user_count is used, if it is lower than the max user limit of the meeting
     *
     * @return void
     */
    public function test_load_with_max_user_higher_than_min_user()
    {
        config([
            'bigbluebutton.load_new_meeting_min_user_count' => 10,
            'bigbluebutton.load_new_meeting_min_user_interval' => 5,
        ]);

        $getMeetingsResponse = new GetMeetingsResponse(simplexml_load_file(__DIR__.'/../Fixtures/GetMeetings-MaxUsers.xml'));

        $this->travelTo(Carbon::createFromTimestampMsUTC($getMeetingsResponse->getMeetings()[0]->getCreationTime())->addMinute());

        $load = (new ServerLoadCalculationPlugin)->getLoad($getMeetingsResponse->getMeetings());
        $this->assertEquals(10, $load);

    }
}

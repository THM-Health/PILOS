<?php

// @formatter:off
// phpcs:ignoreFile
/**
 * A helper file for your Eloquent Models
 * Copy the phpDocs from this file to the correct Model,
 * And remove them from this file, to prevent double declarations.
 *
 * @author Barry vd. Heuvel <barryvdh@gmail.com>
 */


namespace App\Models{
/**
 * @method static \Illuminate\Database\Eloquent\Builder<static>|IncludedPermissionPermission newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|IncludedPermissionPermission newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|IncludedPermissionPermission query()
 */
	class IncludedPermissionPermission extends \Eloquent {}
}

namespace App\Models{
/**
 * @property string $id
 * @property string $room_id
 * @property int|null $server_id
 * @property int $is_breakout
 * @property int $sequence
 * @property \Illuminate\Support\Carbon|null $start
 * @property \Illuminate\Support\Carbon|null $end
 * @property string|null $deleted_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property bool $record_attendance
 * @property \Illuminate\Support\Carbon|null $detached
 * @property bool $record
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\MeetingAttendee> $attendees
 * @property-read int|null $attendees_count
 * @property-read \App\Models\Room $room
 * @property-read \App\Models\Server|null $server
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\MeetingStat> $stats
 * @property-read int|null $stats_count
 * @method static \Database\Factories\MeetingFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Meeting newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Meeting newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Meeting query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Meeting whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Meeting whereDeletedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Meeting whereDetached($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Meeting whereEnd($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Meeting whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Meeting whereIsBreakout($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Meeting whereRecord($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Meeting whereRecordAttendance($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Meeting whereRoomId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Meeting whereSequence($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Meeting whereServerId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Meeting whereStart($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Meeting whereUpdatedAt($value)
 */
	class Meeting extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $meeting_id
 * @property string|null $name
 * @property int|null $user_id
 * @property string|null $session_id
 * @property \Illuminate\Support\Carbon $join
 * @property \Illuminate\Support\Carbon|null $leave
 * @property-read \App\Models\Meeting $meeting
 * @property-read \App\Models\User|null $user
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MeetingAttendee newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MeetingAttendee newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MeetingAttendee query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MeetingAttendee whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MeetingAttendee whereJoin($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MeetingAttendee whereLeave($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MeetingAttendee whereMeetingId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MeetingAttendee whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MeetingAttendee whereSessionId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MeetingAttendee whereUserId($value)
 */
	class MeetingAttendee extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $meeting_id
 * @property int $participant_count
 * @property int $listener_count
 * @property int $voice_participant_count
 * @property int $video_count
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Meeting $meeting
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MeetingStat newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MeetingStat newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MeetingStat query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MeetingStat whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MeetingStat whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MeetingStat whereListenerCount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MeetingStat whereMeetingId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MeetingStat whereParticipantCount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MeetingStat whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MeetingStat whereVideoCount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MeetingStat whereVoiceParticipantCount($value)
 */
	class MeetingStat extends \Eloquent {}
}

namespace App\Models{
/**
 * Class Permission
 *
 * @property int $id
 * @property string $name
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\PermissionRole|\App\Models\IncludedPermissionPermission|null $pivot
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Permission> $includedPermissions
 * @property-read int|null $included_permissions_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Role> $roles
 * @property-read int|null $roles_count
 * @method static \Database\Factories\PermissionFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Permission newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Permission newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Permission query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Permission whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Permission whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Permission whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Permission whereUpdatedAt($value)
 */
	class Permission extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $permission_id
 * @property int $role_id
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PermissionRole newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PermissionRole newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PermissionRole query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PermissionRole wherePermissionId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PermissionRole whereRoleId($value)
 */
	class PermissionRole extends \Eloquent {}
}

namespace App\Models{
/**
 * @property string $id
 * @property string $room_id
 * @property string|null $meeting_id
 * @property string $description
 * @property \App\Enums\RecordingAccess $access
 * @property \Illuminate\Support\Carbon $start
 * @property \Illuminate\Support\Carbon $end
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\RecordingFormat> $formats
 * @property-read int|null $formats_count
 * @property-read \App\Models\Meeting|null $meeting
 * @property-read \App\Models\Room $room
 * @method static \Database\Factories\RecordingFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Recording newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Recording newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Recording query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Recording whereAccess($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Recording whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Recording whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Recording whereEnd($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Recording whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Recording whereMeetingId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Recording whereRoomId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Recording whereStart($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Recording whereUpdatedAt($value)
 */
	class Recording extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $recording_id
 * @property string $format
 * @property string $url
 * @property bool $disabled
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Recording $recording
 * @method static \Database\Factories\RecordingFormatFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RecordingFormat newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RecordingFormat newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RecordingFormat query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RecordingFormat whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RecordingFormat whereDisabled($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RecordingFormat whereFormat($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RecordingFormat whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RecordingFormat whereRecordingId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RecordingFormat whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RecordingFormat whereUrl($value)
 */
	class RecordingFormat extends \Eloquent {}
}

namespace App\Models{
/**
 * Class Role
 *
 * @property int $id
 * @property string $name
 * @property bool $superuser
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property int|null $room_limit
 * @property-read string $model_name
 * @property-read \App\Models\RoleUser|\App\Models\PermissionRole|null $pivot
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Permission> $permissions
 * @property-read int|null $permissions_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\RoomType> $roomTypes
 * @property-read int|null $room_types_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\User> $users
 * @property-read int|null $users_count
 * @method static \Database\Factories\RoleFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Role newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Role newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Role query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Role whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Role whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Role whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Role whereRoomLimit($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Role whereSuperuser($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Role whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Role withName($name)
 */
	class Role extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $user_id
 * @property int $role_id
 * @property bool $automatic
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoleUser newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoleUser newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoleUser query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoleUser whereAutomatic($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoleUser whereRoleId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoleUser whereUserId($value)
 */
	class RoleUser extends \Eloquent {}
}

namespace App\Models{
/**
 * @property string $id
 * @property string $name
 * @property string|null $welcome
 * @property bool $webcams_only_for_moderator
 * @property bool $mute_on_start
 * @property bool $lock_settings_disable_cam
 * @property bool $lock_settings_disable_mic
 * @property bool $lock_settings_disable_private_chat
 * @property bool $lock_settings_disable_public_chat
 * @property bool $lock_settings_disable_note
 * @property int $lock_settings_lock_on_join
 * @property bool $lock_settings_hide_user_list
 * @property bool $allow_guests
 * @property \App\Enums\RoomUserRole $default_role
 * @property \App\Enums\RoomLobby $lobby
 * @property bool $allow_membership
 * @property bool $everyone_can_start
 * @property string|null $access_code
 * @property int $user_id
 * @property int $room_type_id
 * @property string|null $deleted_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property int|null $participant_count
 * @property int|null $listener_count
 * @property int|null $voice_participant_count
 * @property int|null $video_count
 * @property bool $record_attendance
 * @property \Illuminate\Support\Carbon|null $delete_inactive
 * @property string|null $description
 * @property string|null $short_description
 * @property bool $expert_mode
 * @property \App\Enums\RoomVisibility $visibility
 * @property bool $record
 * @property bool $auto_start_recording
 * @property string|null $meeting_id
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\RoomFile> $files
 * @property-read int|null $files_count
 * @property-read string $model_name
 * @property-read bool $room_type_invalid
 * @property-read \App\Models\Meeting|null $latestMeeting
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Meeting> $meetings
 * @property-read int|null $meetings_count
 * @property-read \App\Models\RoomUser|null $pivot
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\User> $members
 * @property-read int|null $members_count
 * @property-read \App\Models\User $owner
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Recording> $recordings
 * @property-read int|null $recordings_count
 * @property-read \App\Models\RoomType $roomType
 * @property-read \App\Models\RoomStreaming $streaming
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\RoomPersonalizedLink> $tokens
 * @property-read int|null $tokens_count
 * @method static \Database\Factories\RoomFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereAccessCode($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereAllowGuests($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereAllowMembership($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereAutoStartRecording($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereDefaultRole($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereDeleteInactive($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereDeletedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereEveryoneCanStart($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereExpertMode($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereListenerCount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereLobby($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereLockSettingsDisableCam($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereLockSettingsDisableMic($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereLockSettingsDisableNote($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereLockSettingsDisablePrivateChat($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereLockSettingsDisablePublicChat($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereLockSettingsHideUserList($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereLockSettingsLockOnJoin($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereMeetingId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereMuteOnStart($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereParticipantCount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereRecord($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereRecordAttendance($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereRoomTypeId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereShortDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereUserId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereVideoCount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereVisibility($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereVoiceParticipantCount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereWebcamsOnlyForModerator($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Room whereWelcome($value)
 */
	class Room extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $path
 * @property string $filename
 * @property bool $default
 * @property bool $download
 * @property bool $use_in_meeting
 * @property string $room_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Room $room
 * @method static \Database\Factories\RoomFileFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomFile newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomFile newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomFile query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomFile whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomFile whereDefault($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomFile whereDownload($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomFile whereFilename($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomFile whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomFile wherePath($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomFile whereRoomId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomFile whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomFile whereUseInMeeting($value)
 */
	class RoomFile extends \Eloquent {}
}

namespace App\Models{
/**
 * @property string $room_id
 * @property bool $enabled
 * @property bool $enabled_for_current_meeting
 * @property string|null $url
 * @property string|null $pause_image
 * @property string|null $status
 * @property int|null $fps
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Room $room
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomStreaming newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomStreaming newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomStreaming query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomStreaming whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomStreaming whereEnabled($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomStreaming whereEnabledForCurrentMeeting($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomStreaming whereFps($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomStreaming wherePauseImage($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomStreaming whereRoomId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomStreaming whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomStreaming whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomStreaming whereUrl($value)
 */
	class RoomStreaming extends \Eloquent {}
}

namespace App\Models{
/**
 * @property string $token
 * @property string $room_id
 * @property string $firstname
 * @property string $lastname
 * @property \App\Enums\RoomUserRole $role
 * @property \Illuminate\Support\Carbon|null $last_usage
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read null $expires
 * @property-read string $fullname
 * @property-read \App\Models\Room $room
 * @method static \Database\Factories\RoomTokenFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomPersonalizedLink newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomPersonalizedLink newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomPersonalizedLink query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomPersonalizedLink whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomPersonalizedLink whereFirstname($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomPersonalizedLink whereLastUsage($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomPersonalizedLink whereLastname($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomPersonalizedLink whereRole($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomPersonalizedLink whereRoomId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomPersonalizedLink whereToken($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomPersonalizedLink whereUpdatedAt($value)
 */
	class RoomToken extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $name
 * @property string $color
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property int $server_pool_id
 * @property bool $restrict
 * @property int|null $max_participants
 * @property int|null $max_duration
 * @property bool $has_access_code_enforced
 * @property bool $record_attendance_default
 * @property string|null $description
 * @property bool $webcams_only_for_moderator_default
 * @property bool $webcams_only_for_moderator_enforced
 * @property bool $mute_on_start_default
 * @property bool $mute_on_start_enforced
 * @property bool $lock_settings_disable_cam_default
 * @property bool $lock_settings_disable_cam_enforced
 * @property bool $lock_settings_disable_mic_default
 * @property bool $lock_settings_disable_mic_enforced
 * @property bool $lock_settings_disable_private_chat_default
 * @property bool $lock_settings_disable_private_chat_enforced
 * @property bool $lock_settings_disable_public_chat_default
 * @property bool $lock_settings_disable_public_chat_enforced
 * @property bool $lock_settings_disable_note_default
 * @property bool $lock_settings_disable_note_enforced
 * @property bool $lock_settings_hide_user_list_default
 * @property bool $lock_settings_hide_user_list_enforced
 * @property bool $everyone_can_start_default
 * @property bool $everyone_can_start_enforced
 * @property bool $allow_guests_default
 * @property bool $allow_guests_enforced
 * @property bool $allow_membership_default
 * @property bool $allow_membership_enforced
 * @property \App\Enums\RoomUserRole $default_role_default
 * @property bool $default_role_enforced
 * @property \App\Enums\RoomLobby $lobby_default
 * @property bool $lobby_enforced
 * @property bool $record_attendance_enforced
 * @property \App\Enums\RoomVisibility $visibility_default
 * @property bool $visibility_enforced
 * @property bool $has_access_code_default
 * @property bool $record_default
 * @property bool $record_enforced
 * @property bool $auto_start_recording_default
 * @property bool $auto_start_recording_enforced
 * @property string|null $create_parameters
 * @property string|null $join_parameters
 * @property-read string $model_name
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Role> $roles
 * @property-read int|null $roles_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Room> $rooms
 * @property-read int|null $rooms_count
 * @property-read \App\Models\ServerPool $serverPool
 * @property-read \App\Models\RoomTypeStreamingSettings $streamingSettings
 * @method static \Database\Factories\RoomTypeFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereAllowGuestsDefault($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereAllowGuestsEnforced($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereAllowMembershipDefault($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereAllowMembershipEnforced($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereAutoStartRecordingDefault($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereAutoStartRecordingEnforced($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereColor($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereCreateParameters($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereDefaultRoleDefault($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereDefaultRoleEnforced($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereEveryoneCanStartDefault($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereEveryoneCanStartEnforced($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereHasAccessCodeDefault($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereHasAccessCodeEnforced($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereJoinParameters($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereLobbyDefault($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereLobbyEnforced($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereLockSettingsDisableCamDefault($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereLockSettingsDisableCamEnforced($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereLockSettingsDisableMicDefault($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereLockSettingsDisableMicEnforced($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereLockSettingsDisableNoteDefault($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereLockSettingsDisableNoteEnforced($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereLockSettingsDisablePrivateChatDefault($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereLockSettingsDisablePrivateChatEnforced($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereLockSettingsDisablePublicChatDefault($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereLockSettingsDisablePublicChatEnforced($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereLockSettingsHideUserListDefault($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereLockSettingsHideUserListEnforced($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereMaxDuration($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereMaxParticipants($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereMuteOnStartDefault($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereMuteOnStartEnforced($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereRecordAttendanceDefault($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereRecordAttendanceEnforced($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereRecordDefault($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereRecordEnforced($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereRestrict($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereServerPoolId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereVisibilityDefault($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereVisibilityEnforced($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereWebcamsOnlyForModeratorDefault($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomType whereWebcamsOnlyForModeratorEnforced($value)
 */
	class RoomType extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $room_type_id
 * @property bool $enabled
 * @property string|null $default_pause_image
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\RoomType $roomType
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomTypeStreamingSettings newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomTypeStreamingSettings newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomTypeStreamingSettings query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomTypeStreamingSettings whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomTypeStreamingSettings whereDefaultPauseImage($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomTypeStreamingSettings whereEnabled($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomTypeStreamingSettings whereRoomTypeId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomTypeStreamingSettings whereUpdatedAt($value)
 */
	class RoomTypeStreamingSettings extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $user_id
 * @property string $room_id
 * @property \App\Enums\RoomUserRole $role
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomUser newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomUser newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomUser query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomUser whereRole($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomUser whereRoomId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomUser whereUserId($value)
 */
	class RoomUser extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $base_url
 * @property string $secret
 * @property string $name
 * @property \App\Enums\ServerStatus $status
 * @property string|null $deleted_at
 * @property int|null $participant_count
 * @property int|null $listener_count
 * @property int|null $voice_participant_count
 * @property int|null $video_count
 * @property int|null $meeting_count
 * @property int $strength
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property string|null $description
 * @property string|null $version
 * @property int $error_count
 * @property int $recover_count
 * @property int|null $load
 * @property-read \App\Enums\ServerHealth|null $health
 * @property-read string $model_name
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Meeting> $meetings
 * @property-read int|null $meetings_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\ServerPool> $pools
 * @property-read int|null $pools_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\ServerStat> $stats
 * @property-read int|null $stats_count
 * @method static \Database\Factories\ServerFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Server newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Server newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Server query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Server whereBaseUrl($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Server whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Server whereDeletedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Server whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Server whereErrorCount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Server whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Server whereListenerCount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Server whereLoad($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Server whereMeetingCount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Server whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Server whereParticipantCount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Server whereRecoverCount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Server whereSecret($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Server whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Server whereStrength($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Server whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Server whereVersion($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Server whereVideoCount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Server whereVoiceParticipantCount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Server withName($name)
 */
	class Server extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read string $model_name
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\RoomType> $roomTypes
 * @property-read int|null $room_types_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Server> $servers
 * @property-read int|null $servers_count
 * @method static \Database\Factories\ServerPoolFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ServerPool newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ServerPool newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ServerPool query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ServerPool whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ServerPool whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ServerPool whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ServerPool whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ServerPool whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ServerPool withName($name)
 */
	class ServerPool extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $server_id
 * @property int|null $participant_count
 * @property int|null $listener_count
 * @property int|null $voice_participant_count
 * @property int|null $video_count
 * @property int|null $meeting_count
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Server $server
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ServerStat newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ServerStat newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ServerStat query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ServerStat whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ServerStat whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ServerStat whereListenerCount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ServerStat whereMeetingCount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ServerStat whereParticipantCount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ServerStat whereServerId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ServerStat whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ServerStat whereVideoCount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ServerStat whereVoiceParticipantCount($value)
 */
	class ServerStat extends \Eloquent {}
}

namespace App\Models{
/**
 * @property string $id
 * @property int|null $user_id
 * @property string|null $ip_address
 * @property string|null $user_agent
 * @property string $payload
 * @property \Illuminate\Support\Carbon $last_activity
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\SessionData> $sessionData
 * @property-read int|null $session_data_count
 * @property-read \App\Models\User|null $user
 * @method static \Database\Factories\SessionFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Session newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Session newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Session query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Session whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Session whereIpAddress($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Session whereLastActivity($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Session wherePayload($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Session whereUserAgent($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Session whereUserId($value)
 */
	class Session extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $key
 * @property string $value
 * @property string $session_id
 * @property-read \App\Models\Session $session
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SessionData newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SessionData newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SessionData query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SessionData whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SessionData whereKey($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SessionData whereSessionId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SessionData whereValue($value)
 */
	class SessionData extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $firstname
 * @property string $lastname
 * @property string|null $external_id
 * @property string $email
 * @property \Illuminate\Support\Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $remember_token
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property string|null $locale
 * @property string $authenticator
 * @property bool $bbb_skip_check_audio
 * @property bool $initial_password_set
 * @property string $timezone
 * @property string|null $image
 * @property string|null $external_image_hash
 * @property \Illuminate\Support\Carbon|null $last_login
 * @property-read mixed $fullname
 * @property-read bool $has_external_image
 * @property-read string|null $image_url
 * @property-read string $model_name
 * @property-read string[] $permissions
 * @property-read int $room_limit
 * @property-read bool $superuser
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Room> $myRooms
 * @property-read int|null $my_rooms_count
 * @property-read \Illuminate\Notifications\DatabaseNotificationCollection<int, \Illuminate\Notifications\DatabaseNotification> $notifications
 * @property-read int|null $notifications_count
 * @property-read \App\Models\RoleUser|null $pivot
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Role> $roles
 * @property-read int|null $roles_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Room> $roomFavorites
 * @property-read int|null $room_favorites_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Session> $sessions
 * @property-read int|null $sessions_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Room> $sharedRooms
 * @property-read int|null $shared_rooms_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \Laravel\Sanctum\PersonalAccessToken> $tokens
 * @property-read int|null $tokens_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\VerifyEmail> $verifyEmails
 * @property-read int|null $verify_emails_count
 * @method static \Database\Factories\UserFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereAuthenticator($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereBbbSkipCheckAudio($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereEmail($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereEmailVerifiedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereExternalId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereExternalImageHash($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereFirstname($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereImage($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereInitialPasswordSet($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereLastLogin($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereLastname($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereLocale($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User wherePassword($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereRememberToken($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereTimezone($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User withEmail($email)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User withFirstName($firstname)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User withLastName($lastname)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User withNameOrEmail($name)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User withRole($role)
 */
	class User extends \Eloquent implements \Illuminate\Contracts\Translation\HasLocalePreference {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $user_id
 * @property string $email
 * @property string $token
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\User $user
 * @method static \Illuminate\Database\Eloquent\Builder<static>|VerifyEmail newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|VerifyEmail newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|VerifyEmail query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|VerifyEmail whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|VerifyEmail whereEmail($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|VerifyEmail whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|VerifyEmail whereToken($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|VerifyEmail whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|VerifyEmail whereUserId($value)
 */
	class VerifyEmail extends \Eloquent {}
}


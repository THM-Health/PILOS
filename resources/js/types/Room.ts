interface Room {
    id: string;
    name: string;
    owner: Owner;
    last_meeting: LastMeeting;
    type: RoomType;
    model_name: string;
    short_description: string | null;
    is_favorite: boolean;
    authenticated: boolean;
    description: string | null;
    allow_membership: boolean;
    is_member: boolean;
    is_moderator: boolean;
    is_co_owner: boolean;
    can_start: boolean;
    access_code: number;
    room_type_invalid: boolean;
    record_attendance: boolean;
    record: boolean;
    current_user: CurrentUser;
}

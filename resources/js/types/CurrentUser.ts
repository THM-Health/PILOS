interface CurrentUser {
    id: number;
    authenticator: string;
    image: string;
    email: string;
    external_id: string | null;
    firstname: string;
    lastname: string;
    user_locale: string;
    permissions: string[];
    model_name: string;
    room_limit: number;
    updated_at: string;
    bbb_skip_check_audio: boolean;
    initial_password_set: boolean;
    timezone: string;
}

export interface RoomGuestAuthenticationToken {
    id: string;
    type: RoomGuestAuthenticationTokenType;
}

export enum RoomGuestAuthenticationTokenType {
    Code = 0,
    Token = 1,
}

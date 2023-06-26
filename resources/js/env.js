export default {
  HTTP_UNAUTHORIZED: 401,
  HTTP_FORBIDDEN: 403,
  HTTP_NOT_FOUND: 404,
  HTTP_GONE: 410,
  HTTP_PAYLOAD_TOO_LARGE: 413,
  HTTP_GUESTS_ONLY: 420,
  HTTP_UNPROCESSABLE_ENTITY: 422,
  HTTP_MEETING_NOT_RUNNING: 460,
  HTTP_NO_SERVER_AVAILABLE: 461,
  HTTP_ROOM_START_FAILED: 462,
  HTTP_ROOM_JOIN_FAILED: 463,
  HTTP_ROOM_LIMIT_EXCEEDED: 464,
  HTTP_ROLE_DELETE_LINKED_USERS: 465,
  HTTP_ROLE_UPDATE_PERMISSION_LOST: 466,
  HTTP_ATTENDANCE_AGREEMENT_MISSING: 471,
  HTTP_EMAIL_CHANGE_THROTTLE: 472,
  HTTP_STALE_MODEL: 428,
  HTTP_TOO_MANY_REQUESTS: 429,
  HTTP_LOCKED: 423,
  HTTP_SERVICE_UNAVAILABLE: 503,

  HISTORY_PARTICIPANT_COLOR: import.meta.env.VITE_HISTORY_PARTICIPANT_COLOR || '#c0392b',
  HISTORY_VOICES_COLOR: import.meta.env.VITE_HISTORY_VOICES_COLOR || '#2980b9',
  HISTORY_VIDEOS_COLOR: import.meta.env.VITE_HISTORY_VIDEOS_COLOR || '#27ae60',
  ROOM_TYPE_COLORS: import.meta.env.VITE_ROOM_TYPE_COLORS ? JSON.parse(import.meta.env.VITE_ROOM_TYPE_COLORS) : ['#16a085', '#27ae60', '#2980b9', '#8e44ad', '#f39c12', '#d35400', '#c0392b', '#2c3e50'],
  BANNER_BACKGROUND_COLORS: import.meta.env.VITE_BANNER_BACKGROUND_COLORS ? JSON.parse(import.meta.env.VITE_BANNER_BACKGROUND_COLORS) : ['#16a085', '#27ae60', '#2980b9', '#8e44ad', '#f39c12', '#d35400', '#c0392b', '#2c3e50'],
  BANNER_TEXT_COLORS: import.meta.env.VITE_BANNER_TEXT_COLORS ? JSON.parse(import.meta.env.VITE_BANNER_TEXT_COLORS) : ['#ffffff', '#000000']
};

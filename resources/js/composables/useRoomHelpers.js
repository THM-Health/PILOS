import { watch } from 'vue';
import _ from 'lodash';
export function onRoomHasChanged (room, callback) {
  watch(room, (newRoom, oldRoom) => {
    if (newRoom.owner.id !== oldRoom.owner.id) {
      return callback();
    }

    if (newRoom.authenticated !== oldRoom.authenticated) {
      return callback();
    }

    if (newRoom.is_member !== oldRoom.is_member) {
      return callback();
    }

    if (newRoom.is_moderator !== oldRoom.is_moderator) {
      return callback();
    }

    if (newRoom.is_co_owner !== oldRoom.is_co_owner) {
      return callback();
    }

    if (!_.isEqual(newRoom.current_user, oldRoom.current_user)) {
      return callback();
    }
  });
}

export function createNotificationFaker(closeSpy, eventListenerSpy) {
  const listeners = [];
  let notifications = 0;

  return {
    createNotification: () => {
      const index = notifications;
      notifications++;
      console.debug("Create new notification #" + index);
      listeners[index] = [];
      return {
        close: () => {
          console.debug("notification #" + index + " closed");
          closeSpy(index);
        },
        addEventListener: (event, callback) => {
          if (listeners[index][event] === undefined)
            listeners[index][event] = [];

          listeners[index][event].push(callback);

          console.debug(
            "event " + event + " registered for notification #" + index,
          );
          eventListenerSpy(index, event, callback);
        },
      };
    },
    triggerEvent: (notificationId, event) => {
      if (listeners[notificationId][event] !== undefined) {
        listeners[notificationId][event].forEach((callback) => {
          callback();
        });
      }
    },
  };
}

export function createAudioNotificationFaker(playSpy) {
  return {
    createAudioNotification: () => {
      return {
        play() {
          playSpy();
        },
      };
    },
  };
}

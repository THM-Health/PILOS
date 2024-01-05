<template>
  <div
    v-if="notificationSupport && !running"
    class="w-100 text-center my-2"
  >
    <b-button
      v-if="!notificationEnabled"
      block
      @click="enableNotification"
    >
      <i class="fa-solid fa-bell" /> {{ $t('rooms.notification.enable') }}
    </b-button>
    <b-alert
      v-else
      variant="success"
      show
    >
      <i class="fa-solid fa-bell" /> {{ $t('rooms.notification.enabled') }}
    </b-alert>
  </div>
</template>

<script>

import { mapState } from 'pinia';
import { useSettingsStore } from '@/stores/settings';
import notificationSound from '../../../audio/notification.mp3';

export default {
  name: 'BrowserNotification',

  props: {
    running: Boolean,
    name: String
  },

  data () {
    return {
      notificationSupport: false,
      notificationEnabled: false,
      notification: null
    };
  },

  computed: {
    ...mapState(useSettingsStore, ['getSetting'])
  },

  watch: {
    /**
     * check if the running status of the room has changed
     * @param running current running status
     * @param wasRunning previous running status
     */
    running: function (running, wasRunning) {
      // only check for changes it notifications is enabled
      if (this.notificationEnabled) {
        // room was not running and now is running
        // clear older notifications and send new notification if notifications are enabled
        if (wasRunning === false && running === true) {
          this.clearNotification();
          this.sendNotification();
        }
        // room was running and now stopped running
        // clear notification to prevent confusion
        if (wasRunning === true && running === false) {
          this.clearNotification();
        }
      }
    }
  },

  mounted () {
    // check if notification is supported by the browser
    if (!('Notification' in window)) {
      this.noSupportHandler();
    // check if the notification permission is already given
    } else if (Notification.permission === 'granted' || Notification.permission === 'denied') {
      this.notificationSupport = true;
    } else {
      // no permission, check if sending a test notification
      try {
        const testNotification = new Notification('');
        testNotification.close();
        this.notificationSupport = true;
      } catch (e) {
        //  type error, e.g. Android due to not fully supported notification api
        if (e.name === 'TypeError') {
          this.noSupportHandler();
        }
      }
    }
  },
  methods: {
    /**
     * Clear older notification if exists
     */
    clearNotification: function () {
      if (this.notification != null) {
        this.notification.close();
        this.notification = null;
      }
    },

    /**
     * Handle support issues with notification api
     * @param showToast boolean Show error message
     */
    noSupportHandler: function (showToast = false) {
      this.notificationEnabled = false;
      this.notificationSupport = false;
      if (showToast) { this.toastError(this.$t('rooms.notification.browser_support')); }
    },

    /**
     * Send notification that the room was started
     */
    sendNotification: function () {
      const options = {
        body: this.$t('rooms.notification.body', { time: this.$d(new Date(), 'time') }),
        icon: this.getSetting('favicon')
      };
      try {
        this.notification = new Notification(this.name, options);
        // on click open current window and remove notification
        this.notification.addEventListener('click', () => {
          window.focus();
          this.clearNotification();
        });

        const audio = new Audio(notificationSound);
        audio.play();
      } catch (e) {
        // missing full notification api support, e.g. Android
        if (e.name === 'TypeError') {
          this.noSupportHandler(true);
        }
      }
    },

    /**
     * Enable notification for this room
     */
    enableNotification: function () {
      // if permission granted enable notification
      if (Notification.permission === 'granted') {
        this.notificationEnabled = true;

        // if permission denied disable notification and show error message
      } else if (Notification.permission === 'denied') {
        this.notificationEnabled = false;
        this.toastError(this.$t('rooms.notification.denied'));

        // if no permission decision was made yet, request permission
      } else {
        Notification.requestPermission().then((permission) => {
          // permission granted, enable notification
          if (permission === 'granted') {
            this.notificationEnabled = true;

            // permission denied, disable notification and show error message
          } else {
            this.notificationEnabled = false;
            this.toastError(this.$t('rooms.notification.denied'));
          }
        });
      }
    }
  }
};
</script>

<style scoped>

</style>

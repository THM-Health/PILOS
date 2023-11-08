<template>
  <div class="container mt-5 mb-5" v-cloak>

    <!-- room token is invalid -->
    <div v-if="tokenInvalid">
        <!-- Show message that room can only be used by logged in users -->
        <b-alert show variant="danger">
          <i class="fa-solid fa-unlink"></i> {{ $t('rooms.invalid_personal_link') }}
        </b-alert>
      </div>

      <!-- room is only for logged in users -->
      <div v-else-if="guestsNotAllowed">
        <!-- Show message that room can only be used by logged in users -->
        <b-alert show>
          <i class="fa-solid fa-exclamation-circle"></i> {{ $t('rooms.only_used_by_authenticated_users') }}
        </b-alert>
        <b-button-group>
          <!-- Reload page, in case the room settings changed -->
          <b-button
            v-on:click="reload"
            :disabled="loading"
          >
            <b-spinner small v-if="loading"></b-spinner> <i v-if="!loading" class="fa-solid fa-sync"></i> {{$t('rooms.try_again')}}
          </b-button>
        </b-button-group>
      </div>

      <div v-else>

        <div v-if="!room" >
          <div class="text-center my-2">
            <b-spinner ref="room-loading-spinner" v-if="roomLoading" ></b-spinner>
            <b-button
              ref="reload"
              v-else
              @click="load()"
            >
              <i class="fa-solid fa-sync"></i> {{ $t('app.reload') }}
            </b-button>
          </div>
        </div>
        <div v-else>
          <b-row >
            <b-col md="10">
                <!-- Display room type, name and owner  -->
                <b-badge :style="{ 'background-color': room.type.color}">{{room.type.description}}</b-badge>
                <h2 class="h2 mt-2 roomname">{{ room.name }}</h2>

              <room-details-component :room="room" :showDescription="true"/>

            </b-col>
            <b-col md="2" class="d-flex justify-content-end align-items-start">
              <b-button-group>
                  <!-- Reload general room settings/details -->
                  <b-button
                    variant="secondary"
                    :title="$t('app.reload')"
                    ref="reloadButton"
                    v-b-tooltip.hover
                    v-tooltip-hide-click
                    v-on:click="reload"
                    :disabled="loading"
                  >
                    <i v-bind:class="{ 'fa-spin': loading  }" class="fa-solid fa-sync"></i>
                  </b-button>
                  <b-dropdown variant="dark" toggle-class="text-decoration-none" class="room-dropdown" no-caret right down v-if="room.authenticated && isAuthenticated">
                    <template #button-content>
                      <i class="fa-solid fa-bars"></i>
                    </template>
                    <room-membership-button
                      :room="room"
                      :accessCode="accessCode"
                      :disabled="loading"
                      @removed="reload()"
                      @added="accessCode = null; reload();"
                      @error="onMembershipButtonError"
                    />
                    <RoomFavoriteButton
                      :disabled="loading"
                      ref="favoriteComponent"
                      @favorites_changed="reload()"
                      :is-favorite="room.is_favorite"
                      :id="room.id"
                    />
                    <can method="delete" :policy="room">
                      <delete-room-button
                        @roomDeleted="$router.push({ name: 'rooms.index' })"
                        :room="room"
                        :disabled="loading"
                      />
                    </can>
                  </b-dropdown>
              </b-button-group>
            </b-col>
          </b-row>
          <div class="row pt-2" v-if="room.authenticated && room.can_start && room.room_type_invalid">
            <div class="col-lg-12 col-12">
              <b-alert show variant="warning" ref="roomTypeInvalidAlert">
                {{ $t('rooms.room_type_invalid_alert', { roomTypeName: room.type.name }) }}
              </b-alert>
            </div>
          </div>

          <hr>

          <!-- room join/start, files, settings for logged in users -->
          <template v-if="room.authenticated">
            <!-- Room join/start -->
            <b-row>
              <!-- Show invitation text/link to moderators and room owners -->
              <b-col order="2" order-md="1" col cols="12" md="8" lg="6" v-if="viewInvitation">
                <room-invitation ref="room-invitation" :name="room.name" :id="room.id" :accessCode="room.access_code" ></room-invitation>
              </b-col>
              <b-col order="1" order-md="2" col cols="12" :md="viewInvitation ? 4 : 12" :lg="viewInvitation ? 6 : 12">
                <b-row>
                  <!-- Ask guests for their first and lastname -->
                  <b-col col cols="12" md="6" v-if="!isAuthenticated">
                    <b-form-group id="guest-name-group" :label="$t('rooms.first_and_lastname')" :state="fieldState('name')">
                      <b-input-group>
                        <b-form-input ref="guestName" v-model="name" :placeholder="$t('rooms.placeholder_name')" :disabled="!!token" :state="fieldState('name')"></b-form-input>
                      </b-input-group>
                      <template slot='invalid-feedback'><div v-html="fieldError('name')"></div></template>
                    </b-form-group>
                  </b-col>
                  <!-- Show room start or join button -->
                  <b-col col cols="12" :md="isAuthenticated ? 12 : 6">

                    <b-alert show v-if="room.record_attendance" class="text-center p-3" ref="recordingAttendanceInfo">
                      <i class="fa-solid fa-info-circle"></i> {{ $t('rooms.recording_attendance_info') }}
                      <b-form-checkbox
                        v-model="recordAttendanceAgreement"
                        :value="true"
                        :unchecked-value="false"
                      >
                        {{ $t('rooms.recording_attendance_accept')}}
                      </b-form-checkbox>
                    </b-alert>

                    <!-- If room is running, show join button -->
                    <template v-if="running">
                      <!-- If user is guest, join is only possible if a name is provided -->
                      <b-button
                        block
                        ref="joinMeeting"
                        v-on:click="join"
                        :disabled="(!isAuthenticated && name==='') || loadingJoinStart || room.room_type_invalid || (room.record_attendance && !recordAttendanceAgreement)"
                        variant="primary"
                      >
                        <b-spinner small v-if="loadingJoinStart"></b-spinner> <i class="fa-solid fa-door-open"></i> {{ $t('rooms.join') }}
                      </b-button>
                    </template>
                    <!-- If room is not running -->
                    <template v-else>
                      <b-button
                        block
                        ref="startMeeting"
                        v-if="room.can_start"
                        :disabled="(!isAuthenticated && name==='') || loadingJoinStart || room.room_type_invalid || (room.record_attendance && !recordAttendanceAgreement)"
                        v-on:click="start"
                        variant="primary"
                      >
                          <b-spinner small v-if="loadingJoinStart"></b-spinner> <i class="fa-solid fa-door-open"></i> {{ $t('rooms.start') }}
                      </b-button>
                      <!-- If user isn't allowed to start a new meeting, show message that meeting isn't running yet -->
                      <div v-else class="text-center p-3">
                        <div class="mb-3">
                          <b-spinner></b-spinner>
                        </div>
                        {{ $t('rooms.not_running') }}
                      </div>
                    </template>

                    <browser-notification :running="running" :name="room.name"></browser-notification>
                  </b-col>
                </b-row>
              </b-col>
            </b-row>

            <!-- Show limited file list for guests, users, members and moderators-->
            <cannot method="viewSettings" :policy="room">
              <hr>
              <tabs-component ref="tabs" :access-code="accessCode" :token="token" :room="room" v-on:tabComponentError="onTabComponentError" />
            </cannot>

            <!-- Show room settings (including members and files) for co-owners, owner and users with rooms.viewAll permission -->
            <can method="viewSettings" :policy="room">
              <admin-tabs-component @settingsChanged="reload" :room="room" />
            </can>
          </template>
          <!-- Ask for room access code -->
          <div v-else>
            <b-alert show>{{ $t('rooms.require_access_code') }}</b-alert>
            <b-input-group>
              <b-form-input
                :state="accessCodeValid"
                :placeholder="$t('rooms.access_code')"
                v-mask="'999-999-999'"
                v-model="accessCodeInput"
                v-on:keyup.enter="login"
              ></b-form-input>
              <b-input-group-append>
                <b-button
                  v-on:click="login"
                  :disabled="loading"
                  variant="primary"
                >
                  <b-spinner small v-if="loading"></b-spinner> <i v-if="!loading" class="fa-solid fa-lock"></i> {{ $t('rooms.login') }}
                </b-button>
              </b-input-group-append>
            </b-input-group>
          </div>
        </div>
      </div>
  </div>
</template>
<script>
import AwesomeMask from 'awesome-mask';
import Base from '../../api/base';
import AdminTabsComponent from '../../components/Room/AdminTabsComponent.vue';
import TabsComponent from '../../components/Room/TabsComponent.vue';
import env from './../../env.js';
import DeleteRoomButton from '../../components/Room/DeleteRoomButton.vue';
import Can from '../../components/Permissions/Can.vue';
import Cannot from '../../components/Permissions/Cannot.vue';
import PermissionService from '../../services/PermissionService';
import FieldErrors from '../../mixins/FieldErrors';
import BrowserNotification from '../../components/Room/BrowserNotification.vue';
import { mapActions, mapState } from 'pinia';
import { useAuthStore } from '../../stores/auth';
import { useSettingsStore } from '../../stores/settings';
import RoomInvitation from '../../components/Room/RoomInvitation.vue';
import RoomFavoriteButton from '../../components/Room/RoomFavoriteButton.vue';
import RoomMembershipButton from '../../components/Room/RoomMembershipButton.vue';
import RoomDetailsComponent from '../../components/Room/RoomDetailsComponent.vue';

export default {
  directives: {
    mask: AwesomeMask
  },

  props: {
    modalStatic: {
      type: Boolean,
      default: false
    },
    id: {
      type: String,
      default: null
    },
    token: {
      type: String,
      default: null
    }
  },

  components: {
    RoomDetailsComponent,
    RoomFavoriteButton,
    RoomInvitation,
    BrowserNotification,
    DeleteRoomButton,
    TabsComponent,
    AdminTabsComponent,
    RoomMembershipButton,
    Can,
    Cannot
  },

  mixins: [FieldErrors],

  data () {
    return {
      reloadInterval: null,
      loading: false, // Room settings/details loading
      loadingJoinStart: false, // Loading indicator on joining/starting a room
      name: '', // Name of guest
      room: null, // Room object
      accessCode: null, // Access code to use for requests
      accessCodeInput: '', // Access code input modal
      accessCodeValid: null, // Is access code valid
      recordAttendanceAgreement: false,
      errors: [],
      roomLoading: false, // Room loading indicator for initial load

      tokenInvalid: false, // Room token is invalid
      guestsNotAllowed: false // Access to room was forbidden
    };
  },
  mounted () {
    // Prevent authenticated users from using a room token
    if (this.token && this.isAuthenticated) {
      this.toastInfo(this.$t('app.flash.guests_only'));
      this.$router.replace({ name: 'home' });
      return;
    }

    this.load();
  },
  destroyed () {
    clearInterval(this.reloadInterval);
  },
  methods: {

    /**
     * Get a random refresh interval for polling to prevent
     * simultaneous request from multiple clients
     * @returns {number} random refresh internal in seconds
     */
    getRandomRefreshInterval: function () {
      const base = Math.abs(this.getSetting('room_refresh_rate'));
      // 15% range to scatter the values around the base refresh rate
      const percentageRange = 0.15;
      const absoluteRange = base * percentageRange;
      // Calculate a random refresh internal between (base-range and base+range)
      return (base - absoluteRange) + (Math.random() * absoluteRange * 2);
    },

    /**
     * Reload room details in a set interval, change in the .env
     */
    startAutoRefresh: function () {
      this.reloadInterval = setInterval(this.reload, this.getRandomRefreshInterval() * 1000);
    },

    /**
     *  Handle errors of the file list
     */
    onTabComponentError: function (error) {
      if (error.response) {
        // Access code invalid
        if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_code') {
          return this.handleInvalidCode();
        }

        // Access code invalid
        if (error.response.status === env.HTTP_FORBIDDEN && error.response.data.message === 'require_code') {
          return this.handleInvalidCode();
        }

        // Room token is invalid
        if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_token') {
          return this.handleInvalidToken();
        }

        // Forbidden, guests not allowed
        if (error.response.status === env.HTTP_FORBIDDEN && error.response.data.message === 'guests_not_allowed') {
          return this.handleGuestsNotAllowed();
        }
      }
      Base.error(error, this.$root);
    },

    onMembershipButtonError: function (error) {
      // Access code invalid
      if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_code') {
        return this.handleInvalidCode();
      }

      // Membership not allowed, update status
      if (error.response.status === env.HTTP_FORBIDDEN) {
        this.room.allow_membership = false;
      }

      Base.error(error, this.$root);
    },

    ...mapActions(useAuthStore, ['setCurrentUser']),

    /**
     * Reset room access code and details
     */
    handleGuestsNotAllowed: function () {
      this.guestsNotAllowed = true;

      // Remove a potential access code
      this.accessCode = null;

      // Set current user to null, as the user is not logged in
      this.setCurrentUser(null);
    },

    /**
     * Reset access code due to errors, show error and reload room details
     */
    handleInvalidCode: function () {
      // Show access code is valid
      this.accessCodeValid = false;
      // Reset access code (not the form input) to load the general room details again
      this.accessCode = null;
      // Show error message
      this.toastError(this.$t('rooms.flash.access_code_invalid'));
      this.reload();
    },

    /**
     * Reset room due to token error
     */
    handleInvalidToken: function () {
      // Show error message
      this.tokenInvalid = true;
      this.toastError(this.$t('rooms.flash.token_invalid'));
      // Disable auto reload as this error is permanent and the removal of the room link cannot be undone
      clearInterval(this.reloadInterval);
    },

    /**
     * Initial loading of the room
     */
    load: function () {
      // Enable loading indicator
      this.roomLoading = true;

      // Build room api url, include access code if set
      const config = {};

      if (this.token) {
        config.headers = { Token: this.token };
      } else if (this.accessCode != null) {
        config.headers = { 'Access-Code': this.accessCode };
      }

      const url = 'rooms/' + this.id;

      // Load data
      Base.call(url, config)
        .then(response => {
          this.room = response.data.data;

          if (this.room.username) {
            this.name = this.room.username;
          }

          this.setPageTitle(this.room.name);

          this.startAutoRefresh();
        })
        .catch((error) => {
          if (error.response) {
            // Room not found
            if (error.response.status === env.HTTP_NOT_FOUND) {
              this.$router.push({ name: '404' });
              return;
            }

            // Room token is invalid
            if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_token') {
              this.tokenInvalid = true;
              return;
            }

            // Forbidden, guests not allowed
            if (error.response.status === env.HTTP_FORBIDDEN && error.response.data.message === 'guests_not_allowed') {
              this.guestsNotAllowed = true;
              this.startAutoRefresh();
              return;
            }
          }
          Base.error(error, this.$root);
        }).finally(() => {
          // Disable loading indicator
          this.roomLoading = false;
        });
    },

    /**
     * Reload the room details/settings
     */
    reload: function () {
      // Enable loading indicator
      this.loading = true;
      // Build room api url, include access code if set
      const config = {};

      if (this.token) {
        config.headers = { Token: this.token };
      } else if (this.accessCode != null) {
        config.headers = { 'Access-Code': this.accessCode };
      }

      const url = 'rooms/' + this.id;

      // Load data
      Base.call(url, config)
        .then(response => {
          this.room = response.data.data;
          // If logged in, reset the access code valid
          if (this.room.authenticated) {
            this.accessCodeValid = null;
          }

          if (this.$refs.tabs) {
            this.$refs.tabs.reload();
          }

          if (this.room.username) {
            this.name = this.room.username;
          }

          this.setPageTitle(this.room.name);

          // Update current user, if logged in/out in another tab or session expired
          // to have the can/cannot component use the correct state
          this.setCurrentUser(this.room.current_user);

          this.guestsNotAllowed = false;
        })
        .catch((error) => {
          if (error.response) {
            // Room not found
            if (error.response.status === env.HTTP_NOT_FOUND) {
              return;
            }

            // Access code invalid
            if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_code') {
              return this.handleInvalidCode();
            }

            // Room token is invalid
            if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_token') {
              return this.handleInvalidToken();
            }

            // Forbidden, guests not allowed
            if (error.response.status === env.HTTP_FORBIDDEN && error.response.data.message === 'guests_not_allowed') {
              return this.handleGuestsNotAllowed();
            }
          }
          Base.error(error, this.$root);
        }).finally(() => {
          // Disable loading indicator
          this.loading = false;

          this.modelLoading = false;
        });
    },

    /**
     * Start a new meeting
     */
    start: function () {
      // Enable start/join meeting indicator/spinner
      this.loadingJoinStart = true;
      // Reset errors
      this.errors = [];
      // Build url, add accessCode and token if needed
      const config = {
        params: {
          name: this.token ? null : this.name,
          record_attendance: this.recordAttendanceAgreement ? 1 : 0
        }
      };

      if (this.token) {
        config.headers = { Token: this.token };
      } else if (this.accessCode != null) {
        config.headers = { 'Access-Code': this.accessCode };
      }

      const url = 'rooms/' + this.id + '/start';

      Base.call(url, config)
        .then(response => {
          // Check if response has a join url, if yes redirect
          if (response.data.url !== undefined) {
            window.location = response.data.url;
          }
        })
        .catch((error) => {
          if (error.response) {
            // Access code invalid
            if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_code') {
              return this.handleInvalidCode();
            }

            // Access code invalid
            if (error.response.status === env.HTTP_FORBIDDEN && error.response.data.message === 'require_code') {
              return this.handleInvalidCode();
            }

            // Room token is invalid
            if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_token') {
              return this.handleInvalidToken();
            }

            // Forbidden, guests not allowed
            if (error.response.status === env.HTTP_FORBIDDEN && error.response.data.message === 'guests_not_allowed') {
              return this.handleGuestsNotAllowed();
            }

            // Forbidden, use can't start the room
            if (error.response.status === env.HTTP_FORBIDDEN) {
              // Show error message
              this.toastError(this.$t('rooms.flash.start_forbidden'));
              // Disable room start button and reload the room settings, as there was obviously
              // a different understanding of the users permission in this room
              this.room.can_start = false;
              this.reload();
              return;
            }

            // Form validation error
            if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
              this.errors = error.response.data.errors;
              return;
            }

            // Attendance logging agreement required but not accepted
            if (error.response.status === env.HTTP_ATTENDANCE_AGREEMENT_MISSING) {
              this.room.record_attendance = true;
            }
          }
          Base.error(error, this.$root);
        }).finally(() => {
          // Disable loading indicator
          this.loadingJoinStart = false;
        });
    },

    /**
     * Show room name in title
     * @param {string} roomName Name of the room
     */
    setPageTitle: function (roomName) {
      document.title = roomName + ' - ' + this.getSetting('name');
    },

    /**
     * Join a running meeting
     */
    join: function () {
      // Enable start/join meeting indicator/spinner
      this.loadingJoinStart = true;
      // Reset errors
      this.errors = [];

      // Build url, add accessCode and token if needed
      const config = {
        params: {
          name: this.token ? null : this.name,
          record_attendance: this.recordAttendanceAgreement ? 1 : 0
        }
      };

      if (this.token) {
        config.headers = { Token: this.token };
      } else if (this.accessCode != null) {
        config.headers = { 'Access-Code': this.accessCode };
      }

      const url = 'rooms/' + this.id + '/join';

      // Join meeting request
      Base.call(url, config)
        .then(response => {
          // Check if response has a join url, if yes redirect
          if (response.data.url !== undefined) {
            window.location = response.data.url;
          }
        })
        .catch((error) => {
          if (error.response) {
            // Access code invalid
            if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_code') {
              return this.handleInvalidCode();
            }

            // Access code invalid
            if (error.response.status === env.HTTP_FORBIDDEN && error.response.data.message === 'require_code') {
              return this.handleInvalidCode();
            }

            // Room token is invalid
            if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_token') {
              return this.handleInvalidToken();
            }

            // Forbidden, guests not allowed
            if (error.response.status === env.HTTP_FORBIDDEN && error.response.data.message === 'guests_not_allowed') {
              return this.handleGuestsNotAllowed();
            }

            // Room is not running, update running status
            if (error.response.status === env.HTTP_MEETING_NOT_RUNNING) {
              this.reload();
            }

            // Form validation error
            if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
              this.errors = error.response.data.errors;
              return;
            }

            // Attendance logging agreement required but not accepted
            if (error.response.status === env.HTTP_ATTENDANCE_AGREEMENT_MISSING) {
              this.room.record_attendance = true;
            }
          }
          Base.error(error, this.$root);
        }).finally(() => {
          // Disable loading indicator
          this.loadingJoinStart = false;
        });
    },
    /**
     * Handle login with access code
     */
    login: function () {
      // Remove all non-numeric or dash chars
      this.accessCodeInput = this.accessCodeInput.replace(/[^0-9-]/g, '');
      // Remove the dashes for storing the access code
      this.accessCode = this.accessCodeInput.replace(/[-]/g, '');
      // Reload the room with an access code
      this.reload();
    }
  },
  computed: {

    running: function () {
      return this.room.last_meeting != null && this.room.last_meeting.end == null;
    },
    ...mapState(useAuthStore, ['isAuthenticated']),
    ...mapState(useSettingsStore, ['getSetting']),

    /**
     * Show invitation section only to users with the required permission
     */
    viewInvitation () {
      return PermissionService.can('viewInvitation', this.room);
    }
  }
};
</script>

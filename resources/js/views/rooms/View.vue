<template>
  <div class="container mt-5 mb-5" v-cloak>
    <template v-if="room !== null">

      <div class="row">
        <div class="col-12">
          <b-button-group class="float-right">
            <!-- If membership is enabled, allow user to become member -->
            <can v-if="room.authenticated && isAuthenticated" method="becomeMember" :policy="room">
            <b-button
              v-on:click="joinMembership"
              :disabled="loading"
              variant="secondary"
            >
              <b-spinner small v-if="loading"></b-spinner> <i v-else class="fa-solid fa-user-plus"></i> {{ $t('rooms.become_member') }}
            </b-button>
            </can>
            <!-- If user is member, allow user to end the membership -->
            <b-button
              id="leave-membership-button"
              v-if="room.authenticated && isAuthenticated && room.is_member"
              v-b-modal.leave-membership-modal
              :disabled="loading"
              variant="danger"
            >
              <b-spinner small v-if="loading"></b-spinner> <i v-else class="fa-solid fa-user-minus"></i> {{ $t('rooms.end_membership.button') }}
            </b-button>

            <b-modal
              v-if="room.authenticated && isAuthenticated"
              :static='modalStatic'
              :title="$t('rooms.end_membership.title')"
              ok-variant="danger"
              cancel-variant="secondary"
              :ok-title="$t('rooms.end_membership.yes')"
              :cancel-title="$t('rooms.end_membership.no')"
              @ok="leaveMembership"
              id="leave-membership-modal"
              ref="leave-membership-modal"
            >
              {{ $t('rooms.end_membership.message') }}
            </b-modal>

            <b-button @click="toggleFavorite" :variant="room.is_favorite ? 'dark' : 'light'">
              <i class="fa-solid fa-star"></i>
            </b-button>
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

            <!-- Delete button and modal -->
            <can method="delete" :policy="room">
              <delete-room-component
                @roomDeleted="$router.push({ name: 'rooms.index' })"
                :room="room"
                :disabled="loading"
              ></delete-room-component>
            </can>
          </b-button-group>
        </div>
      </div>

      <!-- Display room name, icon and owner -->
      <div class="row pt-2">
        <!-- Room icon -->
        <div class="col-lg-1 col-2">
          <div :style="{ 'background-color': room.type.color}" class="room-icon" v-if="room.type">
            {{room.type.short}}
          </div>
        </div>
        <!-- Room name and owner -->
        <div class="col-lg-11 col-10">
          <h2 class="roomname">{{ room.name }}</h2>
          <h5>{{ room.owner.name}}</h5>
        </div>
      </div>

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
            <div class="jumbotron p-4" >
              <h5>{{ $t('rooms.access_for_participants') }}</h5>
              <b-button
                class="float-right"
                v-clipboard:copy="invitationText"
                v-b-tooltip.hover
                :title="$t('rooms.copy_access_for_participants')"
                variant="light"
              >
                <i class="fa-solid fa-copy"></i>
              </b-button>
              <span style="white-space: pre;">{{ invitationText }}</span>
            </div>
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
    </template>
    <!-- Room object is empty, access forbidden -->
    <template v-else>

      <!-- room token is invalid -->
      <template v-if="token !== null">
        <!-- Show message that room can only be used by logged in users -->
        <b-alert show variant="danger">
          <i class="fa-solid fa-unlink"></i> {{ $t('rooms.invalid_personal_link') }}
        </b-alert>
      </template>
      <!-- room is only for logged in users -->
      <template v-else>
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
      </template>

    </template>
  </div>
</template>
<script>
import AwesomeMask from 'awesome-mask';
import Base from '../../api/base';
import AdminTabsComponent from '../../components/Room/AdminTabsComponent.vue';
import TabsComponent from '../../components/Room/TabsComponent.vue';
import env from './../../env.js';
import DeleteRoomComponent from '../../components/Room/DeleteRoomComponent.vue';
import Can from '../../components/Permissions/Can.vue';
import Cannot from '../../components/Permissions/Cannot.vue';
import PermissionService from '../../services/PermissionService';
import FieldErrors from '../../mixins/FieldErrors';
import BrowserNotification from '../../components/Room/BrowserNotification.vue';
import { mapActions, mapState } from 'pinia';
import { useAuthStore } from '../../stores/auth';
import { useSettingsStore } from '../../stores/settings';

export default {
  directives: {
    mask: AwesomeMask
  },

  props: {
    modalStatic: {
      type: Boolean,
      default: false
    }
  },

  components: {
    BrowserNotification,
    DeleteRoomComponent,
    TabsComponent,
    AdminTabsComponent,
    Can,
    Cannot
  },

  mixins: [FieldErrors],

  data () {
    return {
      reloadInterval: null,
      loading: false, // Room settings/details loading
      loadingJoinStart: false, // Loading indicator on joining/starting a room
      loadingDownload: false, // Loading indicator for downloading file
      name: '', // Name of guest
      room_id: null, // ID of the room
      room: null, // Room object
      accessCode: null, // Access code to use for requests
      accessCodeInput: '', // Access code input modal
      accessCodeValid: null, // Is access code valid
      recordAttendanceAgreement: false,
      token: null,
      errors: []
    };
  },
  // Component not loaded yet
  beforeRouteEnter (to, from, next) {
    const auth = useAuthStore();
    if (to.params.token && auth.isAuthenticated) {
      const error = new Error();
      error.response = { status: env.HTTP_GUESTS_ONLY };
      return next(error);
    }

    let config;

    if (to.params.token) {
      config = {
        headers: {
          Token: to.params.token
        }
      };
    }

    // Load room details
    Base.call('rooms/' + to.params.id, config).then(response => {
      next(vm => {
        vm.token = to.params.token ? to.params.token : null;
        vm.room = response.data.data;
        vm.room_id = to.params.id;

        if (vm.room.username) {
          vm.name = vm.room.username;
        }

        vm.startAutoRefresh();
      });
    }).catch((error) => {
      if (error.response) {
        // Room not found
        if (error.response.status === env.HTTP_NOT_FOUND) {
          return next('/404');
        }

        // Room token is invalid
        if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_token') {
          return next(vm => {
            vm.token = to.params.token ? to.params.token : null;
            vm.room_id = to.params.id;
          });
        }

        // Room is not open for guests
        if (error.response.status === env.HTTP_FORBIDDEN) {
          return next(vm => {
            vm.room_id = to.params.id;

            vm.startAutoRefresh();
          });
        }
        next(error);
      }
    });
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

    /**
     * Add a room to the favorites or delete it from the favorites
     */
    toggleFavorite: function () {
      let config;
      // check if the room must be added or deleted
      if (this.room.is_favorite) {
        config = { method: 'delete' };
      } else {
        config = { method: 'put' };
      }
      // add or delete room
      Base.call('rooms/' + this.room.id + '/favorites', config)
        .then(response => {
          this.reload();
        }).catch(error => {
        Base.error(error, this);
      });
    },

    ...mapActions(useAuthStore, ['setCurrentUser']),

    /**
     * Reset room access code and details
     */
    handleGuestsNotAllowed: function () {
      this.room = null;
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
      this.room = null;
      this.toastError(this.$t('rooms.flash.token_invalid'));
      // Disable auto reload as this error is permanent and the removal of the room link cannot be undone
      clearInterval(this.reloadInterval);
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

      const url = 'rooms/' + this.room_id;

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

          // Update current user, if logged in/out in another tab or session expired
          // to have the can/cannot component use the correct state
          this.setCurrentUser(this.room.current_user);
        })
        .catch((error) => {
          if (error.response) {
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

      const url = 'rooms/' + this.room_id + '/start';

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

      const url = 'rooms/' + this.room_id + '/join';

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
     * Become a room member
     * @param event
     */
    joinMembership: function (event) {
      // Enable loading indicator
      this.loading = true;

      // Join room as member, send access code if needed
      const config = this.accessCode == null ? { method: 'post' } : { method: 'post', headers: { 'Access-Code': this.accessCode } };
      Base.call('rooms/' + this.room.id + '/membership', config)
        .then(response => {
          // Reload room, now as a member; access code no longer needed
          this.accessCode = null;
          this.reload();
        })
        .catch((error) => {
          this.loading = false;

          if (error.response) {
            // Access code invalid
            if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_code') {
              // reset the logged in status, as it is no longer correct
              this.room.authenticated = false;
              // set the access code input invalid
              this.accessCodeValid = false;
              // Show error message
              this.toastError(this.$t('rooms.flash.access_code_invalid'));
              return;
            }

            // Membership not allowed, update status
            if (error.response.status === env.HTTP_FORBIDDEN) {
              this.room.allow_membership = false;
            }
          }
          Base.error(error, this.$root);
        });
    },
    /**
     * Leave room membership
     * @param event
     */
    leaveMembership: function (event) {
      // Enable loading indicator
      this.loading = true;
      Base.call('rooms/' + this.room.id + '/membership', {
        method: 'delete'
      }).catch((error) => {
        Base.error(error, this.$root);
      }).finally(() => {
        // Reload without membership
        this.reload();
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
      return this.room.last_meeting != null && this.room.last_meeting.start != null && this.room.last_meeting.end == null;
    },
    ...mapState(useAuthStore, ['isAuthenticated']),
    ...mapState(useSettingsStore, ['getSetting']),

    /**
     * Build invitation message
     */
    invitationText: function () {
      let message = this.$t('rooms.invitation.room', { roomname: this.room.name, platform: this.getSetting('name') }) + '\n';
      message += this.$t('rooms.invitation.link', { link: this.getSetting('base_url') + this.$router.resolve({ name: 'rooms.view', params: { id: this.room.id } }).route.fullPath });
      // If room has access code, include access code in the message
      if (this.room.access_code) {
        message += '\n' + this.$t('rooms.invitation.code', {
          code: String(this.room.access_code)
            .match(/.{1,3}/g)
            .join('-')
        });
      }
      return message;
    },

    /**
     * Enable or disable the edition of roles and attributes depending on the permissions of the current user.
     */
    viewInvitation () {
      return PermissionService.can('viewInvitation', this.room);
    }
  }
};
</script>

<style scoped>
  .room-icon {
    margin-top: 8px;
  }
</style>

<template>
  <div class="container mt-5 mb-5" v-cloak>
    <template v-if="room !== null">

      <!-- Delete button and modal -->
      <can method="delete" :policy="{ model_name: 'Room', isOwner: room.isOwner  }">
        <delete-room-component
          @roomDeleted="$router.push({ name: 'rooms.index' })"
          :room="room"
          :disabled="loading"
          button-class="float-right"
        ></delete-room-component>
      </can>

      <!-- Reload general room settings/details -->
      <b-button
        class="float-right"
        variant="dark"
        :title="$t('app.reload')"
        ref="reloadButton"
        v-b-tooltip.hover
        v-on:click="reload"
        :disabled="loading"
      >
        <i v-bind:class="{ 'fa-spin': loading  }" class="fas fa-sync"></i>
      </b-button>

      <!-- Show membership options for users that are logged into the room (via access code, membership, ownership) -->
      <div class="row pt-7 pt-sm-9 mb-3" v-if="room.authenticated && isAuthenticated">
        <div class="col-lg-12">
          <!-- If membership is enabled, allow user to become member -->
          <b-button
            class="float-right"
            v-if="room.allowMembership && !room.isMember && !room.isOwner"
            v-on:click="joinMembership"
            :disabled="loading"
            variant="dark"
          >
            <b-spinner small v-if="loading"></b-spinner> <i v-else class="fas fa-user-plus"></i> {{ $t('rooms.becomeMember') }}
          </b-button>
          <!-- If user is member, allow user to end the membership -->
          <b-button
            class="float-right"
            v-if="room.isMember"
            v-on:click="leaveMembership"
            :disabled="loading"
            variant="danger"
          >
            <b-spinner small v-if="loading"></b-spinner> <i v-else class="fas fa-user-minus"></i> {{ $t('rooms.endMembership') }}
          </b-button>
        </div>
      </div>

      <!-- Display room name, icon and owner -->
      <div class="row pt-7 pt-sm-9">
        <!-- Room icon -->
        <div class="col-lg-1 col-2">
          <div :style="{ 'background-color': room.type.color}" class="roomicon" v-if="room.type">
            {{room.type.short}}
          </div>
        </div>
        <!-- Room name and owner -->
        <div class="col-lg-11 col-10">
          <h2 class="roomname">{{ room.name }}</h2>
          <h5>{{ room.owner}}</h5>
        </div>
      </div>

      <hr>

      <!-- room join/start, files, settings for logged in users -->
      <template v-if="room.authenticated">
        <!-- Room join/start -->
        <b-row class="pt-7 pt-sm-9">
          <!-- Show inviation text/link to moderators and room owners -->
          <b-col order="2" order-md="1" col cols="12" md="8" lg="6" v-if="room.isModerator">
            <div class="jumbotron p-4" >
              <h5>{{ $t('rooms.accessForParticipants') }}</h5>
              <b-button
                class="float-right"
                v-clipboard="() => invitationText"
                variant="light"
              >
                <i class="fas fa-copy"></i>
              </b-button>
              <span style="white-space: pre;">{{ invitationText }}</span>
            </div>
          </b-col>
          <b-col order="1" order-md="2" col cols="12" :md="room.isModerator ? 4 : 12" :lg="room.isModerator ? 6 : 12">
            <b-row>
              <!-- Ask guests for their first and lastname -->
              <b-col col cols="12" md="6" v-if="room.isGuest">
                <b-form-group :label="$t('rooms.firstAndLastname')">
                  <b-input-group>
                    <b-form-input ref="guestName" v-model="name" :placeholder="$t('rooms.placeholderName')"></b-form-input>
                  </b-input-group>
                </b-form-group>
              </b-col>
              <!-- Show room start or join button -->
              <b-col col cols="12" :md="room.isGuest ? 6 : 12">
                <!-- If room is running, show join button -->
                <template v-if="room.running">
                  <!-- If user is guest, join is only possible if a name is provided -->
                  <b-button
                    block
                    ref="joinMeeting"
                    v-on:click="join"
                    :disabled="(room.isGuest && name==='') || loadingJoinStart"
                    variant="success"
                  >
                    <b-spinner small v-if="loadingJoinStart"></b-spinner> <i class="fas fa-door-open"></i> {{ $t('rooms.join') }}
                  </b-button>
                </template>
                <!-- If room is not running -->
                <template v-else>
                  <b-button
                    block
                    ref="startMeeting"
                    v-if="room.canStart"
                    :disabled="(room.isGuest && name==='') || loadingJoinStart"
                    v-on:click="start"
                    variant="success"
                  >
                      <b-spinner small v-if="loadingJoinStart"></b-spinner> <i class="fas fa-door-open"></i> {{ $t('rooms.start') }}
                  </b-button>
                  <!-- If user isn't allowed to start a new meeting, show message that meeting isn't running yet -->
                  <b-alert show v-else class="text-center p-3">
                    <div class="mb-3">
                      <b-spinner></b-spinner>
                    </div>
                    {{ $t('rooms.notRunning') }}
                  </b-alert>
                </template>
              </b-col>
            </b-row>
          </b-col>
        </b-row>

        <!-- Show file list for non-owner users (owner has it's own more detailed file list -->
        <template v-if="!room.isOwner">
          <b-row>
            <b-col>
              <hr>
              <file-component
                ref="publicFileList"
                :emit-errors="true"
                v-on:error="onFileListError"
                :access-code="accessCode"
                :room-id="room_id"
                :is-owner="room.isOwner"
                :show-title="true"
                :require-agreement="true"
                :hide-reload="true"
              ></file-component>
            </b-col>
          </b-row>
        </template>

        <!-- Show admin settings (owners only)-->
        <room-admin @settingsChanged="reload" :room="room" v-if="room.isOwner"></room-admin>
      </template>
      <!-- Ask for room access code -->
      <div v-else>
        <b-alert show>{{ $t('rooms.requireAccessCode') }}</b-alert>
        <b-input-group>
          <b-form-input
            :state="accessCodeValid"
            :placeholder="$t('rooms.placeholderAccessCode')"
            v-mask="'999-999-999'"
            v-model="accessCodeInput"
            v-on:keyup.enter="login"
          ></b-form-input>
          <b-input-group-append>
            <b-button
              v-on:click="login"
              :disabled="loading"
              variant="success"
            >
              <b-spinner small v-if="loading"></b-spinner> <i v-if="!loading" class="fas fa-lock"></i> {{ $t('rooms.login') }}
            </b-button>
          </b-input-group-append>
        </b-input-group>
      </div>
    </template>
    <!-- Room object is empty, access forbidden, room is only for logged in users -->
    <template v-else>
      <!-- Show message that room can only be used by logged in users -->
      <b-alert show>
        <i class="fas fa-exclamation-circle"></i> {{ $t('rooms.onlyUsedByAuthenticatedUsers') }}
      </b-alert>
      <b-button-group>
        <!-- Reload page, in case the room settings changed -->
        <b-button
          v-on:click="reload"
          :disabled="loading"
        >
          <b-spinner small v-if="loading"></b-spinner> <i v-if="!loading" class="fas fa-sync"></i> {{$t('rooms.tryAgain')}}
        </b-button>
        <!-- Redirect the login the access room -->
        <b-button
          @click="$router.push('/login')"
          variant="success"
        >
          <i class="fas fa-lock"></i> {{$t('rooms.login')}}
        </b-button>
      </b-button-group>
    </template>
  </div>
</template>
<script>
import { mapGetters } from 'vuex';
import AwesomeMask from 'awesome-mask';
import Base from '../../api/base';
import RoomAdmin from '../../components/Room/AdminComponent';
import env from './../../env.js';
import DeleteRoomComponent from '../../components/Room/DeleteRoomComponent';
import Can from '../../components/Permissions/Can';
import FileComponent from '../../components/Room/FileComponent';

export default {
  directives: {
    mask: AwesomeMask
  },
  components: {
    FileComponent,
    DeleteRoomComponent,
    RoomAdmin,
    Can
  },

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
      accessCodeInput: null, // Access code input modal
      accessCodeValid: null // Is access code valid
    };
  },
  // Component not loaded yet
  beforeRouteEnter (to, from, next) {
    // Load room details
    Base.call('rooms/' + to.params.id).then(response => {
      next(vm => {
        vm.room = response.data.data;
        vm.room_id = to.params.id;
      });
    }).catch((error) => {
      if (error.response) {
        // Room not found
        if (error.response.status === env.HTTP_NOT_FOUND) {
          return next('/404');
        }
        // Room is not open for guests
        if (error.response.status === env.HTTP_FORBIDDEN) {
          return next(vm => {
            vm.room_id = to.params.id;
          });
        }
        Base.error(error, this.$root);
      }
    });
  },
  mounted () {
    // Reload room details in a set inteval, change in the .env
    this.reloadInterval = setInterval(this.reload, env.REFRESH_RATE * 1000);
  },
  destroyed () {
    clearInterval(this.reloadInterval);
  },
  methods: {
    /**
     *  Handle errors of the file list
     */
    onFileListError: function (error) {
      if (error.response) {
        // Access code invalid
        if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_code') {
          return this.handleInvalidCode();
        }

        // Access code invalid
        if (error.response.status === env.HTTP_FORBIDDEN && error.response.data.message === 'require_code') {
          return this.handleInvalidCode();
        }

        // Forbidden, guests not allowed
        if (error.response.status === env.HTTP_FORBIDDEN) {
          return this.handleGuestsNotAllowed();
        }
      }
      Base.error(error, this.$root);
    },

    /**
     * Reset room access code and details
     */
    handleGuestsNotAllowed: function () {
      this.room = null;
      // Remove a potential access code
      this.accessCode = null;
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
      this.flashMessage.error(this.$t('rooms.flash.accessCodeChanged'));
      this.reload();
    },

    /**
     * Reload the room details/settings
     */
    reload: function () {
      // Enable loading indictor
      this.loading = true;
      // Build room api url, include access code if set

      const config = this.accessCode == null ? {} : { headers: { 'Access-Code': this.accessCode } };
      const url = 'rooms/' + this.room_id;

      // Load data
      Base.call(url, config)
        .then(response => {
          this.room = response.data.data;
          // If logged in, reset the access code valid
          if (this.room.authenticated) {
            this.accessCodeValid = null;
          }

          if (this.$refs.publicFileList) {
            this.$refs.publicFileList.reload();
          }
        })
        .catch((error) => {
          if (error.response) {
            // Access code invalid
            if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_code') {
              return this.handleInvalidCode();
            }

            // Forbidden, guests not allowed
            if (error.response.status === env.HTTP_FORBIDDEN) {
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
      // Build url, add accessCode if needed
      const config = this.accessCode == null ? {} : { headers: { 'Access-Code': this.accessCode } };
      const url = 'rooms/' + this.room_id + '/start?name=' + this.name;

      Base.call(url, config)
        .then(response => {
          // Check if response has a join url, if yes redirect
          if (response.data.url !== undefined) {
            window.location = response.data.url;
          }
        })
        .catch((error) => {
          if (error.response) {
            // Forbidden, use can't start the room
            if (error.response.status === env.HTTP_FORBIDDEN) {
              // Show error message
              this.flashMessage.error(this.$t('rooms.flash.startForbidden'));
              // Disable room start button and reload the room settings, as there was obviously
              // a diffent understanding of the users permission in this room
              this.room.canStart = false;
              this.reload();
              return;
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
      // Build url, add accessCode if needed
      const config = this.accessCode == null ? {} : { headers: { 'Access-Code': this.accessCode } };
      const url = 'rooms/' + this.room_id + '/join?name=' + this.name;

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
            // Room is not running, update running status
            if (error.response.status === env.HTTP_MEETING_NOT_RUNNING) {
              this.room.running = false;
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
      // Enable loading indictor
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
              this.flashMessage.error(this.$t('rooms.flash.accessCodeChanged'));
              return;
            }

            // Membership not allowed, update status
            if (error.response.status === env.HTTP_FORBIDDEN) {
              this.room.allowMembership = false;
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
      // Enable loading indictor
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
      // Remove all non-numic or dash chars
      this.accessCodeInput = this.accessCodeInput.replace(/[^0-9-]/g, '');
      // Remove the dashes for storing the access code
      this.accessCode = this.accessCodeInput.replace(/[-]/g, '');
      // Reload the room with an access code
      this.reload();
    }
  },
  computed: {

    ...mapGetters({
      isAuthenticated: 'session/isAuthenticated'
    }),
    /**
     * Filestable heading
     */
    filefields () {
      return [
        {
          key: 'filename',
          label: this.$t('rooms.files.filename'),
          sortable: true
        },
        {
          key: 'actions',
          label: this.$t('rooms.files.actions')
        }
      ];
    },

    /**
     * Build inviation message
     */
    invitationText: function () {
      let message = this.$t('rooms.invitation.room', { roomname: this.room.name }) + '\n';
      message += this.$t('rooms.invitation.link', { link: location.protocol + '//' + location.host + location.pathname });
      // If room has access code, include access code in the message
      if (this.room.accessCode) {
        message += '\n' + this.$t('rooms.invitation.code', {
          code: String(this.room.accessCode)
            .match(/.{1,3}/g)
            .join('-')
        });
      }
      return message;
    }
  }
};
</script>

<style scoped>
  .roomicon {
    margin-top: 8px;
  }
</style>

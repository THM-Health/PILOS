<template>
  <div class="container mt-5 mb-5" v-cloak>
    <template v-if="room">
      <!-- Reload general room settings/details -->
      <b-button
        class="float-right"
        v-on:click="reload"
        :disabled="loading"
      >
        <b-spinner small v-if="loading"></b-spinner> <i v-if="!loading" class="fas fa-sync"></i>
      </b-button>

      <!-- Show membership options for users that are logged into the room (via access code, membership, ownership) -->
      <div class="row pt-7 pt-sm-9 mb-3" v-if="room.loggedIn">
        <div class="col-lg-12">
          <!-- If membership is enabled, allow user to become member -->
          <b-button
            class="float-right"
            v-if="room.allowMembership && !room.isMember && !room.isOwner"
            v-on:click="joinMembership"
            variant="dark"
          >
            <i class="fas fa-user-plus"></i> {{ $t('rooms.becomeMember') }}
          </b-button>
          <!-- If user is member, allow user to end the membership -->
          <b-button
            class="float-right"
            v-if="room.isMember"
            v-on:click="leaveMembership"
            variant="danger"
          >
            <i class="fas fa-user-minus"></i> {{ $t('rooms.endMembership') }}
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
      <template v-if="room.loggedIn">
        <!-- Room join/start -->
        <b-row class="pt-7 pt-sm-9">
          <!-- Show inviation text/link to moderators and room owners -->
          <b-col v-if="room.isModerator">
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
          <b-col>
            <b-row>
              <!-- Ask guests for their first and lastname -->
              <b-col v-if="room.isGuest">
                <b-form-group :label="$t('rooms.firstAndLastname')">
                  <b-input-group>
                    <b-form-input v-model="name" placeholder="Max Mustermann"></b-form-input>
                  </b-input-group>
                </b-form-group>
              </b-col>
              <!-- Show room start or join button -->
              <b-col>
                <!-- If room is running, show join button -->
                <template v-if="room.running">
                  <!-- If user is guest, join is only possible if a name is provided -->
                  <b-button
                    block
                    v-on:click="join"
                    :disabled="(room.isGuest && name==='') || loadingJoinStart"
                    variant="success"
                  >
                    <b-spinner small v-if="loadingJoinStart"></b-spinner> <i class="fas fa-door-open"></i> {{ $t('rooms.join') }}
                  </b-button>
                </template>
                <!-- If room is not running -->
                <template v-else>
                  <!--
                  Quick start new meeting button, or TODO select specify server
                  only possible is user is allowed to start a room
                  -->
                  <b-dropdown
                    block
                    split
                    v-if="room.canStart"
                    :disabled="(room.isGuest && name==='') || loadingJoinStart"
                    v-on:click="start"
                    variant="success"
                  >
                    <template v-slot:button-content>
                      <b-spinner small v-if="loadingJoinStart"></b-spinner> <i class="fas fa-door-open"></i> {{ $t('rooms.start') }}
                    </template>
                    <!--
                    <b-dropdown-item href="#">Server 11</b-dropdown-item>
                    <b-dropdown-item href="#">Server 12</b-dropdown-item>
                    -->
                  </b-dropdown>
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
        <template v-if="room.files && room.files.length > 0 && !room.isOwner">
          <b-row><b-col>
            <hr>
            <h4>{{ $t('rooms.files.title') }}</h4>
            <!-- Table with all files -->
            <b-table :fields="filefields" :items="room.files" hover>
              <!-- Render action column-->
              <template v-slot:cell(actions)="data">
                <!-- Download file button -->
                <b-button
                  class="float-right"
                  variant="dark"
                  :href="data.item.url"
                  target="_blank"
                >
                  <i class="fas fa-eye"></i>
                </b-button>
              </template>
            </b-table>
          </b-col></b-row>
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
            placeholder="Zugangscode"
            v-mask="'999-999-999'"
            v-model="accessCodeInput"
            v-on:keyup.enter="login"
          ></b-form-input>
          <b-input-group-append>
            <b-button
              v-on:click="login"
              variant="success"
            >
              <i class="fas fa-lock"></i> {{ $t('rooms.login') }}
            </b-button>
          </b-input-group-append>
        </b-input-group>
      </div>
    </template>
    <!-- Room object is empty, access forbidden, room is only for logged in users -->
    <template v-else>
      <!-- Show message that room can only be used by logged in users -->
      <b-alert show>
        <i class="fas fa-exclamation-circle"></i> {{ $t('rooms.onlyUsedByLoggedInUsers') }}
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
import AwesomeMask from 'awesome-mask'
import Base from '../../api/base'
import RoomAdmin from '../../components/Room/AdminComponent'

export default {
  directives: {
    mask: AwesomeMask
  },
  components: {
    RoomAdmin
  },

  data () {
    return {
      loading: false, // Room settings/details loading
      name: '', // Name of guest
      loadingJoinStart: false, // Loading indicator on joining/starting a room
      room_id: null, // ID of the room
      room: null, // Room object
      accessCode: null, // Access code to use for requests
      accessCodeInput: null, // Access code input modal
      accessCodeValid: null, // Is access code valid
    }
  },
  // Component not loaded yet
  beforeRouteEnter (to, from, next) {
    // Load room details
    Base.call('rooms/' + to.params.id).then(response => {
      next(vm => {
        vm.room = response.data.data;
        vm.room_id = to.params.id
      })
    }).catch((error) => {
      if (error.response) {
        // Room not found
        if (error.response.status === 404) {
          next('/404')
        }
        // Room is not open for guests
        if (error.response.status === 403) {
          next(vm => {
            vm.room_id = to.params.id
          })
        }

        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers)
      } else if (error.request) {
        /*
             * The request was made but no response was received, `error.request`
             * is an instance of XMLHttpRequest in the browser and an instance
             * of http.ClientRequest in Node.js
             */
        console.log(error.request)
      }
    })
  },
  mounted () {
    // Reload room details in a set inteval, change in the .env
    setInterval(this.reload, process.env.MIX_REFRESH_RATE*1000)
  },
  methods: {
    /**
     * Reload the room details/settings
     */
    reload: function () {
      // Enable loading indictor
      this.loading = true;
      // Build room api url, include access code if set
      var url = 'rooms/' + this.room_id;
      if (this.accessCode != null) {
        url += '?code=' + this.accessCode
      }
      // Load data
      Base.call(url)
        .then(response => {
          // Disable loading indicator
          this.loading = false;
          this.room = response.data.data;
          // If logged in, reset the access code valid
          if (this.room.loggedIn) {
            this.accessCodeValid = null
          }
        })
        .catch((error) => {
          // Disable loading indicator
          this.loading = false;
          if (error.response) {
            // Access code invalid
            if (error.response.status === 401 && error.response.data.message === 'invalid_code') {
              // Show access code is valid
              this.accessCodeValid = false;
              // Reset access code (not the form input) to load the general room details again
              this.accessCode = null;
              this.reload()
            }

            // Forbidden, guests not allowed
            if (error.response.status === 403) {
              this.room = null;
              // Remove a potential access code
              this.accessCode = null
            }

            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers)
          } else if (error.request) {
            /*
                 * The request was made but no response was received, `error.request`
                 * is an instance of XMLHttpRequest in the browser and an instance
                 * of http.ClientRequest in Node.js
                 */
            console.log(error.request)
        }
      })
    },

    /**
     * Start a new meeting
     */
    start: function () {
      // Enable start/join meeting indicator/spinner
      this.loadingJoinStart = true;
      // Build url, add accessCode if needed
      var url = 'rooms/' + this.room_id + '/start?name=' + this.name;
      if (this.accessCode != null) {
        url += '&code=' + this.accessCode
      }

      Base.call(url)
        .then(response => {
          // Disable loading indicator
          this.loadingJoinStart = false;
          // Check if response has a join url, if yes redirect
          if (response.data.url !== undefined)
          {
            window.location = response.data.url
          }
        })
        .catch((error) => {
          // Disable loading indicator
          this.loadingJoinStart = false;
          if (error.response) {
            // Forbidden, use can't start the room
            if (error.response.status === 403) {
              // Show error message
              this.flashMessage.error(this.$t('rooms.flash.startForbidden'));
              // Disable room start button and reload the room settings, as there was obviously
              // a diffent understanding of the users permission in this room
              this.room.canStart = false;
              this.reload()
            }


            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers)
          } else if (error.request) {
            /*
                 * The request was made but no response was received, `error.request`
                 * is an instance of XMLHttpRequest in the browser and an instance
                 * of http.ClientRequest in Node.js
                 */
            console.log(error.request)
          }
      })
    },
    /**
     * Join a running meeting
     */
    join: function () {
      // Enable start/join meeting indicator/spinner
      this.loadingJoinStart = true;
      // Build url, add accessCode if needed
      var url = 'rooms/' + this.room_id + '/join?name=' + this.name;
      if (this.accessCode != null) {
        url += '&code=' + this.accessCode
      }

      // Join meeting request
      Base.call(url)
        .then(response => {
          // Disable loading indicator
          this.loadingJoinStart = false;
          // Check if response has a join url, if yes redirect
          if (response.data.url !== undefined)
          {
            window.location = response.data.url
          }
        })
        .catch((error) => {
          // Disable loading indicator
          this.loadingJoinStart = false;
          if (error.response) {
            // Room is not running
            if (error.response.status === 460) {
              // Update room running
              this.room.running = false;
              // Display error message
              this.flashMessage.error(this.$t('rooms.flash.notRunning'))
            }

            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers)
          } else if (error.request) {
            /*
                 * The request was made but no response was received, `error.request`
                 * is an instance of XMLHttpRequest in the browser and an instance
                 * of http.ClientRequest in Node.js
                 */
            console.log(error.request)
        }
      })
    },
    /**
     * Become a room member
     * @param event
     */
    joinMembership: function (event) {
      // Join room as member, send access code if needed
      Base.call('rooms/' + this.room.id + '/membership', {
        method: 'post',
        data: { code: this.accessCode }
      })
        .then(response => {
          // Reload room, now as a member; access code no longer needed
          this.accessCode = null;
          this.reload()
        })
        .catch((error) => {
          if (error.response) {
            // Access code invalid
            if (error.response.status === 401 && error.response.data.message === 'invalid_code') {
              // reset the logged in status, as it is no longer correct
              this.room.loggedIn = false;
              // set the access code input invalid
              this.accessCodeValid = false
            }

            if (error.response.status === 403) {
              // @TODO Show error, join membership deactivated by room owner
              this.reload()
            }

            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers)
          } else if (error.request) {
            console.log(error.request)
          }
      })
    },
    /**
     * Leave room membership
     * @param event
     */
    leaveMembership: function (event) {
      Base.call('rooms/' + this.room.id + '/membership', {
        method: 'delete'
      })
        .then(response => {
          // Reload without membership
          this.reload()
        })
        .catch((error) => {
          // leaving room failed
          // TODO error handling
          if (error.response) {
            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers)
          } else if (error.request) {
            console.log(error.request)
          }
      })
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
      this.reload()
    }
  },
  computed: {
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
      ]
    },

    /**
     * Build inviation message
     */
    invitationText: function () {
      var message = this.$t('rooms.invitation.room', { roomname: this.room.name }) + '\n';
      message += this.$t('rooms.invitation.link', { link: location.protocol + '//' + location.host + location.pathname });
      // If room has access code, include access code in the message
      if (this.room.accessCode) {
        message += '\n' + this.$t('rooms.invitation.code', {
          code: String(this.room.accessCode)
            .match(/.{1,3}/g)
            .join('-')
        })
      }
      return message
    }
  }
}
</script>

<style scoped>
  .roomicon {
    margin-top: 8px;
  }
</style>

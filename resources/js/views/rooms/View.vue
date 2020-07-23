<template>
  <div class="container mt-5 mb-5" v-cloak>
    <div v-if="!room">
      <b-alert show><i class="fas fa-exclamation-circle"></i> {{ $t('rooms.onlyUsedByLoggedInUsers') }}
      </b-alert>
      <b-button-group>
        <b-button
          v-on:click="reload"
        >
          <i class="fas fa-sync"></i> Erneut versuchen
        </b-button>

        <b-button
          @click="$router.push('/login')"
          variant="success"
        >
          <i class="fas fa-lock"></i> Anmelden
        </b-button>
      </b-button-group>
    </div>
    <div v-if="room">
      <div class="row pt-7 pt-sm-9 mb-3" v-if="room.loggedIn">
        <div class="col-lg-12">
          <b-button
            class="float-right"
            v-if="room.allowMembership && !room.isMember && !room.isOwner"
            v-on:click="joinMembership"
            variant="dark"
          >
            <i class="fas fa-user-plus"></i> {{ $t('rooms.becomeMember') }}
          </b-button>
          <b-button
            class="float-right"
            v-if="room.isMember && room.loggedIn"
            v-on:click="leaveMembership"
            variant="danger"
          >
            <i class="fas fa-user-minus"></i> {{ $t('rooms.endMembership') }}
          </b-button>
        </div>
      </div>
      <div class="row pt-7 pt-sm-9">
        <div class="col-lg-1 col-2">
          <div :style="{ 'background-color': room.type.color}" class="roomicon" v-if="room.type">
            {{room.type.short}}
          </div>
          <div class="roomicon" v-else>ME</div>
        </div>
        <div class="col-lg-11 col-10">
          <h2 class="roomname">{{ room.name }}</h2>
          <h5>{{ room.owner}}</h5>
        </div>
      </div>
      <hr>
      <b-row class="pt-7 pt-sm-9">
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
          <template v-if="room.loggedIn">
            <b-row>
              <b-col v-if="room.isGuest">
                <b-form-group :label="$t('rooms.firstAndLastname')">
                  <b-input-group>
                    <b-form-input v-model="name" placeholder="Max Mustermann"></b-form-input>
                  </b-input-group>
                </b-form-group>
              </b-col>
              <b-col>
                <template v-if="room.running">
                  <b-button
                    block
                    v-on:click="join"
                    :disabled="(room.isGuest && name==='') || loadingJoinStart"
                    variant="success"
                  >
                    <b-spinner small v-if="loadingJoinStart"></b-spinner> <i class="fas fa-door-open"></i> {{ $t('rooms.join') }}
                  </b-button>
                </template>
                <template v-else>
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
                    <b-dropdown-item href="#">Server 11</b-dropdown-item>
                    <b-dropdown-item href="#">Server 12</b-dropdown-item>
                  </b-dropdown>
                  <b-alert show v-else class="text-center p-3">
                    <div class="mb-3">
                      <b-spinner></b-spinner>
                    </div>
                    {{ $t('rooms.notRunning') }}
                  </b-alert>
                </template>
              </b-col>
            </b-row>
          </template>
        </b-col>
      </b-row>
      <template v-if="room.files && room.files.length > 0 && !room.isOwner">
        <b-row><b-col>
          <hr>
          <h4>{{ $t('rooms.files.title') }}</h4>
          <b-table :fields="filefields" :items="room.files" hover>
            <template v-slot:cell(actions)="data">
              <b-button-group class="float-right">
                <b-button variant="dark"
                          :href="data.item.url"
                          target="_blank"
                ><i class="fas fa-eye"></i
                ></b-button>
              </b-button-group>
            </template>
          </b-table>
        </b-col></b-row>
      </template>
      <room-admin :room="room" v-if="room.isOwner"></room-admin>

      <!-- Using components -->

      <div v-if="!room.loggedIn">
        <b-alert show>{{ $t('rooms.requireAccessCode') }}</b-alert>
        <b-input-group>
          <b-form-input :state="accessCodeValid" placeholder="Zugangscode" v-mask="'999-999-999'" v-model="accessCodeInput"
                        v-on:keyup.enter="login"></b-form-input>
          <b-input-group-append>
            <b-button v-on:click="login" variant="success"><i class="fas fa-lock"></i> {{ $t('rooms.login') }}</b-button>
          </b-input-group-append>
        </b-input-group>
      </div>
    </div>
  </div>
</template>
<script>
  import AwesomeMask from 'awesome-mask'
  import Base from '../../api/base'
  import RoomAdmin from '../../components/Room/AdminComponent'

  export default {
    directives: {
      'mask': AwesomeMask
    },
    components: {
      RoomAdmin
    },

    data() {
      return {
        name: '',
        loadingJoinStart : false,
        room_id: null,
        room: null,
        accessCode: null,
        accessCodeInput: null,
        accessCodeValid: null,
        reloadTimer: '',
      }
    },
    // Component not loaded yet
    beforeRouteEnter(to, from, next) {
      Base.call('rooms/' + to.params.id).then(response => {
        next(vm => {
          vm.room = response.data.data
          vm.room_id = to.params.id
        })
      }).catch((error) => {
        if (error.response) {
          if (error.response.status === 404) {
            next('/404')
          }

          if (error.response.status === 403) {
            next(vm => {
              vm.room_id = to.params.id
            })
          }

          console.log(error.response.data)
          console.log(error.response.status)
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
    mounted() {
      setInterval(this.reload, 3000)
    },
    methods: {

      reload: function () {
        var url = 'rooms/' + this.room_id
        if (this.accessCode != null) {
          url += '?code=' + this.accessCode
        }

        Base.call(url).then(response => {
          this.room = response.data.data
          if (this.room.loggedIn) {
            this.accessCodeValid = null
          }
        }).catch((error) => {
          if (error.response) {
            if (error.response.status === 401 && error.response.data.message == 'invalid_code') {
              this.accessCodeValid = false
              this.accessCode = null
              this.reload()
            }

            if (error.response.status === 403) {
              this.room = null
              this.accessCode = null
            }

            console.log(error.response.data)
            console.log(error.response.status)
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

      start: function () {
        this.loadingJoinStart = true;
        var url = 'rooms/' + this.room_id + '/start?name='+this.name;
        if (this.accessCode != null) {
          url += '&code=' + this.accessCode
        }

        Base.call(url).then(response => {
          if(response.data.url !== undefined)
            window.location = response.data.url;
        }).catch((error) => {
          this.loadingJoinStart = false;
          if (error.response) {
            console.log(error.response.data)
            console.log(error.response.status)
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
      join: function () {
        this.loadingJoinStart = true;
        var url = 'rooms/' + this.room_id + '/join?name='+this.name;
        if (this.accessCode != null) {
          url += '&code=' + this.accessCode
        }

        Base.call(url).then(response => {
          if(response.data.url !== undefined)
            window.location = response.data.url;
        }).catch((error) => {
          this.loadingJoinStart = false;
          if (error.response) {
            if (error.response.status === 460) {
              this.room.running = false
            }

            console.log(error.response.data)
            console.log(error.response.status)
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

      joinMembership: function (event) {
        Base.call('rooms/' + this.room.id + '/membership', {
          method: 'post',
          data: {code: this.accessCode}
        }).then(response => {
          this.reload()
        }).catch((error) => {
          if (error.response) {
            if (error.response.status === 401 && error.response.data.message == 'invalid_code') {
              this.room.loggedIn = false
              this.accessCodeValid = false
            }

            if (error.response.status === 403) {
              // @TODO Show error, join membership deacticated by room owner
              this.reload()
            }

            console.log(error.response.data)
            console.log(error.response.status)
            console.log(error.response.headers)
          } else if (error.request) {
            console.log(error.request)
          }
        })
      },
      leaveMembership: function (event) {
        Base.call('rooms/' + this.room.id + '/membership', {
          method: 'delete'
        }).then(response => {
          this.reload()
        }).catch((error) => {
          if (error.response) {
            console.log(error.response.data)
            console.log(error.response.status)
            console.log(error.response.headers)
          } else if (error.request) {
            console.log(error.request)
          }
        })
      },
      login: function () {
        this.accessCodeInput = this.accessCodeInput.replace(/[^0-9\-]/g,'');
        this.accessCode = this.accessCodeInput.replace(/[-]/g,'');
        this.reload()
      }
    },
    computed: {
      roomUrl: function () {
        return (
          window.location.origin +
          this.$router.resolve({
            name: "rooms.view",
            params: { id: this.room.id },
          }).href
        );
      },

      filefields() { return [
        {
          key: "filename",
          label: this.$t('rooms.files.filename'),
          sortable: true,
        },
        {
          key: "actions",
          label: this.$t('rooms.files.actions'),
        },
      ]; },

      invitationText: function () {
        var message = this.$t('rooms.invitation.room',{roomname:this.room.name})+"\n";
        message += this.$t('rooms.invitation.link',{link:this.roomUrl});

        if (this.room.accessCode) {
          message += "\n"+this.$t('rooms.invitation.code',{code: String(this.room.accessCode)
              .match(/.{1,3}/g)
              .join("-")});
        }
        return message;
      },
    },
  }
</script>

<style scoped>

  .btn-group-vertical-block {
    width: 100%;
  }

  .roomicon {
    margin-top: 8px;
  }

</style>

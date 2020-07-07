<template>
  <div class="container mt-5 mb-5" v-cloak>

    <div v-if="!room">
      <b-alert show><i class="fas fa-exclamation-circle"></i> Dieser Raum kann nur von angemeldeten Nutern verwendet werden.</b-alert>
      <b-button-group>
      <b-button
        v-on:click="reload"
      >
        <i class="fas fa-sync"></i> Erneut versuchen
      </b-button>

      <b-button
        variant="success"
        @click="$router.push('/login')"
      >
        <i class="fas fa-lock"></i> Anmelden
      </b-button>
      </b-button-group>
    </div>

    <div v-if="room">
    <div class="row pt-7 pt-sm-9 mb-3"  v-if="room.loggedIn">
      <div class="col-lg-12">
      <b-button
        v-if="room.allowSubscription && !room.isMember"
        class="float-right"
        variant="dark"
        v-on:click="joinMembership"
      >
        <i class="fas fa-user-plus"></i> Mitglied werden
      </b-button>
        <b-button
          v-if="room.isMember && room.loggedIn"
          class="float-right"
          variant="danger"
          v-on:click="leaveMembership"
        >
          <i class="fas fa-user-minus"></i> Mitgliedschaft beenden
        </b-button>
      </div>

    </div>
    <div class="row pt-7 pt-sm-9">
      <div class="col-lg-1 col-2">
        <div v-if="room.type" class="roomicon" :style="{ 'background-color': room.type.color}">{{room.type.short}}</div>
        <div v-else class="roomicon">ME</div>
      </div>
      <div class="col-lg-7 col-10">
        <h2 class="roomname">{{ room.name }}</h2>
        <h5>{{ room.owner}}</h5>
      </div>
      <div class="offset-lg-1 col-lg-3 col-sm-12">


        <template v-if="room.loggedIn || !room.requireAuth">
          <template v-if="room.running">
            <b-button
              block
              variant="success"
              v-on:click="join"
            >
              <i class="fas fa-door-open"></i> Teilnehmen
            </b-button>
          </template>
          <template v-else>
            <b-dropdown
              v-if="room.canStart"
              block
              split
              variant="success"
              v-on:click="start"
            >
              <template   v-slot:button-content>
                <i class="fas fa-door-open"></i> Starten
              </template>
              <b-dropdown-item href="#">Server 11</b-dropdown-item>
              <b-dropdown-item href="#">Server 12</b-dropdown-item>
            </b-dropdown>
            <b-alert v-else show>
              <div class="d-flex justify-content-center mb-3">
                <b-spinner></b-spinner>
              </div>
              Der Raum ist noch nicht gestartet
              .</b-alert>
          </template>
        </template>





      </div>
    </div>
    <hr>
    <room-admin v-if="room.settings" :room="room"></room-admin>


    <!-- Using components -->

    <div v-if="!room.loggedIn && room.requireAuth">
      <b-alert show>Für diesen Raum ist ein Zugangscode erforderlich</b-alert>
    <b-input-group>
      <b-form-input  v-on:keyup.enter="reload" :state="accessCodeValid" v-model="accessCode" placeholder="Zugangscode"></b-form-input>
      <b-input-group-append>
        <b-button variant="success" v-on:click="reload"><i class="fas fa-lock"></i> Anmelden</b-button>
      </b-input-group-append>
    </b-input-group>
    </div>

    </div>

  </div>
</template>

<script>

import Base from '../../api/base'
import RoomAdmin from '../../components/Room/RoomAdminComponent'

export default {

  components: {
    RoomAdmin
  },

  data () {
    return {
      room_id: null,
      room: null,
      accessCode: null,
      accessCodeValid: null,
    }
  },
  // Component not loaded yet
  beforeRouteEnter  (to, from, next) {
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

        if(error.response.status == 403){
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
  methods: {

    reload: function() {

      var url = 'rooms/' + this.room_id;
      if(this.accessCode != null)
        url +=  "?code="+this.accessCode;

      Base.call(url).then(response => {
        this.room = response.data.data
        this.accessCodeValid = null;
      }).catch((error) => {
        if (error.response) {

          if(error.response.status == 401 && error.response.data.message == 'invalid_code'){
            this.accessCodeValid = false;

          }

          if(error.response.status == 403){
            this.room = null;
            this.accessCode = null;
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

    start: function() {

      var url = 'rooms/' + this.room_id+"/start";
      if(this.accessCode != null)
        url +=  "?code="+this.accessCode;

      Base.call(url).then(response => {
        console.log(response.data)
      }).catch((error) => {
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
    join: function() {

      var url = 'rooms/' + this.room_id+"/join";
      if(this.accessCode != null)
        url +=  "?code="+this.accessCode;

      Base.call(url).then(response => {
        console.log(response.data)
      }).catch((error) => {
        if (error.response) {

          if(error.response.status == 460){
            this.room.running = false;
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


    joinMembership: function(event) {
      Base.call('rooms/' + this.room.id + "/membership",{
        method: 'post',
        data: {code: this.accessCode}
      }).then(response => {
        this.reload();
      }).catch((error) => {
        if (error.response) {
          if(error.response.status == 401 && error.response.data.message == 'invalid_code'){
            this.room.loggedIn = false;
            this.accessCodeValid = false;
          }

          if(error.response.status == 403){
            // @TODO Show error, join membership deacticated by room owner
            this.reload();
          }

          console.log(error.response.data)
          console.log(error.response.status)
          console.log(error.response.headers)
        } else if (error.request) {
          console.log(error.request)
        }
      })

    },
    leaveMembership: function(event) {
      Base.call('rooms/' + this.room.id + "/membership",{
        method: 'delete'
      }).then(response => {
        this.reload();
      }).catch((error) => {
        if (error.response) {
          console.log(error.response.data)
          console.log(error.response.status)
          console.log(error.response.headers)
        } else if (error.request) {
          console.log(error.request)
        }
      })

    }
  }

}
</script>

<style scoped>

  .btn-group-vertical-block{
    width: 100%;
  }

  .roomicon{
    margin-top: 8px;
  }

</style>

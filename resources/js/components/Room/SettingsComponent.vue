<template>
  <div>

            <div class="row" v-on:keyup.enter="save" @change="save">
              <div class="col-lg-12 mb-3" v-if="saving">
                <b-alert show>
                  <b-spinner small></b-spinner> {{ $t('rooms.settings.saving') }}
                </b-alert>
              </div>

              <!-- General settings tab -->
              <div class="col-lg-3 col-sm-12">
                <h5>{{ $t('rooms.settings.general.title') }}</h5>
                <b-form-group label="Typ">
                  <b-input-group>
                  <b-form-select v-model.number="roomType" :options="roomTypeSelect"></b-form-select>
                  </b-input-group>
                </b-form-group>
                <!-- Room name -->
                <b-form-group :label="$t('rooms.settings.general.roomName')">
                  <b-input-group>
                    <b-form-input  v-model="settings.name"></b-form-input>
                  </b-input-group>
                </b-form-group>
                <!-- Welcome message -->
                <b-form-group :label="$t('rooms.settings.general.welcomeMessage')">
                  <b-input-group>
                    <b-form-textarea
                      :state="welcomeMessageValidLength"
                      :placeholder="$t('rooms.settings.nonePlaceholder')"
                      rows="3"
                      v-model="settings.welcome"
                    ></b-form-textarea>
                  </b-input-group>
                  <small class="text-muted">
                    {{$t('rooms.settings.general.chars', {chars: charactersLeftWelcomeMessage})}}</small>
                </b-form-group>

                <!-- Max duration -->
                <b-form-group :label="$t('rooms.settings.general.maxDuration')">
                  <b-input-group>
                    <b-form-input
                      min="1"
                      :placeholder="$t('rooms.settings.nonePlaceholder')"
                      type="number"
                      v-model.number="settings.duration"
                    ></b-form-input>
                    <b-input-group-append>
                      <b-input-group-text>{{$t('rooms.settings.general.minutes')}}</b-input-group-text>
                      <b-button
                        @click="clearDuration"
                        variant="outline-secondary"
                      ><i class="fas fa-trash"></i
                      ></b-button>
                    </b-input-group-append>
                  </b-input-group>
                </b-form-group>
              </div>
              <!-- Security settings tab -->
              <div class="col-lg-3 col-sm-12">
                <h5>{{ $t('rooms.settings.security.title') }}</h5>
                <!-- Access code -->
                <b-form-group :label="$t('rooms.settings.security.accessCode')">
                  <b-input-group>
                    <b-input-group-prepend>
                      <b-button
                        v-on:click="genAccessCode"
                        variant="outline-secondary"
                      ><i class="fas fa-dice"></i
                      ></b-button>
                    </b-input-group-prepend>
                    <b-form-input
                      id="settings-accessCode"
                      :placeholder="$t('rooms.settings.security.unprotectedPlaceholder')"
                      readonly
                      type="number"
                      v-model.number="settings.accessCode"
                    ></b-form-input>
                    <b-input-group-append>
                      <b-button
                        @click="clearAccessCode"
                        variant="outline-secondary"
                      ><i class="fas fa-trash"></i
                      ></b-button>
                    </b-input-group-append>
                  </b-input-group>
                  <small class="text-muted">
                    {{ $t('rooms.settings.security.accessCodeNote') }}
                  </small>
                </b-form-group>
                <b-form-group>
                  <b-form-checkbox v-model="settings.allowGuests" switch>
                    {{ $t('rooms.settings.security.allowGuests') }}
                  </b-form-checkbox>
                </b-form-group>
                <b-form-group>
                  <b-form-checkbox v-model="settings.allowSubscription" switch>
                    {{ $t('rooms.settings.security.allowNewMembers') }}
                  </b-form-checkbox>
                </b-form-group>
              </div>
              <div class="col-lg-3 col-sm-12">
                <h5>{{ $t('rooms.settings.participants.title') }}</h5>
                  <!-- Max amount of participants -->
                  <b-form-group :label="$t('rooms.settings.participants.maxParticipants')">
                    <b-input-group>
                      <b-form-input
                        min="1"
                        :placeholder="$t('rooms.settings.nonePlaceholder')"
                        type="number"
                        v-model.number="settings.maxParticipants"
                      ></b-form-input>
                      <b-input-group-append>
                        <b-button
                          @click="clearmaxParticipants"
                          variant="outline-secondary"
                        ><i class="fas fa-trash"></i
                        ></b-button>
                      </b-input-group-append>
                    </b-input-group>
                  </b-form-group>
                  <b-form-group>
                    <template v-slot:label>
                      {{ $t('rooms.settings.participants.defaultRole.title') }}<br><small>{{ $t('rooms.settings.participants.defaultRole.onlyLoggedIn') }}</small>
                    </template>
                    <b-form-radio
                      name="setting-defaultRole"
                      v-model.number="settings.defaultRole"
                      value="1">
                      {{ $t('rooms.settings.participants.defaultRole.participant') }}
                    </b-form-radio>
                    <b-form-radio
                      name="setting-defaultRole"
                      v-model.number="settings.defaultRole"
                      value="2">
                      {{ $t('rooms.settings.participants.defaultRole.moderator') }}
                    </b-form-radio>
                  </b-form-group>
                <b-form-group :label="$t('rooms.settings.participants.waitingRoom.title')">
                  <b-form-radio
                    name="setting-lobby"
                    v-model.number="settings.lobby"
                    value="0">
                    {{ $t('rooms.settings.participants.waitingRoom.disabled') }}
                  </b-form-radio>
                  <b-form-radio
                    name="setting-lobby"
                    v-model.number="settings.lobby"
                    value="1">
                    {{ $t('rooms.settings.participants.waitingRoom.enabled') }}
                  </b-form-radio>
                  <b-form-radio
                    name="setting-lobby"
                    v-model.number="settings.lobby"
                    value="2">
                    {{ $t('rooms.settings.participants.waitingRoom.onlyForGuestsEnabled') }}
                  </b-form-radio>
                </b-form-group>
              </div>
              <div class="col-lg-3 col-sm-12">
                <h5>{{ $t('rooms.settings.permissions.title') }}</h5>
                <b-form-checkbox v-model="settings.everyoneCanStart" switch>
                  {{ $t('rooms.settings.permissions.everyoneStart') }}
                </b-form-checkbox>
                <b-form-checkbox v-model="settings.muteOnStart" switch>
                  {{ $t('rooms.settings.permissions.muteMic') }}
                </b-form-checkbox>
                <hr>
                <h5>{{ $t('rooms.settings.restrictions.title') }}</h5>
                <b-form-group>
                  <b-form-checkbox v-model="settings.lockSettingsLockOnJoin" switch>
                    {{ $t('rooms.settings.restrictions.enabled') }}
                  </b-form-checkbox>
                  <b-form-checkbox v-model="settings.lockSettingsDisableCam" switch>
                    {{ $t('rooms.settings.restrictions.disableCam') }}
                  </b-form-checkbox>
                  <b-form-checkbox v-model="settings.webcamsOnlyForModerator" switch>
                    {{ $t('rooms.settings.restrictions.onlyModSeeCam') }}
                  </b-form-checkbox>
                  <b-form-checkbox v-model="settings.lockSettingsDisableMic" switch>
                    {{ $t('rooms.settings.restrictions.disableMic') }}
                  </b-form-checkbox>
                  <b-form-checkbox v-model="settings.lockSettingsDisablePublicChat" switch>
                    {{ $t('rooms.settings.restrictions.disablePublicChat') }}
                  </b-form-checkbox>
                  <b-form-checkbox v-model="settings.lockSettingsDisablePrivateChat" switch>
                    {{ $t('rooms.settings.restrictions.disablePrivateChat') }}
                  </b-form-checkbox>
                  <b-form-checkbox v-model="settings.lockSettingsDisableNote" switch>
                    {{ $t('rooms.settings.restrictions.disableNoteEdit') }}
                  </b-form-checkbox>
                  <b-form-checkbox v-model="settings.lockSettingsHideUserList" switch>
                    {{ $t('rooms.settings.restrictions.hideParticipantsList') }}
                  </b-form-checkbox>
                </b-form-group>
              </div>
            </div>

  </div>
</template>

<script>
import Base from '../../api/base'

export default {
  props: {
    room: Object
  },
  data () {
    return {
      settings: Object,
      saving: false,
      welcomeMessageLimit: 500,
      defaultRoomType: null
    }
  },
  methods: {
    genAccessCode: function (event) {
      this.settings.accessCode =
          Math.floor(Math.random() * (999999999 - 111111112)) + 111111111
      this.save()
    },
    save () {
      this.saving = true
      console.log(this.settings)

      Base.call('rooms/' + this.room.id + '/settings', {
        method: 'put',
        data: this.settings
      }).then(response => {
        this.settings = response.data.data
        this.saving = false
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
    clearAccessCode () {
      this.settings.accessCode = null
      this.save()
    },
    clearDuration () {
      this.settings.duration = null
      this.save()
    },
    clearmaxParticipants () {
      this.settings.maxParticipants = null
      this.save()
    }
  },
  computed: {
    roomType: {

      get: function () {
        if (this.settings.roomType) {
          return this.settings.roomType
        } else { return this.defaultRoomType }
      },
      set: function (newValue) {
        this.settings.roomType = newValue
      }

    },

    roomTypeSelect () {
      if (this.settings.roomTypes) {
        return this.settings.roomTypes.map(roomtype => {
          var entry = {}
          entry.value = roomtype.id
          entry.text = roomtype.description
          if (roomtype.default) { this.defaultRoomType = roomtype.id }
          return entry
        })
      }
      return null
    },

    charactersLeftWelcomeMessage () {
      var char = this.settings.welcome
        ? this.settings.welcome.length
        : 0
      return char + ' / ' + this.welcomeMessageLimit
    },
    welcomeMessageValidLength () {
      return this.settings.welcome
        ? this.settings.welcome.length <= this.welcomeMessageLimit
          ? null
          : false
        : null
    }

  },
  created () {
    var url = 'rooms/' + this.room.id + '/settings'
    Base.call(url).then(response => {
      this.settings = response.data.data
    }).catch((error) => {
      if (error.response) {
        if (error.response.status === 401 && error.response.data.message === 'invalid_code') {
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
  }

}
</script>
<style scoped></style>

<template>
  <div>
    <b-overlay :show="isBusy || modelLoadingError" >
      <template #overlay>
        <div class="text-center">
          <b-spinner v-if="isBusy" ></b-spinner>
          <b-button
            v-else
            @click="load()"
          >
            <b-icon-arrow-clockwise></b-icon-arrow-clockwise> {{ $t('app.reload') }}
          </b-button>
        </div>
      </template>
      <b-form @submit='save' :aria-hidden="modelLoadingError">
        <b-row>
          <!-- General settings tab -->
          <b-col lg="3" md="6" cols="12">
            <h5>{{ $t('rooms.settings.general.title') }}</h5>
            <b-form-group :state="fieldState('roomType')" :label="$t('rooms.settings.general.type')">
              <room-type-select :disabled="isBusy || modelLoadingError" v-on:loadingError="(value) => this.roomTypeSelectLoadingError = value"  v-on:busy="(value) => this.roomTypeSelectBusy = value" ref="roomTypeSelect" v-model="settings.roomType" :state="fieldState('roomType')" ></room-type-select>
              <template slot='invalid-feedback'><div v-html="fieldError('roomType')"></div></template>
            </b-form-group>
            <!-- Room name -->
            <b-form-group :state="fieldState('name')" :label="$t('rooms.settings.general.roomName')">
              <b-input-group>
                <b-form-input
                  :disabled="isBusy || modelLoadingError"
                  :state="fieldState('name')"
                  v-model="settings.name"
                ></b-form-input>
              </b-input-group>
              <template slot='invalid-feedback'><div v-html="fieldError('name')"></div></template>
            </b-form-group>
            <!-- Welcome message -->
            <b-form-group :state="fieldState('welcome')" :label="$t('rooms.settings.general.welcomeMessage')">
              <b-input-group >
                <b-form-textarea
                  :disabled="isBusy || modelLoadingError"
                  id="welcome"
                  :placeholder="$t('rooms.settings.nonePlaceholder')"
                  rows="3"
                  :state="fieldState('welcome')"
                  v-model="settings.welcome"
                ></b-form-textarea>
              </b-input-group>
              <small class="text-muted">
                {{$t('rooms.settings.general.chars', {chars: charactersLeftWelcomeMessage})}}</small>
              <template slot='invalid-feedback'><div v-html="fieldError('welcome')"></div></template>
            </b-form-group>

            <!-- Max duration -->
            <b-form-group :state="fieldState('duration')" :label="$t('rooms.settings.general.maxDuration')">
              <b-input-group>
                <b-form-input
                  :disabled="isBusy || modelLoadingError"
                  min="1"
                  :placeholder="$t('rooms.settings.nonePlaceholder')"
                  type="number"
                  v-model.number="settings.duration"
                  :state="fieldState('duration')"
                ></b-form-input>
                <b-input-group-append>
                  <b-input-group-text>{{$t('rooms.settings.general.minutes')}}</b-input-group-text>
                  <!-- Reset the duration -->
                  <b-button
                    :disabled="isBusy || modelLoadingError"
                    @click="settings.duration = null"
                    variant="outline-secondary"
                  ><i class="fas fa-trash"></i
                  ></b-button>
                </b-input-group-append>
              </b-input-group>
              <template slot='invalid-feedback'><div v-html="fieldError('duration')"></div></template>
            </b-form-group>
          </b-col>

          <!-- Security settings tab -->
          <b-col lg="3" md="6" cols="12">
            <h5>{{ $t('rooms.settings.security.title') }}</h5>
            <!-- Access code -->
            <b-form-group :state="fieldState('accessCode')" :label="$t('rooms.settings.security.accessCode')">
              <b-input-group>
                <b-input-group-prepend>
                  <!-- Generate random access code -->
                  <b-button
                    :disabled="isBusy || modelLoadingError"
                    v-on:click="settings.accessCode = (Math.floor(Math.random() * (999999999 - 111111112)) + 111111111)"
                    variant="outline-secondary"
                  ><i class="fas fa-dice"></i
                  ></b-button>
                </b-input-group-prepend>
                <b-form-input
                  id="settings-accessCode"
                  :placeholder="$t('rooms.settings.security.unprotectedPlaceholder')"
                  readonly
                  :state="fieldState('accessCode')"
                  type="number"
                  v-model.number="settings.accessCode"
                ></b-form-input>
                <b-input-group-append>
                  <!-- Clear access code -->
                  <b-button
                    :disabled="isBusy || modelLoadingError"
                    @click="settings.accessCode = null"
                    variant="outline-secondary"
                  ><i class="fas fa-trash"></i
                  ></b-button>
                </b-input-group-append>
              </b-input-group>
              <small class="text-muted">
                {{ $t('rooms.settings.security.accessCodeNote') }}
              </small>
              <template slot='invalid-feedback'><div v-html="fieldError('accessCode')"></div></template>
            </b-form-group>

            <!-- Checkbox allow guests to access the room -->
            <b-form-group :state="fieldState('allowGuests')">
              <b-form-checkbox
                :disabled="isBusy || modelLoadingError"
                :state="fieldState('allowGuests')"
                v-model="settings.allowGuests"
                switch
              >
                {{ $t('rooms.settings.security.allowGuests') }}
              </b-form-checkbox>
              <template slot='invalid-feedback'><div v-html="fieldError('allowGuests')"></div></template>
            </b-form-group>

            <!-- Checkbox allow users to become room members -->
            <b-form-group :state="fieldState('allowMembership')">
              <b-form-checkbox
                :disabled="isBusy || modelLoadingError"
                :state="fieldState('allowMembership')"
                v-model="settings.allowMembership"
                switch
              >
                {{ $t('rooms.settings.security.allowNewMembers') }}
              </b-form-checkbox>
              <template slot='invalid-feedback'><div v-html="fieldError('allowMembership')"></div></template>
            </b-form-group>
          </b-col>

          <!-- Paticipants settings tab -->
          <b-col lg="3" md="6" cols="12">
            <h5>{{ $t('rooms.settings.participants.title') }}</h5>
              <!-- Max amount of participants -->
              <b-form-group :state="fieldState('maxParticipants')" :label="$t('rooms.settings.participants.maxParticipants')">
                <b-input-group>
                  <b-form-input
                    min="1"
                    :disabled="isBusy || modelLoadingError"
                    :placeholder="$t('rooms.settings.nonePlaceholder')"
                    type="number"
                    :state="fieldState('maxParticipants')"
                    v-model.number="settings.maxParticipants"
                  ></b-form-input>
                  <b-input-group-append>
                    <!-- Clear participants limit -->
                    <b-button
                      :disabled="isBusy || modelLoadingError"
                      @click="settings.maxParticipants = null"
                      variant="outline-secondary"
                    ><i class="fas fa-trash"></i
                    ></b-button>
                  </b-input-group-append>
                </b-input-group>
                <template slot='invalid-feedback'><div v-html="fieldError('maxParticipants')"></div></template>
              </b-form-group>

              <!-- Radio default user role for logged in users only -->
              <b-form-group :state="fieldState('defaultRole')">
                <template v-slot:label>
                  {{ $t('rooms.settings.participants.defaultRole.title') }}<br><small>{{ $t('rooms.settings.participants.defaultRole.onlyLoggedIn') }}</small>
                </template>
                <b-form-radio
                  :disabled="isBusy || modelLoadingError"
                  name="setting-defaultRole"
                  v-model.number="settings.defaultRole"
                  :state="fieldState('defaultRole')"
                  value="1">
                  {{ $t('rooms.settings.participants.defaultRole.participant') }}
                </b-form-radio>
                <b-form-radio
                  name="setting-defaultRole"
                  :disabled="isBusy || modelLoadingError"
                  v-model.number="settings.defaultRole"
                  :state="fieldState('defaultRole')"
                  value="2">
                  {{ $t('rooms.settings.participants.defaultRole.moderator') }}
                </b-form-radio>
                <template slot='invalid-feedback'><div v-html="fieldError('defaultRole')"></div></template>
              </b-form-group>

            <!-- Radio usage of the waiting room/guest lobby -->
            <b-form-group :state="fieldState('lobby')" :label="$t('rooms.settings.participants.waitingRoom.title')">
              <b-form-radio
                :disabled="isBusy || modelLoadingError"
                name="setting-lobby"
                v-model.number="settings.lobby"
                :state="fieldState('lobby')"
                value="0">
                {{ $t('rooms.settings.participants.waitingRoom.disabled') }}
              </b-form-radio>
              <b-form-radio
                :disabled="isBusy || modelLoadingError"
                name="setting-lobby"
                v-model.number="settings.lobby"
                :state="fieldState('lobby')"
                value="1">
                {{ $t('rooms.settings.participants.waitingRoom.enabled') }}
              </b-form-radio>
              <b-form-radio
                :disabled="isBusy || modelLoadingError"
                name="setting-lobby"
                v-model.number="settings.lobby"
                :state="fieldState('lobby')"
                value="2">
                {{ $t('rooms.settings.participants.waitingRoom.onlyForGuestsEnabled') }}
              </b-form-radio>
              <template slot='invalid-feedback'><div v-html="fieldError('lobby')"></div></template>
            </b-form-group>
          </b-col>

          <!-- Permissions & Restrictions tab -->
          <b-col lg="3" md="6" cols="12">
            <h5>{{ $t('rooms.settings.permissions.title') }}</h5>
            <!-- Everyone can start a new meeting, not only the moderator -->
            <b-form-checkbox
              :disabled="isBusy || modelLoadingError"
              :state="fieldState('everyoneCanStart')"
              v-model="settings.everyoneCanStart"
              switch
            >
              {{ $t('rooms.settings.permissions.everyoneStart') }}
            </b-form-checkbox>
            <b-form-invalid-feedback :state="fieldState('everyoneCanStart')" v-html="fieldError('everyoneCanStart')"></b-form-invalid-feedback>
            <!-- Mute everyones microphone on meeting join -->
            <b-form-checkbox
              :disabled="isBusy || modelLoadingError"
              :state="fieldState('muteOnStart')"
              v-model="settings.muteOnStart"
              switch
            >
              {{ $t('rooms.settings.permissions.muteMic') }}
            </b-form-checkbox>
            <b-form-invalid-feedback :state="fieldState('muteOnStart')" v-html="fieldError('muteOnStart')"></b-form-invalid-feedback>
            <hr>
            <h5>{{ $t('rooms.settings.restrictions.title') }}</h5>
            <!-- Enable the restrictions, otherwise just send the settings, can be activated during the meeting -->
            <b-form-checkbox
              :disabled="isBusy || modelLoadingError"
              :state="fieldState('lockSettingsLockOnJoin')"
              v-model="settings.lockSettingsLockOnJoin"
              switch
            >
              {{ $t('rooms.settings.restrictions.enabled') }}
            </b-form-checkbox>
            <b-form-invalid-feedback :state="fieldState('lockSettingsLockOnJoin')" v-html="fieldError('lockSettingsLockOnJoin')"></b-form-invalid-feedback>
            <!-- Disable the ability to use the webcam for non moderator-uses, can be changed during the meeting -->
            <b-form-checkbox
              :disabled="isBusy || modelLoadingError"
              :state="fieldState('lockSettingsDisableCam')"
              v-model="settings.lockSettingsDisableCam"
              switch
            >
              {{ $t('rooms.settings.restrictions.disableCam') }}
            </b-form-checkbox>
            <b-form-invalid-feedback :state="fieldState('lockSettingsDisableCam')" v-html="fieldError('lockSettingsDisableCam')"></b-form-invalid-feedback>
            <!--
            Disable the ability to see the webcam of non moderator-uses,
            moderators can see all webcams,
            can be changed during the meeting
            -->
            <b-form-checkbox
              :disabled="isBusy || modelLoadingError"
              :state="fieldState('webcamsOnlyForModerator')"
              v-model="settings.webcamsOnlyForModerator"
              switch
            >
              {{ $t('rooms.settings.restrictions.onlyModSeeCam') }}
            </b-form-checkbox>
            <b-form-invalid-feedback :state="fieldState('webcamsOnlyForModerator')" v-html="fieldError('webcamsOnlyForModerator')"></b-form-invalid-feedback>
            <!-- Disable the ability to use the microphone for non moderator-uses, can be changed during the meeting -->
            <b-form-checkbox
              :disabled="isBusy || modelLoadingError"
              :state="fieldState('lockSettingsDisableMic')"
              v-model="settings.lockSettingsDisableMic"
              switch
            >
              {{ $t('rooms.settings.restrictions.disableMic') }}
            </b-form-checkbox>
            <b-form-invalid-feedback :state="fieldState('lockSettingsDisableMic')" v-html="fieldError('lockSettingsDisableMic')"></b-form-invalid-feedback>
            <!-- Disable the ability to send messages via the public chat for non moderator-uses, can be changed during the meeting -->
            <b-form-checkbox
              :disabled="isBusy || modelLoadingError"
              :state="fieldState('lockSettingsDisablePublicChat')"
              v-model="settings.lockSettingsDisablePublicChat"
              switch
            >
              {{ $t('rooms.settings.restrictions.disablePublicChat') }}
            </b-form-checkbox>
            <b-form-invalid-feedback :state="fieldState('lockSettingsDisablePublicChat')" v-html="fieldError('lockSettingsDisablePublicChat')"></b-form-invalid-feedback>
            <!--
            Disable the ability to send messages via the private chat for non moderator-uses,
            private chats with the moderators is still possible
            can be changed during the meeting
            -->
            <b-form-checkbox
              :disabled="isBusy || modelLoadingError"
              :state="fieldState('lockSettingsDisablePrivateChat')"
              v-model="settings.lockSettingsDisablePrivateChat"
              switch
            >
              {{ $t('rooms.settings.restrictions.disablePrivateChat') }}
            </b-form-checkbox>
            <b-form-invalid-feedback :state="fieldState('lockSettingsDisablePrivateChat')" v-html="fieldError('lockSettingsDisablePrivateChat')"></b-form-invalid-feedback>
            <!-- Disable the ability to edit the notes for non moderator-uses, can be changed during the meeting -->
            <b-form-checkbox
              :disabled="isBusy || modelLoadingError"
              :state="fieldState('lockSettingsDisableNote')"
              v-model="settings.lockSettingsDisableNote"
              switch
            >
              {{ $t('rooms.settings.restrictions.disableNoteEdit') }}
            </b-form-checkbox>
            <b-form-invalid-feedback :state="fieldState('lockSettingsDisableNote')" v-html="fieldError('lockSettingsDisableNote')"></b-form-invalid-feedback>
            <!-- Disable the ability to see a list of all participants for non moderator-uses, can be changed during the meeting -->
            <b-form-checkbox
              :disabled="isBusy || modelLoadingError"
              :state="fieldState('lockSettingsHideUserList')"
              v-model="settings.lockSettingsHideUserList"
              switch
            >
              {{ $t('rooms.settings.restrictions.hideParticipantsList') }}
            </b-form-checkbox>
            <b-form-invalid-feedback :state="fieldState('lockSettingsHideUserList')" v-html="fieldError('lockSettingsHideUserList')"></b-form-invalid-feedback>
          </b-col>
        </b-row>
        <hr>
        <b-row class='mt-1 mb-3 float-right'>
          <b-col sm='12'>
            <b-button
              :disabled='isBusy || modelLoadingError || roomTypeSelectBusy || roomTypeSelectLoadingError'
              variant='success'
              type='submit'
              >
              <i class='fas fa-save'></i> {{ $t('app.save') }}
            </b-button>
          </b-col>
        </b-row>
      </b-form>
    </b-overlay>
  </div>
</template>

<script>
import Base from '../../api/base';
import env from './../../env.js';
import FieldErrors from '../../mixins/FieldErrors';
import RoomTypeSelect from '../RoomType/RoomTypeSelect';

export default {
  mixins: [FieldErrors],
  components: { RoomTypeSelect },

  props: {
    room: Object
  },

  data () {
    return {
      settings: Object, // Room settings
      isBusy: false, // Settings are currently saved, display spinner
      roomTypeSelectBusy: false,
      roomTypeSelectLoadingError: false,
      modelLoadingError: false,
      welcomeMessageLimit: env.WELCOME_MESSAGE_LIMIT,
      errors: {}
    };
  },
  methods: {
    /**
     * Save room settings
     *
     *  @param evt
     */
    save (evt) {
      if (evt) {
        evt.preventDefault();
      }

      // Set saving indicator
      this.isBusy = true;
      // Send new settings to the server
      Base.call('rooms/' + this.room.id, {
        method: 'put',
        data: this.settings
      }).then(response => {
        // Settings successfully saved
        // update the settings to the response from the server, feedback the changed were applied correctly
        this.settings = response.data.data;
        // inform parent component about changed settings
        this.$emit('settingsChanged');
        this.errors = {};
      }).catch((error) => {
        // Settings couldn't be saved
        if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          if (error.response.data.errors.roomType !== undefined) {
            this.$refs.roomTypeSelect.reloadRoomTypes();
          }
          this.errors = error.response.data.errors;
          return;
        }
        Base.error(error, this.$root);
      }).finally(() => {
        // Disable saving indicator
        this.isBusy = false;
      });
    },

    load () {
      this.modelLoadingError = false;
      this.isBusy = true;
      // Load all room settings
      Base.call('rooms/' + this.room.id + '/settings')
        .then(response => {
          // fetch successful
          this.settings = response.data.data;
        }).catch((error) => {
          this.modelLoadingError = true;
          Base.error(error, this.$root);
        }).finally(() => {
          this.isBusy = false;
        });
    }
  },
  computed: {

    /**
     * Count the chars of the welcome message
     * @returns {string} amount of chars in comparision to the limit
     */
    charactersLeftWelcomeMessage () {
      var char = this.settings.welcome
        ? this.settings.welcome.length
        : 0;
      return char + ' / ' + this.welcomeMessageLimit;
    }
  },
  created () {
    this.load();
  }
};
</script>
<style scoped></style>

<template>
  <div>
    <b-overlay :show="isBusy || modelLoadingError" >
      <template #overlay>
        <div class="text-center">
          <b-spinner v-if="isBusy" ></b-spinner>
          <b-button
            ref="reload"
            v-else
            @click="load()"
          >
            <i class="fa-solid fa-sync"></i> {{ $t('app.reload') }}
          </b-button>
        </div>
      </template>
      <b-form @submit='save' :aria-hidden="modelLoadingError">
        <b-row>
          <!-- General settings tab -->
          <b-col lg="3" md="6" cols="12">
            <h5>{{ $t('rooms.settings.general.title') }}</h5>
            <b-form-group :state="fieldState('room_type')" :label="$t('rooms.settings.general.type')">
              <room-type-select
                :disabled="disabled"
                v-on:loadingError="(value) => this.roomTypeSelectLoadingError = value"
                v-on:busy="(value) => this.roomTypeSelectBusy = value"
                ref="roomTypeSelect"
                v-model="settings.room_type"
                :room-id="room.id"
                :state="fieldState('room_type')" >
              </room-type-select>
              <template slot='invalid-feedback'><div v-html="fieldError('room_type')"></div></template>
            </b-form-group>
            <!-- Room name -->
            <b-form-group :state="fieldState('name')" :label="$t('rooms.name')">
              <b-input-group>
                <b-form-input
                  :disabled="disabled"
                  :state="fieldState('name')"
                  v-model="settings.name"
                ></b-form-input>
              </b-input-group>
              <template slot='invalid-feedback'><div v-html="fieldError('name')"></div></template>
            </b-form-group>
            <!-- Welcome message -->
            <b-form-group :state="fieldState('welcome')" :label="$t('rooms.settings.general.welcome_message')">
              <b-input-group >
                <b-form-textarea
                  :disabled="disabled"
                  id="welcome"
                  :placeholder="$t('rooms.settings.none_placeholder')"
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
            <b-form-group :state="fieldState('duration')" :label="$t('rooms.settings.general.max_duration')">
              <b-input-group>
                <b-form-input
                  :disabled="disabled"
                  min="1"
                  :placeholder="$t('rooms.settings.none_placeholder')"
                  type="number"
                  v-model.number="settings.duration"
                  :state="fieldState('duration')"
                ></b-form-input>
                <b-input-group-append>
                  <b-input-group-text>{{$t('rooms.settings.general.minutes')}}</b-input-group-text>
                  <!-- Reset the duration -->
                  <b-button
                    :disabled="disabled"
                    @click="settings.duration = null"
                    variant="outline-secondary"
                    :title="$t('rooms.settings.general.reset_duration')"
                    v-b-tooltip.hover
                    v-tooltip-hide-click
                  ><i class="fa-solid fa-trash"></i
                  ></b-button>
                </b-input-group-append>
              </b-input-group>
              <template slot='invalid-feedback'><div v-html="fieldError('duration')"></div></template>
            </b-form-group>

            <!-- Checkbox record meeting -->
            <b-form-group :state="fieldState('record')">
              <b-form-checkbox
                :disabled="disabled"
                :state="fieldState('record')"
                v-model="settings.record"
                switch
              >
                {{ $t('rooms.settings.general.record') }}
              </b-form-checkbox>
              <template slot='invalid-feedback'><div v-html="fieldError('record')"></div></template>
            </b-form-group>
          </b-col>

          <!-- Security settings tab -->
          <b-col lg="3" md="6" cols="12">
            <h5>{{ $t('app.security') }}</h5>
            <!-- Access code -->
            <b-form-group :state="fieldState('access_code')" :label="$t('rooms.access_code')">
              <b-input-group>
                <b-input-group-prepend>
                  <!-- Generate random access code -->
                  <b-button
                    :disabled="disabled"
                    v-on:click="settings.access_code = (Math.floor(Math.random() * (999999999 - 111111112)) + 111111111)"
                    variant="outline-secondary"
                    :title="$t('rooms.settings.security.generate_access_code')"
                    v-b-tooltip.hover
                    v-tooltip-hide-click
                  >
                    <i class="fa-solid fa-dice"></i>
                  </b-button>
                </b-input-group-prepend>
                <b-form-input
                  id="settings-accessCode"
                  :placeholder="$t('rooms.settings.security.unprotected_placeholder')"
                  :disabled="disabled"
                  readonly="readonly"
                  :state="fieldState('access_code')"
                  type="number"
                  v-model.number="settings.access_code"
                ></b-form-input>
                <b-input-group-append>
                  <!-- Clear access code -->
                  <b-button
                    :disabled="disabled"
                    @click="settings.access_code = null"
                    variant="outline-secondary"
                    :title="$t('rooms.settings.security.delete_access_code')"
                    v-b-tooltip.hover
                    v-tooltip-hide-click
                  ><i class="fa-solid fa-trash"></i
                  ></b-button>
                </b-input-group-append>
              </b-input-group>
              <small class="text-muted">
                {{ $t('rooms.settings.security.access_code_note') }}
              </small>
              <template slot='invalid-feedback'><div v-html="fieldError('access_code')"></div></template>
            </b-form-group>

            <!-- Checkbox allow guests to access the room -->
            <b-form-group :state="fieldState('allow_guests')">
              <b-form-checkbox
                :disabled="disabled"
                :state="fieldState('allow_guests')"
                v-model="settings.allow_guests"
                switch
              >
                {{ $t('rooms.settings.security.allow_guests') }}
              </b-form-checkbox>
              <template slot='invalid-feedback'><div v-html="fieldError('allow_guests')"></div></template>
            </b-form-group>

            <!-- Checkbox allow users to become room members -->
            <b-form-group :state="fieldState('allow_membership')">
              <b-form-checkbox
                :disabled="disabled"
                :state="fieldState('allow_membership')"
                v-model="settings.allow_membership"
                switch
              >
                {{ $t('rooms.settings.security.allow_new_members') }}
              </b-form-checkbox>
              <template slot='invalid-feedback'><div v-html="fieldError('allow_membership')"></div></template>
            </b-form-group>

            <!-- Checkbox publicly list this room -->
            <b-form-group :state="fieldState('listed')" v-if="settings.room_type && settings.room_type.allow_listing && !settings.access_code">
              <b-form-checkbox
                :disabled="disabled"
                :state="fieldState('listed')"
                v-model="settings.listed"
                switch
              >
                {{ $t('rooms.settings.security.listed') }}
              </b-form-checkbox>
              <template slot='invalid-feedback'><div v-html="fieldError('listed')"></div></template>
            </b-form-group>
          </b-col>

          <!-- Participants settings tab -->
          <b-col lg="3" md="6" cols="12">
            <h5>{{ $t('rooms.settings.participants.title') }}</h5>
              <!-- Max amount of participants -->
              <b-form-group :state="fieldState('max_participants')" :label="$t('rooms.settings.participants.max_participants')">
                <b-input-group>
                  <b-form-input
                    min="1"
                    :disabled="disabled"
                    :placeholder="$t('rooms.settings.none_placeholder')"
                    type="number"
                    :state="fieldState('max_participants')"
                    v-model.number="settings.max_participants"
                  ></b-form-input>
                  <b-input-group-append>
                    <!-- Clear participants limit -->
                    <b-button
                      :disabled="disabled"
                      @click="settings.max_participants = null"
                      variant="outline-secondary"
                      :title="$t('rooms.settings.participants.clear_max_participants')"
                      v-b-tooltip.hover
                      v-tooltip-hide-click
                    ><i class="fa-solid fa-trash"></i
                    ></b-button>
                  </b-input-group-append>
                </b-input-group>
                <template slot='invalid-feedback'><div v-html="fieldError('max_participants')"></div></template>
              </b-form-group>

              <!-- Radio default user role for logged in users only -->
              <b-form-group :state="fieldState('default_role')" ref="defaultRole-group">
                <template v-slot:label>
                  {{ $t('rooms.settings.participants.default_role.title') }}<br><small>{{ $t('rooms.settings.participants.default_role.only_logged_in') }}</small>
                </template>
                <b-form-radio
                  :disabled="disabled"
                  name="setting-defaultRole"
                  v-model.number="settings.default_role"
                  :state="fieldState('default_role')"
                  value="1">
                  {{ $t('rooms.roles.participant') }}
                </b-form-radio>
                <b-form-radio
                  name="setting-defaultRole"
                  :disabled="disabled"
                  v-model.number="settings.default_role"
                  :state="fieldState('default_role')"
                  value="2">
                  {{ $t('rooms.roles.moderator') }}
                </b-form-radio>
                <template slot='invalid-feedback'><div v-html="fieldError('default_role')"></div></template>
              </b-form-group>

              <!-- Radio usage of the waiting room/guest lobby -->
              <b-form-group :state="fieldState('lobby')" :label="$t('rooms.settings.participants.waiting_room.title')" ref="waitingRoom-group">
                <b-form-radio
                  :disabled="disabled"
                  name="setting-lobby"
                  v-model.number="settings.lobby"
                  :state="fieldState('lobby')"
                  value="0">
                  {{ $t('app.disabled') }}
                </b-form-radio>
                <b-form-radio
                  :disabled="disabled"
                  name="setting-lobby"
                  v-model.number="settings.lobby"
                  :state="fieldState('lobby')"
                  value="1">
                  {{ $t('app.enabled') }}
                </b-form-radio>
                <b-form-radio
                  :disabled="disabled"
                  name="setting-lobby"
                  v-model.number="settings.lobby"
                  :state="fieldState('lobby')"
                  value="2">
                  {{ $t('rooms.settings.participants.waiting_room.only_for_guests_enabled') }}
                </b-form-radio>
                <template slot='invalid-feedback'><div v-html="fieldError('lobby')"></div></template>
              </b-form-group>

              <!-- Alert shown when default role is moderator and waiting room is active -->
              <b-alert ref="waiting-room-alert" show v-if="showLobbyAlert" variant="warning">
                {{ $t('rooms.settings.participants.waiting_room_alert') }}
              </b-alert>

            <!-- Checkbox record attendance of users and guests -->
            <b-form-group :state="fieldState('record_attendance')" v-if="getGlobalSetting('attendance.enabled')">
              <b-form-checkbox
                :disabled="disabled"
                :state="fieldState('record_attendance')"
                v-model="settings.record_attendance"
                switch
              >
                {{ $t('rooms.settings.participants.record_attendance') }}
              </b-form-checkbox>
              <template slot='invalid-feedback'><div v-html="fieldError('record_attendance')"></div></template>
            </b-form-group>
          </b-col>

          <!-- Permissions & Restrictions tab -->
          <b-col lg="3" md="6" cols="12">
            <h5>{{ $t('rooms.settings.permissions.title') }}</h5>
            <!-- Everyone can start a new meeting, not only the moderator -->
            <b-form-checkbox
              :disabled="disabled"
              :state="fieldState('everyone_can_start')"
              v-model="settings.everyone_can_start"
              switch
            >
              {{ $t('rooms.settings.permissions.everyone_start') }}
            </b-form-checkbox>
            <b-form-invalid-feedback :state="fieldState('everyone_can_start')" v-html="fieldError('everyone_can_start')"></b-form-invalid-feedback>
            <!-- Mute everyones microphone on meeting join -->
            <b-form-checkbox
              :disabled="disabled"
              :state="fieldState('mute_on_start')"
              v-model="settings.mute_on_start"
              switch
            >
              {{ $t('rooms.settings.permissions.mute_mic') }}
            </b-form-checkbox>
            <b-form-invalid-feedback :state="fieldState('mute_on_start')" v-html="fieldError('mute_on_start')"></b-form-invalid-feedback>
            <hr>
            <h5>{{ $t('rooms.settings.restrictions.title') }}</h5>
            <!-- Enable the restrictions, otherwise just send the settings, can be activated during the meeting -->
            <b-form-checkbox
              :disabled="disabled"
              :state="fieldState('lock_settings_lock_on_join')"
              v-model="settings.lock_settings_lock_on_join"
              switch
            >
              {{ $t('rooms.settings.restrictions.enabled') }}
            </b-form-checkbox>
            <b-form-invalid-feedback :state="fieldState('Y')" v-html="fieldError('lock_settings_lock_on_join')"></b-form-invalid-feedback>
            <!-- Disable the ability to use the webcam for non moderator-uses, can be changed during the meeting -->
            <b-form-checkbox
              :disabled="disabled"
              :state="fieldState('lock_settings_disable_cam')"
              v-model="settings.lock_settings_disable_cam"
              switch
            >
              {{ $t('rooms.settings.restrictions.disable_cam') }}
            </b-form-checkbox>
            <b-form-invalid-feedback :state="fieldState('lock_settings_disable_cam')" v-html="fieldError('lock_settings_disable_cam')"></b-form-invalid-feedback>
            <!--
            Disable the ability to see the webcam of non moderator-uses,
            moderators can see all webcams,
            can be changed during the meeting
            -->
            <b-form-checkbox
              :disabled="disabled"
              :state="fieldState('webcams_only_for_moderator')"
              v-model="settings.webcams_only_for_moderator"
              switch
            >
              {{ $t('rooms.settings.restrictions.only_mod_see_cam') }}
            </b-form-checkbox>
            <b-form-invalid-feedback :state="fieldState('webcams_only_for_moderator')" v-html="fieldError('webcams_only_for_moderator')"></b-form-invalid-feedback>
            <!-- Disable the ability to use the microphone for non moderator-uses, can be changed during the meeting -->
            <b-form-checkbox
              :disabled="disabled"
              :state="fieldState('lock_settings_disable_mic')"
              v-model="settings.lock_settings_disable_mic"
              switch
            >
              {{ $t('rooms.settings.restrictions.disable_mic') }}
            </b-form-checkbox>
            <b-form-invalid-feedback :state="fieldState('lock_settings_disable_mic')" v-html="fieldError('Y')"></b-form-invalid-feedback>
            <!-- Disable the ability to send messages via the public chat for non moderator-uses, can be changed during the meeting -->
            <b-form-checkbox
              :disabled="disabled"
              :state="fieldState('lock_settings_disable_public_chat')"
              v-model="settings.lock_settings_disable_public_chat"
              switch
            >
              {{ $t('rooms.settings.restrictions.disable_public_chat') }}
            </b-form-checkbox>
            <b-form-invalid-feedback :state="fieldState('lock_settings_disable_public_chat')" v-html="fieldError('lock_settings_disable_public_chat')"></b-form-invalid-feedback>
            <!--
            Disable the ability to send messages via the private chat for non moderator-uses,
            private chats with the moderators is still possible
            can be changed during the meeting
            -->
            <b-form-checkbox
              :disabled="disabled"
              :state="fieldState('lock_settings_disable_private_chat')"
              v-model="settings.lock_settings_disable_private_chat"
              switch
            >
              {{ $t('rooms.settings.restrictions.disable_private_chat') }}
            </b-form-checkbox>
            <b-form-invalid-feedback :state="fieldState('Y')" v-html="fieldError('lock_settings_disable_private_chat')"></b-form-invalid-feedback>
            <!-- Disable the ability to edit the notes for non moderator-uses, can be changed during the meeting -->
            <b-form-checkbox
              :disabled="disabled"
              :state="fieldState('lock_settings_disable_note')"
              v-model="settings.lock_settings_disable_note"
              switch
            >
              {{ $t('rooms.settings.restrictions.disable_note_edit') }}
            </b-form-checkbox>
            <b-form-invalid-feedback :state="fieldState('lock_settings_disable_note')" v-html="fieldError('lock_settings_disable_note')"></b-form-invalid-feedback>
            <!-- Disable the ability to see a list of all participants for non moderator-uses, can be changed during the meeting -->
            <b-form-checkbox
              :disabled="disabled"
              :state="fieldState('lock_settings_hide_user_list')"
              v-model="settings.lock_settings_hide_user_list"
              switch
            >
              {{ $t('rooms.settings.restrictions.hide_participants_list') }}
            </b-form-checkbox>
            <b-form-invalid-feedback :state="fieldState('lock_settings_hide_user_list')" v-html="fieldError('lock_settings_hide_user_list')"></b-form-invalid-feedback>
          </b-col>
        </b-row>
        <hr>
        <b-row class='mt-1 mb-3 float-right'>
          <b-col sm='12'>
            <b-button
              :disabled='disabled || roomTypeSelectBusy || roomTypeSelectLoadingError'
              variant='success'
              type='submit'
              >
              <i class='fa-solid fa-save'></i> {{ $t('app.save') }}
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
import RoomTypeSelect from '../Inputs/RoomTypeSelect.vue';
import _ from 'lodash';
import PermissionService from '../../services/PermissionService';
import { mapState } from 'pinia';
import { useSettingsStore } from '../../stores/settings';

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

      const newSettings = _.clone(this.settings);
      newSettings.room_type = newSettings.room_type ? newSettings.room_type.id : null;

      // Send new settings to the server
      Base.call('rooms/' + this.room.id, {
        method: 'put',
        data: newSettings
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
          if (error.response.data.errors.room_type !== undefined) {
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

    ...mapState(useSettingsStore, {
      getGlobalSetting: 'getSetting'
    }),

    /**
     * Input fields are disabled: due to limited permissions, loading of settings or errors
     */
    disabled () {
      return PermissionService.cannot('manageSettings', this.room) || this.isBusy || this.modelLoadingError;
    },

    /**
     * Count the chars of the welcome message
     * @returns {string} amount of chars in comparision to the limit
     */
    charactersLeftWelcomeMessage () {
      const char = this.settings.welcome
        ? this.settings.welcome.length
        : 0;
      return char + ' / ' + this.getGlobalSetting('bbb.welcome_message_limit');
    },

    /**
     * Show alert if simulatinously default role is moderator and waiting room is active
     */
    showLobbyAlert () {
      return this.settings.default_role === 2 && this.settings.lobby === 1;
    }
  },
  created () {
    this.load();
  }
};
</script>
<style scoped></style>

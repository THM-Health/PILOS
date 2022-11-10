<template>
  <div>
    <h3>
      {{ id === 'new' ? $t('settings.servers.new') : (
        viewOnly ? $t('settings.servers.view', { name : model.name })
          : $t('settings.servers.edit', { name: model.name })
      ) }}
    </h3>
    <hr>

    <b-overlay :show="isBusy || modelLoadingError">
      <template #overlay>
        <div class="text-center">
          <b-spinner v-if="isBusy" ></b-spinner>
          <b-button
            v-else
            ref="reloadServer"
            @click="load()"
          >
            <i class="fa-solid fa-sync"></i> {{ $t('app.reload') }}
          </b-button>
        </div>
      </template>

      <b-form @submit='saveServer' :aria-hidden="modelLoadingError">
        <b-container fluid>
          <b-form-group
            label-cols-sm='4'
            :label="$t('app.model_name')"
            label-for='name'
            :state='fieldState("name")'
          >
            <b-form-input id='name' type='text' v-model='model.name' :state='fieldState("name")' :disabled='isBusy || modelLoadingError || viewOnly'></b-form-input>
            <template slot='invalid-feedback'><div v-html="fieldError('name')"></div></template>
          </b-form-group>
          <b-form-group
            label-cols-sm='4'
            :label="$t('app.description')"
            label-for='description'
            :state='fieldState("description")'
          >
            <b-form-input id='description' type='text' v-model='model.description' :state='fieldState("description")' :disabled='isBusy || modelLoadingError || viewOnly'></b-form-input>
            <template slot='invalid-feedback'><div v-html="fieldError('description')"></div></template>
          </b-form-group>
          <b-form-group
            label-cols-sm='4'
            :label="$t('settings.servers.version')"
            label-for='version'
          >
            <b-form-input id='version' type='text' :value='model.version || "---"' :disabled='true'></b-form-input>
          </b-form-group>
          <b-form-group
            label-cols-sm='4'
            :label="$t('settings.servers.baseUrl')"
            label-for='base_url'
            :state='fieldState("base_url")'
          >
            <b-form-input id='base_url' type='text' v-model='model.base_url' :state='fieldState("base_url")' :disabled='isBusy || modelLoadingError || viewOnly'></b-form-input>
            <template slot='invalid-feedback'><div v-html="fieldError('base_url')"></div></template>
          </b-form-group>
          <b-form-group
            label-cols-sm='4'
            :label="$t('settings.servers.salt')"
            label-for='salt'
            :state='fieldState("salt")'
          >
            <b-input-group>
              <b-form-input id='salt' :type='hideSalt ? "password": "text"' v-model='model.salt' :state='fieldState("salt")' :disabled='isBusy || modelLoadingError || viewOnly'></b-form-input>
              <b-input-group-append>
                <b-button @click="hideSalt = !hideSalt" :disabled='isBusy || modelLoadingError' v-tooltip-hide-click v-b-tooltip.hover :title="hideSalt ? $t('settings.servers.showSalt') : $t('settings.servers.hideSalt')" variant="secondary"><i class="fa-solid fa-eye" v-if="hideSalt"></i><i class="fa-solid fa-eye-slash" v-else></i></b-button>
              </b-input-group-append>
            </b-input-group>
            <template slot='invalid-feedback'><div v-html="fieldError('salt')"></div></template>
          </b-form-group>
          <b-form-group
            :description="$t('settings.servers.strengthDescription')"
            label-cols-sm='4'
            :label="$t('settings.servers.strength')"
            label-for='strength'
            :state='fieldState("strength")'
          >
            <b-form-rating id='strength' stars="10" v-model='model.strength' :state='fieldState("strength")' :disabled='isBusy || modelLoadingError || viewOnly'>
            </b-form-rating>
            <template slot='invalid-feedback'><div v-html="fieldError('strength')"></div></template>
          </b-form-group>

          <b-form-group
            label-cols-sm='4'
            :label="$t('settings.servers.disabled')"
            label-for='disabled'
            :state='fieldState("disabled")'
            :description="$t('settings.servers.disabledDescription')"
          >
            <b-form-checkbox id="disabled" v-model="model.disabled" name="check-button" switch  class="align-items-center d-flex mb-3"  :disabled='isBusy || modelLoadingError || viewOnly'>
            </b-form-checkbox>
            <template slot='invalid-feedback'><div v-html="fieldError('disabled')"></div></template>
          </b-form-group>

          <b-form-group
            label-cols-sm='4'
            :label="$t('settings.servers.status')"
            label-for='onlineStatus'
          >
            <b-input-group>
              <b-form-input type='text' v-model='onlineStatus' id="onlineStatus" :disabled='true'></b-form-input>
              <b-input-group-append>
                <b-button :disabled='isBusy || modelLoadingError || checking'
                          variant='info'
                          @click="testConnection()"><i class="fa-solid fa-link"></i> {{ $t('settings.servers.testConnection') }}</b-button>
              </b-input-group-append>
            </b-input-group>
            <b-form-text v-if="offlineReason"> {{ $t('settings.servers.offlineReason.'+offlineReason) }}</b-form-text>
          </b-form-group>
          <hr>
          <b-row class='my-1'>
            <b-col sm='12'>
              <b-button
                :disabled='isBusy || modelLoadingError'
                variant='success'
                type='submit'
                class='ml-1 float-right'
                v-if='!viewOnly'>
                <i class='fa-solid fa-save'></i> {{ $t('app.save') }}
              </b-button>
              <b-button
                class="float-right"
                :disabled='isBusy'
                variant='secondary'
                @click="$router.push({ name: 'settings.servers' })">
                <i class='fa-solid fa-arrow-left'></i> {{ $t('app.back') }}
              </b-button>

            </b-col>
          </b-row>

        </b-container>

      </b-form>
      <b-container ref="currentUsage" fluid class="mt-5" v-if="!modelLoadingError && viewOnly && !model.disabled && model.id!==null">
        <b-row class='my-1'>
          <b-col sm='12'>
            <h4>{{ $t('settings.servers.currentUsage')}}
            </h4>
            <hr>
          </b-col>
        </b-row>

        <b-form-group
          label-cols-sm='4'
          :label="$t('settings.servers.meetingCount')"
          label-for='meetingCount'
          :description="$t('settings.servers.meetingDescription')"
        >
          <b-form-input id='meetingCount' type='text' v-model='model.meeting_count' :disabled='true'></b-form-input>
        </b-form-group>
        <b-form-group
          label-cols-sm='4'
          :label="$t('settings.servers.ownMeetingCount')"
          label-for='ownMeetingCount'
          :description="$t('settings.servers.ownMeetingDescription')"
        >
          <b-form-input id='ownMeetingCount' type='text' v-model='model.own_meeting_count' :disabled='true'></b-form-input>
        </b-form-group>
        <b-form-group
          label-cols-sm='4'
          :label="$t('settings.servers.participantCount')"
          label-for='participantCount'
        >
          <b-form-input id='participantCount' type='text' v-model='model.participant_count' :disabled='true'></b-form-input>
        </b-form-group>
        <b-form-group
          label-cols-sm='4'
          :label="$t('settings.servers.videoCount')"
          label-for='videoCount'
        >
          <b-form-input id='videoCount' type='text' v-model='model.video_count' :disabled='true'></b-form-input>
        </b-form-group>

        <can method='update' :policy='model'>
        <b-form-group
          label-cols-sm='4'
          :label="$t('settings.servers.panic')"
          label-for='panic'
          :description="$t('settings.servers.panicDescription')"
        >
          <b-button :disabled='isBusy || modelLoadingError || checking || panicking'
                    id="panic"
                    variant='danger'
                    @click="panic()"><i class="fa-solid fa-exclamation-triangle"></i> {{ $t('settings.servers.panicServer') }}</b-button>
        </b-form-group>
        </can>

      </b-container>

      <b-modal
        :static='modalStatic'
        :busy='isBusy'
        ok-variant='danger'
        cancel-variant='secondary'
        @ok='forceOverwrite'
        @cancel='refreshServer'
        :hide-header-close='true'
        :no-close-on-backdrop='true'
        :no-close-on-esc='true'
        ref='stale-server-modal'
        :hide-header='true'>
        <template v-slot:default>
          <h5>{{ staleError.message }}</h5>
        </template>
        <template v-slot:modal-ok>
          <b-spinner small v-if="isBusy"></b-spinner>  {{ $t('app.overwrite') }}
        </template>
        <template v-slot:modal-cancel>
          <b-spinner small v-if="isBusy"></b-spinner>  {{ $t('app.reload') }}
        </template>
      </b-modal>
    </b-overlay>
  </div>
</template>

<script>
import Base from '../../../api/base';
import FieldErrors from '../../../mixins/FieldErrors';
import env from '../../../env';
import Can from '../../../components/Permissions/Can';

export default {
  components: { Can },
  mixins: [FieldErrors],
  props: {
    id: {
      type: [String, Number],
      required: true
    },

    viewOnly: {
      type: Boolean,
      required: true
    },

    modalStatic: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    /**
     * Provides the translation for the connection status
     */
    onlineStatus () {
      switch (this.online) {
        case 0: return this.$t('settings.servers.offline');
        case 1: return this.$t('settings.servers.online');
        default: return this.$t('settings.servers.unknown');
      }
    }
  },

  data () {
    return {
      model: {
        id: null,
        disabled: false
      },
      hideSalt: true,
      errors: {},
      staleError: {},
      isBusy: false,
      modelLoadingError: false,
      checking: false,
      panicking: false,
      online: 0,
      offlineReason: null
    };
  },

  /**
   * Loads the server from the backend
   */
  mounted () {
    this.load();
  },

  methods: {

    panic () {
      this.panicking = true;

      Base.call(`servers/${this.id}/panic`).then(response => {
        if (response.status === 200) {
          this.flashMessage.success(this.$t('settings.servers.panic.flash.title'), this.$t('settings.servers.panic.flash.description', { total: response.data.total, success: response.data.success }));
          this.load();
        }
      }).catch(error => {
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        this.panicking = false;
      });
    },

    /**
     * Check if the backend can establish a connection with the passed api details to a bigbluebutton server
     * Based on the result the online status field is updated
     */
    testConnection () {
      this.checking = true;

      const config = {
        method: 'post',
        data: {
          base_url: this.model.base_url,
          salt: this.model.salt
        }
      };

      Base.call('servers/check', config).then(response => {
        if (response.data.connection_ok && response.data.salt_ok) {
          this.online = 1;
          this.offlineReason = null;
        } else {
          if (response.data.connection_ok && !response.data.salt_ok) {
            this.online = 0;
            this.offlineReason = 'salt';
          } else {
            this.online = 0;
            this.offlineReason = 'connection';
          }
        }
      }).catch(error => {
        this.online = null;
        this.offlineReason = null;
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        this.checking = false;
      });
    },

    /**
     * Loads the servers from the backend
     */
    load () {
      this.modelLoadingError = false;

      if (this.id !== 'new') {
        this.isBusy = true;

        Base.call(`servers/${this.id}`).then(response => {
          this.model = response.data.data;
          this.$set(this.model, 'disabled', this.model.status === -1);
          this.online = this.model.status === -1 ? null : this.model.status;
          this.offlineReason = null;
        }).catch(error => {
          if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
            this.$router.push({ name: 'settings.servers' });
          } else {
            this.modelLoadingError = true;
          }
          Base.error(error, this.$root, error.message);
        }).finally(() => {
          this.isBusy = false;
        });
      }
    },

    /**
     * Saves the changes of the server to the database by making a api call.
     *
     * @param evt
     */
    saveServer (evt) {
      if (evt) {
        evt.preventDefault();
      }

      this.isBusy = true;

      const config = {
        method: this.id === 'new' ? 'post' : 'put',
        data: this.model
      };

      Base.call(this.id === 'new' ? 'servers' : `servers/${this.id}`, config).then(() => {
        this.$router.push({ name: 'settings.servers' });
      }).catch(error => {
        if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          this.errors = error.response.data.errors;
        } else if (error.response && error.response.status === env.HTTP_STALE_MODEL) {
          this.staleError = error.response.data;
          this.$refs['stale-server-modal'].show();
        } else {
          if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
            this.$router.push({ name: 'settings.servers' });
          }

          Base.error(error, this.$root, error.message);
        }
      }).finally(() => {
        this.isBusy = false;
      });
    },

    /**
     * Force a overwrite of the server in the database by setting the `updated_at` field to the new one.
     */
    forceOverwrite () {
      this.model.updated_at = this.staleError.new_model.updated_at;
      this.staleError = {};
      this.$refs['stale-server-modal'].hide();
      this.saveServer();
    },

    /**
     * Refreshes the current model with the new passed from the stale error response.
     */
    refreshServer () {
      this.model = this.staleError.new_model;
      this.$set(this.model, 'disabled', this.model.status === -1);
      this.online = this.model.status === -1 ? null : this.model.status;
      this.offlineReason = null;
      this.staleError = {};
      this.$refs['stale-server-modal'].hide();
    }
  }
};
</script>

<style scoped>

</style>

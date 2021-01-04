<template>
  <div>
    <h3>
      {{ id === 'new' ? $t('settings.servers.new') : (
        viewOnly ? $t('settings.servers.view', { id : model.id })
          : $t('settings.servers.edit', { id: model.id })
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
            <b-icon-arrow-clockwise></b-icon-arrow-clockwise> {{ $t('app.reload') }}
          </b-button>
        </div>
      </template>

      <b-form @submit='saveServer' :aria-hidden="modelLoadingError">
        <b-container fluid>
          <b-form-group
            label-cols-sm='4'
            :label="$t('settings.servers.description')"
            label-for='description'
            :state='fieldState("description")'
          >
            <b-form-input id='description' type='text' v-model='model.description' :state='fieldState("description")' :disabled='isBusy || modelLoadingError || viewOnly'></b-form-input>
            <template slot='invalid-feedback'><div v-html="fieldError('description')"></div></template>
          </b-form-group>
          <b-form-group
            label-cols-sm='4'
            :label="$t('settings.servers.base_url')"
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
              <b-form-input id='salt' :type='hideSalt ? "password": "text"' v-model='model.salt' :state='fieldState("description")' :disabled='isBusy || modelLoadingError || viewOnly'></b-form-input>
              <b-input-group-append>
                <b-button @click="hideSalt = !hideSalt" :disabled='isBusy || modelLoadingError' v-b-tooltip.hover :title="hideSalt ? $t('settings.servers.showSalt') : $t('settings.servers.hideSalt')" variant="success"><b-icon-eye-fill v-if="hideSalt"></b-icon-eye-fill><b-icon-eye-slash-fill v-else></b-icon-eye-slash-fill></b-button>
              </b-input-group-append>
            </b-input-group>
            <template slot='invalid-feedback'><div v-html="fieldError('salt')"></div></template>
          </b-form-group>
          <b-form-group
            :description="$t('settings.servers.strength_description')"
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
          >
            <b-form-checkbox id="disabled" v-model="model.disabled" name="check-button" switch  class="align-items-center d-flex"  :disabled='isBusy || modelLoadingError || viewOnly'>
            </b-form-checkbox>
            <template slot='invalid-feedback'><div v-html="fieldError('disabled')"></div></template>
          </b-form-group>

          <b-form-group
            label-cols-sm='4'
            :label="$t('settings.servers.status')"
            label-for='status'
          >
            <b-input-group>
              <b-form-input type='text' v-model='onlineStatus' id="onlineStatus" :disabled='true'></b-form-input>
              <b-input-group-append>
                <b-button :disabled='isBusy || modelLoadingError || checking'
                          variant='primary'
                          @click="testConnection()"><i class="fas fa-link"></i> {{ $t('settings.servers.test_connection') }}</b-button>
              </b-input-group-append>
            </b-input-group>
            <b-form-text v-if="offlineReason"> {{ $t('settings.servers.offlineReason.'+offlineReason) }}</b-form-text>
          </b-form-group>
          <hr>
          <b-row class='my-1 float-right'>
            <b-col sm='12'>
              <b-button
                :disabled='isBusy'
                variant='secondary'
                @click="$router.push({ name: 'settings.servers' })">
                <i class='fas fa-arrow-left'></i> {{ $t('app.back') }}
              </b-button>
              <b-button
                :disabled='isBusy || modelLoadingError'
                variant='success'
                type='submit'
                class='ml-1'
                v-if='!viewOnly'>
                <i class='fas fa-save'></i> {{ $t('app.save') }}
              </b-button>
            </b-col>
          </b-row>

        </b-container>

      </b-form>

      <b-modal
        :static='modalStatic'
        :busy='isBusy'
        ok-variant='danger'
        cancel-variant='dark'
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

export default {
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
          this.model.disabled = this.model.status === -1;
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
      this.model.disabled = this.model.status === -1;
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

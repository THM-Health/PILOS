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
          <b-spinner v-if="isBusy" />
          <b-button
            v-else
            ref="reloadServer"
            @click="load()"
          >
            <i class="fa-solid fa-sync" /> {{ $t('app.reload') }}
          </b-button>
        </div>
      </template>

      <b-form
        :aria-hidden="modelLoadingError"
        @submit="saveServer"
      >
        <b-container fluid>
          <b-form-group
            label-cols-sm="4"
            :label="$t('app.model_name')"
            label-for="name"
            :state="fieldState('name')"
          >
            <b-form-input
              id="name"
              v-model="model.name"
              type="text"
              :state="fieldState('name')"
              :disabled="isBusy || modelLoadingError || viewOnly"
            />
            <template #invalid-feedback>
              <div v-html="fieldError('name')" />
            </template>
          </b-form-group>
          <b-form-group
            label-cols-sm="4"
            :label="$t('app.description')"
            label-for="description"
            :state="fieldState('description')"
          >
            <b-form-input
              id="description"
              v-model="model.description"
              type="text"
              :state="fieldState('description')"
              :disabled="isBusy || modelLoadingError || viewOnly"
            />
            <template #invalid-feedback>
              <div v-html="fieldError('description')" />
            </template>
          </b-form-group>
          <b-form-group
            label-cols-sm="4"
            :label="$t('settings.servers.version')"
            label-for="version"
          >
            <b-form-input
              id="version"
              type="text"
              :value="model.version || '---'"
              :disabled="true"
            />
          </b-form-group>
          <b-form-group
            label-cols-sm="4"
            :label="$t('settings.servers.base_url')"
            label-for="base_url"
            :state="fieldState('base_url')"
          >
            <b-form-input
              id="base_url"
              v-model="model.base_url"
              type="text"
              :state="fieldState('base_url')"
              :disabled="isBusy || modelLoadingError || viewOnly"
            />
            <template #invalid-feedback>
              <div v-html="fieldError('base_url')" />
            </template>
          </b-form-group>
          <b-form-group
            label-cols-sm="4"
            :label="$t('settings.servers.secret')"
            label-for="secret"
            :state="fieldState('secret')"
          >
            <b-input-group>
              <b-form-input
                id="secret"
                v-model="model.secret"
                :type="hideSecret ? 'password': 'text'"
                :state="fieldState('secret')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
              <b-input-group-append>
                <b-button
                  v-b-tooltip.hover
                  :disabled="isBusy || modelLoadingError"
                  :title="hideSecret ? $t('settings.servers.show_secret') : $t('settings.servers.hide_secret')"
                  variant="secondary"
                  @click="hideSecret = !hideSecret"
                >
                  <i
                    v-if="hideSecret"
                    class="fa-solid fa-eye"
                  /><i
                    v-else
                    class="fa-solid fa-eye-slash"
                  />
                </b-button>
              </b-input-group-append>
            </b-input-group>
            <template #invalid-feedback>
              <div v-html="fieldError('secret')" />
            </template>
          </b-form-group>
          <b-form-group
            :description="$t('settings.servers.strength_description')"
            label-cols-sm="4"
            :label="$t('settings.servers.strength')"
            label-for="strength"
            :state="fieldState('strength')"
          >
            <b-form-rating
              id="strength"
              v-model="model.strength"
              stars="10"
              :state="fieldState('strength')"
              :disabled="isBusy || modelLoadingError || viewOnly"
            />
            <template #invalid-feedback>
              <div v-html="fieldError('strength')" />
            </template>
          </b-form-group>

          <b-form-group
            label-cols-sm="4"
            :label="$t('settings.servers.disabled')"
            label-for="disabled"
            :state="fieldState('disabled')"
            :description="$t('settings.servers.disabled_description')"
          >
            <b-form-checkbox
              id="disabled"
              v-model="model.disabled"
              name="check-button"
              switch
              class="align-items-center d-flex mb-3"
              :disabled="isBusy || modelLoadingError || viewOnly"
            />
            <template #invalid-feedback>
              <div v-html="fieldError('disabled')" />
            </template>
          </b-form-group>

          <b-form-group
            label-cols-sm="4"
            :label="$t('settings.servers.status')"
            label-for="onlineStatus"
          >
            <b-input-group>
              <b-form-input
                id="onlineStatus"
                v-model="onlineStatus"
                type="text"
                :disabled="true"
              />
              <b-input-group-append>
                <b-button
                  :disabled="isBusy || modelLoadingError || checking"
                  variant="info"
                  @click="testConnection()"
                >
                  <i class="fa-solid fa-link" /> {{ $t('settings.servers.test_connection') }}
                </b-button>
              </b-input-group-append>
            </b-input-group>
            <b-form-text v-if="offlineReason">
              {{ $t('settings.servers.offline_reason.'+offlineReason) }}
            </b-form-text>
          </b-form-group>
          <hr>
          <b-row class="my-1">
            <b-col sm="12">
              <b-button
                v-if="!viewOnly"
                :disabled="isBusy || modelLoadingError"
                variant="success"
                type="submit"
                class="ml-1 float-right"
              >
                <i class="fa-solid fa-save" /> {{ $t('app.save') }}
              </b-button>
              <b-button
                class="float-right"
                :disabled="isBusy"
                variant="secondary"
                @click="$router.push({ name: 'settings.servers' })"
              >
                <i class="fa-solid fa-arrow-left" /> {{ $t('app.back') }}
              </b-button>
            </b-col>
          </b-row>
        </b-container>
      </b-form>
      <b-container
        v-if="!modelLoadingError && viewOnly && !model.disabled && model.id!==null"
        ref="currentUsage"
        fluid
        class="mt-5"
      >
        <b-row class="my-1">
          <b-col sm="12">
            <h4>
              {{ $t('settings.servers.current_usage') }}
            </h4>
            <hr>
          </b-col>
        </b-row>

        <b-form-group
          label-cols-sm="4"
          :label="$t('settings.servers.meeting_count')"
          label-for="meetingCount"
          :description="$t('settings.servers.meeting_description')"
        >
          <b-form-input
            id="meetingCount"
            v-model="model.meeting_count"
            type="text"
            :disabled="true"
          />
        </b-form-group>
        <b-form-group
          label-cols-sm="4"
          :label="$t('settings.servers.own_meeting_count')"
          label-for="ownMeetingCount"
          :description="$t('settings.servers.own_meeting_description')"
        >
          <b-form-input
            id="ownMeetingCount"
            v-model="model.own_meeting_count"
            type="text"
            :disabled="true"
          />
        </b-form-group>
        <b-form-group
          label-cols-sm="4"
          :label="$t('settings.servers.participant_count')"
          label-for="participantCount"
        >
          <b-form-input
            id="participantCount"
            v-model="model.participant_count"
            type="text"
            :disabled="true"
          />
        </b-form-group>
        <b-form-group
          label-cols-sm="4"
          :label="$t('settings.servers.video_count')"
          label-for="videoCount"
        >
          <b-form-input
            id="videoCount"
            v-model="model.video_count"
            type="text"
            :disabled="true"
          />
        </b-form-group>

        <can
          method="update"
          :policy="model"
        >
          <b-form-group
            label-cols-sm="4"
            :label="$t('settings.servers.panic')"
            label-for="panic"
            :description="$t('settings.servers.panic_description')"
          >
            <b-button
              id="panic"
              :disabled="isBusy || modelLoadingError || checking || panicking"
              variant="danger"
              @click="panic()"
            >
              <i class="fa-solid fa-exclamation-triangle" /> {{ $t('settings.servers.panic_server') }}
            </b-button>
          </b-form-group>
        </can>
      </b-container>

      <b-modal
        ref="stale-server-modal"
        :static="modalStatic"
        :busy="isBusy"
        ok-variant="danger"
        cancel-variant="secondary"
        :hide-header-close="true"
        :no-close-on-backdrop="true"
        :no-close-on-esc="true"
        :hide-header="true"
        @ok="forceOverwrite"
        @cancel="refreshServer"
      >
        <template #default>
          <h5>{{ staleError.message }}</h5>
        </template>
        <template #modal-ok>
          <b-spinner
            v-if="isBusy"
            small
          />  {{ $t('app.overwrite') }}
        </template>
        <template #modal-cancel>
          <b-spinner
            v-if="isBusy"
            small
          />  {{ $t('app.reload') }}
        </template>
      </b-modal>
    </b-overlay>
  </div>
</template>

<script>
import Base from '@/api/base';
import FieldErrors from '@/mixins/FieldErrors';
import env from '@/env';
import Can from '@/components/Permissions/Can.vue';

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

  data () {
    return {
      model: {
        id: null,
        disabled: false
      },
      hideSecret: true,
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
          this.toastSuccess(this.$t('settings.servers.flash.panic.description', { total: response.data.total, success: response.data.success }), this.$t('settings.servers.flash.panic.title'));
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
          secret: this.model.secret
        }
      };

      Base.call('servers/check', config).then(response => {
        if (response.data.connection_ok && response.data.secret_ok) {
          this.online = 1;
          this.offlineReason = null;
        } else {
          if (response.data.connection_ok && !response.data.secret_ok) {
            this.online = 0;
            this.offlineReason = 'secret';
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

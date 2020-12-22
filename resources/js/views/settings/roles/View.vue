<template>
  <div>
    <h3>
      {{ id === 'new' ? $t('settings.roles.new') : (
        viewOnly ? $t('settings.roles.view', { name: $te(`app.roles.${model.name}`) ? $t(`app.roles.${model.name}`) : model.name })
          : $t('settings.roles.edit', { name: $te(`app.roles.${model.name}`) ? $t(`app.roles.${model.name}`) : model.name })
      ) }}
    </h3>
    <hr>

    <b-overlay :show="isBusy || modelLoadingError">
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

      <b-form @submit='saveRole' :aria-hidden="modelLoadingError">
        <b-container fluid>
          <b-form-group
            label-cols-sm='4'
            :label="$t('settings.roles.name')"
            label-for='name'
            :state='fieldState("name")'
          >
            <b-form-input id='name' type='text' v-model='model.name' :state='fieldState("name")' :disabled='isBusy || modelLoadingError || viewOnly'></b-form-input>
            <template slot='invalid-feedback'><div v-html="fieldError('name')"></div></template>
          </b-form-group>

          <b-modal id="modal-help-roomlimit" :hide-footer="true">
            <template v-slot:modal-title>
              <b-icon-info-circle></b-icon-info-circle> {{ $t('settings.roles.roomLimit.helpModal.title') }}
            </template>
            <p>{{ $t('settings.roles.roomLimit.helpModal.info') }}</p>

            <strong>{{ $t('settings.roles.roomLimit.helpModal.examples') }}</strong>
            <table class="table">
              <thead>
              <tr>
                <th scope="col">{{ $t('settings.roles.roomLimit.helpModal.systemDefault') }}</th>
                <th scope="col">{{ $t('settings.roles.roomLimit.helpModal.roleA') }}</th>
                <th scope="col">{{ $t('settings.roles.roomLimit.helpModal.roleB') }}</th>
                <th scope="col">{{ $t('settings.roles.roomLimit.helpModal.maxAmount') }}</th>
              </tr>
              </thead>
              <tbody>
              <tr>
                <td><raw-text>5</raw-text></td>
                <td><raw-text>X</raw-text></td>
                <td><raw-text>X</raw-text></td>
                <td><raw-text>5</raw-text></td>
              </tr>
              <tr>
                <td><raw-text>1</raw-text></td>
                <td><raw-text>5</raw-text></td>
                <td><raw-text>X</raw-text></td>
                <td><raw-text>5</raw-text></td>
              </tr>
              <tr>
                <td><raw-text>5</raw-text></td>
                <td><raw-text>1</raw-text></td>
                <td><raw-text>X</raw-text></td>
                <td><raw-text>1</raw-text></td>
              </tr>
              <tr>
                <td><raw-text>5</raw-text></td>
                <td><raw-text>1</raw-text></td>
                <td><raw-text>2</raw-text></td>
                <td><raw-text>2</raw-text></td>
              </tr>
              <tr>
                <td><raw-text>5</raw-text></td>
                <td>{{ $t('settings.roles.roomLimit.helpModal.systemDefault') }}</td>
                <td><raw-text>2</raw-text></td>
                <td><raw-text>5</raw-text></td>
              </tr>
              <tr>
                <td><raw-text>5</raw-text></td>
                <td>{{ $t('settings.roles.roomLimit.helpModal.systemDefault') }}</td>
                <td><raw-text>10</raw-text></td>
                <td><raw-text>10</raw-text></td>
              </tr>
              <tr>
                <td><raw-text>5</raw-text></td>
                <td>{{ $t('settings.roles.roomLimit.unlimited') }}</td>
                <td><raw-text>2</raw-text></td>
                <td>{{ $t('settings.roles.roomLimit.unlimited') }}</td>
              </tr>
              </tbody>
            </table>
            <p>{{ $t('settings.roles.roomLimit.helpModal.note') }}</p>
          </b-modal>

          <b-form-group
            label-cols-sm='4'
            label-for='room-limit'
            :state='fieldState("room_limit")'
          >
            <template slot='label'>{{ $t('settings.roles.roomLimit.label') }}  <b-button variant="link" class="text-dark" :disabled="isBusy || modelLoadingError" v-b-modal.modal-help-roomlimit><b-icon-info-circle></b-icon-info-circle></b-button></template>
            <b-form-radio-group
              class='mb-2'
              v-model='roomLimitMode'
              :options='roomLimitModeOptions'
              :disabled='isBusy || modelLoadingError || viewOnly'
              :state='fieldState("room_limit")'
              @change="roomLimitModeChanged"
              stacked
            ></b-form-radio-group>
            <b-form-input
              id='room-limit'
              type='number'
              :state='fieldState("room_limit")'
              v-model='model.room_limit'
              min='0'
              :disabled='isBusy || modelLoadingError || viewOnly'
              v-if="roomLimitMode === 'custom'">
            </b-form-input>
            <template slot='invalid-feedback'><div v-html="fieldError('room_limit')"></div></template>
          </b-form-group>
          <b-form-group
            :label="$t('settings.roles.permissions')"
            label-size='lg'
            label-class='font-weight-bold pt-0'
            :state="Object.keys(errors).some(error => error === 'permissions' || error.startsWith('permissions.')) ? false : null"
          >
            <div class='row' v-if='!isBusy && Object.keys(permissions).length > 0'>
              <b-form-group
                class='col-lg-4 col-sm-12'
                v-for="key in Object.keys(permissions)"
                :key='key'
              >
                <template v-slot:label>
                  <b>{{ $t(`app.permissions.${key}.title`) }}</b>
                </template>

                <b-form-checkbox-group
                  v-model='model.permissions'
                  stacked
                  :disabled='isBusy || modelLoadingError || viewOnly'
                  :state="fieldState('permissions', true)"
                >
                  <b-form-checkbox :key='permission.id' v-for="permission in permissions[key]" :value="permission.id">{{ $t(`app.permissions.${permission.name}`) }}</b-form-checkbox>
                </b-form-checkbox-group>
              </b-form-group>
            </div>
            <div class="ml-3" v-if="!isBusy && Object.keys(permissions).length === 0">
              {{ $t('settings.roles.noOptions') }}
            </div>

            <template slot="invalid-feedback"><div v-html="fieldError('permissions', true)"></div></template>
          </b-form-group>
          <hr>
          <b-row class='my-1 float-right'>
            <b-col sm='12'>
              <b-button
                :disabled='isBusy'
                variant='secondary'
                @click="$router.push({ name: 'settings.roles' })">
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
        @cancel='refreshRole'
        :hide-header-close='true'
        :no-close-on-backdrop='true'
        :no-close-on-esc='true'
        ref='stale-role-modal'
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
import { mapGetters } from 'vuex';
import env from '../../../env';
import RawText from '../../../components/RawText';

export default {
  mixins: [FieldErrors],
  components: {
    RawText
  },
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
    ...mapGetters({
      settings: 'session/settings'
    }),

    /**
     * Options for the room limit mode radio button group.
     */
    roomLimitModeOptions () {
      return [
        {
          text: this.$t('settings.roles.roomLimit.default', {
            value: parseInt(this.settings('room_limit'), 10) === -1
              ? this.$t('settings.roles.roomLimit.unlimited').toLowerCase() : this.settings('room_limit')
          }),
          value: 'default'
        },
        { text: this.$t('settings.roles.roomLimit.unlimited'), value: 'unlimited' },
        { text: this.$t('settings.roles.roomLimit.custom'), value: 'custom' }
      ];
    },

    /**
     * Boolean that indicates, whether any request for this form is pending or not.
     */
    isBusy () {
      return this.busyCounter > 0;
    }
  },

  data () {
    return {
      model: {
        name: null,
        room_limit: null,
        permissions: []
      },
      permissions: {},
      errors: {},
      staleError: {},
      roomLimitMode: 'default',
      busyCounter: 0,
      modelLoadingError: false
    };
  },

  /**
   * Loads the role from the backend and also the permissions that can be selected.
   */
  mounted () {
    this.load();
  },

  methods: {
    /**
     * Loads the role from the backend and also the permissions that can be selected.
     */
    load () {
      this.modelLoadingError = false;
      this.loadPermissions();

      if (this.id !== 'new') {
        this.busyCounter++;

        Base.call(`roles/${this.id}`).then(response => {
          this.model = response.data.data;
          this.model.permissions = this.model.permissions.map(permission => permission.id);
          this.roomLimitMode = this.model.room_limit === null ? 'default' : (this.model.room_limit === -1 ? 'unlimited' : 'custom');
        }).catch(error => {
          if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
            this.$router.push({ name: 'settings.roles' });
          } else {
            this.modelLoadingError = true;
          }
          Base.error(error, this.$root, error.message);
        }).finally(() => {
          this.busyCounter--;
        });
      }
    },

    /**
     * Loads the permissions that can be selected through checkboxes.
     */
    loadPermissions () {
      this.busyCounter++;

      Base.call('permissions').then(response => {
        this.permissions = {};
        response.data.data.forEach(permission => {
          const group = permission.name.split('.')[0];

          if (!this.permissions[group]) {
            this.permissions[group] = [];
          }

          this.permissions[group].push(permission);
        });
      }).catch(error => {
        this.modelLoadingError = true;
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        this.busyCounter--;
      });
    },

    /**
     * Saves the changes of the role to the database by making a api call.
     *
     * @param evt
     */
    saveRole (evt) {
      if (evt) {
        evt.preventDefault();
      }

      this.busyCounter++;

      const config = {
        method: this.id === 'new' ? 'post' : 'put',
        data: {
          name: this.model.name,
          room_limit: this.model.room_limit || null,
          permissions: this.model.permissions,
          updated_at: this.model.updated_at
        }
      };

      Base.call(this.id === 'new' ? 'roles' : `roles/${this.id}`, config).then(() => {
        this.errors = {};
        this.$router.push({ name: 'settings.roles' });
      }).catch(error => {
        if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          this.errors = error.response.data.errors;
        } else if (error.response && error.response.status === env.HTTP_STALE_MODEL) {
          this.staleError = error.response.data;
          this.$refs['stale-role-modal'].show();
        } else {
          if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
            this.$router.push({ name: 'settings.roles' });
          }

          Base.error(error, this.$root, error.message);
        }
      }).finally(() => {
        this.busyCounter--;
      });
    },

    /**
     * Force a overwrite of the role in the database by setting the `updated_at` field to the new one.
     */
    forceOverwrite () {
      this.model.updated_at = this.staleError.new_model.updated_at;
      this.staleError = {};
      this.$refs['stale-role-modal'].hide();
      this.saveRole();
    },

    /**
     * Refreshes the current model with the new passed from the stale error response.
     */
    refreshRole () {
      this.model = this.staleError.new_model;
      this.model.permissions = this.model.permissions.map(permission => permission.id);
      this.staleError = {};
      this.$refs['stale-role-modal'].hide();
    },

    /**
     * Sets the room_limit on the model depending on the selected radio button.
     *
     * @param value Value of the radio button that was selected.
     */
    roomLimitModeChanged (value) {
      switch (value) {
        case 'default':
          this.model.room_limit = null;
          break;
        case 'unlimited':
          this.model.room_limit = -1;
          break;
        case 'custom':
          this.model.room_limit = 0;
          break;
      }
    }
  }
};
</script>

<style scoped>

</style>

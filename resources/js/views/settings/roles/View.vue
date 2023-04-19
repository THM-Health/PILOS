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
            <i class="fa-solid fa-sync"></i> {{ $t('app.reload') }}
          </b-button>
        </div>
      </template>

      <b-form @submit='saveRole' :aria-hidden="modelLoadingError">
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

          <b-modal id="modal-help-roomlimit" size="lg" :hide-footer="true">
            <template v-slot:modal-title>
              <i class="fa-solid fa-circle-info"></i> {{ $t('app.room_limit') }}
            </template>
            <p>{{ $t('settings.roles.room_limit.help_modal.info') }}</p>

            <strong>{{ $t('settings.roles.room_limit.help_modal.examples') }}</strong>
            <table class="table">
              <thead>
              <tr>
                <th scope="col">{{ $t('settings.roles.room_limit.help_modal.system_default') }}</th>
                <th scope="col">{{ $t('settings.roles.room_limit.help_modal.role_a') }}</th>
                <th scope="col">{{ $t('settings.roles.room_limit.help_modal.role_b') }}</th>
                <th scope="col">{{ $t('app.room_limit') }}</th>
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
                <td>{{ $t('settings.roles.room_limit.help_modal.system_default') }}</td>
                <td><raw-text>2</raw-text></td>
                <td><raw-text>5</raw-text></td>
              </tr>
              <tr>
                <td><raw-text>5</raw-text></td>
                <td>{{ $t('settings.roles.room_limit.help_modal.system_default') }}</td>
                <td><raw-text>10</raw-text></td>
                <td><raw-text>10</raw-text></td>
              </tr>
              <tr>
                <td><raw-text>5</raw-text></td>
                <td>{{ $t('settings.roles.room_limit.unlimited') }}</td>
                <td><raw-text>2</raw-text></td>
                <td>{{ $t('settings.roles.room_limit.unlimited') }}</td>
              </tr>
              </tbody>
            </table>
            <p>{{ $t('settings.roles.room_limit.help_modal.note') }}</p>
          </b-modal>

          <b-form-group
            label-cols-sm='4'
            label-for='room-limit'
            :state='fieldState("room_limit")'
          >
            <template slot='label'>{{ $t('app.room_limit') }}  <b-button variant="link" class="secondary" :disabled="isBusy || modelLoadingError" v-b-modal.modal-help-roomlimit><i class="fa-solid fa-circle-info"></i></b-button></template>
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
            <b-row v-if='!isBusy && Object.keys(permissions).length > 0'>
              <b-col cols="8">
                <b>{{ $t('settings.roles.permission_name') }}</b>
              </b-col>
              <b-col cols="2">
                <b>{{ $t('settings.roles.permission_explicit') }}</b>
              </b-col>
              <b-col cols="2">
                <b>{{ $t('settings.roles.permission_included') }}
                  <i class="fa-solid fa-circle-info"
                    v-b-tooltip.hover
                    :title="$t('settings.roles.permission_included_help')"
                  ></i></b>
              </b-col>
              <b-col cols="12">
                <hr>
              <b-row
                v-for="key in Object.keys(permissions)"
                :key='key'
                class="mb-2"
              >
                <b-col cols="12">
                  <b>{{ $t(`app.permissions.${key}.title`) }}</b>
                </b-col>
                <b-col cols="12">
                <b-row
                  :key='permission.id' v-for="permission in permissions[key]"
                >
                  <b-col cols="8">
                    <label :for="permission.name">{{ $t(`app.permissions.${permission.name}`) }}</label>
                  </b-col>
                  <b-col cols="2">
                    <b-form-checkbox
                      v-model="model.permissions"
                      :id="permission.name"
                      :value="permission.id"
                      switch
                      :disabled='isBusy || modelLoadingError || viewOnly'
                      :state="fieldState('permissions', true)"
                    >
                    </b-form-checkbox>
                  </b-col>
                  <b-col cols="2">
                    <i
                      v-if="includedPermissions.includes(permission.id)"
                      class="fa-solid fa-check-circle text-success"
                      v-b-tooltip.hover
                      :title="$t('settings.roles.has_included_permission',{'name':$t(`app.permissions.${permission.name}`)})"
                    ></i>
                    <i
                      v-else
                      class="fa-solid fa-minus-circle text-danger"
                      v-b-tooltip.hover
                      :title="$t('settings.roles.has_not_included_permission',{'name':$t(`app.permissions.${permission.name}`)})"
                    ></i>
                  </b-col>

                </b-row>
                </b-col>
              </b-row>
              </b-col>
            </b-row>

            <div class="ml-3" v-if="!isBusy && Object.keys(permissions).length === 0">
              {{ $t('settings.roles.no_options') }}
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
                <i class='fa-solid fa-arrow-left'></i> {{ $t('app.back') }}
              </b-button>
              <b-button
                :disabled='isBusy || modelLoadingError'
                variant='success'
                type='submit'
                class='ml-1'
                v-if='!viewOnly'>
                <i class='fa-solid fa-save'></i> {{ $t('app.save') }}
              </b-button>
            </b-col>
          </b-row>
        </b-container>
      </b-form>

      <b-modal
        :static='modalStatic'
        :busy='isBusy'
        ok-variant='danger'
        cancel-variant='secondary'
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
import env from '../../../env';
import RawText from '../../../components/RawText.vue';
import _ from 'lodash';
import { mapState } from 'pinia';
import { useSettingsStore } from '../../../stores/settings';

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
    ...mapState(useSettingsStore, ['getSetting']),

    /**
     * Options for the room limit mode radio button group.
     */
    roomLimitModeOptions () {
      return [
        {
          text: this.$t('settings.roles.room_limit.default', {
            value: parseInt(this.getSetting('room_limit'), 10) === -1
              ? this.$t('settings.roles.room_limit.unlimited').toLowerCase()
              : this.getSetting('room_limit')
          }),
          value: 'default'
        },
        { text: this.$t('settings.roles.room_limit.unlimited'), value: 'unlimited' },
        { text: this.$t('settings.roles.room_limit.custom'), value: 'custom' }
      ];
    },

    /**
     * Calculate what permissions the role gets, based on the select permissions and the permissions that are included
     * in the selected permissions
     */
    includedPermissions () {
      return _.uniq(this.model.permissions.flatMap(permission => [permission, this.includedPermissionMap[permission]].flat()));
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
      includedPermissionMap: {},
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
          permission.name = permission.name.split('.').map(fragment => _.snakeCase(fragment)).join('.');

          const group = permission.name.split('.')[0];

          if (!this.permissions[group]) {
            this.permissions[group] = [];
          }

          this.permissions[group].push(permission);

          this.$set(this.includedPermissionMap, permission.id, permission.included_permissions);
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

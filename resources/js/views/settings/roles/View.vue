<template>
  <div>
    <h2>
      {{ id === 'new' ? $t('settings.roles.new') : (
        viewOnly ? $t('settings.roles.view', { name: $te(`app.role_labels.${model.name}`) ? $t(`app.role_labels.${model.name}`) : model.name })
        : $t('settings.roles.edit', { name: $te(`app.role_labels.${model.name}`) ? $t(`app.role_labels.${model.name}`) : model.name })
      ) }}
    </h2>
    <hr>

<!--    ToDo Overlay-->
    <b-overlay :show="isBusy || modelLoadingError">
      <template #overlay>
        <div class="text-center">
          <b-spinner v-if="isBusy" />
          <b-button
            v-else
            @click="load()"
          >
            <i class="fa-solid fa-sync" /> {{ $t('app.reload') }}
          </b-button>
        </div>
      </template>

      <form
        :aria-hidden="modelLoadingError"
        @submit="saveRole"
      >
        <div class="container container-fluid">
          <div class="field grid">
            <label for="name" class="col-4">{{$t('app.model_name')}}</label>
            <div class="col-8">
              <InputText
                class="w-full"
                id="name"
                v-model="model.name"
                type="text"
                :state="fieldState('name')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
            </div>
<!--            <template #invalid-feedback>-->
<!--              <div v-html="fieldError('name')" />-->
<!--            </template>-->
          </div>

<!--      ToDo-->
          <Dialog
            v-model:visible="helpRoomLimitVisible"
            modal
            id="modal-help-roomlimit"
          >
<!--            ToDo fix header-->
            <template #header>
              <i class="fa-solid fa-circle-info" /> {{ $t('app.room_limit') }}
            </template>
            <p>{{ $t('settings.roles.room_limit.help_modal.info') }}</p>

            <strong>{{ $t('settings.roles.room_limit.help_modal.examples') }}</strong>
            <table class="table">
              <thead>
                <tr>
                  <th scope="col">
                    {{ $t('settings.roles.room_limit.help_modal.system_default') }}
                  </th>
                  <th scope="col">
                    {{ $t('settings.roles.room_limit.help_modal.role_a') }}
                  </th>
                  <th scope="col">
                    {{ $t('settings.roles.room_limit.help_modal.role_b') }}
                  </th>
                  <th scope="col">
                    {{ $t('app.room_limit') }}
                  </th>
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
          </Dialog>

          <div class="field grid">
            <label for="room-limit" class="col-4 align-items-start">
              <span class="flex align-items-center">
                {{ $t('app.room_limit') }}
                <Button
                @click="helpRoomLimitVisible=true"
                severity="link"
                class="secondary"
                :disabled="isBusy || modelLoadingError"
                >
                <i class="fa-solid fa-circle-info" />
                </Button>
              </span>
            </label>
            <div class="col-8">
              <div v-for="option in roomLimitModeOptions" :key="option.value" class="mb-2">
                <RadioButton
                  v-model="roomLimitMode"
                  ::inputId="option.value"
                  :value="option.value"
                  @change="roomLimitModeChanged"
                  :disabled="isBusy || modelLoadingError || viewOnly"
                />
                <label :for="option.value" class="ml-2">{{option.text}}</label>
              </div>
              <InputText
                class="w-full"
                v-if="roomLimitMode === 'custom'"
                id="room-limit"
                v-model="model.room_limit"
                type="number"
                :state="fieldState('room_limit')"
                min="0"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
              <!--            <template #invalid-feedback>-->
              <!--              <div v-html="fieldError('room_limit')" />-->
              <!--            </template>-->
            </div>
          </div>

<!--          <b-form-group-->
<!--            :label="$t('settings.roles.permissions')"-->
<!--            label-size="lg"-->
<!--            label-class="font-weight-bold pt-0"-->
<!--            :state="Object.keys(errors).some(error => error === 'permissions' || error.startsWith('permissions.')) ? false : null"-->
<!--          >-->
<!--          ToDo Label-->
          <div class="field grid">

            <div class="grid w-full" v-if="!isBusy && Object.keys(permissions).length > 0">
              <div class="col-8">
                <b>{{ $t('settings.roles.permission_name') }}</b>
              </div>
              <div class="col-2">
                <b>{{ $t('settings.roles.permission_explicit') }}</b>
              </div>
              <div class="col-2">
                <b>{{ $t('settings.roles.permission_included') }}
                  <i
                    class="fa-solid fa-circle-info"
                    v-tooltip="$t('settings.roles.permission_included_help')"
                  /></b>
              </div>


              <div class="col-12">
                <hr class="mt-4 mb-4">
                <div class="grid mb-3"
                  v-for="key in Object.keys(permissions)"
                  :key="key"
                >
                  <div class="col-12 mb-3">
                    <b>{{ $t(`app.permissions.${key}.title`) }}</b>
                  </div>
                  <div class="col-12">
                    <div class="grid mb-3"
                      v-for="permission in permissions[key]"
                      :key="permission.id"
                    >
                      <div class="col-8">
                        <label :for="permission.name">{{ $t(`app.permissions.${permission.name}`) }}</label>
                      </div>
                      <div class="col-2 flex">
<!--                        ToDo check for better option-->
                        <Checkbox
                          :input-id="permission.name"
                          v-model="model.permissions"
                          :value="permission.id"
                          :disabled="isBusy || modelLoadingError || viewOnly"
                          :state="fieldState('permissions', true)"
                        />
                      </div>
                      <div class="col-2">
                        <i
                          v-if="includedPermissions.includes(permission.id)"
                          class="fa-solid fa-check-circle text-success"
                          v-tooltip="$t('settings.roles.has_included_permission',{'name':$t(`app.permissions.${permission.name}`)})"
                        />
                        <i
                          v-else
                          class="fa-solid fa-minus-circle text-danger"
                          v-tooltip="$t('settings.roles.has_not_included_permission',{'name':$t(`app.permissions.${permission.name}`)})"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="!isBusy && Object.keys(permissions).length === 0"
              class="ml-3"
            >
              {{ $t('settings.roles.no_options') }}
            </div>

<!--            <template #invalid-feedback>-->
<!--              <div v-html="fieldError('permissions', true)" />-->
<!--            </template>-->
          </div>
<!--          </b-form-group>-->
          <hr>
          <div class=" grid my-1 ">
            <div class="col sm:col-12 flex justify-content-end">
              <Button
                :disabled="isBusy"
                severity="secondary"
                @click="$router.push({ name: 'settings.roles' })"
                icon="fa-solid fa-arrow-left"
                :label="$t('app.back')"
              >
              </Button>
              <Button
                v-if="!viewOnly"
                :disabled="isBusy || modelLoadingError"
                severity="success"
                type="submit"
                class="ml-1"
                icon="fa-solid fa-save"
                :label="$t('app.save')"
              >
              </Button>
            </div>
          </div>
        </div>
      </form>

<!--      ToDo-->
      <b-modal
        ref="stale-role-modal"
        :static="modalStatic"
        :busy="isBusy"
        ok-variant="danger"
        cancel-variant="secondary"
        :hide-header-close="true"
        :no-close-on-backdrop="true"
        :no-close-on-esc="true"
        :hide-header="true"
        @ok="forceOverwrite"
        @cancel="refreshRole"
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

<!--ToDo switch to script setup-->
<script>
import Base from '@/api/base';
import FieldErrors from '@/mixins/FieldErrors';
import env from '@/env';
import RawText from '@/components/RawText.vue';
import _ from 'lodash';
import { mapState } from 'pinia';
import { useSettingsStore } from '@/stores/settings';

export default {
  components: {
    RawText
  },
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
      modelLoadingError: false,
      helpRoomLimitVisible: false
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

          //ToDo
          //this.$set(this.includedPermissionMap, permission.id, permission.included_permissions);
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

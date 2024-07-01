<template>
  <div>
    <h2>
      {{ id === 'new' ? $t('settings.roles.new') : (
        viewOnly ? $t('settings.roles.view', { name })
        : $t('settings.roles.edit', { name })
      ) }}
    </h2>
    <div class="flex justify-between">
      <router-link
        class="p-button p-button-secondary"
        :disabled="isBusy"
        :to="{ name: 'settings.roles' }"
      >
        <i class="fa-solid fa-arrow-left mr-2"/> {{$t('app.back')}}
      </router-link>
      <div v-if="model.id && id !=='new'" class="flex gap-2">
        <router-link
          v-if="!viewOnly && userPermissions.can('view', model)"
          class="p-button p-button-secondary"
          :disabled="isBusy"
          :to="{ name: 'settings.roles.view', params: { id: model.id }, query: { view: '1' } }"
        >
          <i class="fa-solid fa-times mr-2" /> {{$t('app.cancel_editing')}}
        </router-link>
        <router-link
          v-if="viewOnly && userPermissions.can('update', model)"
          class="p-button p-button-secondary"
          :disabled="isBusy"
          :to="{ name: 'settings.roles.view', params: { id: model.id } }"
        >
          <i class="fa-solid fa-edit mr-2"/> {{$t('app.edit')}}
        </router-link>
        <SettingsRolesDeleteButton
          v-if="userPermissions.can('delete', model)"
          :id="model.id"
          :name="name"
          @deleted="$router.push({ name: 'settings.roles' })"
        />
      </div>
    </div>

    <Divider/>

    <OverlayComponent :show="isBusy || modelLoadingError">
      <template #loading>
        <LoadingRetryButton :error="modelLoadingError" @reload="load()"></LoadingRetryButton>
      </template>

      <form
        :aria-hidden="modelLoadingError"
        @submit.prevent="saveRole"
      >
          <div class="field grid grid-cols-12 gap-4">
            <label for="name" class="col-span-12 md:col-span-4">{{$t('app.model_name')}}</label>
            <div class="col-span-12 md:col-span-8">
              <InputText
                class="w-full"
                id="name"
                v-model="model.name"
                type="text"
                :invalid="formErrors.fieldInvalid('name')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
              <p class="p-error" v-html="formErrors.fieldError('name')"></p>
            </div>
          </div>

          <div class="field grid grid-cols-12 gap-4">
            <label for="room-limit" class="col-span-12 md:col-span-4 items-start">
              <span class="flex items-center">
                {{ $t('app.room_limit') }}
                <Button
                @click="helpRoomLimitModalVisible=true"
                severity="link"
                class="secondary"
                :disabled="isBusy || modelLoadingError"
                icon="fa-solid fa-circle-info"
                />
              </span>
            </label>
            <div class="col-span-12 md:col-span-8">
              <div v-for="option in roomLimitModeOptions" :key="option.value" class="mb-2">
                <RadioButton
                  v-model="roomLimitMode"
                  :inputId="option.value"
                  :value="option.value"
                  @change="roomLimitModeChanged(option.value)"
                  :disabled="isBusy || modelLoadingError || viewOnly || model.superuser"
                />
                <label :for="option.value" class="ml-2">{{option.text}}</label>
              </div>
              <InputNumber
                class="w-full"
                v-if="roomLimitMode === 'custom'"
                id="room-limit"
                v-model="model.room_limit"
                mode="decimal"
                show-buttons
                :min="0"
                :invalid="formErrors.fieldInvalid('room_limit')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
              <p class="p-error" v-html="formErrors.fieldError('room_limit')"></p>
            </div>

          </div>
            <h3>{{ $t('settings.roles.permissions') }}</h3>
            <div class="grid grid-cols-12 gap-4" v-if="!isBusy && Object.keys(permissions).length > 0">
              <div class="col-span-8">
                <b>{{ $t('settings.roles.permission_name') }}</b>
              </div>
              <div class="col-span-2" style="word-wrap: break-word">
                <b>{{ $t('settings.roles.permission_explicit') }}</b>
              </div>
              <div class="col-span-2" style="word-wrap: break-word">
                <b>{{ $t('settings.roles.permission_included') }}
                  <i
                    class="fa-solid fa-circle-info"
                    v-tooltip="$t('settings.roles.permission_included_help')"
                  /></b>
              </div>
              <div class="col-span-12">
                <Divider/>
                <div class="grid grid-cols-12 gap-4"
                  v-for="key in Object.keys(permissions)"
                  :key="key"
                >
                  <div class="col-span-12">
                    <b>{{ $t(`app.permissions.${key}.title`) }}</b>
                  </div>
                  <div class="col-span-12">
                    <div class="grid grid-cols-12 gap-4"
                      v-for="permission in permissions[key]"
                      :key="permission.id"
                    >
                      <div class="col-span-8">
                        <label :for="permission.name">{{ $t(`app.permissions.${permission.name}`) }}</label>
                      </div>
                      <div class="col-span-2 flex">
                        <Checkbox
                          :input-id="permission.name"
                          v-model="model.permissions"
                          :value="permission.id"
                          :disabled="isBusy || modelLoadingError || viewOnly || model.superuser"
                          :invalid="formErrors.fieldInvalid('permissions', true)"
                        />
                      </div>
                      <div class="col-span-2">
                        <i
                          v-if="includedPermissions.includes(permission.id)"
                          class="fa-solid fa-check-circle text-green-500"
                          v-tooltip="$t('settings.roles.has_included_permission',{'name':$t(`app.permissions.${permission.name}`)})"
                        />
                        <i
                          v-else
                          class="fa-solid fa-minus-circle text-red-500"
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
              class="ml-4"
            >
              {{ $t('settings.roles.no_options') }}
            </div>
            <p class="p-error" v-html="formErrors.fieldError('permissions', true)"></p>
        <div v-if="!viewOnly">
          <Divider/>
          <div class="flex justify-end">
            <Button
              :disabled="isBusy || modelLoadingError"
              severity="success"
              type="submit"
              icon="fa-solid fa-save"
              :label="$t('app.save')"
            />
          </div>
        </div>
      </form>

    </OverlayComponent>

    <ConfirmDialog></ConfirmDialog>

    <Dialog
      v-model:visible="helpRoomLimitModalVisible"
      modal
      :style="{ width: '700px' }"
      :breakpoints="{ '775px': '90vw' }"
      closeOnEscape
      dismissableMask
      :draggable = false
      :header="$t('app.room_limit')"
    >
      <div class="overflow-auto">
      <p>{{ $t('settings.roles.room_limit.help_modal.info') }}</p>

      <p class="font-bold text-lg">{{ $t('settings.roles.room_limit.help_modal.examples') }}</p>
      <table class="p-datatable p-datatable-table">
        <thead class="p-datatable-thead">
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
        <tbody class="p-datatable-tbody">
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
            <td>{{ $t('app.unlimited') }}</td>
            <td><raw-text>2</raw-text></td>
            <td>{{ $t('app.unlimited') }}</td>
          </tr>
        </tbody>
      </table>
      <p>{{ $t('settings.roles.room_limit.help_modal.note') }}</p>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import env from '../env.js';
import { useApi } from '../composables/useApi.js';
import { useFormErrors } from '../composables/useFormErrors.js';
import { useRouter } from 'vue-router';
import { onMounted, ref, computed } from 'vue';
import { useUserPermissions } from '../composables/useUserPermission.js';
import { useSettingsStore } from '../stores/settings';
import { useI18n } from 'vue-i18n';
import _ from 'lodash';
import ConfirmDialog from 'primevue/confirmdialog';
import { useConfirm } from 'primevue/useconfirm';

const formErrors = useFormErrors();
const userPermissions = useUserPermissions();
const settingsStore = useSettingsStore();
const confirm = useConfirm();
const { t } = useI18n();
const api = useApi();
const router = useRouter();

const props = defineProps({
  id: {
    type: [String, Number],
    required: true
  },

  viewOnly: {
    type: Boolean,
    required: true
  }
});

const model = ref({
  name: null,
  room_limit: null,
  permissions: []
});

const name = ref('');
const includedPermissionMap = ref({});
const permissions = ref({});
const roomLimitMode = ref('default');
const busyCounter = ref(0);
const modelLoadingError = ref(false);
const helpRoomLimitModalVisible = ref(false);

/**
 * Options for the room limit mode radio button group.
 */
const roomLimitModeOptions = computed(() => {
  return [
    {
      text: t('settings.roles.room_limit.default', {
        value: parseInt(settingsStore.getSetting('room_limit'), 10) === -1
          ? t('app.unlimited').toLowerCase()
          : settingsStore.getSetting('room_limit')
      }),
      value: 'default'
    },
    { text: t('app.unlimited'), value: 'unlimited' },
    { text: t('settings.roles.room_limit.custom'), value: 'custom' }
  ];
});

/**
 * Calculate what permissions the role gets, based on the select permissions and the permissions that are included
 * in the selected permissions
 */
const includedPermissions = computed(() => {
  return _.uniq(model.value.permissions.flatMap(permission => [permission, includedPermissionMap.value[permission]].flat()));
});

/**
 * Boolean that indicates, whether any request for this form is pending or not.
 */
const isBusy = computed(() => {
  return busyCounter.value > 0;
});

/**
 * Loads the role from the backend and also the permissions that can be selected.
 */
onMounted(() => {
  load();
});
/**
 * Loads the role from the backend and also the permissions that can be selected.
 */
function load () {
  modelLoadingError.value = false;
  loadPermissions();

  if (props.id !== 'new') {
    busyCounter.value++;

    api.call(`roles/${props.id}`).then(response => {
      model.value = response.data.data;
      model.value.permissions = model.value.permissions.map(permission => permission.id);
      name.value = response.data.data.name;
      roomLimitMode.value = model.value.room_limit === null ? 'default' : (model.value.room_limit === -1 ? 'unlimited' : 'custom');
    }).catch(error => {
      if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
        router.push({ name: 'settings.roles' });
      } else {
        modelLoadingError.value = true;
      }
      api.error(error);
    }).finally(() => {
      busyCounter.value--;
    });
  }
}
/**
 * Loads the permissions that can be selected through checkboxes.
 */
function loadPermissions () {
  busyCounter.value++;

  api.call('permissions').then(response => {
    permissions.value = {};
    response.data.data.forEach(permission => {
      permission.name = permission.name.split('.').map(fragment => _.snakeCase(fragment)).join('.');

      const group = permission.name.split('.')[0];

      if (!permissions.value[group]) {
        permissions.value[group] = [];
      }

      permissions.value[group].push(permission);
      includedPermissionMap.value[permission.id] = permission.included_permissions;
    });
  }).catch(error => {
    modelLoadingError.value = true;
    api.error(error);
  }).finally(() => {
    busyCounter.value--;
  });
}

/**
 * Saves the changes of the role to the database by making a api call.
 *
 */
function saveRole () {
  busyCounter.value++;

  const config = {
    method: props.id === 'new' ? 'post' : 'put',
    data: {
      name: model.value.name,
      room_limit: model.value.room_limit,
      permissions: model.value.permissions,
      updated_at: model.value.updated_at
    }
  };

  api.call(props.id === 'new' ? 'roles' : `roles/${props.id}`, config).then(response => {
    formErrors.clear();
    router.push({ name: 'settings.roles.view', params: { id: response.data.data.id }, query: { view: '1' } });
  }).catch(error => {
    if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
      formErrors.set(error.response.data.errors);
    } else if (error.response && error.response.status === env.HTTP_STALE_MODEL) {
      handleStaleError(error.response.data);
    } else {
      if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
        router.push({ name: 'settings.roles' });
      }

      api.error(error);
    }
  }).finally(() => {
    busyCounter.value--;
  });
}

/**
 * Sets the room_limit on the model depending on the selected radio button.
 *
 * @param value Value of the radio button that was selected.
 */
function roomLimitModeChanged (value) {
  switch (value) {
    case 'default':
      model.value.room_limit = null;
      break;
    case 'unlimited':
      model.value.room_limit = -1;
      break;
    case 'custom':
      model.value.room_limit = 0;
      break;
  }
}

function handleStaleError (staleError) {
  confirm.require({
    message: staleError.message,
    header: t('app.errors.stale_error'),
    icon: 'pi pi-exclamation-triangle',
    rejectClass: 'p-button-secondary',
    rejectLabel: t('app.reload'),
    acceptLabel: t('app.overwrite'),
    accept: () => {
      model.value.updated_at = staleError.new_model.updated_at;
      saveRole();
    },
    reject: () => {
      model.value = staleError.new_model;
      model.value.permissions = model.value.permissions.map(permission => permission.id);
      name.value = staleError.new_model.name;
    }
  });
}
</script>

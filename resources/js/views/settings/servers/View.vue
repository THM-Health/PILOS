<template>
  <div>
    <h2>
      {{
        id === 'new' ? $t('settings.servers.new') : (
          viewOnly ? $t('settings.servers.view', { name })
            : $t('settings.servers.edit', { name })
        )
      }}
    </h2>
    <div class="flex justify-content-between">
      <router-link
        class="p-button p-button-secondary"
        :disabled="isBusy"
        :to="{ name: 'settings.servers' }"
      >
        <i class="fa-solid fa-arrow-left mr-2"/> {{$t('app.back')}}
      </router-link>
      <div v-if="model.id!== null && id!=='new'" class="flex gap-2">
        <router-link
          v-if="!viewOnly && userPermissions.can('view', model)"
          :disabled="isBusy"
          :to="{ name: 'settings.servers.view', params: { id: model.id }, query: { view: '1' } }"
          class="p-button p-button-secondary"
        >
          <i class="fa-solid fa-times mr-2" /> {{$t('app.cancel_editing')}}
        </router-link>
        <router-link
          v-if="viewOnly && userPermissions.can('update', model)"
          :disabled="isBusy"
          :to="{ name: 'settings.servers.view', params: { id: model.id } }"
          class="p-button p-button-secondary"
        >
          <i class="fa-solid fa-edit mr-2"/> {{$t('app.edit')}}
        </router-link>
        <SettingsServersDeleteButton
          v-if="userPermissions.can('delete', model) && model.status===-1"
          :id="model.id"
          :name="name"
          @deleted="$router.push({ name: 'settings.servers' })"
        ></SettingsServersDeleteButton>
      </div>
    </div>

    <Divider/>

    <OverlayComponent :show="isBusy">
      <template #loading>
        <LoadingRetryButton :error="modelLoadingError" @reload="load"></LoadingRetryButton>
      </template>

      <form
        :aria-hidden="modelLoadingError"
        @submit.prevent="saveServer"
      >
        <div class="field grid">
          <label class="col-12 md:col-4 md:mb-0" for="name">{{ $t('app.model_name') }}</label>
          <div class="col-12 md:col-8">
            <InputText
              id="name"
              v-model="model.name"
              :disabled="isBusy || modelLoadingError || viewOnly"
              :invalid="formErrors.fieldInvalid('name')"
              class="w-full"
              type="text"
            />
            <p class="p-error" v-html="formErrors.fieldError('name')"></p>
          </div>
          </div>
          <div class="field grid">
            <label class="col-12 md:col-4 md:mb-0" for="description">{{ $t('app.description') }}</label>
            <div class="col-12 md:col-8">
              <InputText
                id="description"
                v-model="model.description"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :invalid="formErrors.fieldInvalid('description')"
                class="w-full"
                type="text"
              />
              <p class="p-error" v-html="formErrors.fieldError('description')"></p>
            </div>
          </div>
          <div class="field grid">
            <label class="col-12 md:col-4 md:mb-0" for="version">{{ $t('settings.servers.version') }}</label>
            <div class="col-12 md:col-8">
              <InputText
                id="version"
                :disabled="true"
                :value="model.version || '---'"
                class="w-full"
                type="text"
              />
            </div>
          </div>
          <div class="field grid">
            <label class="col-12 md:col-4 md:mb-0" for="base_url">{{ $t('settings.servers.base_url') }}</label>
            <div class="col-12 md:col-8">
              <InputText
                id="base_url"
                autocomplete="off"
                v-model="model.base_url"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :invalid="formErrors.fieldInvalid('base_url')"
                class="w-full"
                type="text"
              />
              <p class="p-error" v-html="formErrors.fieldError('base_url')"></p>
            </div>
          </div>
          <div class="field grid">
            <label class="col-12 md:col-4 md:mb-0" for="secret">{{ $t('settings.servers.secret') }}</label>
            <div class="col-12 md:col-8">
              <Password
                class="w-full"
                id="secret"
                :inputProps="{ autocomplete: 'off' }"
                v-model="model.secret"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :invalid="formErrors.fieldInvalid('secret')"
                :feedback="false"
                :toggleMask="true"
              />
              <p class="p-error" v-html="formErrors.fieldError('secret')"></p>
            </div>
          </div>
          <div class="field grid">
            <label class="col-12 md:col-4 md:mb-0" for="strength">{{
                $t('settings.servers.strength')
              }}</label>
            <div class="col-12 md:col-8">
              <Rating
                id="strength"
                v-model="model.strength"
                :cancel="false"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :invalid="formErrors.fieldInvalid('strength')"
                :stars="10"
                aria-describedby="strength-help"
                class="border-1 border-300 border-round px-4 py-3 flex justify-content-between"
              />
              <small id="strength-help">{{ $t('settings.servers.strength_description') }}</small>
              <p class="p-error" v-html="formErrors.fieldError('strength')"></p>
            </div>
          </div>

          <div class="field grid">
            <label class="col-12 md:col-4 md:mb-0" for="disabled">{{ $t('settings.servers.disabled') }}</label>
            <div class="col-12 md:col-8">
              <div>
                <InputSwitch
                  id="disabled"
                  v-model="model.disabled"
                  :disabled="isBusy || modelLoadingError || viewOnly"
                  :invalid="formErrors.fieldInvalid('disabled')"
                  aria-describedby="disabled-help"
                  class="align-items-center d-flex mb-3"
                  name="check-button"
                />
              </div>
              <small id="disabled-help">{{ $t('settings.servers.disabled_description') }}</small>
              <p class="p-error" v-html="formErrors.fieldError('disabled')"></p>
            </div>
          </div>

          <div class="field grid">
            <label class="col-12 md:col-4 md:mb-0" for="onlineStatus">{{ $t('settings.servers.status') }}</label>
            <div class="col-12 md:col-8">
              <InputGroup>
                <InputText
                  id="onlineStatus"
                  v-model="onlineStatus"
                  :disabled="true"
                  type="text"
                />
                <Button
                  :disabled="isBusy || modelLoadingError || checking"
                  :label="$t('settings.servers.test_connection')"
                  icon="fa-solid fa-link"
                  severity="info"
                  @click="testConnection()"
                />
              </InputGroup>
              <p v-if="offlineReason" class="p-error">
                {{ $t('settings.servers.offline_reason.' + offlineReason) }}
              </p>
            </div>
          </div>
        <div v-if="!viewOnly">
          <Divider/>
          <div class="flex justify-content-end">
            <Button
              :disabled="isBusy || modelLoadingError"
              :label="$t('app.save')"
              icon="fa-solid fa-save"
              severity="success"
              type="submit"
            />
          </div>
        </div>
      </form>
      <div
        v-if="!modelLoadingError && viewOnly && !model.disabled && model.id!==null"
        class="mt-3"
      >
        <div class="grid">
          <div class="col-12 md:col">
            <h3 class="mt-0">
              {{ $t('settings.servers.current_usage') }}
            </h3>
            <Divider/>
          </div>
        </div>

        <div class="field grid">
          <label class="col-12 md:col-4 md:mb-0" for="meetingCount">{{ $t('settings.servers.meeting_count') }}</label>
          <div class="col-12 md:col-8">
            <InputText
              id="meetingCount"
              v-model="model.meeting_count"
              :disabled="true"
              aria-describedby="meetingCount-help"
              class="w-full"
              type="text"
            />
            <small id="meetingCount-help">{{ $t('settings.servers.meeting_description') }}</small>
          </div>
        </div>
        <div class="field grid">
          <label class="col-12 md:col-4 md:mb-0"
                 for="ownMeetingCount">{{ $t('settings.servers.own_meeting_count') }}</label>
          <div class="col-12 md:col-8">
            <InputText
              id="ownMeetingCount"
              v-model="model.own_meeting_count"
              :disabled="true"
              aria-describedby="ownMeetingCount-help"
              class="w-full"
              type="text"
            />
            <small id="ownMeetingCount-help">{{ $t('settings.servers.own_meeting_description') }}</small>
          </div>
        </div>
        <div class="field grid">
          <label class="col-12 md:col-4 md:mb-0" for="participantCount">
            {{$t('settings.servers.participant_count') }}
          </label>
          <div class="col-12 md:col-8">
            <InputText
              id="participantCount"
              v-model="model.participant_count"
              :disabled="true"
              class="w-full"
              type="text"
            />
          </div>
        </div>
        <div class="field grid">
          <label class="col-12 md:col-4 md:mb-0" for="videoCount">{{ $t('settings.servers.video_count') }}</label>
          <div class="col-12 md:col-8">
            <InputText
              id="videoCount"
              v-model="model.video_count"
              :disabled="true"
              class="w-full"
              type="text"
            />
          </div>
        </div>

        <div
          v-if="userPermissions.can('update', model)"
          class="field grid"
        >
          <label class="col-12 md:col-4 md:mb-0" for="panic">{{ $t('settings.servers.panic') }}</label>
          <div class="col-12 md:col-8">
            <div>
              <Button
                id="panic"
                :disabled="isBusy || modelLoadingError || checking || panicking"
                :label="$t('settings.servers.panic_server')"
                aria-describedby="panic-help"
                icon="fa-solid fa-exclamation-triangle"
                severity="danger"
                @click="panic()"
              />
            </div>
            <small id="panic-help">{{ $t('settings.servers.panic_description') }}</small>
          </div>
        </div>
      </div>
      <ConfirmDialog></ConfirmDialog>
    </OverlayComponent>
  </div>
</template>
<script setup>
import env from '@/env.js';
import { useFormErrors } from '@/composables/useFormErrors.js';
import { useApi } from '@/composables/useApi.js';
import { useUserPermissions } from '@/composables/useUserPermission.js';
import { useRouter } from 'vue-router';
import { useConfirm } from 'primevue/useconfirm';
import ConfirmDialog from 'primevue/confirmdialog';
import { useI18n } from 'vue-i18n';
import { computed, onMounted, ref } from 'vue';
import { useToast } from '@/composables/useToast.js';

const toast = useToast();
const userPermissions = useUserPermissions();
const formErrors = useFormErrors();
const api = useApi();
const router = useRouter();
const confirm = useConfirm();
const { t } = useI18n();

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
  id: null,
  disabled: false
});
const name = ref('');
const isBusy = ref(false);
const modelLoadingError = ref(false);
const checking = ref(false);
const panicking = ref(false);
const online = ref(0);
const offlineReason = ref(null);

const onlineStatus = computed(() => {
  switch (online.value) {
    case 0:
      return t('settings.servers.offline');
    case 1:
      return t('settings.servers.online');
    default:
      return t('settings.servers.unknown');
  }
});

/**
 * Loads the server from the backend
 */
onMounted(() => {
  load();
});

function panic () {
  panicking.value = true;

  api.call(`servers/${props.id}/panic`).then(response => {
    if (response.status === 200) {
      toast.success(t('settings.servers.flash.panic.description', {
        total: response.data.total,
        success: response.data.success
      }), t('settings.servers.flash.panic.title'));
      load();
    }
  }).catch(error => {
    api.error(error);
  }).finally(() => {
    panicking.value = false;
  });
}

/**
 * Check if the backend can establish a connection with the passed api details to a bigbluebutton server
 * Based on the result the online status field is updated
 */
function testConnection () {
  checking.value = true;

  const config = {
    method: 'post',
    data: {
      base_url: model.value.base_url,
      secret: model.value.secret
    }
  };

  api.call('servers/check', config).then(response => {
    if (response.data.connection_ok && response.data.secret_ok) {
      online.value = 1;
      offlineReason.value = null;
    } else {
      if (response.data.connection_ok && !response.data.secret_ok) {
        online.value = 0;
        offlineReason.value = 'secret';
      } else {
        online.value = 0;
        offlineReason.value = 'connection';
      }
    }
  }).catch(error => {
    online.value = null;
    offlineReason.value = null;
    api.error(error);
  }).finally(() => {
    checking.value = false;
  });
}

/**
 * Loads the servers from the backend
 */
function load () {
  modelLoadingError.value = false;

  if (props.id !== 'new') {
    isBusy.value = true;

    api.call(`servers/${props.id}`).then(response => {
      model.value = response.data.data;
      model.value.disabled = model.value.status === -1;
      name.value = response.data.data.name;
      online.value = model.value.status === -1 ? null : model.value.status;
      offlineReason.value = null;
    }).catch(error => {
      if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
        router.push({ name: 'settings.servers' });
      } else {
        modelLoadingError.value = true;
      }
      api.error(error);
    }).finally(() => {
      isBusy.value = false;
    });
  }
}

/**
 * Saves the changes of the server to the database by making a api call.
 *
 */
function saveServer () {
  isBusy.value = true;

  const config = {
    method: props.id === 'new' ? 'post' : 'put',
    data: model.value
  };

  api.call(props.id === 'new' ? 'servers' : `servers/${props.id}`, config).then(response => {
    formErrors.clear();
    router.push({ name: 'settings.servers.view', params: { id: response.data.data.id }, query: { view: '1' } });
  }).catch(error => {
    if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
      formErrors.set(error.response.data.errors);
    } else if (error.response && error.response.status === env.HTTP_STALE_MODEL) {
      // handle stale errors
      handleStaleError(error.response.data);
    } else {
      if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
        router.push({ name: 'settings.servers' });
      }
      api.error(error);
    }
  }).finally(() => {
    isBusy.value = false;
  });
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
      saveServer();
    },
    reject: () => {
      model.value = staleError.new_model;
      model.value.disabled = model.value.status === -1;
      name.value = staleError.new_model.name;
      online.value = model.value.status === -1 ? null : model.value.status;
      offlineReason.value = null;
    }
  });
}
</script>

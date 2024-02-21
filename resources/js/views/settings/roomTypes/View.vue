<template>
  <div>
    <h2>
      {{ id === 'new' ? $t('settings.room_types.new') : (
        viewOnly ? $t('settings.room_types.view', { name: description })
        : $t('settings.room_types.edit', { name: description })
      ) }}
    </h2>
    <Divider/>
    <OverlayComponent :show="isBusy || modelLoadingError">
      <template #loading>
        <LoadingRetryButton :error="modelLoadingError" @reload="loadRoomType"></LoadingRetryButton>
      </template>
      <form @submit.prevent="saveRoomType">
        <div class="field grid">
          <label for="description" class="col-12 md:col-4 md:mb-0">{{$t('app.description')}}</label>
          <div class="col-12 md:col-8">
            <InputText
              class="w-full"
              id="description"
              v-model="model.description"
              type="text"
              :invalid="formErrors.fieldInvalid('description')"
              :disabled="isBusy || modelLoadingError || viewOnly"
            />
            <p class="p-error" v-html="formErrors.fieldError('description')"></p>
          </div>
        </div>

        <div class="field grid">
          <label for="color" class="col-12 md:col-4 md:mb-0 align-items-start">{{ $t('settings.room_types.color') }}</label>
          <div class="col-12 md:col-8">
            <color-select
              id="color"
              class="mb-2"
              :disabled='isBusy || modelLoadingError || viewOnly'
              :colors="colors"
              v-model="model.color"
            />
            <label for="color">{{ $t('settings.room_types.custom_color') }}</label>
            <InputText
              class="w-full"
              id="color"
              v-model="model.color"
              type="text"
              :invalid="formErrors.fieldInvalid('color')"
              :disabled="isBusy || modelLoadingError || viewOnly"
            />
            <p class="p-error" v-html="formErrors.fieldError('color')"></p>
          </div>
        </div>

        <div class="field grid">
          <label class="col-12 md:col-4 md:mb-0">{{$t('settings.room_types.preview')}}</label>
          <div class="col-12 md:col-8 flex align-items-center">
            <Tag
              :value="model.description || '&nbsp;'"
              class="flex-shrink-1 text-break "
              style="white-space: normal"
              :style="{ 'background-color': model.color}"
            >
            </Tag>
          </div>
        </div>

        <div class="field grid">
          <label for="server_pool" class="col-12 md:col-4 md:mb-0 align-items-start">{{$t('app.server_pool')}}</label>
          <div class="col-12 md:col-8">
            <InputGroup>
              <multiselect
                id="server_pool"
                ref="serverPoolMultiselectRef"
                v-model="model.server_pool"
                :placeholder="$t('settings.room_types.select_server_pool')"
                track-by="id"
                label="name"
                open-direction="bottom"
                :multiple="false"
                :searchable="false"
                :internal-search="false"
                :clear-on-select="false"
                :close-on-select="false"
                :show-no-results="false"
                :show-labels="false"
                :options="serverPools"
                :disabled="isBusy || modelLoadingError || serverPoolsLoadingError || viewOnly"
                :loading="serverPoolsLoading"
                :allow-empty="false"
                :class="{ 'is-invalid': formErrors.fieldInvalid('server_pool'), 'multiselect-form-control': true }"
                aria-describedby="server_pool-help"
              >
                <template #noOptions>
                  {{ $t('settings.server_pools.no_data') }}
                </template>
                <template #afterList>
                  <div class="flex p-2 gap-2">
                    <Button
                      :disabled="serverPoolsLoading || serverPoolsCurrentPage === 1"
                      severity="secondary"
                      outlined
                      @click="loadServerPools(Math.max(1, serverPoolsCurrentPage - 1))"
                      icon="fa-solid fa-arrow-left"
                      :label="$t('app.previous_page')"
                    />
                    <Button
                      :disabled="serverPoolsLoading || !serverPoolsHasNextPage"
                      severity="secondary"
                      outlined
                      @click="loadServerPools(serverPoolsCurrentPage + 1)"
                      icon="fa-solid fa-arrow-right"
                      :label="$t('app.next_page')"
                    />
                  </div>
                </template>
              </multiselect>
              <Button
                v-if="serverPoolsLoadingError"
                severity="secondary"
                outlined
                @click="loadServerPools(currentPage)"
              >
                <i class="fa-solid fa-sync" />
              </Button>
            </InputGroup>
            <p class="p-error" v-html="formErrors.fieldError('server_pool')"></p>
            <small id="server_pool-help">{{$t('settings.room_types.server_pool_description')}}</small>
          </div>
        </div>

        <div class="field grid">
          <label for="restrict" class="col-12 md:col-4 md:mb-0 align-items-start">{{$t('settings.room_types.restrict')}}</label>
          <div class="col-12 md:col-8">
            <div>
              <InputSwitch
                id="restrict"
                v-model="model.restrict"
                :invalid="formErrors.fieldInvalid('restrict')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                aria-describedby="restrict-help"
              />
            </div>
            <p class="p-error" v-html="formErrors.fieldError('restrict')"></p>
            <small id="restrict-help">{{$t('settings.room_types.restrict_description')}}</small>
          </div>
        </div>

        <div class="field grid" v-if="model.restrict">
          <label for="roles" class="col-12 md:col-4 md:mb-0">{{$t('app.roles')}}</label>
          <div class="col-12 md:col-8">
            <RoleSelect
              v-model="model.roles"
              :invalid="formErrors.fieldInvalid('roles')"
              :disabled="isBusy || modelLoadingError || viewOnly"
              id="roles"
              @busy="(value) => rolesLoading = value"
              @rolesLoadingError="(value) => rolesLoadingError = value"
            />
            <p class="p-error" v-html="formErrors.fieldError('roles')"></p>
          </div>
        </div>

        <div class="field grid">
          <label for="allow_listing" class="col-12 md:col-4 md:mb-0 align-items-start">{{$t('settings.room_types.allow_listing')}}</label>
          <div class="col-12 md:col-8">
            <div>
              <InputSwitch
                id="allow_listing"
                v-model="model.allow_listing"
                :invalid="formErrors.fieldInvalid('allow_listing')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                aria-describedby="allow_listing-help"
              />
            </div>
            <p class="p-error" v-html="formErrors.fieldError('allow_listing')"></p>
            <small id="allow_listing-help">{{$t('settings.room_types.allow_listing_description')}}</small>
          </div>
        </div>

        <div class="field grid">
          <label for="allow_record_attendance" class="col-12 md:col-4 md:mb-0 align-items-start">{{$t('settings.room_types.allow_record_attendance')}}</label>
          <div class="col-12 md:col-8">
            <div>
              <InputSwitch
                id="allow_record_attendance"
                v-model="model.allow_record_attendance"
                :invalid="formErrors.fieldInvalid('allow_record_attendance')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
            </div>
            <p class="p-error" v-html="formErrors.fieldError('allow_record_attendance')"></p>
          </div>
        </div>

        <div class="field grid">
          <label for="require_access_code" class="col-12 md:col-4 md:mb-0 align-items-start">{{$t('settings.room_types.require_access_code')}}</label>
          <div class="col-12 md:col-8">
            <div>
              <InputSwitch
                id="require_access_code"
                v-model="model.require_access_code"
                :invalid="formErrors.fieldInvalid('require_access_code')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
            </div>
            <p class="p-error" v-html="formErrors.fieldError('require_access_code')"></p>
          </div>
        </div>

        <div class="field grid">
          <label for="max_participants" class="col-12 md:col-4 md:mb-0 align-items-start">{{$t('settings.room_types.max_participants')}}</label>
          <div class="col-12 md:col-8">
            <InputGroup>
              <InputNumber
                id="max_participants"
                v-model="model.max_participants"
                :invalid="formErrors.fieldInvalid('max_participants')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :placeholder="$t('app.unlimited')"
              />
              <Button
                @click="model.max_participants = null"
                icon="fa-solid fa-xmark"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
            </InputGroup>
            <p class="p-error" v-html="formErrors.fieldError('max_participants')"></p>
          </div>
        </div>

        <div class="field grid">
          <label for="max_duration" class="col-12 md:col-4 md:mb-0 align-items-start">{{$t('settings.room_types.max_duration')}}</label>
          <div class="col-12 md:col-8">
            <InputGroup>
              <InputNumber
                id="max_duration"
                v-model="model.max_duration"
                :invalid="formErrors.fieldInvalid('max_duration')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :placeholder="$t('app.unlimited')"
                suffix=" min."
              />
              <Button
                @click="model.max_duration = null"
                icon="fa-solid fa-xmark"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
            </InputGroup>
            <p class="p-error" v-html="formErrors.fieldError('max_duration')"></p>
          </div>
        </div>

        <Divider/>

        <div class="flex justify-content-end">
          <Button
            :disabled="isBusy"
            severity="secondary"
            @click="$router.push({ name: 'settings.room_types' })"
            icon="fa-solid fa-arrow-left"
            :label="$t('app.back')"
          >
          </Button>
          <Button
            v-if="!viewOnly"
            :disabled="isBusy || modelLoadingError || serverPoolsLoadingError || serverPoolsLoading || rolesLoading || rolesLoadingError"
            severity="success"
            type="submit"
            class="ml-1"
            icon="fa-solid fa-save"
            :label="$t('app.save')"
          >
          </Button>
        </div>
      </form>
    </OverlayComponent>
    <ConfirmDialog></ConfirmDialog>
  </div>
</template>

<script setup>
import env from '@/env.js';
import { useFormErrors } from '@/composables/useFormErrors.js';
import { useApi } from '@/composables/useApi.js';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import _ from 'lodash';
import { Multiselect } from 'vue-multiselect';
import { useConfirm } from 'primevue/useconfirm';
import { useI18n } from 'vue-i18n';
import ConfirmDialog from 'primevue/confirmdialog';

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
  },

  modalStatic: {
    type: Boolean,
    default: false
  }
});

const isBusy = ref(false);
const model = ref({
  description: null,
  color: env.ROOM_TYPE_COLORS[0],
  server_pool: null,
  allow_listing: false,
  allow_record_attendance: false,
  require_access_code: false,
  max_duration: null,
  max_participants: null,
  restrict: false,
  roles: []
});

const description = ref('');

const rolesLoading = ref(false);
const colors = env.ROOM_TYPE_COLORS;

const serverPoolsLoading = ref(false);
const serverPools = ref([]);
const serverPoolsCurrentPage = ref(1);
const serverPoolsHasNextPage = ref(false);

const rolesLoadingError = ref(false);
const modelLoadingError = ref(false);
const serverPoolsLoadingError = ref(false);

const serverPoolMultiselectRef = ref();

/**
 * Loads the role from the backend and also a part of permissions that can be selected.
 */
onMounted(() => {
  loadRoomType();
  loadServerPools();
});

/**
 * Load the room type from the server api
 *
 */
function loadRoomType () {
  if (props.id !== 'new') {
    isBusy.value = true;

    api.call(`roomTypes/${props.id}`).then(response => {
      model.value = response.data.data;
      description.value = response.data.data.description;
      modelLoadingError.value = false;
    }).catch(error => {
      if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
        router.push({ name: 'settings.room_types' });
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
 * Loads the roles for the passed page, that can be selected through the multiselect.
 *
 * @param [page=1] The page to load the roles for.
 */
function loadServerPools (page = 1) {
  serverPoolsLoading.value = true;

  const config = {
    params: {
      page
    }
  };

  api.call('serverPools', config).then(response => {
    serverPoolsLoadingError.value = false;
    serverPools.value = response.data.data;
    serverPoolsCurrentPage.value = page;
    serverPoolsHasNextPage.value = page < response.data.meta.last_page;
  }).catch(error => {
    serverPoolMultiselectRef.value.deactivate();
    serverPoolsLoadingError.value = true;
    api.error(error);
  }).finally(() => {
    serverPoolsLoading.value = false;
  });
}

/**
 * Saves the changes of the room type to the database by making an api call.
 */
function saveRoomType () {
  isBusy.value = true;

  const config = {
    method: props.id === 'new' ? 'post' : 'put',
    data: _.cloneDeep(model.value)
  };

  config.data.server_pool = config.data.server_pool ? config.data.server_pool.id : null;
  config.data.roles = config.data.roles.map(role => role.id);

  api.call(props.id === 'new' ? 'roomTypes' : `roomTypes/${props.id}`, config).then((response) => {
    formErrors.clear();
    if (props.id === 'new') {
      router.push({ name: 'settings.room_types.view', params: { id: response.data.data.id } });
    } else {
      model.value = response.data.data;
      description.value = response.data.data.description;
    }
  }).catch(error => {
    if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
      formErrors.set(error.response.data.errors);
    } else if (error.response && error.response.status === env.HTTP_STALE_MODEL) {
      // handle stale errors
      handleStaleError(error.response.data);
    } else if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
      api.error(error);
      router.push({ name: 'settings.room_types' });
    } else {
      api.error(error);
    }
  }).finally(() => {
    isBusy.value = false;
  });
}

function handleStaleError (staleError) {
  confirm.require({
    message: staleError.message,
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    rejectClass: 'p-button-secondary p-button-outlined',
    rejectLabel: t('app.reload'),
    acceptLabel: t('app.overwrite'),
    accept: () => {
      model.value.updated_at = staleError.new_model.updated_at;
      saveRoomType();
    },
    reject: () => {
      model.value = staleError.new_model;
      description.value = staleError.new_model.description;
    }
  });
}
</script>

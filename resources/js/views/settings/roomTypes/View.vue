<template>
  <div>
    <h2>
      {{ id === 'new' ? $t('settings.room_types.new') : (
        viewOnly ? $t('settings.room_types.view', { name: model.description })
        : $t('settings.room_types.edit', { name: model.description })
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
            ref="reloadRoomType"
            @click="loadRoomType()"
          >
            <i class="fa-solid fa-sync" /> {{ $t('app.reload') }}
          </b-button>
        </div>
      </template>
      <form @submit="saveRoomType">
        <div class="field grid">
          <label for="description" class="col-12 md:col-4 md:mb-0">{{$t('app.description')}}</label>
          <div class="col-12 md:col-8">
            <InputText
              class="w-full"
              id="description"
              v-model="model.description"
              type="text"
              :class="{'p-invalid': formErrors.fieldInvalid('description')}"
              :disabled="isBusy || modelLoadingError || viewOnly"
            />
            <p class="p-error" v-html="formErrors.fieldError('description')"></p>
          </div>
        </div>

        <div class="field grid">
          <label for="color" class="col-12 md:col-4 md:mb-0 align-items-start">{{ $t('settings.room_types.color') }}</label>
          <div class="col-12 md:col-8">
<!--        ToDo Color Select-->
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
              :class="{'p-invalid': formErrors.fieldInvalid('color')}"
              :disabled="isBusy || modelLoadingError || viewOnly"
            />
            <p class="p-error" v-html="formErrors.fieldError('color')"></p>
          </div>
        </div>

        <div class="field grid">
          <label class="col-12 md:col-4 md:mb-0">{{$t('settings.room_types.preview')}}</label>
          <div class="col-12 md:col-8 flex align-items-center">
            <Tag
              :value="model.description"
              class="flex-shrink-1 text-break "
              style="white-space: normal"
              :style="{ 'background-color': model.color}"
            >
            </Tag>
          </div>
        </div>
        <div class="field grid">
          <label for="allow_listing" class="col-12 md:col-4 md:mb-0 align-items-start">{{$t('settings.room_types.allow_listing')}}</label>
          <div class="col-12 md:col-8">
            <div>
              <InputSwitch
                id="allow_listing"
                v-model="model.allow_listing"
                :class="{'p-invalid': formErrors.fieldInvalid('allow_listing')}"
                :disabled="isBusy || modelLoadingError || viewOnly"
                aria-describedby="allow_listing-help"
              />
            </div>
            <p class="p-error" v-html="formErrors.fieldError('allow_listing')"></p>
            <small id="allow_listing-help">{{$t('settings.room_types.allow_listing_description')}}</small>
          </div>
        </div>

        <div class="field grid">
          <label for="server_pool" class="col-12 md:col-4 md:mb-0 align-items-start">{{$t('app.server_pool')}}</label>
          <div class="col-12 md:col-8">
            <InputGroup>
              <multiselect
                id="server_pool"
                ref="server-pool-multiselect"
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
                  <Button
                    :disabled="serverPoolsLoading || currentPage === 1"
                    severity="secondary"
                    outlined
                    @click="loadServerPools(Math.max(1, currentPage - 1))"
                  >
                    <i class="fa-solid fa-arrow-left" /> {{ $t('app.previous_page') }}
                  </Button>
                  <Button
                    :disabled="serverPoolsLoading || !hasNextPage"
                    severity="secondary"
                    outlined
                    @click="loadServerPools(currentPage + 1)"
                  >
                    <i class="fa-solid fa-arrow-right" /> {{ $t('app.next_page') }}
                  </Button>
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
                :class="{'p-invalid': formErrors.fieldInvalid('restrict')}"
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
            <InputGroup>
              <multiselect
                id="roles"
                ref="roles-multiselect"
                v-model="model.roles"
                :placeholder="$t('settings.room_types.select_roles')"
                track-by="id"
                open-direction="bottom"
                :multiple="true"
                :searchable="false"
                :internal-search="false"
                :clear-on-select="false"
                :close-on-select="false"
                :show-no-results="false"
                :show-labels="false"
                :options="roles"
                :disabled="isBusy || modelLoadingError || viewOnly || rolesLoadingError"
                :loading="rolesLoading"
                :allow-empty="!!model.restrict"
                :class="{ 'is-invalid': formErrors.fieldError('roles'), 'multiselect-form-control': true }"

              >
                <template #noOptions>
                  {{ $t('settings.roles.nodata') }}
                </template>
                <template v-slot:option="{ option }">
                  {{ $te(`app.role_lables.${option.name}`) ? $t(`app.role_lables.${option.name}`) : option.name }}
                </template>
                <template v-slot:tag="{ option, remove }">
                  <h5 class="inline mr-1 mb-1">
<!--                    ToDo no severity secondary (other options?)-->
                    <Tag severity="warning">
                      {{ $te(`app.role_lables.${option.name}`) ? $t(`app.role_lables.${option.name}`) : option.name }}
                      <span @click="remove(option)"><i
                        class="fa-solid fa-xmark"
                        :aria-label="$t('settings.users.remove_role')"
                      /></span>
                    </Tag>
                  </h5>
                </template>
                <template #afterList>
                  <Button
                    :disabled="rolesLoading || currentRolePage === 1"
                    severity="secondary"
                    outlined
                    @click="loadRoles(Math.max(1, currentRolePage - 1))"
                  >
                    <i class="fa-solid fa-arrow-left" /> {{ $t('app.previous_page') }}
                  </Button>
                  <Button
                    :disabled="rolesLoading || !hasNextRolePage"
                    severity="secondary"
                    outlined
                    @click="loadRoles(currentRolePage + 1)"
                  >
                    <i class="fa-solid fa-arrow-right" /> {{ $t('app.next_page') }}
                  </Button>
                </template>
              </multiselect>
                <Button
                  v-if="rolesLoadingError"
                  ref="reloadRolesButton"
                  severity="secondary"
                  outlined
                  @click="loadRoles(currentRolePage)"
                >
                  <i class="fa-solid fa-sync" />
                </Button>
            </InputGroup>
            <p class="p-error" v-html="formErrors.fieldError('roles')"></p>
          </div>
        </div>

          <hr>
          <div class="grid my-1" >
            <div class="col sm:col-12 flex justify-content-end">
              <Button
                :disabled="isBusy"
                severity="secondary"
                @click="$router.push({ name: 'settings.room_types' })"
              >
                <i class="fa-solid fa-arrow-left" /> {{ $t('app.back') }}
              </Button>
              <Button
                v-if="!viewOnly"
                :disabled="isBusy || modelLoadingError || serverPoolsLoadingError || serverPoolsLoading || rolesLoading || rolesLoadingError"
                severity="success"
                type="submit"
                class="ml-1"
              >
                <i class="fa-solid fa-save" /> {{ $t('app.save') }}
              </Button>
            </div>
          </div>
      </form>
    </b-overlay>

<!--    ToDo-->
    <b-modal
      ref="stale-roomType-modal"
      :static="modalStatic"
      :busy="isBusy"
      ok-variant="danger"
      cancel-variant="secondary"
      :hide-header-close="true"
      :no-close-on-backdrop="true"
      :no-close-on-esc="true"
      :hide-header="true"
      @ok="forceOverwrite"
      @cancel="refreshRoomType"
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
  </div>
</template>

<script setup>
import env from '@/env';
import { useFormErrors } from '@/composables/useFormErrors.js';
import { useApi } from '@/composables/useApi.js';
import {onMounted, ref} from "vue";
import { useRouter } from 'vue-router';
import _ from "lodash";
import { Multiselect } from 'vue-multiselect';

const formErrors = useFormErrors();
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
  },

  modalStatic: {
    type: Boolean,
  default: false
  }
});

const isBusy = ref(false);
const model = ref({
  description:null,
  color:env.ROOM_TYPE_COLORS[0],
  server_pool: null,
  allow_listing: false,
  restrict: false,
  roles: []
});
const roles = ref([]);
const rolesLoading = ref(false);
const currentRolePage = ref(1);
const hasNextRolePage = ref(false);
const colors = env.ROOM_TYPE_COLORS;

const serverPoolsLoading = ref(false);
const serverPools = ref([]);
const currentPage = ref(1);
const hasNextPage = ref(false);

const rolesLoadingError = ref(false);
const modelLoadingError = ref(false);
const staleError = ref({});
const serverPoolsLoadingError = ref(false);
const errors = ref({});

//Todo
const serverPoolMultiselect = ref(null);
const rolesMultiselect = ref(null);

/**
 * Loads the role from the backend and also a part of permissions that can be selected.
 */
onMounted(() =>{
  loadRoomType();
  loadRoles();
  loadServerPools();
});

/**
 * Load the room type from the server api
 *
 */
function loadRoomType(){
  if (props.id !== 'new') {
    isBusy.value = true;

    api.call(`roomTypes/${props.id}`).then(response => {
      model.value = response.data.data;
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
function loadServerPools (page = 1){
  serverPoolsLoading.value = true;

  const config = {
    params: {
      page
    }
  };

  api.call('serverPools', config).then(response => {
    serverPoolsLoadingError.value = false;
    serverPools.value = response.data.data;
    currentPage.value = page;
    hasNextPage.value = page < response.data.meta.last_page;
  }).catch(error => {
    serverPoolMultiselect.value.deactivate();
    serverPoolsLoadingError.value = true;
    api.error(error);
  }).finally(() => {
    serverPoolsLoading.value = false;
  });
}

/**
 * Saves the changes of the room type to the database by making a api call.
 *
 * @param evt
 */
function saveRoomType(evt){
  if (evt) {
    evt.preventDefault();
  }
  isBusy.value = true;

  const config = {
    method: props.id === 'new' ? 'post' : 'put',
    data: _.cloneDeep(model.value)
  };

  config.data.server_pool = config.data.server_pool ? config.data.server_pool.id : null;
  config.data.roles = config.data.roles.map(role => role.id);

  api.call(props.id === 'new' ? 'roomTypes' : `roomTypes/${props.id}`, config).then(() => {
    formErrors.clear();
    router.push({ name: 'settings.room_types' });
  }).catch(error => {
    if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
      formErrors.set(error.response.data.errors);
    } else if (error.response && error.response.status === env.HTTP_STALE_MODEL) {
      // handle stale errors
      staleError.value = error.response.data;
      this.$refs['stale-roomType-modal'].show();
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

/**
 * Force a overwrite of the user in the database by setting the `updated_at` field to the new one.
 */
function forceOverwrite(){
  model.value.updated_at = staleError.value.new_model.updated_at;
  staleError.value = {};
  this.$refs['stale-roomType-modal'].hide();
  saveRoomType();
}

/**
 * Refreshes the current model with the new passed from the stale error response.
 */
function refreshRoomType(){
  model.value = staleError.value.new_model;
  staleError.value = {};
  this.$refs['stale-roomType-modal'].hide();
}

/**
 * Loads the roles for the passed page, that can be selected through the multiselect.
 *
 * @param [page=1] The page to load the roles for.
 */
function loadRoles (page=1){
  rolesLoading.value = true;

  const config = {
    params: {
      page
    }
  };

  api.call('roles', config).then(response => {
    rolesLoadingError.value = false;
    roles.value = response.data.data;
    currentRolePage.value = page;
    hasNextRolePage.value = page < response.data.meta.last_page;
  }).catch(error => {
    rolesMultiselect.value.deactivate();
    rolesLoadingError.value = true;
    api.error(error);
  }).finally(() => {
    rolesLoading.value = false;
  });
}
</script>

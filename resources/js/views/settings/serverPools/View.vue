<template>
  <div>
    <h2>
      {{
        id === 'new' ? $t('settings.server_pools.new') : (
          viewOnly ? $t('settings.server_pools.view', {name: model.name})
            : $t('settings.server_pools.edit', {name: model.name})
        )
      }}
    </h2>
    <Divider/>

    <OverlayComponent :show="isBusy">
      <template #loading>
        <LoadingRetryButton :error="modelLoadingError" @reload="load"></LoadingRetryButton>
      </template>

      <form
        @submit.prevent="saveServerPool"
        :aria-hidden="modelLoadingError"
      >
          <div class="field grid">
            <label for="name" class="col-12 md:col-4 md:mb-0">{{ $t('app.model_name') }}</label>
            <div class="col-12 md:col-8">

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

          <div class="field grid">
            <label for="description" class="col-12 md:col-4 md:mb-0">{{ $t('app.description') }}</label>
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
          <div class="field grid"
          >
            <label for="servers" class="col-12 md:col-4 md:mb-0">{{ $t('app.servers') }}</label>
            <div class="col-12 md:col-8">
              <InputGroup>
                <multiselect
                  id="servers"
                  ref="serversMultiselectRef"
                  v-model="model.servers"
                  :placeholder="$t('settings.server_pools.select_servers')"
                  track-by="id"
                  open-direction="bottom"
                  :multiple="true"
                  :searchable="false"
                  :internal-search="false"
                  :clear-on-select="false"
                  :close-on-select="false"
                  :show-no-results="false"
                  :show-labels="false"
                  :options="servers"
                  :disabled="isBusy || modelLoadingError || serversLoadingError || viewOnly"
                  :loading="serversLoading"
                  :allow-empty="true"
                  :class="{ 'is-invalid': formErrors.fieldInvalid('servers', true), 'multiselect-form-control': true }"
                >
                  <template #noOptions>
                    {{ $t('settings.servers.no_data') }}
                  </template>
                  <template v-slot:option="{ option }">
                    {{ option.name }}
                  </template>
                  <template v-slot:tag="{ option, remove }">
                    <Chip :label="option.name" removable @remove="remove(option)"/>
                  </template>
                  <template #afterList>
                    <Button
                      :disabled="serversLoading || serversCurrentPage === 1"
                      outlined
                      severity="secondary"
                      @click="loadServers(Math.max(1, serversCurrentPage - 1))"
                      icon="fa-solid fa-arrow-left"
                      :label="$t('app.previous_page')"
                    >
                    </Button>
                    <Button
                      :disabled="serversLoading || !serversHasNextPage"
                      outlined
                      severity="secondary"
                      @click="loadServers(serversCurrentPage + 1)"
                      icon="fa-solid fa-arrow-right"
                      :label="$t('app.next_page')"
                    >
                    </Button>
                  </template>
                </multiselect>
                <Button
                  v-if="serversLoadingError"
                  outlined
                  variant="secondary"
                  @click="loadServers(serversCurrentPage)"
                  icon="fa-solid fa-sync"
                >
                </Button>
              </InputGroup>
            </div>
            <p class="p-error" v-html="formErrors.fieldError('servers', true)"></p>
          </div>

          <Divider/>
          <div class="flex justify-content-end">
            <Button
              :disabled="isBusy"
              severity="secondary"
              @click="$router.push({ name: 'settings.server_pools' })"
              icon="fa-solid fa-arrow-left"
              :label="$t('app.back')"
            >
            </Button>
            <Button
              v-if="!viewOnly"
              :disabled="isBusy || modelLoadingError || serversLoadingError || serversLoading"
              severity="success"
              type="submit"
              class="ml-1"
              icon="fa-solid fa-save"
              :label="$t('app.save')"
            ></Button>
          </div>
      </form>
    </OverlayComponent>
    <ConfirmDialog></ConfirmDialog>
  </div>
</template>

<script setup>
import env from '@/env.js';
import { useApi } from '@/composables/useApi.js';
import { useFormErrors } from '@/composables/useFormErrors.js';
import { useConfirm } from 'primevue/useconfirm';
import { Multiselect } from 'vue-multiselect';
import _ from 'lodash';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import ConfirmDialog from 'primevue/confirmdialog';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const formErrors = useFormErrors();
const api = useApi();
const confirm = useConfirm();
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
  servers: []
});
const isBusy = ref(false);
const modelLoadingError = ref(false);

const serversLoading = ref(false);
const servers = ref([]);
const serversCurrentPage = ref(1);
const serversHasNextPage = ref(false);
const serversLoadingError = ref(false);
const serversMultiselectRef = ref(false);

/**
 * Loads the server from the backend
 */
onMounted(() => {
  load();
  loadServers();
});

/**
 * Loads the server pool from the backend
 */
function load () {
  modelLoadingError.value = false;

  if (props.id !== 'new') {
    isBusy.value = true;

    api.call(`serverPools/${props.id}`).then(response => {
      model.value = response.data.data;
    }).catch(error => {
      if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
        router.push({ name: 'settings.server_pools' });
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
 * Loads the servers for the passed page, that can be selected through the multiselect.
 *
 * @param [page=1] The page to load the servers for.
 */
function loadServers (page = 1) {
  serversLoading.value = true;

  const config = {
    params: {
      page
    }
  };

  api.call('servers', config).then(response => {
    serversLoadingError.value = false;
    servers.value = response.data.data;
    serversCurrentPage.value = page;
    serversHasNextPage.value = page < response.data.meta.last_page;
  }).catch(error => {
    serversMultiselectRef.value.deactivate();
    serversLoadingError.value = true;
    api.error(error);
  }).finally(() => {
    serversLoading.value = false;
  });
}

/**
 * Saves the changes of the server pool to the database by making a api call.
 *
 */
function saveServerPool () {
  isBusy.value = true;

  const config = {
    method: props.id === 'new' ? 'post' : 'put',
    data: _.cloneDeep(model.value)
  };

  config.data.servers = config.data.servers.map(server => server.id);

  api.call(props.id === 'new' ? 'serverPools' : `serverPools/${props.id}`, config).then(() => {
    formErrors.clear();
    router.push({ name: 'settings.server_pools' });
  }).catch(error => {
    if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
      formErrors.set(error.response.data.errors);
    } else if (error.response && error.response.status === env.HTTP_STALE_MODEL) {
      // handle stale errors
      handleStaleError(error.response.data);
    } else {
      if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
        router.push({ name: 'settings.server_pools' });
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
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    rejectClass: 'p-button-secondary p-button-outlined',
    rejectLabel: t('app.reload'),
    acceptLabel: t('app.overwrite'),
    accept: () => {
      model.value.updated_at = staleError.new_model.updated_at;
      saveServerPool();
    },
    reject: () => {
      model.value = staleError.new_model;
    }
  });
}
</script>

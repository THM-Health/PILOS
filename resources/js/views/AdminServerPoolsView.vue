<template>
  <div>
    <div class="mb-6 flex justify-end">
      <div v-if="model.id && id !== 'new'" class="flex gap-2">
        <Button
          v-if="!viewOnly && userPermissions.can('view', model)"
          as="router-link"
          :disabled="isBusy"
          :to="{ name: 'admin.server_pools.view', params: { id: model.id } }"
          severity="secondary"
          :label="$t('app.cancel_editing')"
          icon="fa-solid fa-times"
        />
        <Button
          v-if="viewOnly && userPermissions.can('update', model)"
          as="router-link"
          :disabled="isBusy"
          :to="{ name: 'admin.server_pools.edit', params: { id: model.id } }"
          severity="info"
          icon="fa-solid fa-edit"
          :label="$t('app.edit')"
        />
        <SettingsServerPoolsDeleteButton
          v-if="userPermissions.can('delete', model)"
          :id="model.id"
          :name="name"
          @deleted="$router.push({ name: 'admin.server_pools' })"
        >
        </SettingsServerPoolsDeleteButton>
      </div>
    </div>

    <OverlayComponent :show="isBusy">
      <template #loading>
        <LoadingRetryButton
          :error="modelLoadingError"
          @reload="load"
        ></LoadingRetryButton>
      </template>

      <form
        :aria-hidden="modelLoadingError"
        class="flex flex-col gap-4"
        @submit.prevent="saveServerPool"
      >
        <div class="field grid grid-cols-12 gap-4">
          <label for="name" class="col-span-12 md:col-span-4 md:mb-0">{{
            $t("app.model_name")
          }}</label>
          <div class="col-span-12 md:col-span-8">
            <InputText
              id="name"
              v-model="model.name"
              class="w-full"
              type="text"
              :invalid="formErrors.fieldInvalid('name')"
              :disabled="isBusy || modelLoadingError || viewOnly"
            />
            <FormError :errors="formErrors.fieldError('name')" />
          </div>
        </div>
        <div class="field grid grid-cols-12 gap-4">
          <label for="description" class="col-span-12 md:col-span-4 md:mb-0">{{
            $t("app.description")
          }}</label>
          <div class="col-span-12 md:col-span-8">
            <InputText
              id="description"
              v-model="model.description"
              class="w-full"
              type="text"
              :invalid="formErrors.fieldInvalid('description')"
              :disabled="isBusy || modelLoadingError || viewOnly"
            />
            <FormError :errors="formErrors.fieldError('description')" />
          </div>
        </div>
        <div class="field grid grid-cols-12 gap-4">
          <label id="servers-label" class="col-span-12 md:col-span-4 md:mb-0">{{
            $t("app.servers")
          }}</label>
          <div class="col-span-12 md:col-span-8">
            <InputGroup>
              <multiselect
                ref="serversMultiselectRef"
                v-model="model.servers"
                aria-labelledby="servers-label"
                :placeholder="$t('admin.server_pools.select_servers')"
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
                :disabled="
                  isBusy ||
                  modelLoadingError ||
                  serversLoading ||
                  serversLoadingError ||
                  viewOnly
                "
                :loading="serversLoading"
                :allow-empty="true"
                :class="{
                  'is-invalid': formErrors.fieldInvalid('servers', true),
                }"
              >
                <template #noOptions>
                  {{ $t("admin.servers.no_data") }}
                </template>
                <template #option="{ option }">
                  {{ option.name }}
                </template>
                <template #tag="{ option, remove }">
                  <Chip :label="option.name">
                    <span>{{ option.name }}</span>
                    <Button
                      v-if="!viewOnly"
                      severity="contrast"
                      class="h-5 w-5 rounded-full text-sm"
                      icon="fas fa-xmark"
                      :aria-label="
                        $t('admin.server_pools.remove_server', {
                          name: option.name,
                        })
                      "
                      @click="remove(option)"
                    />
                  </Chip>
                </template>
                <template #afterList>
                  <Button
                    :disabled="serversLoading || serversCurrentPage === 1"
                    outlined
                    severity="secondary"
                    icon="fa-solid fa-arrow-left"
                    :label="$t('app.previous_page')"
                    @click="loadServers(Math.max(1, serversCurrentPage - 1))"
                  />
                  <Button
                    :disabled="serversLoading || !serversHasNextPage"
                    outlined
                    severity="secondary"
                    icon="fa-solid fa-arrow-right"
                    :label="$t('app.next_page')"
                    @click="loadServers(serversCurrentPage + 1)"
                  />
                </template>
              </multiselect>
              <Button
                v-if="serversLoadingError"
                outlined
                severity="secondary"
                icon="fa-solid fa-sync"
                @click="loadServers(serversCurrentPage)"
              />
            </InputGroup>
          </div>
          <FormError :errors="formErrors.fieldError('servers', true)" />
        </div>
        <div v-if="!viewOnly">
          <div class="flex justify-end">
            <Button
              :disabled="
                isBusy ||
                modelLoadingError ||
                serversLoadingError ||
                serversLoading
              "
              type="submit"
              icon="fa-solid fa-save"
              :label="$t('app.save')"
            />
          </div>
        </div>
      </form>
    </OverlayComponent>
    <ConfirmDialog></ConfirmDialog>
  </div>
</template>

<script setup>
import env from "../env.js";
import { useApi } from "../composables/useApi.js";
import { useUserPermissions } from "../composables/useUserPermission.js";
import { useFormErrors } from "../composables/useFormErrors.js";
import { useConfirm } from "primevue/useconfirm";
import { Multiselect } from "vue-multiselect";
import _ from "lodash";
import { inject, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import ConfirmDialog from "primevue/confirmdialog";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const userPermissions = useUserPermissions();
const formErrors = useFormErrors();
const api = useApi();
const confirm = useConfirm();
const router = useRouter();
const breakcrumbLabelData = inject("breakcrumbLabelData");

const props = defineProps({
  id: {
    type: [String, Number],
    required: true,
  },

  viewOnly: {
    type: Boolean,
    required: true,
  },
});

const model = ref({
  servers: [],
});
const name = ref("");

watch(
  () => name.value,
  () => {
    breakcrumbLabelData.value = {
      name: name.value,
    };
  },
);

const isBusy = ref(false);
const modelLoadingError = ref(false);

const serversLoading = ref(false);
const servers = ref([]);
const serversCurrentPage = ref(1);
const serversHasNextPage = ref(false);
const serversLoadingError = ref(false);
const serversMultiselectRef = ref(false);

/**
 * Loads the server pool and servers from the backend
 */
onMounted(() => {
  load();
  if (!props.viewOnly) {
    loadServers();
  }
});

/**
 * Loads the server pool from the backend
 */
function load() {
  modelLoadingError.value = false;

  if (props.id !== "new") {
    isBusy.value = true;

    api
      .call(`serverPools/${props.id}`)
      .then((response) => {
        model.value = response.data.data;
        name.value = response.data.data.name;
      })
      .catch((error) => {
        if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
          router.push({ name: "admin.server_pools" });
        } else {
          modelLoadingError.value = true;
        }
        api.error(error);
      })
      .finally(() => {
        isBusy.value = false;
      });
  }
}

/**
 * Loads the servers for the passed page, that can be selected through the multiselect.
 *
 * @param [page=1] The page to load the servers for.
 */
function loadServers(page = 1) {
  serversLoading.value = true;

  const config = {
    params: {
      page,
    },
  };

  api
    .call("servers", config)
    .then((response) => {
      serversLoadingError.value = false;
      servers.value = response.data.data;
      serversCurrentPage.value = page;
      serversHasNextPage.value = page < response.data.meta.last_page;
    })
    .catch((error) => {
      serversMultiselectRef.value.deactivate();
      serversLoadingError.value = true;
      api.error(error);
    })
    .finally(() => {
      serversLoading.value = false;
    });
}

/**
 * Saves the changes of the server pool to the database by making a api call.
 *
 */
function saveServerPool() {
  isBusy.value = true;
  formErrors.clear();

  const config = {
    method: props.id === "new" ? "post" : "put",
    data: _.cloneDeep(model.value),
  };

  config.data.servers = config.data.servers.map((server) => server.id);

  api
    .call(
      props.id === "new" ? "serverPools" : `serverPools/${props.id}`,
      config,
    )
    .then((response) => {
      router.push({
        name: "admin.server_pools.view",
        params: { id: response.data.data.id },
      });
    })
    .catch((error) => {
      if (
        error.response &&
        error.response.status === env.HTTP_UNPROCESSABLE_ENTITY
      ) {
        formErrors.set(error.response.data.errors);
      } else if (
        error.response &&
        error.response.status === env.HTTP_STALE_MODEL
      ) {
        // handle stale errors
        handleStaleError(error.response.data);
      } else {
        if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
          router.push({ name: "admin.server_pools" });
        }

        api.error(error);
      }
    })
    .finally(() => {
      isBusy.value = false;
    });
}

function handleStaleError(staleError) {
  confirm.require({
    message: staleError.message,
    header: t("app.errors.stale_error"),
    icon: "pi pi-exclamation-triangle",
    rejectProps: {
      label: t("app.reload"),
      severity: "secondary",
    },
    acceptProps: {
      label: t("app.overwrite"),
    },
    accept: () => {
      model.value.updated_at = staleError.new_model.updated_at;
      saveServerPool();
    },
    reject: () => {
      model.value = staleError.new_model;
      name.value = staleError.newMember.name;
    },
  });
}
</script>

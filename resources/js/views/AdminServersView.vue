<template>
  <div>
    <div class="mb-6 flex justify-end">
      <div v-if="model.id !== null && id !== 'new'" class="flex gap-2">
        <Button
          v-if="!viewOnly && userPermissions.can('view', model)"
          as="router-link"
          :disabled="isBusy"
          :to="{ name: 'admin.servers.view', params: { id: model.id } }"
          severity="secondary"
          :label="$t('app.cancel_editing')"
          icon="fa-solid fa-times"
        />
        <Button
          v-if="viewOnly && userPermissions.can('update', model)"
          as="router-link"
          :disabled="isBusy"
          :to="{ name: 'admin.servers.edit', params: { id: model.id } }"
          severity="info"
          :label="$t('app.edit')"
          icon="fa-solid fa-edit"
        />
        <SettingsServersDeleteButton
          v-if="userPermissions.can('delete', model) && isDisabled"
          :id="model.id"
          :name="name"
          @deleted="$router.push({ name: 'admin.servers' })"
        ></SettingsServersDeleteButton>
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
        @submit.prevent="saveServer"
      >
        <div class="field grid grid-cols-12 gap-4">
          <label class="col-span-12 md:col-span-4 md:mb-0" for="name">{{
            $t("app.model_name")
          }}</label>
          <div class="col-span-12 md:col-span-8">
            <InputText
              id="name"
              v-model="model.name"
              :disabled="isBusy || modelLoadingError || viewOnly"
              :invalid="formErrors.fieldInvalid('name')"
              class="w-full"
              type="text"
            />
            <FormError :errors="formErrors.fieldError('name')" />
          </div>
        </div>
        <div class="field grid grid-cols-12 gap-4">
          <label class="col-span-12 md:col-span-4 md:mb-0" for="description">{{
            $t("app.description")
          }}</label>
          <div class="col-span-12 md:col-span-8">
            <InputText
              id="description"
              v-model="model.description"
              :disabled="isBusy || modelLoadingError || viewOnly"
              :invalid="formErrors.fieldInvalid('description')"
              class="w-full"
              type="text"
            />
            <FormError :errors="formErrors.fieldError('description')" />
          </div>
        </div>
        <div class="field grid grid-cols-12 gap-4">
          <label class="col-span-12 md:col-span-4 md:mb-0" for="version">{{
            $t("admin.servers.version")
          }}</label>
          <div class="col-span-12 md:col-span-8">
            <InputText
              id="version"
              :disabled="true"
              :value="model.version || '---'"
              class="w-full"
              type="text"
            />
          </div>
        </div>
        <div class="field grid grid-cols-12 gap-4">
          <label class="col-span-12 md:col-span-4 md:mb-0" for="base_url">{{
            $t("admin.servers.base_url")
          }}</label>
          <div class="col-span-12 md:col-span-8">
            <InputText
              id="base_url"
              v-model="model.base_url"
              autocomplete="off"
              placeholder="https://bbb01.example.com/bigbluebutton/"
              :disabled="isBusy || modelLoadingError || viewOnly"
              :invalid="formErrors.fieldInvalid('base_url')"
              class="w-full"
              type="text"
            />
            <FormError :errors="formErrors.fieldError('base_url')" />
          </div>
        </div>
        <div class="field grid grid-cols-12 gap-4">
          <label class="col-span-12 md:col-span-4 md:mb-0" for="secret">{{
            $t("admin.servers.secret")
          }}</label>
          <div class="col-span-12 md:col-span-8">
            <Password
              v-model="model.secret"
              fluid
              input-id="secret"
              :input-props="{ autocomplete: 'off' }"
              :disabled="isBusy || modelLoadingError || viewOnly"
              :invalid="formErrors.fieldInvalid('secret')"
              :feedback="false"
              :toggle-mask="true"
            />
            <FormError :errors="formErrors.fieldError('secret')" />
          </div>
        </div>
        <fieldset class="field grid grid-cols-12 gap-4">
          <legend class="col-span-12 md:col-span-4 md:mb-0">
            {{ $t("admin.servers.strength") }}
          </legend>
          <div class="col-span-12 md:col-span-8">
            <Rating
              v-model="model.strength"
              :cancel="false"
              :disabled="isBusy || modelLoadingError || viewOnly"
              :invalid="formErrors.fieldInvalid('strength')"
              :stars="10"
              aria-describedby="strength-help"
              class="flex justify-between border border-surface-300 px-6 py-3 rounded-border dark:border-surface-700"
            />
            <small id="strength-help">{{
              $t("admin.servers.strength_description")
            }}</small>
            <FormError :errors="formErrors.fieldError('strength')" />
          </div>
        </fieldset>

        <div class="field grid grid-cols-12 gap-4">
          <label id="status-label" class="col-span-12 md:col-span-4 md:mb-0">{{
            $t("admin.servers.status")
          }}</label>
          <div class="col-span-12 md:col-span-8">
            <div>
              <Select
                v-model="model.status"
                aria-labelledby="status-label"
                :options="serverStatusOptions"
                option-label="name"
                option-value="value"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :invalid="formErrors.fieldInvalid('status')"
                class="w-full"
                name="status"
              />
            </div>
            <FormError :errors="formErrors.fieldError('status')" />
          </div>
        </div>

        <div class="field grid grid-cols-12 gap-4">
          <label class="col-span-12 md:col-span-4 md:mb-0" for="healthStatus">{{
            $t("admin.servers.connection")
          }}</label>
          <div class="col-span-12 md:col-span-8">
            <InputGroup>
              <InputText
                id="healthStatus"
                v-model="healthStatus"
                :disabled="true"
                type="text"
              />
              <Button
                :disabled="isBusy || modelLoadingError || checking"
                :label="$t('admin.servers.test_connection')"
                icon="fa-solid fa-link"
                severity="info"
                @click="testConnection()"
              />
            </InputGroup>
            <p v-if="offlineReason" class="text-red-500" role="alert">
              {{ $t("admin.servers.offline_reason." + offlineReason) }}
            </p>
          </div>
        </div>
        <div v-if="!viewOnly">
          <div class="flex justify-end">
            <Button
              :disabled="isBusy || modelLoadingError"
              :label="$t('app.save')"
              icon="fa-solid fa-save"
              type="submit"
            />
          </div>
        </div>
      </form>
      <div
        v-if="
          !modelLoadingError && viewOnly && !isDisabled && model.id !== null
        "
        class="mt-4 flex flex-col gap-4"
      >
        <div class="grid grid-cols-12 gap-4">
          <div class="md:col col-span-12">
            <h3 class="mt-0">
              {{ $t("admin.servers.current_usage") }}
            </h3>
            <Divider />
          </div>
        </div>

        <div class="field grid grid-cols-12 gap-4">
          <label class="col-span-12 md:col-span-4 md:mb-0" for="meetingCount">{{
            $t("admin.servers.meeting_count")
          }}</label>
          <div class="col-span-12 md:col-span-8">
            <InputText
              id="meetingCount"
              v-model="model.meeting_count"
              :disabled="true"
              aria-describedby="meetingCount-help"
              class="w-full"
              type="text"
            />
            <small id="meetingCount-help">{{
              $t("admin.servers.meeting_description")
            }}</small>
          </div>
        </div>
        <div class="field grid grid-cols-12 gap-4">
          <label
            class="col-span-12 md:col-span-4 md:mb-0"
            for="ownMeetingCount"
            >{{ $t("admin.servers.own_meeting_count") }}</label
          >
          <div class="col-span-12 md:col-span-8">
            <InputText
              id="ownMeetingCount"
              v-model="model.own_meeting_count"
              :disabled="true"
              aria-describedby="ownMeetingCount-help"
              class="w-full"
              type="text"
            />
            <small id="ownMeetingCount-help">{{
              $t("admin.servers.own_meeting_description")
            }}</small>
          </div>
        </div>
        <div class="field grid grid-cols-12 gap-4">
          <label
            class="col-span-12 md:col-span-4 md:mb-0"
            for="participantCount"
          >
            {{ $t("admin.servers.participant_count") }}
          </label>
          <div class="col-span-12 md:col-span-8">
            <InputText
              id="participantCount"
              v-model="model.participant_count"
              :disabled="true"
              class="w-full"
              type="text"
            />
          </div>
        </div>
        <div class="field grid grid-cols-12 gap-4">
          <label class="col-span-12 md:col-span-4 md:mb-0" for="videoCount">{{
            $t("admin.servers.video_count")
          }}</label>
          <div class="col-span-12 md:col-span-8">
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
          class="field grid grid-cols-12 gap-4"
        >
          <label class="col-span-12 md:col-span-4 md:mb-0" for="panic">{{
            $t("admin.servers.panic")
          }}</label>
          <div class="col-span-12 md:col-span-8">
            <div>
              <Button
                id="panic"
                :disabled="isBusy || modelLoadingError || checking || panicking"
                :label="$t('admin.servers.panic_server')"
                aria-describedby="panic-help"
                icon="fa-solid fa-exclamation-triangle"
                severity="danger"
                @click="panic()"
              />
            </div>
            <small id="panic-help">{{
              $t("admin.servers.panic_description")
            }}</small>
          </div>
        </div>
      </div>
      <ConfirmDialog></ConfirmDialog>
    </OverlayComponent>
  </div>
</template>
<script setup>
import env from "../env.js";
import { useFormErrors } from "../composables/useFormErrors.js";
import { useApi } from "../composables/useApi.js";
import { useUserPermissions } from "../composables/useUserPermission.js";
import { useRouter } from "vue-router";
import { useConfirm } from "primevue/useconfirm";
import ConfirmDialog from "primevue/confirmdialog";
import { useI18n } from "vue-i18n";
import { computed, inject, onMounted, ref, watch } from "vue";
import { useToast } from "../composables/useToast.js";

const toast = useToast();
const userPermissions = useUserPermissions();
const formErrors = useFormErrors();
const api = useApi();
const router = useRouter();
const confirm = useConfirm();
const { t } = useI18n();
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
  id: null,
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
const checking = ref(false);
const panicking = ref(false);
const health = ref(null);
const isDisabled = ref(false);
const offlineReason = ref(null);

const healthStatus = computed(() => {
  switch (health.value) {
    case -1:
      return t("admin.servers.offline");
    case 0:
      return t("admin.servers.unhealthy");
    case 1:
      return t("admin.servers.online");
    default:
      return t("admin.servers.unknown");
  }
});

const serverStatusOptions = computed(() => {
  return [
    { name: t("admin.servers.enabled"), value: 1 },
    { name: t("admin.servers.draining"), value: 0 },
    { name: t("admin.servers.disabled"), value: -1 },
  ];
});

/**
 * Loads the server from the backend
 */
onMounted(() => {
  load();
});

function panic() {
  panicking.value = true;

  api
    .call(`servers/${props.id}/panic`)
    .then((response) => {
      if (response.status === 200) {
        toast.success(
          t("admin.servers.flash.panic.description", {
            total: response.data.total,
            success: response.data.success,
          }),
          t("admin.servers.flash.panic.title"),
        );
        load();
      }
    })
    .catch((error) => {
      api.error(error);
    })
    .finally(() => {
      panicking.value = false;
    });
}

/**
 * Check if the backend can establish a connection with the passed api details to a bigbluebutton server
 * Based on the result the online status field is updated
 */
function testConnection() {
  checking.value = true;

  const config = {
    method: "post",
    data: {
      base_url: model.value.base_url,
      secret: model.value.secret,
    },
  };

  api
    .call("servers/check", config)
    .then((response) => {
      if (response.data.connection_ok && response.data.secret_ok) {
        health.value = 1;
        offlineReason.value = null;
      } else {
        if (response.data.connection_ok && !response.data.secret_ok) {
          health.value = -1;
          offlineReason.value = "secret";
        } else {
          health.value = -1;
          offlineReason.value = "connection";
        }
      }
    })
    .catch((error) => {
      health.value = null;
      offlineReason.value = null;
      api.error(error);
    })
    .finally(() => {
      checking.value = false;
    });
}

/**
 * Loads the servers from the backend
 */
function load() {
  modelLoadingError.value = false;

  if (props.id !== "new") {
    isBusy.value = true;

    api
      .call(`servers/${props.id}`)
      .then((response) => {
        model.value = response.data.data;
        isDisabled.value = model.value.status === -1;
        name.value = response.data.data.name;
        health.value = model.value.health;
        offlineReason.value = null;
      })
      .catch((error) => {
        if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
          router.push({ name: "admin.servers" });
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
 * Saves the changes of the server to the database by making a api call.
 *
 */
function saveServer() {
  isBusy.value = true;
  formErrors.clear();

  const config = {
    method: props.id === "new" ? "post" : "put",
    data: model.value,
  };

  api
    .call(props.id === "new" ? "servers" : `servers/${props.id}`, config)
    .then((response) => {
      router.push({
        name: "admin.servers.view",
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
          router.push({ name: "admin.servers" });
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
      saveServer();
    },
    reject: () => {
      model.value = staleError.new_model;
      name.value = staleError.new_model.name;
      health.value = model.value.health;
      offlineReason.value = null;
    },
  });
}
</script>

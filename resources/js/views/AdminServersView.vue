<template>
  <div>
    <div class="mb-6 flex justify-end">
      <div v-if="model.id !== null && id !== 'new'" class="flex gap-2">
        <Button
          v-if="!viewOnly && userPermissions.can('view', model)"
          :as="isBusy ? 'button' : 'router-link'"
          :disabled="isBusy"
          :to="{ name: 'admin.servers.view', params: { id: model.id } }"
          severity="secondary"
          :label="$t('app.cancel_editing')"
          icon="fa-solid fa-times"
          data-test="servers-cancel-edit-button"
        />
        <Button
          v-if="viewOnly && userPermissions.can('update', model)"
          :as="isBusy ? 'button' : 'router-link'"
          :disabled="isBusy"
          :to="{ name: 'admin.servers.edit', params: { id: model.id } }"
          severity="info"
          :label="$t('app.edit')"
          icon="fa-solid fa-edit"
          data-test="servers-edit-button"
        />
        <SettingsServersDeleteButton
          v-if="userPermissions.can('delete', model) && isDisabled"
          :id="model.id"
          :name="name"
          :disabled="isBusy"
          @deleted="$router.push({ name: 'admin.servers' })"
          @not-found="$router.push({ name: 'admin.servers' })"
        ></SettingsServersDeleteButton>
      </div>
    </div>

    <OverlayComponent :show="isBusy || modelLoadingError">
      <template #overlay>
        <LoadingRetryButton
          :error="modelLoadingError"
          @reload="load"
        ></LoadingRetryButton>
      </template>

      <Form
        :aria-hidden="modelLoadingError"
        :disabled="isBusy || modelLoadingError"
        class="flex flex-col gap-4"
        @submit="saveServer"
      >
        <div class="field grid grid-cols-12 gap-4" data-test="name-field">
          <label class="col-span-12 md:col-span-4 md:mb-0" for="name">{{
            $t("app.model_name")
          }}</label>
          <div class="col-span-12 md:col-span-8">
            <InputText
              id="name"
              v-model="model.name"
              required
              :disabled="isBusy || modelLoadingError || viewOnly"
              :invalid="formErrors.fieldInvalid('name')"
              class="w-full"
              type="text"
            />
            <FormError :errors="formErrors.fieldError('name')" />
          </div>
        </div>
        <div
          class="field grid grid-cols-12 gap-4"
          data-test="description-field"
        >
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
        <div class="field grid grid-cols-12 gap-4" data-test="version-field">
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
        <div class="field grid grid-cols-12 gap-4" data-test="base-url-field">
          <label class="col-span-12 md:col-span-4 md:mb-0" for="base_url">{{
            $t("admin.servers.base_url")
          }}</label>
          <div class="col-span-12 md:col-span-8">
            <InputText
              id="base_url"
              v-model="model.base_url"
              required
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
        <div class="field grid grid-cols-12 gap-4" data-test="secret-field">
          <label class="col-span-12 md:col-span-4 md:mb-0" for="secret">{{
            $t("admin.servers.secret")
          }}</label>
          <div class="col-span-12 md:col-span-8">
            <Password
              v-model="model.secret"
              fluid
              input-id="secret"
              required
              :input-props="{ autocomplete: 'off' }"
              :disabled="isBusy || modelLoadingError || viewOnly"
              :invalid="formErrors.fieldInvalid('secret')"
              :feedback="false"
              :toggle-mask="true"
            />
            <FormError :errors="formErrors.fieldError('secret')" />
          </div>
        </div>
        <fieldset
          class="field grid grid-cols-12 gap-4"
          data-test="strength-field"
          aria-describedby="strength-help"
        >
          <legend class="col-span-12 md:col-span-4 md:mb-0">
            {{ $t("admin.servers.strength") }}
          </legend>
          <div class="col-span-12 md:col-span-8">
            <Rating
              v-model="model.strength"
              :cancel="false"
              required
              :disabled="isBusy || modelLoadingError || viewOnly"
              :invalid="formErrors.fieldInvalid('strength')"
              :stars="10"
              class="flex justify-between rounded-border border border-surface-300 px-6 py-3 dark:border-surface-600"
              data-test="strength-rating"
              :pt="{
                option: {
                  'data-test': 'strength-rating-option',
                },
              }"
            />
            <small id="strength-help">{{
              $t("admin.servers.strength_description")
            }}</small>
            <FormError :errors="formErrors.fieldError('strength')" />
          </div>
        </fieldset>

        <div class="field grid grid-cols-12 gap-4" data-test="status-field">
          <label id="status-label" class="col-span-12 md:col-span-4 md:mb-0">{{
            $t("admin.servers.status")
          }}</label>
          <div class="col-span-12 md:col-span-8">
            <div>
              <Select
                v-model="model.status"
                aria-labelledby="status-label"
                data-test="status-dropdown"
                :options="serverStatusOptions"
                option-label="name"
                required
                option-value="value"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :invalid="formErrors.fieldInvalid('status')"
                class="w-full"
                name="status"
                :pt="{
                  listContainer: {
                    'data-test': 'status-dropdown-items',
                  },
                  option: {
                    'data-test': 'status-dropdown-option',
                  },
                }"
              />
            </div>
            <FormError :errors="formErrors.fieldError('status')" />
          </div>
        </div>

        <div
          class="field grid grid-cols-12 gap-4"
          data-test="connection-status-always-online-field"
        >
          <label
            for="connection-status-always-online"
            class="col-span-12 items-start md:col-span-4 md:mb-0"
            >{{ $t("admin.servers.connection_status_always_online") }}</label
          >
          <div class="col-span-12 md:col-span-8">
            <div>
              <ToggleSwitch
                v-model="model.connection_status_always_online"
                input-id="connection-status-always-online"
                :invalid="
                  formErrors.fieldInvalid('connection_status_always_online')
                "
                :disabled="isBusy || modelLoadingError || viewOnly"
                aria-describedby="connection-status-always-online-help"
              />
            </div>
            <FormError
              :errors="formErrors.fieldError('connection_status_always_online')"
            />
            <small id="connection-status-always-online-help">{{
              $t("admin.servers.connection_status_always_online_description")
            }}</small>
          </div>
        </div>

        <div
          class="field grid grid-cols-12 gap-4"
          data-test="connection-status-field"
        >
          <label
            class="col-span-12 md:col-span-4 md:mb-0"
            for="connectionStatus"
            >{{ $t("admin.servers.connection") }}</label
          >
          <div class="col-span-12 md:col-span-8">
            <InputGroup>
              <InputText
                id="connectionStatus"
                v-model="connectionStatusLabel"
                :disabled="true"
                type="text"
              />
              <Button
                :disabled="isBusy || modelLoadingError || checking"
                :label="$t('admin.servers.test_connection')"
                icon="fa-solid fa-link"
                severity="info"
                data-test="servers-test-connection-button"
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
              data-test="servers-save-button"
            />
          </div>
        </div>
      </Form>
      <div
        v-if="
          !modelLoadingError && viewOnly && !isDisabled && model.id !== null
        "
        class="mt-4 flex flex-col gap-4"
      >
        <div class="grid grid-cols-12 gap-4">
          <div class="md:col col-span-12">
            <h3 class="mt-0 text-xl font-medium">
              {{ $t("admin.servers.current_usage") }}
            </h3>
            <Divider />
          </div>
        </div>

        <div
          class="field grid grid-cols-12 gap-4"
          data-test="meeting-count-field"
        >
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
        <div
          class="field grid grid-cols-12 gap-4"
          data-test="own-meeting-count-field"
        >
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
        <div
          class="field grid grid-cols-12 gap-4"
          data-test="participant-count-field"
        >
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
        <div
          class="field grid grid-cols-12 gap-4"
          data-test="video-count-field"
        >
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
          data-test="panic-field"
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
                data-test="servers-panic-button"
                @click="panic()"
              />
            </div>
            <small id="panic-help">{{
              $t("admin.servers.panic_description")
            }}</small>
          </div>
        </div>
      </div>
      <ConfirmDialog
        data-test="stale-server-dialog"
        :draggable="false"
        :pt="{
          pcAcceptButton: {
            root: {
              'data-test': 'stale-dialog-accept-button',
            },
          },
          pcRejectButton: {
            root: {
              'data-test': 'stale-dialog-reject-button',
            },
          },
        }"
      ></ConfirmDialog>
    </OverlayComponent>
  </div>
</template>
<script setup>
import { useFormErrors } from "../composables/useFormErrors.js";
import { useApi } from "../composables/useApi.js";
import { useUserPermissions } from "../composables/useUserPermission.js";
import { useRouter } from "vue-router";
import { useConfirm } from "primevue/useconfirm";
import ConfirmDialog from "primevue/confirmdialog";
import { useI18n } from "vue-i18n";
import { computed, inject, onMounted, ref, watch } from "vue";
import { useToast } from "../composables/useToast.js";
import {
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_STALE_MODEL,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
} from "../constants/httpStatusCodes.js";
import * as _ from "lodash-es";

const toast = useToast();
const userPermissions = useUserPermissions();
const formErrors = useFormErrors();
const api = useApi();
const router = useRouter();
const confirm = useConfirm();
const { t } = useI18n();
const breadcrumbLabelData = inject("breadcrumbLabelData");

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
  connection_status_always_online: false,
});
const name = ref("");

watch(
  () => name.value,
  () => {
    breadcrumbLabelData.value = {
      name: name.value,
    };
  },
);

const isBusy = ref(false);
const modelLoadingError = ref(false);
const checking = ref(false);
const panicking = ref(false);
const connectionStatus = ref(null);
const isDisabled = ref(false);
const offlineReason = ref(null);

const connectionStatusLabel = computed(() => {
  switch (connectionStatus.value) {
    case -1:
      return t("admin.servers.offline");
    case 0:
      return t("admin.servers.faulty");
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
    .call(`servers/${props.id}/panic`, { method: "post" })
    .then((response) => {
      if (response.status === 200) {
        toast.success(
          t(
            "admin.servers.flash.panic.description_meetings_total",
            response.data.total,
          ) +
            " " +
            t(
              "admin.servers.flash.panic.description_meetings_successful",
              response.data.success,
            ),
          t("admin.servers.flash.panic.title"),
        );
        load();
      }
    })
    .catch((error) => {
      if (error.response && error.response.status === HTTP_STATUS_NOT_FOUND) {
        router.push({ name: "admin.servers" });
      }
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
        connectionStatus.value = 1;
        offlineReason.value = null;
      } else {
        if (response.data.connection_ok && !response.data.secret_ok) {
          connectionStatus.value = -1;
          offlineReason.value = "secret";
        } else {
          connectionStatus.value = -1;
          offlineReason.value = "connection";
        }
      }
    })
    .catch((error) => {
      connectionStatus.value = null;
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
        connectionStatus.value = model.value.connection_status;
        offlineReason.value = null;
      })
      .catch((error) => {
        if (error.response && error.response.status === HTTP_STATUS_NOT_FOUND) {
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
        error.response.status === HTTP_STATUS_UNPROCESSABLE_ENTITY
      ) {
        formErrors.set(error.response.data.errors);
        api.validationError(error);
      } else if (
        error.response &&
        error.response.status === HTTP_STATUS_STALE_MODEL
      ) {
        // handle stale errors
        handleStaleError(error.response.data);
      } else {
        if (error.response && error.response.status === HTTP_STATUS_NOT_FOUND) {
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
    message: t("app.errors.stale_model", {
      model: t("app.model." + _.snakeCase(model.value.model_name)),
    }),
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
      connectionStatus.value = model.value.connection_status;
      offlineReason.value = null;
    },
  });
}
</script>

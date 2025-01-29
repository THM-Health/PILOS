<template>
  <div>
    <div class="mb-6 flex justify-end">
      <div
        v-if="model.id && id !== 'new' && permissionsLoaded"
        class="flex gap-2"
      >
        <Button
          v-if="!viewOnly && userPermissions.can('view', model)"
          as="router-link"
          severity="secondary"
          :disabled="isBusy"
          :to="{ name: 'admin.roles.view', params: { id: model.id } }"
          :label="$t('app.cancel_editing')"
          icon="fa-solid fa-times"
        />
        <Button
          v-if="viewOnly && userPermissions.can('update', model)"
          as="router-link"
          severity="info"
          :disabled="isBusy"
          :to="{ name: 'admin.roles.edit', params: { id: model.id } }"
          :label="$t('app.edit')"
          icon="fa-solid fa-edit"
        />
        <SettingsRolesDeleteButton
          v-if="userPermissions.can('delete', model)"
          :id="model.id"
          :name="name"
          @deleted="$router.push({ name: 'admin.roles' })"
        />
      </div>
    </div>

    <OverlayComponent
      :show="isBusy || modelLoadingError || permissionsLoadingError"
    >
      <template #overlay>
        <LoadingRetryButton
          :error="modelLoadingError || permissionsLoadingError"
          @reload="load()"
        ></LoadingRetryButton>
      </template>

      <form
        :aria-hidden="modelLoadingError || permissionsLoadingError"
        class="flex flex-col gap-4"
        @submit.prevent="saveRole"
      >
        <div class="field grid grid-cols-12 gap-4">
          <label for="name" class="col-span-12 md:col-span-4">{{
            $t("app.model_name")
          }}</label>
          <div class="col-span-12 md:col-span-8">
            <InputText
              id="name"
              v-model="model.name"
              class="w-full"
              type="text"
              :invalid="formErrors.fieldInvalid('name')"
              :disabled="formFieldsDisabled"
            />
            <FormError :errors="formErrors.fieldError('name')" />
          </div>
        </div>

        <div class="field grid grid-cols-12 gap-4">
          <label for="room-limit" class="col-span-12 items-start md:col-span-4">
            <span class="flex items-center">
              {{ $t("app.room_limit") }}
              <Button
                severity="link"
                class="secondary"
                :disabled="
                  isBusy || modelLoadingError || permissionsLoadingError
                "
                icon="fa-solid fa-circle-info"
                @click="helpRoomLimitModalVisible = true"
              />
            </span>
          </label>
          <div class="col-span-12 md:col-span-8">
            <div
              v-for="option in roomLimitModeOptions"
              :key="option.value"
              class="mb-2"
            >
              <RadioButton
                v-model="roomLimitMode"
                :input-id="option.value"
                :value="option.value"
                :disabled="formFieldsDisabled || model.superuser"
                @change="roomLimitModeChanged(option.value)"
              />
              <label :for="option.value" class="ml-2">{{ option.text }}</label>
            </div>
            <InputNumber
              v-if="roomLimitMode === 'custom'"
              v-model="model.room_limit"
              class="w-full"
              input-id="room-limit"
              mode="decimal"
              show-buttons
              :min="0"
              :invalid="formErrors.fieldInvalid('room_limit')"
              :disabled="formFieldsDisabled"
            />
            <FormError :errors="formErrors.fieldError('room_limit')" />
          </div>
        </div>
        <h3>{{ $t("admin.roles.permissions_title") }}</h3>
        <div
          v-if="!isBusy && Object.keys(permissions).length > 0"
          class="grid grid-cols-12 gap-4"
        >
          <div class="col-span-8">
            <b>{{ $t("admin.roles.permission_name") }}</b>
          </div>
          <div class="col-span-2" style="word-wrap: break-word">
            <b>{{ $t("admin.roles.permission_explicit") }}</b>
          </div>
          <div class="col-span-2" style="word-wrap: break-word">
            <b
              >{{ $t("admin.roles.permission_included") }}
              <i
                v-tooltip="$t('admin.roles.permission_included_help')"
                class="fa-solid fa-circle-info"
            /></b>
          </div>
          <div class="col-span-12 flex flex-col gap-6">
            <Divider class="m-0" />
            <div
              v-for="key in Object.keys(permissions)"
              :key="key"
              class="grid grid-cols-12"
            >
              <div class="col-span-12">
                <b>{{ $t(`admin.roles.permissions.${key}.title`) }}</b>
              </div>
              <div class="col-span-12 flex flex-col gap-2">
                <div
                  v-for="permission in permissions[key]"
                  :key="permission.id"
                  class="grid grid-cols-12 gap-4"
                >
                  <div class="col-span-8">
                    <label :for="permission.name">{{
                      $t(`admin.roles.permissions.${permission.name}`)
                    }}</label>
                    <p
                      class="font-monospace text-sm text-surface-400 dark:text-surface-300"
                    >
                      {{ permission.rawName }}
                    </p>
                  </div>
                  <div class="col-span-2 flex">
                    <Checkbox
                      v-model="model.permissions"
                      :input-id="permission.name"
                      :value="permission.id"
                      :disabled="
                        formFieldsDisabled ||
                        model.superuser ||
                        permission.restricted
                      "
                      :invalid="formErrors.fieldInvalid('permissions', true)"
                    />
                  </div>
                  <div class="col-span-2">
                    <i
                      v-if="includedPermissions.includes(permission.id)"
                      v-tooltip="
                        $t('admin.roles.has_included_permission', {
                          name: $t(
                            `admin.roles.permissions.${permission.name}`,
                          ),
                        })
                      "
                      class="fa-solid fa-check-circle text-green-500"
                    />
                    <i
                      v-else
                      v-tooltip="
                        $t('admin.roles.has_not_included_permission', {
                          name: $t(
                            `admin.roles.permissions.${permission.name}`,
                          ),
                        })
                      "
                      class="fa-solid fa-minus-circle text-red-500"
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
          {{ $t("admin.roles.no_options") }}
        </div>
        <FormError :errors="formErrors.fieldError('permissions', true)" />
        <div v-if="!viewOnly">
          <div class="flex justify-end">
            <Button
              :disabled="formFieldsDisabled"
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
      close-on-escape
      dismissable-mask
      :draggable="false"
      :header="$t('app.room_limit')"
    >
      <div class="overflow-auto">
        <p>{{ $t("admin.roles.room_limit.help_modal.info") }}</p>

        <p class="text-lg font-bold">
          {{ $t("admin.roles.room_limit.help_modal.examples") }}
        </p>
        <table class="p-datatable p-datatable-table">
          <thead class="p-datatable-thead">
            <tr>
              <th scope="col">
                {{ $t("admin.roles.room_limit.help_modal.system_default") }}
              </th>
              <th scope="col">
                {{ $t("admin.roles.room_limit.help_modal.role_a") }}
              </th>
              <th scope="col">
                {{ $t("admin.roles.room_limit.help_modal.role_b") }}
              </th>
              <th scope="col">
                {{ $t("app.room_limit") }}
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
              <td>
                {{ $t("admin.roles.room_limit.help_modal.system_default") }}
              </td>
              <td><raw-text>2</raw-text></td>
              <td><raw-text>5</raw-text></td>
            </tr>
            <tr>
              <td><raw-text>5</raw-text></td>
              <td>
                {{ $t("admin.roles.room_limit.help_modal.system_default") }}
              </td>
              <td><raw-text>10</raw-text></td>
              <td><raw-text>10</raw-text></td>
            </tr>
            <tr>
              <td><raw-text>5</raw-text></td>
              <td>{{ $t("app.unlimited") }}</td>
              <td><raw-text>2</raw-text></td>
              <td>{{ $t("app.unlimited") }}</td>
            </tr>
          </tbody>
        </table>
        <p>{{ $t("admin.roles.room_limit.help_modal.note") }}</p>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import env from "../env.js";
import { useApi } from "../composables/useApi.js";
import { useFormErrors } from "../composables/useFormErrors.js";
import { useRouter } from "vue-router";
import { onMounted, ref, computed, inject, watch } from "vue";
import { useUserPermissions } from "../composables/useUserPermission.js";
import { useSettingsStore } from "../stores/settings";
import { useI18n } from "vue-i18n";
import _ from "lodash";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";

const formErrors = useFormErrors();
const userPermissions = useUserPermissions();
const settingsStore = useSettingsStore();
const confirm = useConfirm();
const { t } = useI18n();
const api = useApi();
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
  name: null,
  room_limit: null,
  permissions: [],
});

const permissionRestrictions = ref([]);

const name = ref("");
watch(
  () => name.value,
  () => {
    breakcrumbLabelData.value = {
      name: name.value,
    };
  },
);

const includedPermissionMap = ref({});
const permissions = ref({});
const permissionsLoaded = ref(false);
const permissionsLoadingError = ref(false);
const roomLimitMode = ref("default");
const busyCounter = ref(0);
const modelLoadingError = ref(false);
const helpRoomLimitModalVisible = ref(false);

/**
 * Options for the room limit mode radio button group.
 */
const roomLimitModeOptions = computed(() => {
  return [
    {
      text: t("admin.roles.room_limit.default", {
        value:
          parseInt(settingsStore.getSetting("room.limit"), 10) === -1
            ? t("app.unlimited").toLowerCase()
            : settingsStore.getSetting("room.limit"),
      }),
      value: "default",
    },
    { text: t("app.unlimited"), value: "unlimited" },
    { text: t("admin.roles.room_limit.custom"), value: "custom" },
  ];
});

/**
 * Calculate what permissions the role gets, based on the select permissions and the permissions that are included
 * in the selected permissions
 */
const includedPermissions = computed(() => {
  return _.uniq(
    model.value.permissions.flatMap((permission) =>
      [permission, includedPermissionMap.value[permission]].flat(),
    ),
  );
});

const formFieldsDisabled = computed(() => {
  return (
    isBusy.value ||
    modelLoadingError.value ||
    props.viewOnly ||
    permissionsLoadingError.value
  );
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
function load() {
  modelLoadingError.value = false;
  loadPermissions();

  if (props.id !== "new") {
    busyCounter.value++;

    api
      .call(`roles/${props.id}`)
      .then((response) => {
        model.value = response.data.data;
        model.value.permissions = model.value.permissions.map(
          (permission) => permission.id,
        );
        name.value = response.data.data.name;
        roomLimitMode.value =
          model.value.room_limit === null
            ? "default"
            : model.value.room_limit === -1
              ? "unlimited"
              : "custom";
      })
      .catch((error) => {
        if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
          router.push({ name: "admin.roles" });
        } else {
          modelLoadingError.value = true;
        }
        api.error(error);
      })
      .finally(() => {
        busyCounter.value--;
      });
  }
}
/**
 * Loads the permissions that can be selected through checkboxes.
 */
function loadPermissions() {
  permissionsLoadingError.value = false;
  busyCounter.value++;

  api
    .call("permissions")
    .then((response) => {
      const newPermissions = {};

      permissionRestrictions.value = response.data.meta.restrictions;

      response.data.data.forEach((permission) => {
        permission.rawName = permission.name;

        permission.restricted = permissionRestrictions.value.some(
          (restriction) => {
            if (restriction === permission.name) {
              return true;
            }

            const restrictionPermission = restriction.split(".", 2)[1];
            const restrictionGroup = restriction.split(".", 2)[0];
            const permissionGroup = permission.name.split(".", 2)[0];

            return (
              restrictionPermission === "*" &&
              permissionGroup === restrictionGroup
            );
          },
        );

        permission.name = permission.name
          .split(".")
          .map((fragment) => _.snakeCase(fragment))
          .join(".");

        const group = permission.name.split(".")[0];

        if (!newPermissions[group]) {
          newPermissions[group] = [];
        }

        newPermissions[group].push(permission);
        includedPermissionMap.value[permission.id] =
          permission.included_permissions;
      });

      // Sort permissions array by custom sort order
      const sortOrder = [
        "rooms",
        "meetings",
        "admin",
        "settings",
        "system",
        "users",
        "roles",
        "room_types",
        "servers",
        "server_pools",
      ];
      sortOrder.forEach((key) => {
        if (newPermissions[key]) {
          permissions.value[key] = newPermissions[key];
          delete newPermissions[key];
        }
      });
      // Add any remaining permissions in alphabetical order
      Object.keys(newPermissions)
        .sort()
        .forEach((key) => {
          permissions.value[key] = newPermissions[key];
        });
      permissionsLoaded.value = true;
    })
    .catch((error) => {
      permissionsLoadingError.value = true;
      api.error(error);
    })
    .finally(() => {
      busyCounter.value--;
    });
}

/**
 * Saves the changes of the role to the database by making a api call.
 *
 */
function saveRole() {
  busyCounter.value++;
  formErrors.clear();

  const config = {
    method: props.id === "new" ? "post" : "put",
    data: {
      name: model.value.name,
      room_limit: model.value.room_limit,
      permissions: model.value.permissions,
      updated_at: model.value.updated_at,
    },
  };

  api
    .call(props.id === "new" ? "roles" : `roles/${props.id}`, config)
    .then((response) => {
      router.push({
        name: "admin.roles.view",
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
        handleStaleError(error.response.data);
      } else {
        if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
          router.push({ name: "admin.roles" });
        }

        api.error(error);
      }
    })
    .finally(() => {
      busyCounter.value--;
    });
}

/**
 * Sets the room_limit on the model depending on the selected radio button.
 *
 * @param value Value of the radio button that was selected.
 */
function roomLimitModeChanged(value) {
  switch (value) {
    case "default":
      model.value.room_limit = null;
      break;
    case "unlimited":
      model.value.room_limit = -1;
      break;
    case "custom":
      model.value.room_limit = 0;
      break;
  }
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
      saveRole();
    },
    reject: () => {
      model.value = staleError.new_model;
      model.value.permissions = model.value.permissions.map(
        (permission) => permission.id,
      );
      name.value = staleError.new_model.name;
      roomLimitMode.value =
        model.value.room_limit === null
          ? "default"
          : model.value.room_limit === -1
            ? "unlimited"
            : "custom";
    },
  });
}
</script>

<template>
  <div>
    <OverlayComponent :show="isBusy || modelLoadingError" :no-center="true">
      <template #overlay>
        <div class="mt-6 flex justify-center">
          <LoadingRetryButton :error="modelLoadingError" @click="getSettings" />
        </div>
      </template>

      <div class="flex flex-col gap-6">
        <AdminPanel :title="$t('admin.streaming.general.title')">
          <form @submit.prevent="updateSettings">
            <fieldset class="grid grid-cols-12 gap-4">
              <legend
                id="default-pause-image-label"
                class="col-span-12 md:col-span-4 md:mb-0"
              >
                {{ $t("admin.streaming.default_pause_image") }}
              </legend>
              <div class="col-span-12 md:col-span-8">
                <SettingsFileSelector
                  v-model:file-url="settings.default_pause_image"
                  v-model:file="defaultPauseImage"
                  v-model:file-deleted="defaultPauseImageDeleted"
                  :disabled="disabled"
                  :readonly="viewOnly"
                  :max-file-size="5000000"
                  show-delete
                  :allowed-extensions="['jpg', 'jpeg', 'png', 'gif', 'svg']"
                  :file-invalid="formErrors.fieldInvalid('default_pause_image')"
                  :file-error="formErrors.fieldError('default_pause_image')"
                />
                <small>{{
                  $t("rooms.streaming.config.pause_image_format")
                }}</small>
              </div>
            </fieldset>

            <div v-if="!viewOnly">
              <div class="mt-6 flex justify-end">
                <Button
                  type="submit"
                  :disabled="
                    disabled || timezonesLoadingError || timezonesLoading
                  "
                  :loading="isBusy"
                  icon="fa-solid fa-save"
                  :label="$t('app.save')"
                />
              </div>
            </div>
          </form>
        </AdminPanel>

        <AdminPanel :title="$t('admin.streaming.room_types.title')">
          <AdminStreamingRoomTypeTable
            v-if="settings.room_types"
            :room-types="settings.room_types"
            @edited="getSettings"
          />
        </AdminPanel>
      </div>
    </OverlayComponent>
  </div>
</template>

<script setup>
import env from "../env";
import { computed, onMounted, ref } from "vue";
import { useApi } from "../composables/useApi.js";
import { useFormErrors } from "../composables/useFormErrors.js";
import { useUserPermissions } from "../composables/useUserPermission.js";
import AdminPanel from "../components/AdminPanel.vue";

const defaultPauseImage = ref(null);
const defaultPauseImageDeleted = ref(false);
const isBusy = ref(false);
const modelLoadingError = ref(false);
const settings = ref({});

const api = useApi();
const formErrors = useFormErrors();
const userPermissions = useUserPermissions();

/**
 * Input fields are disabled
 */
const disabled = computed(() => {
  return viewOnly.value || isBusy.value || modelLoadingError.value;
});

const viewOnly = computed(() => {
  return !userPermissions.can("update", "StreamingPolicy");
});

/**
 * Handle get settings data
 */
function getSettings() {
  modelLoadingError.value = false;
  isBusy.value = true;
  api
    .call("streaming")
    .then((response) => {
      settings.value = response.data.data;
    })
    .catch((error) => {
      api.error(error);
      modelLoadingError.value = true;
    })
    .finally(() => {
      isBusy.value = false;
    });
}

/**
 * Handle update settings data
 *
 */
function updateSettings() {
  isBusy.value = true;
  formErrors.clear();

  // Build form data
  const formData = new FormData();

  if (defaultPauseImage.value !== null) {
    formData.append("default_pause_image", defaultPauseImage.value);
  } else if (defaultPauseImageDeleted.value) {
    formData.append("default_pause_image", "");
  }

  const exclude = ["default_pause_image"];
  Object.keys(settings.value).forEach((key) => {
    if (exclude.includes(key)) {
      return;
    }
    let val = settings.value[key];

    // Since the FormData always strings boolean and empty values must be
    // changed so that they can be handled correctly by the backend.
    if (typeof val === "boolean") {
      val = val ? 1 : 0;
    } else if (val == null) {
      val = "";
    }

    formData.append(key, val);
  });

  formData.append("_method", "PUT");

  api
    .call("streaming", {
      method: "post",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then((response) => {
      defaultPauseImage.value = null;
      defaultPauseImageDeleted.value = false;

      // update form input
      settings.value = response.data.data;
    })
    .catch((error) => {
      if (
        error.response &&
        error.response.status === env.HTTP_UNPROCESSABLE_ENTITY
      ) {
        formErrors.set(error.response.data.errors);
      } else {
        api.error(error);
      }
    })
    .finally(() => {
      isBusy.value = false;
    });
}

onMounted(() => {
  getSettings();
});
</script>

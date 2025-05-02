<template>
  <!-- button -->
  <Button
    :disabled="disabled"
    icon="fa-solid fa-cog"
    severity="contrast"
    :label="$t('rooms.streaming.config.button')"
    data-test="streaming-config-button"
    @click="showConfigModal"
  />

  <!-- modal -->
  <Dialog
    v-model:visible="showModal"
    modal
    data-test="room-streaming-config-dialog"
    :header="$t('rooms.streaming.config.title')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :close-on-escape="!isLoadingAction"
    :dismissable-mask="false"
    :closable="!isLoadingAction"
  >
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          :label="$t('app.cancel')"
          data-test="dialog-cancel-button"
          severity="secondary"
          :disabled="isLoadingAction"
          @click="showModal = false"
        />
        <Button
          v-if="userPermissions.can('manageSettings', props.room)"
          data-test="dialog-save-button"
          :label="$t('app.save')"
          :loading="isLoadingAction"
          :disabled="isLoadingAction || isLoading || modelLoadingError"
          @click="save"
        />
      </div>
    </template>

    <OverlayComponent :show="isLoading || modelLoadingError" :no-center="true">
      <template #overlay>
        <div class="mt-6 flex justify-center">
          <LoadingRetryButton :error="modelLoadingError" @click="loadConfig" />
        </div>
      </template>
      <form class="flex flex-col gap-4" @submit.prevent="save">
        <div
          class="col-span-12 flex flex-col gap-2 md:col-span-6 xl:col-span-3"
          data-test="streaming-enabled-field"
        >
          <label for="streaming-enabled" class="flex items-center">
            {{ $t("rooms.streaming.config.enabled") }}
          </label>
          <ToggleSwitch
            v-model="streamingEnabled"
            :disabled="formDisabled"
            :invalid="formErrors.fieldInvalid('enabled')"
            class="shrink-0"
            input-id="streaming-enabled"
          />
          <FormError :errors="formErrors.fieldError('enabled')" />
        </div>

        <!-- Streaming url -->
        <div
          class="col-span-12 flex flex-col gap-2 md:col-span-6 xl:col-span-3"
          data-test="streaming-url-field"
        >
          <label for="streaming-url" class="mb-2">{{
            $t("rooms.streaming.config.url")
          }}</label>
          <InputText
            id="streaming-url"
            v-model="streamingUrl"
            class="w-full"
            :disabled="formDisabled"
            :invalid="formErrors.fieldInvalid('url')"
          />
          <FormError :errors="formErrors.fieldError('url')" />
        </div>

        <fieldset
          class="grid-rows grid gap-2"
          data-test="streaming-pause-image-field"
        >
          <legend
            id="pause-image-label"
            class="col-span-12 md:col-span-4 md:mb-0"
          >
            {{ $t("rooms.streaming.config.pause_image") }}
          </legend>
          <div class="col-span-12 grid grid-cols-1 gap-2 md:col-span-8">
            <div>
              <div v-if="streamingPauseImageUrl">
                <img
                  :alt="$t('rooms.streaming.config.pause_image')"
                  :src="streamingPauseImageUrl"
                  class="border rounded-border"
                  data-test="streaming-pause-image-preview"
                />
              </div>
              <div v-else-if="roomTypeDefaultPauseImageUrl" class="relative">
                <img
                  :alt="$t('rooms.streaming.config.pause_image')"
                  :src="roomTypeDefaultPauseImageUrl"
                  class="border rounded-border"
                  data-test="streaming-pause-image-room-type-preview"
                />
                <Tag
                  severity="info"
                  class="absolute bottom-2 right-2"
                  :value="$t('rooms.streaming.config.default_pause_image')"
                />
              </div>
              <div v-else-if="systemDefaultPauseImageUrl" class="relative">
                <img
                  :alt="$t('rooms.streaming.config.pause_image')"
                  :src="systemDefaultPauseImageUrl"
                  class="border rounded-border"
                  data-test="streaming-pause-image-system-preview"
                />
                <Tag
                  severity="info"
                  class="absolute bottom-2 right-2"
                  :value="$t('rooms.streaming.config.default_pause_image')"
                />
              </div>
            </div>

            <SettingsFileSelector
              v-model:file-url="streamingPauseImageUrl"
              v-model:file="streamingPauseImageFile"
              v-model:file-deleted="streamingPauseImageDeleted"
              :disabled="formDisabled"
              :max-file-size="5000000"
              :hide-url="true"
              show-delete
              :show-view="false"
              :preview-alt="$t('rooms.streaming.config.pause_image_alt')"
              :allowed-extensions="['jpg', 'jpeg', 'png', 'gif', 'svg']"
              input-id="pause-image"
              :file-invalid="formErrors.fieldInvalid('pause_image')"
              :file-error="formErrors.fieldError('pause_image')"
            />
            <small>{{ $t("rooms.streaming.config.pause_image_format") }}</small>
          </div>
        </fieldset>
      </form>
    </OverlayComponent>
  </Dialog>
</template>

<script setup>
import { useApi } from "../composables/useApi.js";
import { useFormErrors } from "../composables/useFormErrors.js";
import { computed, ref } from "vue";
import env from "../env.js";
import { useUserPermissions } from "../composables/useUserPermission.js";

const props = defineProps({
  room: {
    type: Object,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["saved"]);

const api = useApi();
const formErrors = useFormErrors();
const userPermissions = useUserPermissions();

const showModal = ref(false);

const streamingEnabled = ref(false);
const streamingUrl = ref("");
const streamingPauseImageUrl = ref("");
const streamingPauseImageFile = ref(null);
const streamingPauseImageDeleted = ref(false);

const roomTypeDefaultPauseImageUrl = ref("");
const systemDefaultPauseImageUrl = ref("");

const isLoadingAction = ref(false);
const isLoading = ref(false);
const modelLoadingError = ref(false);

/**
 * show modal
 */
function showConfigModal() {
  formErrors.clear();
  streamingEnabled.value = false;
  streamingUrl.value = "";
  streamingPauseImageUrl.value = "";
  streamingPauseImageFile.value = null;
  streamingPauseImageDeleted.value = false;
  roomTypeDefaultPauseImageUrl.value = "";
  systemDefaultPauseImageUrl.value = "";
  showModal.value = true;
  loadConfig();
}

function loadConfig() {
  modelLoadingError.value = false;
  isLoading.value = true;
  formErrors.clear();

  api
    .call(`rooms/${props.room.id}/streaming/config`)
    .then((response) => {
      // set data
      streamingEnabled.value = response.data.data.enabled;
      streamingUrl.value = response.data.data.url;
      streamingPauseImageUrl.value = response.data.data.pause_image;
      roomTypeDefaultPauseImageUrl.value =
        response.data.data.room_type_default_pause_image;
      systemDefaultPauseImageUrl.value =
        response.data.data.system_default_pause_image;
    })
    .catch((error) => {
      api.error(error);
      modelLoadingError.value = true;
    })
    .finally(() => {
      isLoading.value = false;
    });
}

/**
 * Sends a request to the server to create a new token or edit a existing.
 */
function save() {
  isLoadingAction.value = true;
  formErrors.clear();

  const formData = new FormData();
  formData.append("enabled", streamingEnabled.value ? "1" : "0");
  formData.append("url", streamingUrl.value);

  if (streamingPauseImageFile.value) {
    formData.append("pause_image", streamingPauseImageFile.value);
  } else if (streamingPauseImageDeleted.value) {
    formData.append("pause_image", "");
  }

  formData.append("_method", "PUT");

  api
    .call(`rooms/${props.room.id}/streaming/config`, {
      method: "POST",
      data: formData,
    })
    .then(() => {
      // operation successful, close modal and reload list
      showModal.value = false;
      emit("saved");
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
      isLoadingAction.value = false;
    });
}

/**
 * Input fields are disabled: due to limited permissions, loading of settings or errors
 */
const formDisabled = computed(() => {
  return (
    !userPermissions.can("manageSettings", props.room) ||
    isLoading.value ||
    isLoadingAction.value ||
    modelLoadingError.value
  );
});
</script>

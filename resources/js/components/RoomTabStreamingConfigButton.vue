<template>
  <!-- button -->
  <Button
    :disabled="disabled"
    icon="fa-solid fa-cog"
    severity="contrast"
    :label="$t('rooms.streaming.config.button')"
    @click="showConfigModal"
  />

  <!-- modal -->
  <Dialog
    v-model:visible="showModal"
    modal
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
          severity="secondary"
          :disabled="isLoadingAction"
          @click="showModal = false"
        />
        <Button
          :label="$t('app.save')"
          :loading="isLoadingAction"
          :disabled="isLoadingAction || isLoading"
          @click="save"
        />
      </div>
    </template>

    <OverlayComponent :show="isLoading">
      <form class="flex flex-col gap-4" @submit.prevent="save">
        <div
          class="col-span-12 flex flex-col gap-2 md:col-span-6 xl:col-span-3"
          data-test="streaming-enabled-setting"
        >
          <label for="streaming-enabled" class="flex items-center">
            {{ $t("rooms.streaming.config.enabled") }}
          </label>
          <ToggleSwitch
            v-model="streamingEnabled"
            :disabled="disabled || isLoadingAction || isLoading"
            :invalid="formErrors.fieldInvalid('streaming_enabled')"
            class="shrink-0"
            input-id="streaming-enabled"
          />
          <FormError :errors="formErrors.fieldError('streaming_enabled')" />
        </div>

        <!-- Streaming url -->
        <div
          class="col-span-12 flex flex-col gap-2 md:col-span-6 xl:col-span-3"
          data-test="streaming-url"
        >
          <label for="streaming-url" class="mb-2">{{
            $t("rooms.streaming.config.url")
          }}</label>
          <InputText
            id="streaming-url"
            v-model="streamingUrl"
            class="w-full"
            :disabled="disabled || isLoadingAction || isLoading"
            :invalid="formErrors.fieldInvalid('streaming_url')"
          />
          <FormError :errors="formErrors.fieldError('streaming_url')" />
        </div>

        <fieldset class="grid-rows grid gap-2">
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
                />
              </div>
              <div v-else-if="roomTypeDefaultPauseImageUrl" class="relative">
                <img
                  :alt="$t('rooms.streaming.config.pause_image')"
                  :src="roomTypeDefaultPauseImageUrl"
                  class="border rounded-border"
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
              :disabled="disabled || isLoadingAction || isLoading"
              :max-file-size="5000000"
              :hide-url="true"
              show-delete
              :show-view="false"
              :preview-alt="$t('rooms.streaming.config.pause_image_alt')"
              :allowed-extensions="['jpg', 'jpeg', 'png', 'gif', 'svg']"
              input-id="pause-image"
              :file-invalid="formErrors.fieldInvalid('streaming_pause_image')"
              :file-error="formErrors.fieldError('streaming_pause_image')"
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
import { ref } from "vue";
import env from "../env.js";

const props = defineProps({
  roomId: {
    type: String,
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
  isLoading.value = true;
  formErrors.clear();

  api
    .call(`rooms/${props.roomId}/streaming/config`)
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
      api.error(error, { noRedirectOnUnauthenticated: true });
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
  formData.append("streaming_enabled", streamingEnabled.value ? "1" : "0");

  if (streamingUrl.value) formData.append("streaming_url", streamingUrl.value);

  if (streamingPauseImageFile.value) {
    formData.append("streaming_pause_image", streamingPauseImageFile.value);
  } else if (streamingPauseImageDeleted.value) {
    formData.append("streaming_pause_image", "");
  }

  formData.append("_method", "PUT");

  api
    .call(`rooms/${props.roomId}/streaming/config`, {
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
        api.error(error, { noRedirectOnUnauthenticated: true });
      }
    })
    .finally(() => {
      isLoadingAction.value = false;
    });
}
</script>

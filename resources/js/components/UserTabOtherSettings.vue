<template>
  <div>
    <AdminPanel :title="$t('admin.users.bbb')">
      <form v-if="model" class="flex flex-col gap-4" @submit="save">
        <div
          class="field grid grid-cols-12 gap-4"
          data-test="bbb-skip-check-audio-field"
        >
          <label
            for="bbb_skip_check_audio"
            class="col-span-12 mb-2 md:col-span-3 md:mb-0"
            >{{ $t("admin.users.skip_check_audio") }}</label
          >
          <div class="col-span-12 md:col-span-9">
            <ToggleSwitch
              v-model="model.bbb_skip_check_audio"
              input-id="bbb_skip_check_audio"
              required
              :disabled="isBusy || viewOnly"
              :invalid="formErrors.fieldInvalid('bbb_skip_check_audio')"
            />
            <FormError
              :errors="formErrors.fieldError('bbb_skip_check_audio')"
            />
          </div>
        </div>
        <div
          class="field grid grid-cols-12 gap-4"
          data-test="consent_to_presence_recording-field"
        >
          <label
            for="consent_to_presence_recording"
            class="col-span-12 mb-2 md:col-span-3 md:mb-0"
            >{{ $t("admin.users.consent_to_presence_recording") }}</label
          >
          <div class="col-span-12 md:col-span-9">
            <ToggleSwitch
              v-model="model.consent_to_presence_recording"
              input-id="consent_to_presence_recording"
              required
              :disabled="isBusy || viewOnly"
              :invalid="formErrors.fieldInvalid('consent_to_presence_recording')"
            />
            <FormError
              :errors="formErrors.fieldError('consent_to_presence_recording')"
            />
          </div>
        </div>


        <div
          class="field grid grid-cols-12 gap-4"
          data-test="consent_to_recording-field"
        >
          <label
            for="consent_to_recording"
            class="col-span-12 mb-2 md:col-span-3 md:mb-0"
            >{{ $t("admin.users.consent_to_recording") }}</label
          >
          <div class="col-span-12 md:col-span-9">
            <ToggleSwitch
              v-model="model.consent_to_recording"
              input-id="consent_to_recording"
              required
              :disabled="isBusy || viewOnly"
              :invalid="formErrors.fieldInvalid('consent_to_recording')"
            />
            <FormError
              :errors="formErrors.fieldError('consent_to_recording')"
            />
          </div>
        </div>

        <div
          class="field grid grid-cols-12 gap-4"
          data-test="consent-to-recording-image-field"
        >
          <label
            for="consent_to_recording_image"
            class="col-span-12 mb-2 md:col-span-3 md:mb-0"
            >{{ $t("admin.users.consent_to_recording_image") }}</label
          >
          <div class="col-span-12 md:col-span-9">
            <ToggleSwitch
              v-model="model.consent_to_recording_image"
              input-id="consent_to_recording_image"
              required
              :disabled="isBusy || viewOnly"
              :invalid="formErrors.fieldInvalid('consent_to_recording_image')"
            />
            <FormError
              :errors="formErrors.fieldError('consent_to_recording_image')"
            />
          </div>
        </div>

        <div class="flex justify-end">
          <Button
            v-if="!viewOnly"
            :disabled="isBusy"
            type="submit"
            :loading="isBusy"
            icon="fa-solid fa-save"
            :label="$t('app.save')"
            data-test="user-tab-others-save-button"
          />
        </div>
      </form>
    </AdminPanel>
  </div>
</template>

<script setup>
import env from "../env";
import _ from "lodash";
import { useApi } from "../composables/useApi.js";
import { useFormErrors } from "../composables/useFormErrors.js";
import { onBeforeMount, ref, watch } from "vue";

const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
  viewOnly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["updateUser", "notFoundError", "staleError"]);

const model = ref(null);
const isBusy = ref(false);

const api = useApi();
const formErrors = useFormErrors();

watch(
  () => props.user,
  (user) => {
    model.value = _.cloneDeep(user);
  },
  { deep: true },
);

onBeforeMount(() => {
  model.value = _.cloneDeep(props.user);
});

/**
 * Saves the changes of the user to the database by making a api call.
 *
 */
function save(event) {
  if (event) {
    event.preventDefault();
  }

  isBusy.value = true;
  formErrors.clear();

  api
    .call("users/" + model.value.id, {
      method: "POST",
      data: {
        _method: "PUT",
        updated_at: model.value.updated_at,
        bbb_skip_check_audio: model.value.bbb_skip_check_audio,
        consent_to_presence_recording: model.value.consent_to_presence_recording,
        consent_to_recording: model.value.consent_to_recording,
        consent_to_recording_image: model.value.consent_to_recording_image,
      },
    })
    .then((response) => {
      emit("updateUser", response.data.data);
    })
    .catch((error) => {
      if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
        emit("notFoundError", error);
      } else if (
        error.response &&
        error.response.status === env.HTTP_UNPROCESSABLE_ENTITY
      ) {
        // Validation errors
        formErrors.set(error.response.data.errors);
      } else if (
        error.response &&
        error.response.status === env.HTTP_STALE_MODEL
      ) {
        // Stale error
        emit("staleError", error.response.data);
      } else {
        // Other errors
        api.error(error);
      }
    })
    .finally(() => {
      isBusy.value = false;
    });
}
</script>

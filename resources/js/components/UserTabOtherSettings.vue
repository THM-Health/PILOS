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
          data-test="record-agreement-field"
        >
          <label
            for="record_agreement"
            class="col-span-12 mb-2 md:col-span-3 md:mb-0"
            >{{ $t("admin.users.record_agreement") }}</label
          >
          <div class="col-span-12 md:col-span-9">
            <ToggleSwitch
              v-model="model.record_agreement"
              input-id="record_agreement"
              required
              :disabled="isBusy || viewOnly"
              :invalid="formErrors.fieldInvalid('record_agreement')"
            />
            <FormError
              :errors="formErrors.fieldError('record_agreement')"
            />
          </div>
        </div>


        <div
          class="field grid grid-cols-12 gap-4"
          data-test="record-video-agreement-field"
        >
          <label
            for="record_video_agreement"
            class="col-span-12 mb-2 md:col-span-3 md:mb-0"
            >{{ $t("admin.users.record_video_agreement") }}</label
          >
          <div class="col-span-12 md:col-span-9">
            <ToggleSwitch
              v-model="model.record_video_agreement"
              input-id="record_video_agreement"
              required
              :disabled="isBusy || viewOnly"
              :invalid="formErrors.fieldInvalid('record_video_agreement')"
            />
            <FormError
              :errors="formErrors.fieldError('record_video_agreement')"
            />
          </div>
        </div>

        <div
          class="field grid grid-cols-12 gap-4"
          data-test="record-attendance-agreement-field"
        >
          <label
            for="record_attendance_agreement"
            class="col-span-12 mb-2 md:col-span-3 md:mb-0"
            >{{ $t("admin.users.record_attendance_agreement") }}</label
          >
          <div class="col-span-12 md:col-span-9">
            <ToggleSwitch
              v-model="model.record_attendance_agreement"
              input-id="record_attendance_agreement"
              required
              :disabled="isBusy || viewOnly"
              :invalid="formErrors.fieldInvalid('record_attendance_agreement')"
            />
            <FormError
              :errors="formErrors.fieldError('record_attendance_agreement')"
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
import { useAuthStore } from "../stores/auth";
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

const authStore = useAuthStore();

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
        record_agreement: model.value.record_agreement,
        record_video_agreement: model.value.record_video_agreement,
        record_attendance_agreement: model.value.record_attendance_agreement,
      },
    })
    .then(async (response) => {
      if (
        authStore.currentUser &&
        model.value.id === authStore.currentUser.id
      ) {
        await authStore.getCurrentUser();
      }
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

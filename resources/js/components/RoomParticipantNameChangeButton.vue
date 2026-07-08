<template>
  <Button
    icon="fa-solid fa-user-edit"
    :label="$t('rooms.change_participant_name')"
    data-test="change-participant-name-button"
    severity="secondary"
    @click="showChangeNameModal"
  />

  <Dialog
    v-model:visible="changeNameModalVisible"
    data-test="room-change-participant-name-dialog"
    modal
    :header="$t('rooms.change_participant_name')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :dismissable-mask="false"
  >
    <Form id="changeNameForm" @submit="changeParticipantName">
      <div class="field flex flex-col gap-2" data-test="participant-name-field">
        <label for="participant-name">{{
          $t("rooms.first_and_lastname")
        }}</label>
        <InputText
          id="participant-name"
          v-model="participantNameInput"
          :disabled="loading"
          :invalid="formErrors.fieldInvalid('name')"
        />
        <div class="flex items-center gap-2">
          <Checkbox
            v-model="rememberParticipantNameInput"
            :disabled="loading"
            input-id="remember-participant-name"
            binary
          />
          <label for="remember-participant-name">
            {{ $t("rooms.remember_participant_name") }}
          </label>
        </div>
        <FormError :errors="formErrors.fieldError('name')" />
      </div>
    </Form>
    <template #footer>
      <div class="flex shrink-0 justify-end gap-2">
        <Button
          :label="$t('app.cancel')"
          :disabled="loading"
          data-test="dialog-cancel-button"
          severity="secondary"
          @click="changeNameModalVisible = false"
        />
        <Button
          :label="$t('app.save')"
          data-test="dialog-save-button"
          type="submit"
          :loading="loading"
          form="changeNameForm"
        />
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import { onMounted, ref } from "vue";
import { useApi } from "../composables/useApi.js";
import { useFormErrors } from "../composables/useFormErrors.js";
import { HTTP_STATUS_UNPROCESSABLE_ENTITY } from "../constants/httpStatusCodes.js";

const emit = defineEmits(["participantNameChanged"]);

const props = defineProps({
  participantName: {
    type: String,
    required: true,
  },
});

const rememberParticipantName = defineModel("rememberParticipantName", {
  type: Boolean,
  default: false,
});

const api = useApi();
const formErrors = useFormErrors();
const changeNameModalVisible = ref(false);
const participantNameInput = ref("");
const rememberParticipantNameInput = ref(false);
const loading = ref(false);

onMounted(() => {
  participantNameInput.value = props.participantName;
  rememberParticipantNameInput.value = rememberParticipantName.value;
});

function showChangeNameModal() {
  formErrors.clear();
  participantNameInput.value = props.participantName;
  rememberParticipantNameInput.value = rememberParticipantName.value;
  changeNameModalVisible.value = true;
}

function changeParticipantName() {
  loading.value = true;
  formErrors.clear();

  api
    .call("participantName/check", {
      method: "post",
      data: {
        name: participantNameInput.value,
      },
    })
    .then(() => {
      rememberParticipantName.value = rememberParticipantNameInput.value;
      emit("participantNameChanged", participantNameInput.value);

      changeNameModalVisible.value = false;
    })
    .catch((error) => {
      if (
        error.response &&
        error.response.status === HTTP_STATUS_UNPROCESSABLE_ENTITY
      ) {
        formErrors.set(error.response.data.errors);
        return;
      }

      api.error(error);
    })
    .finally(() => {
      loading.value = false;
    });
}
</script>

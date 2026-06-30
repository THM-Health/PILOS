<template>
  <Button
    icon="fa-solid fa-user-edit"
    :label="$t('rooms.change_participant_name')"
    class="justify-self-end"
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
          v-model="newParticipantName"
          :invalid="newParticipantNameInvalid"
        />
        <div class="flex items-center gap-2">
          <Checkbox
            v-model="rememberParticipantNameInput"
            input-id="remember-participant-name"
            binary
          />
          <label for="remember-participant-name">
            {{ $t("rooms.remember_participant_name") }}
          </label>
        </div>
        <div
          v-if="newParticipantNameInvalid"
          ref="formError"
          tabindex="-1"
          class="form-error mt-2 flex flex-col font-semibold text-red-500 dark:text-red-300"
          role="alert"
        >
          <div class="flex items-baseline gap-1">
            <i
              class="fas fa-exclamation-circle shrink-0 grow-0"
              aria-hidden="true"
            ></i>
            <span>{{ participantNameErrorMessage }}</span>
          </div>
        </div>
      </div>
    </Form>
    <template #footer>
      <div class="flex shrink-0 justify-end gap-2">
        <Button
          :label="$t('app.cancel')"
          data-test="dialog-cancel-button"
          severity="secondary"
          @click="changeNameModalVisible = false"
        />
        <Button
          :label="$t('app.save')"
          data-test="dialog-save-button"
          type="submit"
          form="changeNameForm"
        />
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import { computed, onMounted, ref, watch } from "vue";
import {
  getParticipantNameValidationErrorMessage,
  validateParticipantName,
} from "../composables/useRoomHelpers.js";

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

const changeNameModalVisible = ref(false);
const newParticipantName = ref("");
const newParticipantNameValidation = ref({
  valid: true,
  reason: null,
  invalidChars: "",
});
const rememberParticipantNameInput = ref(false);

const newParticipantNameInvalid = computed(
  () => !newParticipantNameValidation.value.valid,
);

onMounted(() => {
  newParticipantName.value = props.participantName;
  rememberParticipantNameInput.value = rememberParticipantName.value;
});

function showChangeNameModal() {
  newParticipantName.value = props.participantName;
  newParticipantNameValidation.value = {
    valid: true,
    reason: null,
    invalidChars: "",
  };
  rememberParticipantNameInput.value = rememberParticipantName.value;

  changeNameModalVisible.value = true;
}

function changeParticipantName() {
  const participantNameValidation = validateParticipantName(
    newParticipantName.value,
  );

  if (participantNameValidation.valid === false) {
    newParticipantNameValidation.value = participantNameValidation;
  } else {
    newParticipantNameValidation.value = {
      valid: true,
      reason: null,
      invalidChars: "",
    };
    rememberParticipantName.value = rememberParticipantNameInput.value;
    emit("participantNameChanged", newParticipantName.value);

    changeNameModalVisible.value = false;
  }
}

watch(newParticipantName, () => {
  newParticipantNameValidation.value = validateParticipantName(
    newParticipantName.value,
  );
});

const participantNameErrorMessage = computed(() => {
  return getParticipantNameValidationErrorMessage(
    newParticipantNameValidation.value,
  );
});
</script>

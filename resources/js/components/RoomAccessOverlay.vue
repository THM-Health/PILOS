<template>
  <Card
    style="width: 500px; max-width: 90vw"
    :pt="{ header: { class: 'flex justify-center' } }"
    data-test="room-access-overlay"
  >
    <template #header>
      <Badge
        severity="danger"
        class="-mt-8 flex !h-16 !w-16 items-center justify-center rounded-full"
      >
        <i class="fa-solid fa-lock text-2xl text-white"></i>
      </Badge>
    </template>
    <template #content>
      <RoomHeader
        :room="room"
        :loading="loading"
        :details-inline="false"
        :hide-favorites="true"
        :hide-membership="true"
        :disable-reload="authThrottledFor > 0"
        :bbb-errors="bbbErrors"
        :bbb-reason="bbbReason"
        @reload="emit('reload')"
      />

      <div
        v-if="!authStore.isAuthenticated"
        class="mt-4 flex w-full flex-col gap-2"
      >
        <Button
          data-test="room-login-as-user-button"
          icon="fa-solid fa-right-to-bracket"
          :label="$t('auth.offer_login')"
          as="router-link"
          :to="{ name: 'login', query: { redirect: $route.path } }"
        />

        <Divider class="m-1">{{ $t("app.or").toUpperCase() }}</Divider>
      </div>

      <Form :disabled="authThrottledFor > 0" @submit="submit">
        <div
          v-if="!authStore.isAuthenticated"
          class="field flex flex-col gap-2"
          data-test="participant-name-field"
        >
          <label for="participant-name">{{
            $t("rooms.first_and_lastname")
          }}</label>
          <InputText
            id="participant-name"
            v-model="participantNameInput"
            :disabled="authThrottledFor > 0"
            :invalid="participantNameInvalid"
          />

          <div class="flex items-center gap-2">
            <Checkbox
              v-model="rememberParticipantName"
              input-id="remember-participant-name"
              :disabled="authThrottledFor > 0"
              binary
            />
            <label for="remember-participant-name">
              {{ $t("rooms.remember_participant_name") }}
            </label>
          </div>

          <div
            v-if="participantNameInvalid"
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

        <div
          v-if="!room.authenticated"
          class="field mt-4 flex flex-col gap-2"
          data-test="access-code-field"
        >
          <label for="access-code">{{ $t("rooms.access_code") }}</label>
          <InputMask
            id="access-code"
            v-model="accessCodeInput"
            autofocus
            :mask="room.legacy_code ? '******' : '999-999-999'"
            :placeholder="room.legacy_code ? '123abc' : '123-456-789'"
            :invalid="
              accessCodeInvalid || formErrors.fieldInvalid('access_code')
            "
            :disabled="authThrottledFor > 0"
            class="text-center"
            @keydown.enter="submit"
          />
          <FormError :errors="formErrors.fieldError('access_code')" />
          <div
            v-if="authThrottledFor > 0"
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
              <span>{{
                $t("rooms.auth_throttled", { try_again: authThrottledFor })
              }}</span>
            </div>
          </div>

          <div
            v-else-if="accessCodeInvalid"
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
              <span>{{ $t("rooms.flash.access_code_invalid") }}</span>
            </div>
          </div>
        </div>

        <Button
          class="mt-6 w-full"
          type="submit"
          :loading="loading"
          :label="
            authStore.isAuthenticated
              ? $t('app.continue')
              : $t('rooms.continue_as_guest')
          "
          data-test="room-login-button"
          :disabled="authThrottledFor > 0 || loading"
        />
      </Form>
    </template>
  </Card>
</template>

<script setup>
import RoomHeader from "./RoomHeader.vue";
import { useAuthStore } from "../stores/auth.js";
import { computed, onMounted, ref, watch } from "vue";
import {
  getParticipantNameValidationErrorMessage,
  validateParticipantName,
} from "../composables/useRoomHelpers.js";
import { useI18n } from "vue-i18n";

const emit = defineEmits(["submit", "reload"]);
defineProps({
  room: {
    type: Object,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  authThrottledFor: {
    type: Number,
    default: 0,
  },
  accessCodeInvalid: {
    type: Boolean,
    default: false,
  },
  formErrors: {
    type: Object,
    required: true,
  },
  bbbErrors: {
    type: String,
    default: null,
  },
  bbbReason: {
    type: String,
    default: null,
  },
});

const accessCode = defineModel("accessCode", {
  type: String,
  default: "",
});

const participantName = defineModel("participantName", {
  type: String,
  default: "",
});

const rememberParticipantName = defineModel("rememberParticipantName", {
  type: Boolean,
  default: false,
});

const participantNameValidation = ref({
  valid: true,
  reason: null,
  invalidChars: "",
});
const participantNameInput = ref("");
const accessCodeInput = ref("");

const authStore = useAuthStore();
const { t } = useI18n();
const participantNameInvalid = computed(
  () => !participantNameValidation.value.valid,
);

onMounted(() => {
  participantNameInput.value = participantName.value;
  accessCodeInput.value = accessCode.value;
});

function submit() {
  const validation = validateParticipantName(participantNameInput.value);

  if (!authStore.isAuthenticated && validation.valid === false) {
    participantNameValidation.value = validation;
  } else {
    participantNameValidation.value = {
      valid: true,
      reason: null,
      invalidChars: "",
    };
    accessCode.value = accessCodeInput.value;
    participantName.value = participantNameInput.value;
    emit("submit");
  }
}

watch(participantNameInput, () => {
  participantNameValidation.value = validateParticipantName(
    participantNameInput.value,
  );
});

const participantNameErrorMessage = computed(() => {
  return getParticipantNameValidationErrorMessage(
    participantNameValidation.value,
    t,
  );
});
</script>

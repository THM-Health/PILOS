<template>
  <Card
    style="width: 500px; max-width: 90vw"
    :pt="{ header: { class: 'flex justify-center' } }"
    data-test="room-access-overlay"
  >
    <template #header>
      <Badge
        v-if="!room.authenticated"
        severity="danger"
        class="-mt-8 flex !h-16 !w-16 items-center justify-center rounded-full"
      >
        <i class="fa-solid fa-lock text-2xl text-white"></i>
      </Badge>
    </template>
    <template #content>
      <RoomHeader
        :room="room"
        :loading="loading || isLoadingAction"
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
            :invalid="formErrors.fieldInvalid('name')"
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

          <FormError :errors="formErrors.fieldError('name')" />
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
          <FormError :errors="accessCodeErrors" />
        </div>

        <Button
          class="mt-6 w-full"
          type="submit"
          :loading="loading || isLoadingAction"
          :label="
            authStore.isAuthenticated
              ? $t('app.continue')
              : $t('rooms.continue_as_guest')
          "
          data-test="room-login-button"
          :disabled="authThrottledFor > 0 || loading || isLoadingAction"
        />
      </Form>
    </template>
  </Card>
</template>

<script setup>
import RoomHeader from "./RoomHeader.vue";
import { useAuthStore } from "../stores/auth.js";
import { computed, onMounted, ref } from "vue";
import { useApi } from "../composables/useApi.js";
import { HTTP_STATUS_UNPROCESSABLE_ENTITY } from "../constants/httpStatusCodes.js";
import { useI18n } from "vue-i18n";

const emit = defineEmits(["submit", "reload"]);
const props = defineProps({
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
const participantNameInput = ref("");
const accessCodeInput = ref("");
const isLoadingAction = ref(false);

const authStore = useAuthStore();
const api = useApi();
const { t } = useI18n();

const accessCodeErrors = computed(() => {
  if (props.authThrottledFor > 0) {
    return [t("rooms.auth_throttled", { try_again: props.authThrottledFor })];
  }

  if (props.accessCodeInvalid) {
    return [t("rooms.flash.access_code_invalid")];
  }

  return [];
});

onMounted(() => {
  participantNameInput.value = participantName.value;
  accessCodeInput.value = accessCode.value;
});

function submit() {
  if (authStore.isAuthenticated) {
    accessCode.value = accessCodeInput.value;
    emit("submit");
    return;
  }

  props.formErrors.clear();
  isLoadingAction.value = true;

  api
    .call("participantName/check", {
      method: "post",
      data: {
        name: participantNameInput.value,
      },
    })
    .then(() => {
      accessCode.value = accessCodeInput.value;
      participantName.value = participantNameInput.value;
      emit("submit");
    })
    .catch((error) => {
      if (
        error.response &&
        error.response.status === HTTP_STATUS_UNPROCESSABLE_ENTITY
      ) {
        props.formErrors.set(error.response.data.errors);
        return;
      }

      api.error(error);
    })
    .finally(() => {
      isLoadingAction.value = false;
    });
}
</script>

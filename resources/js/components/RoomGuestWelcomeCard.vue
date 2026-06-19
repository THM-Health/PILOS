<template>
  <Card :pt:body:class="'p-3'">
    <template #content>
      <!-- ToDo test alternative layouts-->
      <div class="mx-4 grid grid-cols-3 items-center">
        <RoomRoleBadge class="justify-self-start" :role="roomRole" />
        <div class="text-center">
          Hello
          {{ guestName }}!
        </div>
        <Button
          v-if="allowNameChange"
          icon="fa-solid fa-user-edit"
          :label="$t('rooms.change_guest_name')"
          class="justify-self-end"
          @click="showChangeNameModal"
        />
      </div>
    </template>
  </Card>

  <Dialog
    v-model:visible="changeNameModalVisible"
    data-test="room-change-name-dialog"
    modal
    :header="$t('rooms.change_guest_name')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :dismissable-mask="false"
  >
    <Form id="changeNameForm" @submit="changeGuestName">
      <div class="field flex flex-col gap-2" data-test="guest-name-field">
        <label for="guest-name">{{ $t("rooms.first_and_lastname") }}</label>
        <InputText id="guest-name" v-model="newGuestName" />
        <div class="flex items-center gap-2">
          <Checkbox
            v-model="rememberGuestNameInput"
            input-id="remember-guest-name"
            binary
          />
          <label for="remember-guest-name">
            {{ $t("rooms.remember_guest_name") }}
          </label>
        </div>
        <div
          v-if="newGuestNameInvalid"
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
            <span>{{ $t("rooms.flash.guest_name_invalid") }}</span>
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
import { onMounted, ref } from "vue";

const emit = defineEmits(["guestNameChanged"]);

const props = defineProps({
  guestName: {
    type: String,
    required: true,
  },
  allowNameChange: {
    type: Boolean,
    default: false,
  },
  roomRole: {
    type: Number,
    default: 0,
  },
});

const rememberGuestName = defineModel("rememberGuestName", {
  type: Boolean,
  default: false,
});

const changeNameModalVisible = ref(false);
const newGuestName = ref("");
const newGuestNameInvalid = ref(false);
const rememberGuestNameInput = ref(false);

onMounted(() => {
  newGuestName.value = props.guestName;
  rememberGuestNameInput.value = rememberGuestName.value;
});

function showChangeNameModal() {
  newGuestName.value = props.guestName;
  newGuestNameInvalid.value = false;
  rememberGuestNameInput.value = rememberGuestName.value;

  changeNameModalVisible.value = true;
}

function changeGuestName() {
  if (newGuestName.value.trim().length === 0) {
    newGuestNameInvalid.value = true;
  } else {
    rememberGuestName.value = rememberGuestNameInput.value;
    emit("guestNameChanged", newGuestName.value);

    changeNameModalVisible.value = false;
  }
}
</script>

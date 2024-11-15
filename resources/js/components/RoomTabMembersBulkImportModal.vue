<template>
  <!-- bulk add new user modal -->
  <Dialog
    v-model:visible="modalVisible"
    data-test="room-members-bulk-import-dialog"
    modal
    :header="$t('rooms.members.bulk_import_users')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :close-on-escape="!isLoadingAction"
    :dismissable-mask="false"
    :closable="!isLoadingAction"
    :pt="{
      pcCloseButton: {
        root: {
          'data-test': 'dialog-header-close-button',
        },
      },
    }"
  >
    <template #footer>
      <div
        v-if="step === 0"
        class="flex w-full flex-col justify-end gap-2 sm:flex-row"
      >
        <Button
          :disabled="rawList.length === 0 || isLoadingAction"
          :loading="isLoadingAction"
          :label="$t('rooms.members.modals.add.add')"
          data-test="dialog-continue-button"
          @click="importUsers(true)"
        />
      </div>

      <div
        v-if="step === 1"
        class="flex w-full flex-col justify-end gap-2 sm:flex-row"
      >
        <Button
          :disabled="isLoadingAction"
          severity="secondary"
          :label="$t('app.back')"
          data-test="dialog-back-button"
          @click="step = 0"
        />
        <Button
          v-if="validUsers.length > 0"
          :disabled="isLoadingAction"
          :loading="isLoadingAction"
          :label="
            $t('rooms.members.modals.bulk_import.import_importable_button')
          "
          data-test="dialog-continue-button"
          @click="importUsers(false)"
        />
      </div>

      <div
        v-if="step === 2"
        class="flex w-full flex-col justify-end gap-2 sm:flex-row"
      >
        <Button
          :label="$t('app.close')"
          data-test="dialog-close-button"
          @click="finish"
        />
        <Button
          v-if="invalidUsers.length > 0"
          severity="secondary"
          :label="$t('rooms.members.modals.bulk_import.copy_and_close')"
          data-test="room-members-copy-and-close-button"
          @click="copyInvalidUsers"
        />
      </div>
    </template>

    <div v-if="step === 0">
      <div class="mt-6 flex flex-col gap-2">
        <label for="user-emails">{{
          $t("rooms.members.modals.bulk_import.label")
        }}</label>
        <Textarea
          id="user-emails"
          v-model="rawList"
          autofocus
          aria-describedby="user-emails-help"
          :disabled="isLoadingAction"
          :placeholder="$t('rooms.members.modals.bulk_import.list_placeholder')"
          :invalid="formErrors.fieldInvalid('user_emails')"
          rows="8"
        />
        <small id="user-emails-help">{{
          $t("rooms.members.modals.bulk_import.list_description")
        }}</small>
        <FormError :errors="formErrors.fieldError('user_emails')" />
      </div>
      <!-- select role -->
      <div class="mt-6 flex flex-col gap-2">
        <fieldset class="flex w-full flex-col gap-2">
          <legend>{{ $t("rooms.role") }}</legend>

          <div class="flex items-center" data-test="participant-role-group">
            <RadioButton
              v-model="newUsersRole"
              :disabled="isLoadingAction"
              input-id="participant-role"
              name="role"
              :value="1"
            />
            <label for="participant-role" class="ml-2"
              ><RoomRoleBadge :role="1"
            /></label>
          </div>

          <div class="flex items-center" data-test="moderator-role-group">
            <RadioButton
              v-model="newUsersRole"
              :disabled="isLoadingAction"
              input-id="moderator-role"
              name="role"
              :value="2"
            />
            <label for="moderator-role" class="ml-2"
              ><RoomRoleBadge :role="2"
            /></label>
          </div>

          <div class="flex items-center" data-test="co-owner-role-group">
            <RadioButton
              v-model="newUsersRole"
              :disabled="isLoadingAction"
              input-id="co_owner-role"
              name="role"
              :value="3"
            />
            <label for="co_owner-role" class="ml-2"
              ><RoomRoleBadge :role="3"
            /></label>
          </div>

          <FormError :errors="formErrors.fieldError('role')" />
        </fieldset>
      </div>
    </div>

    <div v-if="step === 1">
      <RoomTabMembersBulkImportList
        :list="validUsers"
        variant="success"
        :description="$t('rooms.members.modals.bulk_import.can_import_users')"
      />

      <RoomTabMembersBulkImportList
        :list="invalidUsers"
        variant="danger"
        :description="
          $t('rooms.members.modals.bulk_import.cannot_import_users')
        "
      />

      <i v-if="validUsers.length > 0">
        {{
          $t("rooms.members.modals.bulk_import.import_importable_question")
        }}</i
      >
    </div>
    <div v-if="step === 2">
      <RoomTabMembersBulkImportList
        :list="validUsers"
        variant="success"
        :description="$t('rooms.members.modals.bulk_import.imported_users')"
      />

      <RoomTabMembersBulkImportList
        :list="invalidUsers"
        variant="danger"
        :description="
          $t('rooms.members.modals.bulk_import.could_not_import_users')
        "
      />
    </div>
  </Dialog>
</template>

<script setup>
import _ from "lodash";
import env from "../env";
import { useFormErrors } from "../composables/useFormErrors.js";
import { useToast } from "../composables/useToast.js";
import { useI18n } from "vue-i18n";
import { ref } from "vue";
import { useApi } from "../composables/useApi.js";

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

const emit = defineEmits(["imported"]);

const step = ref(0);
const rawList = ref("");
const newUsersRole = ref(1);
const modalVisible = ref(false);

const validUsers = ref([]);
const invalidUsers = ref([]);
const isLoadingAction = ref(false);

const formErrors = useFormErrors();
const toast = useToast();
const api = useApi();
const { t } = useI18n();

defineExpose({
  showModal,
});

/**
 * show modal to bulk import users
 */
function showModal() {
  step.value = 0;
  rawList.value = "";
  formErrors.clear();
  modalVisible.value = true;
}

/**
 * close modal to bulk import users
 */
function finish() {
  modalVisible.value = false;
}

/**
 * copy the invalid users and close the modal to bulk import users
 */
function copyInvalidUsers() {
  const invalidUsersEmails = invalidUsers.value.map(
    (invalidUser) => invalidUser.email,
  );
  navigator.clipboard.writeText(invalidUsersEmails.join("\n"));
  toast.info(t("rooms.members.modals.bulk_import.copied_invalid_users"));
  finish();
}

/**
 * init the valid users with the emails that were entered by the user
 */
function initValidUsers() {
  // get content from the textarea and remove unnecessary characters (' ', '\t', '\n' except the separator)
  const transferList = rawList.value
    .replaceAll(" ", "")
    .replaceAll("\t", "")
    .replaceAll(/^[\n?\r]+/gm, "")
    .toLowerCase();
  const usersEmailList = _.uniq(transferList.split(/\r?\n/));
  // delete last element of the email list if it is empty
  if (usersEmailList.at(usersEmailList.length - 1) === "") {
    usersEmailList.splice(usersEmailList.length - 1, 1);
  }
  // clear valid users and add the emails that were entered by the user
  validUsers.value = [];
  usersEmailList.forEach((email) => {
    validUsers.value.push({ email, error: null });
  });
  // clear invalid users
  invalidUsers.value = [];
}

/**
 * bulk import users
 * @param firstRound
 */
function importUsers(firstRound = false) {
  formErrors.clear();

  // initialize list of valid and invalid users on first request sent to the server
  // all subsequent requests only modify list of valid/invalid users
  if (firstRound) {
    initValidUsers();
  }
  const userEmails = validUsers.value.map((entry) => entry.email);
  isLoadingAction.value = true;

  // post new users as room members
  api
    .call("rooms/" + props.roomId + "/member/bulk", {
      method: "post",
      data: { user_emails: userEmails, role: newUsersRole.value },
    })
    .then(() => {
      // operation successful, go to the last step and emit "imported" to reload member list
      step.value = 2;
      emit("imported");
    })
    .catch((error) => {
      // adding failed
      if (error.response) {
        if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          // check for role errors
          if (error.response.data.errors.role) {
            formErrors.set(error.response.data.errors);

            return;
          }
          // check for general errors with user list (empty, too long)
          if (error.response.data.errors.user_emails) {
            formErrors.set({
              user_emails: error.response.data.errors.user_emails,
            });

            return;
          }

          // check for errors for the single emails
          const regex = /^user_emails\.([0-9]+)$/;
          Object.keys(error.response.data.errors).forEach((errorKey) => {
            const result = errorKey.match(regex);
            const index = result[1];
            // userEmails contains the array send to the server,
            // by using the index of the error the server returned, the email causing the error can be looked up
            const email = userEmails[index];
            // remove email from the list of valid emails
            validUsers.value = validUsers.value.filter(
              (entry) => entry.email !== email,
            );
            // get error message for this email
            const errorString = error.response.data.errors[errorKey][0];
            // add email to the list of invalid emails
            invalidUsers.value.push({ email, error: errorString });
            step.value = 1;
          });
          return;
        }
      }
      api.error(error, { noRedirectOnUnauthenticated: true });
    })
    .finally(() => {
      isLoadingAction.value = false;
    });
}
</script>

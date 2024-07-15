<template>
  <!-- bulk add new user modal -->
  <Dialog
    v-model:visible="showModal"
    modal
    :header="$t('rooms.members.bulk_import_users')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :closeOnEscape="!isLoadingAction"
    :dismissableMask="false"
    :closable="!isLoadingAction"
  >
    <template #footer>
      <div class="flex justify-end w-full flex-col sm:flex-row gap-2" v-if="step === 0">
        <Button
          :disabled="rawList.length === 0 || isLoadingAction"
          @click="importUsers(true)"
          :loading="isLoadingAction"
          :label="$t('rooms.members.modals.add.add')"
        />
      </div>

      <div class="flex justify-end w-full flex-col sm:flex-row gap-2" v-if="step === 1">
        <Button
          :disabled="isLoadingAction"
          severity="secondary"
          @click="step = 0"
          :label="$t('app.back')"
        />
        <Button
          v-if="validUsers.length > 0"
          :disabled="isLoadingAction"
          @click="importUsers(false)"
          :loading="isLoadingAction"
          :label="$t('rooms.members.modals.bulk_import.import_importable_button')"
        />
      </div>

      <div class="flex justify-end w-full flex-col sm:flex-row gap-2" v-if="step === 2">
        <Button
          @click="finish"
          :label="$t('app.close')"
        />
        <Button
          v-if="invalidUsers.length>0"
          severity="secondary"
          @click="copyInvalidUsers"
          :label="$t('rooms.members.modals.bulk_import.copy_and_close')"
        />
      </div>
    </template>

    <div v-if="step === 0">
      <div class="flex flex-col gap-2 mt-6">
        <label for="user-emails">{{ $t('rooms.members.modals.bulk_import.label') }}</label>
        <Textarea
          v-model="rawList"
          :disabled="isLoadingAction"
          :placeholder="$t('rooms.members.modals.bulk_import.list_placeholder')"
          :invalid="formErrors.fieldInvalid('user_emails')"
          rows="8"
        />
        <small id="user-emails-help">{{ $t('rooms.members.modals.bulk_import.list_description') }}</small>
        <FormError :errors="formErrors.fieldError('user_emails')" />
      </div>
      <!-- select role -->
      <div class="flex flex-col gap-2 mt-6">
        <label for="role">{{ $t('rooms.role') }}</label>

        <div class="flex items-center">
          <RadioButton v-model="newUsersRole" inputId="participant-role" name="role" :value="1" />
          <label for="participant-role" class="ml-2"><RoomRoleBadge :role="1" /></label>
        </div>

        <div class="flex items-center">
          <RadioButton v-model="newUsersRole" inputId="participant-moderator" name="role" :value="2" />
          <label for="participant-moderator" class="ml-2"><RoomRoleBadge :role="2" /></label>
        </div>

        <div class="flex items-center">
          <RadioButton v-model="newUsersRole" inputId="participant-co_owner" name="role" :value="3" />
          <label for="participant-co_owner" class="ml-2"><RoomRoleBadge :role="3" /></label>
        </div>

        <FormError :errors="formErrors.fieldError('role')" />
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
        :description="$t('rooms.members.modals.bulk_import.cannot_import_users')"
      />

      <i v-if="validUsers.length>0">
        {{ $t('rooms.members.modals.bulk_import.import_importable_question') }}</i>
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
        :description="$t('rooms.members.modals.bulk_import.could_not_import_users')"
      />
    </div>
  </Dialog>
</template>

<script setup>

import _ from 'lodash';
import env from '../env';
import { useFormErrors } from '../composables/useFormErrors.js';
import { useToast } from '../composables/useToast.js';
import { useI18n } from 'vue-i18n';
import { ref } from 'vue';
import { useApi } from '../composables/useApi.js';

const props = defineProps({
  roomId: {
    type: String,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['imported']);

const step = ref(0);
const rawList = ref('');
const newUsersRole = ref(1);
const showModal = ref(false);

const validUsers = ref([]);
const invalidUsers = ref([]);
const isLoadingAction = ref(false);

const formErrors = useFormErrors();
const toast = useToast();
const api = useApi();
const { t } = useI18n();

defineExpose({
  openModal
});

/**
 * show modal to bulk import users
 */
function openModal () {
  step.value = 0;
  rawList.value = '';
  formErrors.clear();
  showModal.value = true;
}

/**
 * close modal to bulk import users
 */
function finish () {
  showModal.value = false;
}

/**
 * copy the invalid users and close the modal to bulk import users
 */
function copyInvalidUsers () {
  const invalidUsersEmails = invalidUsers.value.map(invalidUser => invalidUser.email);
  navigator.clipboard.writeText(invalidUsersEmails.join('\n'));
  toast.info(t('rooms.members.modals.bulk_import.copied_invalid_users'));
  finish();
}

/**
 * init the valid users with the emails that were entered by the user
 */
function initValidUsers () {
  // get content from the textarea and remove unnecessary characters (' ', '\t', '\n' except the separator)
  const transferList = rawList.value
    .replaceAll(' ', '')
    .replaceAll('\t', '')
    .replaceAll(/^[\n?\r]+/gm, '')
    .toLowerCase();
  const usersEmailList = _.uniq(transferList.split(/\r?\n/));
  // delete last element of the email list if it is empty
  if (usersEmailList.at(usersEmailList.length - 1) === '') {
    usersEmailList.splice(usersEmailList.length - 1, 1);
  }
  // clear valid users and add the emails that were entered by the user
  validUsers.value = [];
  usersEmailList.forEach(email => {
    validUsers.value.push({ email, error: null });
  });
  // clear invalid users
  invalidUsers.value = [];
}

/**
 * bulk import users
 * @param firstRound
 */
function importUsers (firstRound = false) {
  formErrors.clear();

  // initialize list of valid and invalid users on first request sent to the server
  // all subsequent requests only modify list of valid/invalid users
  if (firstRound) { initValidUsers(); }
  const userEmails = validUsers.value.map(entry => entry.email);
  isLoadingAction.value = true;

  // post new users as room members
  api.call('rooms/' + props.roomId + '/member/bulk', {
    method: 'post',
    data: { user_emails: userEmails, role: newUsersRole.value }
  }).then(response => {
    // operation successful, go to the last step and emit "imported" to reload member list
    step.value = 2;
    emit('imported');
  }).catch(error => {
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
          formErrors.set({ user_emails: error.response.data.errors.user_emails });

          return;
        }

        // check for errors for the single emails
        const regex = /^user_emails\.([0-9]+)$/;
        Object.keys(error.response.data.errors).forEach(errorKey => {
          const result = errorKey.match(regex);
          const index = result[1];
          // userEmails contains the array send to the server,
          // by using the index of the error the server returned, the email causing the error can be looked up
          const email = userEmails[index];
          // remove email from the list of valid emails
          validUsers.value = validUsers.value.filter(entry => entry.email !== email);
          // get error message for this email
          const errorString = error.response.data.errors[errorKey][0];
          // add email to the list of invalid emails
          invalidUsers.value.push({ email, error: errorString });
          step.value = 1;
        });
        return;
      }
    }
    api.error(error);
  }).finally(() => {
    isLoadingAction.value = false;
  });
}
</script>

<template>
  <div>
    <div v-if="userPermissions.can('manageSettings', room)" class="flex gap-2 justify-content-end mb-3">
      <Button
        v-if="!editorOpen"
        severity="secondary"
        :disabled="isBusy"
        @click="edit"
        icon="fa-solid fa-edit"
        :label="$t('rooms.description.edit')"
      />
      <Button
        v-if="editorOpen"
        severity="success"
        :disabled="isBusy"
        @click="save"
        icon="fa-solid fa-save"
        :label="$t('rooms.description.save')"
      />
      <Button
        v-if="editorOpen"
        severity="secondary"
        :disabled="isBusy"
        @click="cancel"
        icon="fa-solid fa-times"
        :label="$t('rooms.description.cancel')"
      />
    </div>

    <OverlayComponent :show="isBusy">
      <div
        v-if="!editorOpen"
      >
        <RoomTabDescriptionViewer
          v-if="room.description !== null"
          :html="sanitizedHtml"
        />
        <div v-else>
          <InlineMessage severity="info">{{ $t('rooms.description.missing') }}</InlineMessage>
        </div>
      </div>

      <div v-else>
        <TipTapEditor
          v-model="newContent"
          :class="{'is-invalid': formErrors.fieldInvalid('description') === false}"
          :disabled="isBusy"
        />
        <p class="p-error" v-if="formErrors.fieldInvalid('description')"
          v-html="formErrors.fieldError('description')"
        />
      </div>
    </OverlayComponent>
  </div>
</template>

<script setup>
import env from '../env';
import createDOMPurify from 'dompurify';
import { ref, computed } from 'vue';
import { useFormErrors } from '../composables/useFormErrors.js';
import { useApi } from '../composables/useApi.js';
import { useUserPermissions } from '../composables/useUserPermission.js';

const props = defineProps({
  room: Object
});

const emit = defineEmits(['settingsChanged']);

const editorOpen = ref(false);
const newContent = ref('');
const isBusy = ref(false);

const api = useApi();
const formErrors = useFormErrors();
const userPermissions = useUserPermissions();

// Create a new DOMPurify instance
const domPurify = createDOMPurify();

const sanitizedHtml = computed(() => {
  return domPurify.sanitize(props.room.description, { USE_PROFILES: { html: true } });
});

/**
 * Open the editor
 */
function edit () {
  editorOpen.value = true;
  newContent.value = props.room.description;
}

/**
 * Save the new description and close the editor
 */
function save () {
  // Set saving indicator
  isBusy.value = true;

  const data = {
    description: newContent.value
  };

  // Send new description to the server
  api.call('rooms/' + props.room.id + '/description', {
    method: 'put',
    data
  }).then(() => {
    // Description successfully saved
    // inform parent component about changed description
    emit('settingsChanged');
    formErrors.clear();
    editorOpen.value = false;
  }).catch((error) => {
    // Description couldn't be saved due to validation errors
    if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
      formErrors.set(error.response.data.errors);
      return;
    }
    // Handle other errors
    api.error(error);
  }).finally(() => {
    // Disable saving indicator
    isBusy.value = false;
  });
}

/**
     * Cancel editing / close the editor
     */
function cancel () {
  editorOpen.value = false;
}
</script>

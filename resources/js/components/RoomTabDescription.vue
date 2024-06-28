<template>
  <div class="px-2">
    <div v-if="userPermissions.can('manageSettings', room)" class="flex gap-2 justify-content-end mb-3">
      <Button
        v-if="!editorOpen"
        severity="secondary"
        :disabled="isBusy"
        @click="edit"
        icon="fa-solid fa-edit"
        :label="$t('app.edit')"
      />
      <Button
        v-if="editorOpen"
        severity="secondary"
        :disabled="isBusy"
        @click="cancel"
        icon="fa-solid fa-times"
        :label="$t('app.cancel_editing')"
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
          <InlineNote>{{ $t('rooms.description.missing') }}</InlineNote>
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
    <div class="flex justify-content-end mt-2">
      <Button
        v-if="editorOpen"
        severity="success"
        :disabled="isBusy"
        @click="save"
        icon="fa-solid fa-save"
        :label="$t('rooms.description.save')"
      />
    </div>
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

// Add a hook to sanitize the style attribute
domPurify.addHook(
  'uponSanitizeAttribute',
  function (currentNode, hookEvent, config) {
    if (hookEvent.attrName === 'style') {
      hookEvent.attrValue = sanitizeCss(currentNode);
    }
    if (hookEvent.attrName === 'src') {
      hookEvent.attrValue = sanitizeSrc(currentNode);
    }
  }
);

/**
 * Sanitize the CSS of a given node. It checks each style property of the node
 * and removes those that are not in the allowlist or have invalid values.
 * @param {Object} node - The DOM node whose style properties are to be sanitized.
 * @returns {string} - The sanitized CSS as a string.
 */
function sanitizeCss (node) {
  // Regular expressions for the css properties
  const colorRegex = /^#([0-9a-fA-F]{3,6})|(rgb\(([\d ]+),([\d ]+),([\d ]+)\))|(inherit)$/i;
  const textAlignRegex = /^(left|right|center)$/i;

  // Allowlist of allowed CSS properties and their validation regex
  const cssAllowlist = {
    color: colorRegex,
    'background-color': colorRegex,
    'text-align': textAlignRegex
  };

  // Loop through each style property of the node
  for (let i = node.style.length; i--;) {
    const name = node.style[i];
    // If the property is not in the allowlist, remove it
    if (!Object.prototype.hasOwnProperty.call(cssAllowlist, name)) {
      node.style.removeProperty(name);
    } else {
      // If the property is in the allowlist but its value is invalid, remove it
      const value = node.style.getPropertyValue(name);
      if (!cssAllowlist[name].test(value)) {
        node.style.removeProperty(name);
      }
    }
  }

  // Return the sanitized CSS
  return node.style.cssText;
}

/**
 * Sanitize the src attribute of a given node. It checks if the src attribute is a valid URL.
 * @param {Object} node - The DOM node whose src attribute is to be sanitized.
 * @returns {string} - The sanitized src attribute as a string.
 */
function sanitizeSrc (node) {
  if (node.src.startsWith('https://')) {
    return node.src;
  }
  node.remove();
  return '';
}

/**
 * Get sanitized HTML of the room description.
 * It uses the DOMPurify library to sanitize the HTML, allowing only certain tags and attributes.
 * @returns {string} - The sanitized HTML as a string.
 */
const sanitizedHtml = computed(() => {
  // List of allowed HTML tags
  const allowedTags = ['h1', 'h2', 'h3', 'p', 'a', 'img', 'ul', 'ol', 'li', 'strong', 'em', 'u', 's', 'span', 'blockquote', 'mark'];
  // List of allowed HTML attributes
  const allowedAttributes = ['alt', 'src', 'width', 'href', 'style'];

  // Use DOMPurify to sanitize the HTML, allowing only the specified tags and attributes
  return domPurify.sanitize(props.room.description, { ALLOWED_TAGS: allowedTags, ALLOWED_ATTR: allowedAttributes, ALLOW_DATA_ATTR: false, ALLOW_ARIA_ATTR: false });
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

<script setup>
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
const { te } = useI18n();
const router = useRouter();
const route = useRoute();

const props = defineProps({
  reason: {
    type: String,
    default: null,
  },
  errors: {
    type: String,
    default: null,
  },
});

// Handle closing the reason message
const closeReasonMessage = () => {
  // Remove the reason in the URL query parameter
  router.replace({
    query: { ...route.query, reason: undefined },
  });
};

// Parse the errors from the URL query parameter
const errorMessages = ref(null);
try {
  if (props.errors) {
    const parsed = JSON.parse(props.errors);
    if (Array.isArray(parsed)) {
      // Remove all errors that are unknown to the localization system
      errorMessages.value = parsed
        .filter((e) => typeof e === "object" && e && "key" in e)
        .filter((e) => te("rooms.bbb_error_message." + e.key));
    }
  }
} catch {
  // Ignore parsing errors
}

// Handle closing of an error message
const closeErrorMessage = (errorToRemove) => {
  // Remove the error from the list of error messages
  errorMessages.value = errorMessages.value.filter(
    (error) => error.key !== errorToRemove.key,
  );

  if (errorMessages.value.length === 0) {
    errorMessages.value = null;
  }
};

// Update the query parameters when the error messages change
// to prevent the error messages from being lost on page reload
watch(errorMessages, (errors) => {
  router.replace({
    query: {
      ...route.query,
      errors: errors ? JSON.stringify(errors) : undefined,
    },
  });
});
</script>

<template>
  <!-- Show reason meeting was ended -->
  <Message
    v-if="reason"
    data-test="room-meeting-ended-reason"
    class="mb-3"
    closable
    @close="closeReasonMessage"
    >{{ reason }}</Message
  >

  <!-- Show error messages -->
  <div v-if="errorMessages" class="mb-3 flex flex-col gap-3">
    <Message
      v-for="error in errorMessages"
      :key="error.key"
      data-test="room-meeting-bbb-error"
      closable
      severity="error"
      @close="() => closeErrorMessage(error)"
    >
      {{ $t("rooms.bbb_error_message." + error.key) }}
    </Message>
  </div>
</template>

<script setup>
import { useUrlSearchParams } from "@vueuse/core";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
const { te } = useI18n();

const urlSearchParams = useUrlSearchParams("history");

// Handle closing the reason message
const closeReasonMessage = () => {
  urlSearchParams.reason = null;
};

// Parse the errors from the URL query parameter
const errorMessages = ref(null);
try {
  // Remove all errors that are unknown to the localization system
  errorMessages.value = JSON.parse(urlSearchParams.errors).filter((error) => {
    return te("rooms.bbb_error_message." + error.key);
  });
} catch (e) {
  console.error(e);
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

// Update the URL search parameters when the error messages change
// to prevent the error messages from being lost on page reload
watch(errorMessages, (errors) => {
  urlSearchParams.errors = errors ? JSON.stringify(errors) : null;
});
</script>

<template>
  <!-- Show reason meeting was ended -->
  <Message
    v-if="urlSearchParams.reason"
    class="mb-3"
    closable
    @close="closeReasonMessage"
    >{{ urlSearchParams.reason }}</Message
  >

  <!-- Show error messages -->
  <div v-if="errorMessages" class="mb-3 flex flex-col gap-3">
    <Message
      v-for="error in errorMessages"
      :key="error.key"
      closable
      severity="error"
      @close="() => closeErrorMessage(error)"
    >
      {{ $t("rooms.bbb_error_message." + error.key) }}
    </Message>
  </div>
</template>

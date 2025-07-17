<template>
  <div>
    <form v-if="model" class="flex flex-col gap-4" @submit="save">
      <div class="field grid grid-cols-12 gap-4" data-test="discoverable-field">
        <label for="discoverable" class="col-span-12 mb-2 md:col-span-3 md:mb-0"
          >{{ $t("auth.privacy.discoverable") }}
        </label>

        <div class="col-span-12 md:col-span-9">
          <ToggleSwitch
            v-model="model.discoverable"
            input-id="discoverable"
            required
            :disabled="isBusy || viewOnly"
            :invalid="formErrors.fieldInvalid('discoverable')"
            :pt="{
              input: {
                'aria-describedby': 'discoverable_help',
              },
            }"
          />
          <FormError :errors="formErrors.fieldError('discoverable')" />
          <small id="discoverable_help">{{
            $t("auth.privacy.discoverable_help")
          }}</small>
        </div>
      </div>
      <div class="flex justify-end">
        <Button
          :disabled="isBusy"
          type="submit"
          :loading="isBusy"
          :label="$t('app.save')"
          icon="fa-solid fa-save"
          data-test="change-password-save-button"
        />
      </div>
    </form>
  </div>
</template>

<script setup>
import env from "../env";
import _ from "lodash";
import { onBeforeMount, ref, watch } from "vue";
import { useApi } from "../composables/useApi.js";
import { useFormErrors } from "../composables/useFormErrors.js";

const props = defineProps({
  viewOnly: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["staleError", "updateUser", "notFoundError"]);

const api = useApi();
const formErrors = useFormErrors();
const isBusy = ref(false);
const model = ref(null);

/**
 * When the user changes, the model is updated and the privacy is reloaded.
 */
watch(
  () => props.user,
  (user) => {
    model.value = _.cloneDeep(user);
  },
  { deep: true },
);

onBeforeMount(() => {
  model.value = _.cloneDeep(props.user);
});

/**
 * Saves the changes of the user to the database by making a api call.
 *
 */
function save(event) {
  if (event) {
    event.preventDefault();
  }
  isBusy.value = true;
  formErrors.clear();

  api
    .call("users/" + model.value.id, {
      method: "put",
      data: {
        discoverable: model.value.discoverable,
        updated_at: model.value.updated_at,
      },
    })
    .then((response) => {
      emit("updateUser", response.data.data);
    })
    .catch((error) => {
      if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
        emit("notFoundError", error);
      } else if (
        error.response &&
        error.response.status === env.HTTP_UNPROCESSABLE_ENTITY
      ) {
        formErrors.set(error.response.data.errors);
      } else if (
        error.response &&
        error.response.status === env.HTTP_STALE_MODEL
      ) {
        // Stale error
        emit("staleError", error.response.data);
      } else {
        api.error(error);
      }
    })
    .finally(() => {
      isBusy.value = false;
    });
}
</script>

<style scoped>
h2 {
  color: #333;
}
</style>

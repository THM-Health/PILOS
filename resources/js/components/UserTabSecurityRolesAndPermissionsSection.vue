<template>
  <div>
    <form v-if="model" class="flex flex-col gap-4" @submit="save">
      <div class="field grid grid-cols-12 gap-4" data-test="roles-field">
        <label
          id="roles-label"
          class="col-span-12 mb-2 md:col-span-3 md:mb-0"
          >{{ $t("app.roles") }}</label
        >
        <div class="col-span-12 md:col-span-9">
          <RoleSelect
            v-model="model.roles"
            aria-labelledby="roles-label"
            :invalid="formErrors.fieldInvalid('roles', true)"
            :disabled="
              isBusy || viewOnly || !userPermissions.can('editUserRole', model)
            "
            :automatic-roles="automaticRoles"
            :disable-superuser="!authStore.currentUser.superuser"
            @loading-error="(value) => (rolesLoadingError = value)"
            @busy="(value) => (rolesLoading = value)"
          />
          <FormError :errors="formErrors.fieldError('roles')" />
        </div>
      </div>
      <div class="flex justify-end">
        <Button
          v-if="!viewOnly && userPermissions.can('editUserRole', model)"
          :disabled="isBusy || rolesLoadingError || rolesLoading"
          type="submit"
          :loading="isBusy"
          :label="$t('app.save')"
          icon="fa-solid fa-save"
        />
      </div>
    </form>
  </div>
</template>

<script setup>
import env from "../env";
import _ from "lodash";
import { computed, onBeforeMount, ref, watch } from "vue";
import { useUserPermissions } from "../composables/useUserPermission.js";
import { useApi } from "../composables/useApi.js";
import { useFormErrors } from "../composables/useFormErrors.js";
import { useAuthStore } from "../stores/auth.js";

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

const userPermissions = useUserPermissions();
const api = useApi();
const formErrors = useFormErrors();

const isBusy = ref(false);
const model = ref(null);
const rolesLoadingError = ref(false);
const rolesLoading = ref(false);
const authStore = useAuthStore();

const automaticRoles = computed(() => {
  if (!model.value.roles) {
    return [];
  }
  return model.value.roles
    .filter((role) => {
      return role.automatic;
    })
    .map((role) => role.id);
});

/**
 * When the user changes, the model is updated and the roles are reloaded.
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
        roles: model.value.roles.map((role) => role.id),
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

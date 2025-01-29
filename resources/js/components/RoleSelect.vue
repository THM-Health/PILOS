<template>
  <InputGroup>
    <multiselect
      ref="roles-multiselect"
      :aria-labelledby="ariaLabelledby"
      data-test="role-dropdown"
      :placeholder="$t('admin.roles.select_roles')"
      :model-value="selectedRoles"
      track-by="id"
      open-direction="bottom"
      :multiple="true"
      :searchable="false"
      :internal-search="false"
      :clear-on-select="false"
      :close-on-select="false"
      :show-no-results="false"
      :show-labels="false"
      :options="roles"
      :disabled="props.disabled || loading || loadingError"
      :loading="loading"
      :allow-empty="allowEmpty"
      :class="{ 'is-invalid': props.invalid }"
      @update:model-value="input"
    >
      <template #noOptions>
        {{ $t("admin.roles.no_data") }}
      </template>
      <template #option="{ option }">
        <div class="flex flex-wrap justify-between gap-2">
          <span>{{ option.name }}</span>
          <div class="flex gap-2">
            <Tag
              v-if="option.superuser"
              icon="fa-solid fa-crown"
              :value="$t('admin.roles.superuser')"
              severity="warn"
            />
            <Tag
              v-if="props.automaticRoles.some((role) => role === option.id)"
              severity="secondary"
              >{{ $t("admin.roles.automatic") }}</Tag
            >
          </div>
        </div>
      </template>
      <template #tag="{ option, remove }">
        <Chip :label="option.name">
          <span>{{ option.name }}</span>
          <Button
            v-if="
              !option.$isDisabled &&
              (selectedRoles.length > 1 || allowEmpty) &&
              !props.disabled
            "
            severity="contrast"
            class="h-5 w-5 rounded-full text-sm"
            icon="fas fa-xmark"
            :aria-label="$t('admin.users.remove_role', { name: option.name })"
            @click="remove(option)"
          />
        </Chip>
      </template>
      <template #afterList>
        <div class="flex gap-2 p-2">
          <Button
            :disabled="loading || currentPage === 1"
            severity="secondary"
            outlined
            icon="fa-solid fa-arrow-left"
            :label="$t('app.previous_page')"
            @click="loadRoles(Math.max(1, currentPage - 1))"
          />
          <Button
            :disabled="loading || !hasNextPage"
            severity="secondary"
            outlined
            icon="fa-solid fa-arrow-right"
            :label="$t('app.next_page')"
            @click="loadRoles(currentPage + 1)"
          />
        </div>
      </template>
    </multiselect>
    <Button
      v-if="loadingError"
      :disabled="loading"
      severity="secondary"
      outlined
      icon="fa-solid fa-sync"
      :aria-label="$t('app.reload')"
      data-test="roles-reload-button"
      @click="loadRoles(currentPage)"
    />
  </InputGroup>
</template>

<script setup>
import { onBeforeMount, ref, useTemplateRef, watch } from "vue";
import { useApi } from "../composables/useApi.js";
import { Multiselect } from "vue-multiselect";

const api = useApi();

const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
  },
  invalid: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  automaticRoles: {
    type: Array,
    default: () => [],
  },
  disableSuperuser: {
    type: Boolean,
    default: false,
  },
  allowEmpty: {
    type: Boolean,
    default: false,
  },
  ariaLabelledby: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue", "loadingError", "busy"]);

const selectedRoles = ref([]);
const roles = ref([]);
const loading = ref(false);
const loadingError = ref(false);
const currentPage = ref(1);
const hasNextPage = ref(false);
const rolesMultiselectRef = useTemplateRef("roles-multiselect");

watch(
  () => props.modelValue,
  (value) => {
    selectedRoles.value = value;
    disableRoles(selectedRoles.value);
  },
  { deep: true },
);

watch(
  () => props.automaticRoles,
  () => {
    disableRoles(selectedRoles.value);
    disableRoles(roles.value);
  },
  { deep: true },
);

// detect changes of the model loading error
watch(loadingError, () => {
  emit("loadingError", loadingError.value);
});

// detect busy status while data fetching and notify parent
watch(loading, () => {
  emit("busy", loading.value);
});

watch(
  () => props.disabled,
  (disabled) => {
    if (!disabled) {
      loadRoles();
    }
  },
);

onBeforeMount(() => {
  if (!props.disabled) {
    loadRoles();
  }
  selectedRoles.value = props.modelValue;
  disableRoles(selectedRoles.value);
});

function disableRoles(roles) {
  if (roles) {
    roles.forEach((role) => {
      role.$isDisabled =
        props.automaticRoles.some((disabledRole) => disabledRole === role.id) ||
        (props.disableSuperuser && role.superuser);
    });
  }
}

function loadRoles(page = 1) {
  loading.value = true;

  const config = {
    params: {
      page,
    },
  };

  api
    .call("roles", config)
    .then((response) => {
      loadingError.value = false;
      currentPage.value = page;
      hasNextPage.value = page < response.data.meta.last_page;

      const newRoles = response.data.data;
      disableRoles(newRoles);
      roles.value = newRoles;
    })
    .catch((error) => {
      // close open multiselect
      rolesMultiselectRef.value.deactivate();
      loadingError.value = true;
      api.error(error);
    })
    .finally(() => {
      loading.value = false;
    });
}

/**
 * Emits the input event.
 *
 * @param value
 */
function input(value) {
  emit("update:modelValue", value);
}
</script>

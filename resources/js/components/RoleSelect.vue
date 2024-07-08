<template>
  <InputGroup>
    <multiselect
      :id="id"
      ref="rolesMultiselectRef"
      :placeholder="$t('admin.roles.select_roles')"
      :model-value="selectedRoles"
      @update:modelValue="input"
      track-by='id'
      open-direction='bottom'
      :multiple='true'
      :searchable='false'
      :internal-search='false'
      :clear-on-select='false'
      :close-on-select='false'
      :show-no-results='false'
      :showLabels='false'
      :options='roles'
      :disabled="props.disabled || loading || loadingError"
      :loading="loading"
      :allow-empty="allowEmpty"
      :class="{ 'is-invalid': props.invalid, 'multiselect-form-control': true }"
    >
      <template #noOptions>
        {{ $t('admin.roles.no_data') }}
      </template>
      <template v-slot:option="{ option }">
        {{ option.name }}
      </template>
      <template v-slot:tag="{ option, remove }" >
          <Chip
            :key="option.name"
            :label="option.name"
            :removable="!option.$isDisabled && (selectedRoles.length>1 || allowEmpty)"
            @remove="remove(option)"
          />
      </template>
      <template #afterList>
        <div class="flex p-2 gap-2">
          <Button
            :disabled="loading || currentPage === 1"
            severity="secondary"
            outlined
            @click="loadRoles(Math.max(1, currentPage - 1))"
            icon="fa-solid fa-arrow-left"
            :label="$t('app.previous_page')"
          />
          <Button
            :disabled="loading || !hasNextPage"
            severity="secondary"
            outlined
            @click="loadRoles(currentPage + 1)"
            icon="fa-solid fa-arrow-right"
            :label="$t('app.next_page')"
          />
        </div>
      </template>
    </multiselect>
      <Button
        v-if="loadingError"
        :disabled="loading"
        severity="secondary"
        outlined
        @click="loadRoles(currentPage)"
        icon="fa-solid fa-sync"
      />
  </InputGroup>
</template>

<script setup>

import { onMounted, ref, watch } from 'vue';
import { useApi } from '../composables/useApi.js';
import { Multiselect } from 'vue-multiselect';

const api = useApi();

const props = defineProps({
  modelValue: {
    type: Array
  },
  invalid: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  disabledRoles: {
    type: Array,
    default: () => []
  },
  allowEmpty: {
    type: Boolean,
    default: false
  },
  id: {
    type: String,
    default: 'roles'
  }
});

const emit = defineEmits(['update:modelValue', 'loadingError', 'busy']);

const selectedRoles = ref([]);
const roles = ref([]);
const loading = ref(false);
const loadingError = ref(false);
const currentPage = ref(1);
const hasNextPage = ref(false);
const rolesMultiselectRef = ref(null);

watch(() => props.modelValue, (value) => {
  selectedRoles.value = value;
  disableRoles(selectedRoles.value);
},
{ deep: true }
);

watch(() => props.disabledRoles, (value) => {
  disableRoles(selectedRoles.value);
  disableRoles(roles.value);
},
{ deep: true }
);

// detect changes of the model loading error
watch(loadingError, () => {
  emit('loadingError', loadingError.value);
});

// detect busy status while data fetching and notify parent
watch(loading, () => {
  emit('busy', loading.value);
});

watch(() => props.disabled, (disabled) => {
  if (!disabled) {
    loadRoles();
  }
});

onMounted(() => {
  if (!props.disabled) {
    loadRoles();
  }
  selectedRoles.value = props.modelValue;
  disableRoles(selectedRoles.value);
});

function disableRoles (roles) {
  if (roles) {
    roles.forEach(role => {
      role.$isDisabled = props.disabledRoles.some(disabledRole => disabledRole === role.id);
    });
  }
}

function loadRoles (page = 1) {
  loading.value = true;

  const config = {
    params: {
      page
    }
  };

  api.call('roles', config).then(response => {
    loadingError.value = false;
    currentPage.value = page;
    hasNextPage.value = page < response.data.meta.last_page;

    const newRoles = response.data.data;
    disableRoles(newRoles);
    roles.value = newRoles;
  }).catch(error => {
    // close open multiselect
    rolesMultiselectRef.value.deactivate();
    loadingError.value = true;
    api.error(error);
  }).finally(() => {
    loading.value = false;
  });
}

/**
 * Emits the input event.
 *
 * @param value
 */
function input (value) {
  emit('update:modelValue', value);
}

</script>

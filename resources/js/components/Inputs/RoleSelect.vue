<template>
  <InputGroup>
    <multiselect
      :id="id"
      ref="roles-multiselect"
      :placeholder="$t('settings.roles.select_roles')"
      :model-value="selectedRoles"
      @update:model-value="input"
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
      :allow-empty="false"
      :class="{ 'is-invalid': props.invalid, 'multiselect-form-control': true }"
    >
      <template #noOptions>
        {{ $t('settings.roles.nodata') }}
      </template>
      <template v-slot:option="{ option }">
        {{ $te(`app.role_lables.${option.name}`) ? $t(`app.role_lables.${option.name}`) : option.name }}
      </template>
      <template v-slot:tag="{ option, remove }" >
        <h5 class="inline mr-1 mb-1">
        <!--ToDo no severity secondary (other options?)-->
          <Tag severity="warning">
            {{ $te(`app.role_lables.${option.name}`) ? $t(`app.role_lables.${option.name}`) : option.name }}
            <span
              v-if="!option.$isDisabled"
              @click="remove(option)"
            ><i
              class="fa-solid fa-xmark"
              :aria-label="$t('settings.users.remove_role')"
            /></span>
          </Tag>
        </h5>
      </template>
      <template #afterList>
        <Button
          :disabled="loading || currentPage === 1"
          severity="secondary"
          outlined
          @click="loadRoles(Math.max(1, currentPage - 1))"
        >
          <i class="fa-solid fa-arrow-left" /> {{ $t('app.previous_page') }}
        </Button>
        <Button
          :disabled="loading || !hasNextPage"
          severity="secondary"
          outlined
          @click="loadRoles(currentPage + 1)"
        >
          <i class="fa-solid fa-arrow-right" /> {{ $t('app.next_page') }}
        </Button>
      </template>
    </multiselect>
      <Button
        v-if="loadingError"
        ref="reloadRolesButton"
        :disabled="loading"
        severity="secondary"
        outlined
        @click="loadRoles(currentPage)"
      >
        <i class="fa-solid fa-sync" />
      </Button>
  </InputGroup>
</template>

<script setup>

import {onMounted, ref, watch} from "vue";
import { useApi } from '@/composables/useApi.js';
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
  id: {
    type: String,
    default: 'roles'
  }
});

const emit = defineEmits(['update:modelValue']);

const selectedRoles = ref([]);
const roles = ref([]);
const loading = ref(false);
const loadingError = ref(false);
const currentPage = ref(1);
const hasNextPage = ref(false);
const rolesMultiselect = ref(null);

watch(()=>props.modelValue, (value)=>{
  selectedRoles.value = value;
  disableRoles(selectedRoles.value);
},
  //ToDo check if needed
  {deep:true}
);

watch(()=> props.disabledRoles, (value)=>{
    disableRoles(selectedRoles.value);
    disableRoles(roles.value);
},
  //Todo check if needed
  { deep:true }
);

//detect changes of the model loading error
watch(loadingError, ()=>{
  emit('loadingError', loadingError.value);
});

// detect busy status while data fetching and notify parent
watch(loading, () => {
  emit('busy', loading.value);
});

watch(props.disabled, (disabled)=>{
  if(!disabled){
    loadRoles();
  }
});

onMounted(()=>{
  if (!props.disabled) {
    loadRoles();
  }
  selectedRoles.value = props.modelValue;
  disableRoles(selectedRoles.value);
});

function disableRoles(roles){
  if (roles) {
    roles.forEach(role => {
      role.$isDisabled = props.disabledRoles.some(disabledRole => disabledRole === role.id);
    });
  }
}

function loadRoles(page = 1){
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

    const rRoles = response.data.data;
    disableRoles(rRoles);
    roles.value = rRoles;
  }).catch(error => {
    // close open multiselect
    rolesMultiselect.value.deactivate();
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

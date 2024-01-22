<template>

  <InputGroup>
    <InputGroupAddon
      v-if="modelLoadingError"
      class="flex-grow-1 p-0"
      style="width: 1%"
    >
      <InlineMessage
        severity="error"
        class="w-full"
      >
        {{ $t('rooms.room_types.loading_error') }}
      </InlineMessage>
    </InputGroupAddon>
    <Dropdown
      v-else
      v-model="roomTypeId"
      :disabled="disabled || isLoadingAction"
      @change="changeRoomType"
      :placeholder="$t('rooms.room_types.select_type')"
      :options="roomTypes"
      optionLabel="description"
      optionValue="id"
      :class="{'p-invalid': props.invalid}"
    />
    <!-- reload the room types -->
    <Button
      v-tooltip="$t('rooms.room_types.reload')"
      :disabled="disabled || isLoadingAction"
      severity="secondary"
      outlined
      @click="reloadRoomTypes"
      icon="fa-solid fa-sync"
      :loading="isLoadingAction"
    />
  </InputGroup>
</template>

<script setup>

import { useApi } from '../../composables/useApi.js';
import { onMounted, ref, watch } from 'vue';

const api = useApi();

const props = defineProps({
  modelValue: Object,
  state: Boolean,
  disabled: Boolean,
  roomId: String,
  invalid: Boolean
});

const emit = defineEmits(['update:modelValue', 'loadingError']);

const roomTypeId = ref(props.modelValue?.id ?? null);
const roomTypes = ref([]);
const modelLoadingError = ref(false);
const isLoadingAction = ref(false);

// detect changes from the parent component and update select
watch(() => props.modelValue, (value) => {
  roomTypeId.value = value?.id ?? null;
});

// detect changes from the parent component and update select
watch(modelLoadingError, (value) => {
  emit('loadingError', value);
});

// detect busy status while data fetching and notify parent
watch(isLoadingAction, (busy) => {
  emit('busy', busy);
});

onMounted(() => {
  reloadRoomTypes();
});

// Load the room types
function reloadRoomTypes () {
  isLoadingAction.value = true;
  const config = {
    params: {
      filter: props.roomId === undefined ? 'own' : props.roomId
    }
  };

  api.call('roomTypes', config).then(response => {
    roomTypes.value = response.data.data;
    // check if roomType select value is not included in available room type list
    // if so, unset roomType field
    if (roomTypeId.value && !roomTypes.value.map(type => type.id).includes(roomTypeId.value)) {
      roomTypeId.value = null;
      emit('update:modelValue', null);
    }
    modelLoadingError.value = false;
  }).catch(error => {
    modelLoadingError.value = true;
    api.error(error);
  }).finally(() => {
    isLoadingAction.value = false;
  });
}

// detect changes of the select and notify parent
function changeRoomType () {
  const newRoomType = roomTypes.value.find((entry) => entry.id === roomTypeId.value) ?? null;
  emit('update:modelValue', newRoomType);
}

</script>

<template>

<!--  ToDo fix width problems with long texts-->
  <div v-if="modelLoadingError" class="flex flex-column gap-2 align-items-start">
    <Message
      severity="error"
      :closable="false"
      class="w-full"
    >
      {{ $t('rooms.room_types.loading_error') }}
    </Message>

    <Button
      v-if="modelLoadingError"
      v-tooltip="$t('rooms.room_types.reload')"
      :disabled="disabled || isLoadingAction"
      @click="reloadRoomTypes"
      icon="fa-solid fa-sync"
      :label="$t('app.reload')"
      :loading="isLoadingAction"
    />
  </div>
  <OverlayComponent v-else :show="isLoadingAction">
  <div class="flex flex-column md:flex-row">
    <Listbox
      v-model="roomTypeId"
      :disabled="disabled || isLoadingAction"
      @change="changeRoomType"
      :options="roomTypes"
      optionLabel="name"
      optionValue="id"
      :invalid="props.invalid"
      class="w-full"
      listStyle="max-height:250px"
      :aria-labelledby="ariaLabelledby"
    />
    <div class="w-full md:w-2" v-if="modelValue">
      <Divider layout="vertical" class="hidden md:flex"/>
      <Divider layout="horizontal" class="flex md:hidden" align="center"/>
    </div>
    <div class="w-full flex" v-if="modelValue" aria-live="polite" aria-atomic="true">
      <RoomTypeDetails :roomType="modelValue" />
    </div>
  </div>
  </OverlayComponent>

</template>

<script setup>

import { useApi } from '../composables/useApi.js';
import { onMounted, ref, watch } from 'vue';

const api = useApi();

const props = defineProps({
  modelValue: Object,
  state: Boolean,
  disabled: Boolean,
  roomId: String,
  invalid: Boolean,
  ariaLabelledby: String
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

defineExpose({
  reloadRoomTypes
});

// Load the room types
function reloadRoomTypes () {
  isLoadingAction.value = true;
  const config = {
    params: {
      filter: props.roomId === undefined ? 'own' : props.roomId,
      with_room_settings: true
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
function changeRoomType (event) {
  const newRoomType = roomTypes.value.find((entry) => entry.id === roomTypeId.value) ?? null;
  emit('update:modelValue', newRoomType);
}

</script>

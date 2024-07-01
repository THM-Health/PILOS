<template>

  <div v-if="modelLoadingError" class="flex flex-col gap-2 items-start">
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
  <div class="grid grid-cols-12 gap-4">
    <div :class="modelValue ? 'md:col-6' : 'md:col'" class="col-span-12">
      <Dropdown
        v-model="roomTypeId"
        :disabled="disabled || isLoadingAction"
        @change="changeRoomType"
        :options="roomTypes"
        optionLabel="name"
        optionValue="id"
        :invalid="props.invalid"
        class="w-full md:hidden"
        :aria-labelledby="ariaLabelledby"
        :pt="{
          panel: {
            class: 'max-w-full'
          },
          item: {
            class: 'whitespace-normal'
          }
        }"
      >
        <template #option="slotProps">
          <span class="max-w-full" style="word-break: normal; overflow-wrap: anywhere;">{{ slotProps.option.name }}</span>
        </template>
      </Dropdown>

      <Listbox
        v-model="roomTypeId"
        :disabled="disabled || isLoadingAction"
        @change="changeRoomType"
        :options="roomTypes"
        optionLabel="name"
        optionValue="id"
        :invalid="props.invalid"
        class="w-full hidden md:block"
        listStyle="max-height:250px"
        :aria-labelledby="ariaLabelledby"
        :pt="{
          item: {
            'data-test': 'room-type-select-option'
          }
        }"
      >
        <template #option="slotProps">
          <span style="word-break: normal; overflow-wrap: anywhere;">{{ slotProps.option.name }}</span>
        </template>
      </Listbox>
    </div>
    <div class="col-span-12 md:col-span-6" v-if="modelValue" aria-live="polite" aria-atomic="true">
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
  modelValue: {
    type: Object
  },
  state: {
    type: Boolean
  },
  disabled: {
    type: Boolean,
    default: false
  },
  roomId: {
    type: String
  },
  invalid: {
    type: Boolean,
    default: false
  },
  ariaLabelledby: {
    type: String
  }
});

const emit = defineEmits(['update:modelValue', 'loadingError', 'busy']);

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

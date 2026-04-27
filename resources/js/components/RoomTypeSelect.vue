<template>
  <div v-if="modelLoadingError" class="flex flex-col items-start gap-2">
    <Message severity="error" :closable="false" class="w-full">
      {{ $t("rooms.room_types.loading_error") }}
    </Message>

    <Button
      v-if="modelLoadingError"
      v-tooltip="$t('app.reload')"
      :aria-label="$t('app.reload')"
      :disabled="disabled || isLoadingAction"
      :loading="isLoadingAction"
      icon="fa-solid fa-sync"
      data-test="reload-room-types-button"
      @click="reloadRoomTypes"
    />
  </div>
  <div v-else class="overflow-hidden">
    <OverlayComponent :show="isLoadingAction">
      <div class="grid grid-cols-2 gap-4">
        <div
          :class="modelValue ? 'md:col-span-1' : 'md:col-span-2'"
          class="col-span-2"
        >
          <Select
            v-model="roomTypeId"
            :disabled="disabled || isLoadingAction"
            :options="roomTypes"
            option-label="name"
            option-value="id"
            :invalid="props.invalid"
            class="w-full md:hidden"
            :aria-labelledby="ariaLabelledby"
            :pt="{
              panel: {
                class: 'max-w-full',
              },
              item: {
                class: 'whitespace-normal',
              },
            }"
            @change="changeRoomType"
          >
            <template #option="slotProps">
              <span
                class="max-w-full"
                style="word-break: normal; overflow-wrap: anywhere"
                >{{ slotProps.option.name }}</span
              >
            </template>
          </Select>

          <div
            id="room-type-select-list"
            role="radiogroup"
            :aria-labelledby="ariaLabelledby"
            class="border-rounded hidden max-h-76 w-full flex-col gap-1 -space-y-px overflow-y-auto border border-surface p-1 md:flex"
          >
            <label
              v-for="roomType in roomTypes"
              :key="roomType.id"
              class="flex items-center gap-2 p-2"
              :class="
                roomType.id === roomTypeId
                  ? 'bg-primary-400/12 text-primary-600 hover:bg-primary-400/24 hover:text-primary-700 dark:text-white dark:hover:text-white'
                  : 'hover:bg-emphasis'
              "
              :id="'room-type-select-list-item-' + roomType.id"
            >
              <RadioButton
                name="room-type"
                :value="roomType.id"
                type="radio"
                :disabled="disabled || isLoadingAction"
                v-model="roomTypeId"
                @change="changeRoomType"
                :pt="{
                  input: {
                    required: 'required',
                  },
                }"
              />
              <span style="word-break: normal; overflow-wrap: anywhere">
                {{ roomType.name }}
              </span>
            </label>
          </div>
        </div>
        <div
          v-if="modelValue"
          class="col-span-2 md:col-span-1"
          aria-live="polite"
          aria-atomic="true"
        >
          <RoomTypeDetails :room-type="modelValue" />
        </div>
      </div>
    </OverlayComponent>
  </div>
</template>

<script setup>
import { useApi } from "../composables/useApi.js";
import { nextTick, onMounted, ref, watch } from "vue";

const api = useApi();

const props = defineProps({
  modelValue: {
    type: [Object, null],
    required: true,
  },
  state: {
    type: Boolean,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  roomId: {
    type: [String, null],
    default: null,
  },
  invalid: {
    type: Boolean,
    default: false,
  },
  ariaLabelledby: {
    type: [String, null],
    default: null,
  },
  redirectOnUnauthenticated: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["update:modelValue", "loadingError", "busy"]);

const roomTypeId = ref(props.modelValue?.id ?? null);
const roomTypes = ref([]);
const modelLoadingError = ref(false);
const isLoadingAction = ref(false);

// detect changes from the parent component and update select
watch(
  () => props.modelValue,
  (value) => {
    roomTypeId.value = value?.id ?? null;
  },
);

// detect changes from the parent component and update select
watch(modelLoadingError, (value) => {
  emit("loadingError", value);
});

// detect busy status while data fetching and notify parent
watch(isLoadingAction, (busy) => {
  emit("busy", busy);
});

onMounted(() => {
  reloadRoomTypes();
});

defineExpose({
  reloadRoomTypes,
});

// Load the room types
function reloadRoomTypes() {
  isLoadingAction.value = true;
  const config = {
    params: {
      filter: props.roomId ?? "own",
      with_room_settings: 1,
      with_features: 1,
    },
  };

  api
    .call("roomTypes", config)
    .then((response) => {
      roomTypes.value = response.data.data;
      // check if roomType select value is not included in available room type list
      // if so, unset roomType field
      if (
        roomTypeId.value &&
        !roomTypes.value.map((type) => type.id).includes(roomTypeId.value)
      ) {
        roomTypeId.value = null;
        emit("update:modelValue", null);
      }
      modelLoadingError.value = false;

      scrollToSelectedRoomType();
    })
    .catch((error) => {
      modelLoadingError.value = true;
      api.error(error, {
        redirectOnUnauthenticated: props.redirectOnUnauthenticated,
      });
    })
    .finally(() => {
      isLoadingAction.value = false;
    });
}

// detect changes of the select and notify parent
function changeRoomType() {
  const newRoomType =
    roomTypes.value.find((entry) => entry.id === roomTypeId.value) ?? null;
  emit("update:modelValue", newRoomType);
}

async function scrollToSelectedRoomType() {
  await nextTick();
  if (roomTypeId.value) {
    const item = "room-type-select-list-item-" + roomTypeId.value;
    document.getElementById(item)?.scrollIntoView({ behavior: "smooth" });
  }
}
</script>

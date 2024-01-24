<template>
  <Button
    v-if="props.room.authenticated && authStore.isAuthenticated"
    severity="secondary"
    toggle-class="text-decoration-none"
    class="room-dropdown"
    icon="fa-solid fa-bars"
    @click="dropdown = !dropdown"
    ref="dropdownButton"
  />
  <ul ref="dropdownMenu" v-if="dropdown" v-on-click-outside="onClickOutsideHandler" @click="closeDropdown" :style="floatingStyles" class="list-none py-1 px-3 m-0 lg:px-0 lg:py-2 border-round shadow-0 lg:shadow-2 lg:border-1 border-50 lg:absolute lg:z-1 bg-white origin-top w-full right lg:w-15rem cursor-pointer">
    <!-- @added="props.accessCode = null; reload();" @TODO -->
    <room-membership-dropdown-button
      :room="props.room"
      :access-code="accessCode"
      :disabled="props.loading"
      @removed="$emit('reload')"
      @invalid-code="$emit('invalidCode')"
      @membership-disabled="$emit('reload')"
    />
    <room-favorite-dropdown-button
      :disabled="props.loading"
      :room="props.room"
      @favorites-changed="$emit('reload')"
    />
    <!-- transfer room ownership to another user-->
    <can
      method="transfer"
      :policy="props.room"
    >
      <transfer-ownership-dropdown-button
        @transferred-ownership="$emit('reload')"
        :room="props.room">
      </transfer-ownership-dropdown-button>
    </can>
    <can
      method="delete"
      :policy="props.room"
    >
      <delete-room-dropdown-button
        :room="props.room"
        :disabled="props.loading"
        @room-deleted="$router.push({ name: 'rooms.index' })"
      />
    </can>
  </ul>
</template>
<script setup>

import { useAuthStore } from '@/stores/auth.js';
import { ref } from 'vue';
import { vOnClickOutside } from '@vueuse/components';
import { autoPlacement, useFloating } from '@floating-ui/vue';

const authStore = useAuthStore();

const props = defineProps({
  room: Object,
  loading: Boolean,
  accessCode: String
});

const dropdownButton = ref();
const dropdownMenu = ref();
const dropdown = ref(false);
function closeDropdown () {
  dropdown.value = false;
}

const { floatingStyles } = useFloating(dropdownButton, dropdownMenu, {
  middleware: [
    autoPlacement(
      {
        allowedPlacements: ['bottom-start', 'bottom-end']
      }
    )
  ]
});

const onClickOutsideHandler = [
  (ev) => {
    console.log(ev);
    closeDropdown();
  },
  { ignore: [dropdownButton] }
];

</script>

<style scoped>

</style>

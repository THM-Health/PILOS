<script setup>
import { ref } from 'vue';
import { vOnClickOutside } from '@vueuse/components';
import { autoPlacement, autoUpdate, useFloating } from '@floating-ui/vue';

const props = defineProps([
  'text',
  'buttonClass'
]);

const dropdownButton = ref();
const dropdownMenu = ref();

const dropdownMobile = ref(false);
const dropdown = ref(false);
function closeDropdown () {
  dropdown.value = false;
}

function closeMobileDropdown () {
  dropdownMobile.value = false;
}

const { floatingStyles } = useFloating(dropdownButton, dropdownMenu, {
  middleware: [
    autoPlacement(
      {
        allowedPlacements: ['bottom-start', 'bottom-end']
      }
    )
  ],
  whileElementsMounted: autoUpdate
});

const onClickOutsideHandler = [
  (ev) => {
    console.log(ev);
    closeDropdown();
  },
  { ignore: [dropdownButton] }
];

</script>

<template>
  <li>
    <button ref="dropdownButton" :class="props.buttonClass" class="bg-transparent border-none block flex align-items-center text-500 hover:text-900 focus:text-900 w-full p-0 lg:px-2 lg:py-3 cursor-pointer"
       @click.stop="dropdown = !dropdown; dropdownMobile = !dropdownMobile"
    >
      <slot name="button-content">{{ props.text }}</slot>
      <i class="fa-solid fa-caret-down ml-auto lg:ml-2"></i>
    </button>
    <ul v-if="dropdownMobile" class="lg:hidden list-none py-1 px-3 m-0 border-round shadow-0 border-50 w-full" @click.stop>
      <slot :close-callback="closeMobileDropdown" />
    </ul>

    <ul ref="dropdownMenu" v-if="dropdown" v-on-click-outside="onClickOutsideHandler" :style="floatingStyles" class="hidden lg:inline-block list-none m-0 px-0 py-2 border-round shadow-2 border-1 border-50 z-1 bg-white origin-top right w-15rem">
      <slot :close-callback="closeDropdown" />
    </ul>
  </li>
</template>

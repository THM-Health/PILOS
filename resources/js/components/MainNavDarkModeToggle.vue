<script setup>
import { useDark } from "@vueuse/core";
const isDark = useDark();
</script>
<template>
  <div class="relative h-[1em] w-[1em] text-xl">
    <Transition name="dark">
      <i v-if="isDark" class="fa-solid fa-moon absolute w-full text-center" />
    </Transition>
    <Transition name="light">
      <i v-if="!isDark" class="fa-solid fa-sun absolute w-full text-center" />
    </Transition>
  </div>
</template>
<style scoped>
.light-enter-active,
.light-leave-active,
.dark-enter-active,
.dark-leave-active {
  --transition-base: 0.5s ease;
  transition:
    var(--transition-base) opacity,
    var(--transition-base) transform;
}

.light-enter-from,
.light-leave-to {
  opacity: 0;
  transform: rotate(-90deg) scale(0.5);
}

.dark-enter-from,
.dark-leave-to {
  opacity: 0;
  transform: rotate(180deg);
}
</style>

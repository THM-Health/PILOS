<template>
  <transition-group
    tag="span"
    :name="transitionName"
    @after-leave="onExitComplete"
  >
    <span
      v-if="currentWord"
      :key="currentWord"
      class="relative inline text-primary"
    >
      {{ currentWord }}
    </span>
  </transition-group>
</template>

<script setup>
import { ref, onMounted, watchEffect, watch, nextTick } from "vue";

const props = defineProps({
  words: {
    type: Array,
    required: true,
  },
  duration: {
    type: Number,
    default: 5000,
  },
  className: {
    type: String,
    default: "",
  },
});

const currentWord = ref(props.words[0]);
const isAnimating = ref(false);
const transitionName = ref("flip");

const startAnimation = () => {
  const word =
    props.words[props.words.indexOf(currentWord.value) + 1] || props.words[0];
  currentWord.value = word;
  isAnimating.value = true;
};

const onExitComplete = () => {
  isAnimating.value = false;
};

onMounted(() => {
  watchEffect(() => {
    if (!isAnimating.value) {
      setTimeout(() => {
        startAnimation();
      }, props.duration);
    }
  });
});

watch(
  () => props.words,
  async () => {
    transitionName.value = "none";
    currentWord.value = props.words[0];
    await nextTick();
    transitionName.value = "flip";
  },
);
</script>

<style scoped>
.flip-enter-active,
.flip-leave-active {
  transition: all 0.4s ease-in-out;
}
.flip-enter-from,
.flip-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
.flip-leave-active {
  opacity: 0;
  transform: translateY(-30px) translateX(30px) scale(2);
  filter: blur(8px);
  position: absolute;
}
</style>

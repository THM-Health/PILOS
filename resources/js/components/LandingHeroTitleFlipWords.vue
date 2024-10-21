<template>
  <transition-group
    name="flip"
    tag="div"
    class="inline"
    @after-leave="onExitComplete"
  >
    <div
      v-if="currentWord"
      :key="currentWord"
      class="z-10 inline-block relative text-left text-primary"
    >
      <span
        v-for="(letter, index) in currentWord.split('')"
        :key="currentWord + index"
        class="inline-block"
      >
        {{ letter }}
      </span>
    </div>
  </transition-group>
</template>

<script setup>
import { ref, onMounted, watchEffect } from "vue";

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

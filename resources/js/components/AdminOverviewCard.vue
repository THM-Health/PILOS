<script setup>
import { computed, ref } from "vue";
import { vElementHover } from "@vueuse/components";

const props = defineProps({
  to: {
    type: Object,
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  dataTest: {
    type: String,
    required: true,
  },
});

const isHovered = ref(false);
function onHover(state) {
  isHovered.value = state;
}

const titleClass = computed(() => {
  const classes = ["text-center"];
  if (props.disabled) {
    classes.push("opacity-50");
  } else {
    classes.push("text-primary");
  }
  return classes;
});

const contentClass = computed(() => {
  const classes = ["p-0"];
  if (props.disabled) {
    classes.push("opacity-50");
  }
  return classes;
});

const cardClass = computed(() => {
  const classes = [
    "relative",
    "h-full",
    "border",
    "text-center",
    "shadow-none",
    "border-surface",
    "rounded-border",
  ];
  if (props.disabled) {
    classes.push(["cursor-not-allowed"]);
  } else {
    classes.push("hover:bg-emphasis");
  }
  return classes;
});
</script>

<template>
  <router-link :to="disabled ? '' : props.to" :data-test="dataTest">
    <Card
      v-element-hover="onHover"
      :pt="{
        title: { class: titleClass },
        content: { class: contentClass },
      }"
      :class="cardClass"
    >
      <template #title>
        <h2 class="m-0">
          <i class="fa-solid" :class="props.icon" />
        </h2>
        <span>{{ props.title }}</span>
      </template>
      <template #content>{{ props.description }} </template>
      <template #footer>
        <div
          v-if="isHovered && disabled"
          class="absolute inset-0 flex items-center justify-center p-7 bg-emphasis rounded-border"
        >
          <div>
            <div class="text-xl font-medium">
              <h2 class="m-0">
                <i class="fa-solid fa-ban" />
              </h2>
              <span>{{ $t("admin.feature_disabled.title") }}</span>
            </div>
            <span>{{
              $t("admin.feature_disabled.description", { name: props.title })
            }}</span>
          </div>
        </div>
      </template>
    </Card>
  </router-link>
</template>

<style scoped></style>

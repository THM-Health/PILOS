<template>
  <!-- Feature section -->
  <div class="z-10 mx-auto mt-24 mb-24 max-w-7xl px-6 sm:mt-24 lg:px-8">
    <div class="mx-auto max-w-2xl lg:text-center">
      <h2 class="text-primary text-base leading-7 font-semibold">
        {{ $t("home.features.vision") }}
      </h2>
      <p class="text-color mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        {{ $t("home.features.title") }}
      </p>
      <p class="text-color mt-6 text-lg leading-8">
        {{ $t("home.features.description") }}
      </p>
    </div>
    <div class="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-7xl">
      <dl
        class="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 lg:max-w-none lg:grid-cols-3 lg:gap-y-16"
      >
        <div
          v-for="feature in features"
          :key="feature.name"
          class="relative pl-16"
        >
          <dt class="text-color text-base leading-7 font-semibold">
            <div
              class="bg-primary absolute top-0 left-0 flex h-10 w-10 items-center justify-center rounded-lg"
            >
              <i
                :class="'fa-' + feature.icon"
                class="fa-solid text-white"
                aria-hidden="true"
              />
            </div>
            {{ feature.title }}
          </dt>
          <dd class="text-color mt-2 text-base leading-7">
            {{ feature.description }}
          </dd>
        </div>
      </dl>
    </div>
  </div>
</template>
<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

const features = computed(() => {
  return [
    {
      icon: "video",
      title: t("home.features.communication.title"),
      description: t("home.features.communication.description"),
    },
    {
      icon: "users",
      title: t("home.features.collaboration.title"),
      description: t("home.features.collaboration.description"),
    },
    {
      icon: "thumbs-up",
      title: t("home.features.engagement.title"),
      description: t("home.features.engagement.description"),
    },
    {
      icon: "circle-play",
      title: t("home.features.recording.title"),
      description: t("home.features.recording.description"),
    },
    {
      icon: "key",
      title: t("home.features.security.title"),
      description: t("home.features.security.description"),
    },
    {
      icon: "chart-line",
      title: t("home.features.statistics.title"),
      description: t("home.features.statistics.description"),
    },
  ];
});
</script>

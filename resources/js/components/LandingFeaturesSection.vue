<template>
  <div class="bg-white dark:bg-zinc-800 pt-8 mt-2 mb-8">
    <div class="container text-center">
        <div class="mb-4 font-bold text-color text-2xl">
            <span>{{ $t('home.possibilities.title') }}</span>
        </div>
        <div class="grid grid-cols-12 gap-4">

            <div class="col-span-12 md:col-span-4 mb-6 px-8" v-for="(item, index) in items" :key="index">
                <span class="p-4 shadow mb-4 inline-block bg-primary text-primary-contrast rounded-border">
                    <i class="fa-solid text-4xl" :class="'fa-'+item.icon"></i>
                </span>
                <div class="text-color text-xl mb-4 font-bold">{{ item.title }}</div>
                <span class="text-color leading-normal">{{ item.description }}</span>
            </div>
        </div>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const items = computed(() => {
  return [
    {
      icon: 'thumbs-up',
      title: t('home.possibilities.chat.title'),
      description: t('home.possibilities.chat.description')
    },
    {
      icon: 'video',
      title: t('home.possibilities.webcams.title'),
      description: t('home.possibilities.webcams.description')
    },
    {
      icon: 'headset',
      title: t('home.possibilities.audio.title'),
      description: t('home.possibilities.audio.description')
    },
    {
      icon: 'comments',
      title: t('home.possibilities.emojis.title'),
      description: t('home.possibilities.emojis.description')
    },
    {
      icon: 'users',
      title: t('home.possibilities.groups.title'),
      description: t('home.possibilities.groups.description')
    },
    {
      icon: 'square-poll-horizontal',
      title: t('home.possibilities.surveys.title'),
      description: t('home.possibilities.surveys.description')
    },
    {
      icon: 'desktop',
      title: t('home.possibilities.screen_sharing.title'),
      description: t('home.possibilities.screen_sharing.description')
    },
    {
      icon: 'chalkboard-teacher',
      title: t('home.possibilities.whiteboard.title'),
      description: t('home.possibilities.whiteboard.description')
    },
    {
      icon: 'chart-line',
      title: t('home.possibilities.statistics.title'),
      description: t('home.possibilities.statistics.description')
    }
  ];
});
</script>

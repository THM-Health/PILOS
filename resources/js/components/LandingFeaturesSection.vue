<template>
  <div class="bg-white pt-5 mt-2 mb-5">
    <div class="surface-section px-4 py-8 md:px-6 lg:px-8 text-center">
        <div class="mb-3 font-bold text-3xl">
            <span>{{ $t('home.possibilities.title') }}</span>
        </div>
        <div class="grid">

            <div class="col-12 md:col-4 mb-4 px-5" v-for="(item, index) in items" :key="index">
                <span class="p-3 shadow-2 mb-3 inline-block surface-card" style="border-radius: 10px">
                    <i class="fa-solid text-4xl text-primary" :class="'fa-'+item.icon"></i>
                </span>
                <div class="text-900 text-xl mb-3 font-medium">{{ item.title }}</div>
                <span class="text-700 line-height-3">{{ item.description }}</span>
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

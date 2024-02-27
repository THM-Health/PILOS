<template>
  <div class="container mt-3 mb-5">
    <div class="flex flex-row align-items-center gap-4">
      <router-link
        v-if="$route.name!=='settings'"
        v-tooltip="$t('settings.home_button')"
        :aria-label="$t('settings.home_button')"
        class="p-button p-button-icon-only p-button-secondary"
        :to="{ name: 'settings'}"
      >
        <i class="fa-solid fa-home" />
      </router-link>
      <h1 class="m-0 text-3xl text-color">
        {{ $t('settings.title') }}
      </h1>
    </div>

    <Divider/>
    <Card
      :pt="{content:{class:'p-0'}}"
    >
      <template #content>
        <router-view />
      </template>
    </Card>
  </div>
</template>
<script setup>
</script>

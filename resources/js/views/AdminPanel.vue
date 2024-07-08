<template>
  <div class="container mt-4 mb-8">
    <div class="flex flex-row items-center gap-6">
      <router-link
        v-if="$route.name!=='admin'"
        v-tooltip="$t('admin.home_button')"
        :aria-label="$t('admin.home_button')"
        class="p-button p-button-icon-only p-button-secondary"
        :to="{ name: 'admin'}"
      >
        <i class="fa-solid fa-home" />
      </router-link>
      <h1 class="m-0 text-3xl text-color">
        {{ $t('admin.title') }}
      </h1>
    </div>

    <Divider/>
    <Card
      :pt="{content:{class:'p-0'}}"
    >
      <template #content>
        <router-view :key="$route.fullPath" />
      </template>
    </Card>
  </div>
</template>
<script setup>
</script>

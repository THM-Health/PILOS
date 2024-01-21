<template>
  <div class="container mt-3 mb-5">
    <h1>
      <router-link
        v-if="$route.name!=='settings'"
        v-tooltip="$t('settings.home_button')"
        class="p-button p-button-secondary mr-3"
        :to="{ name: 'settings'}"
      >
        <i class="fa-solid fa-arrow-left" />
      </router-link>
      {{ $t('settings.title') }}
    </h1>
    <hr>
    <Card
      :pt="{content:{class:'p-0'}}"
    >
      <template #content>
        <router-view />
      </template>
    </Card>
  </div>
</template>

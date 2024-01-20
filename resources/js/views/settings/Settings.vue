<template>
  <div class="container mt-3 mb-5">
    <h1>
<!--  ToDo improve button-->
      <Button
        v-if="$route.name!=='settings'"
        v-tooltip="$t('settings.home_button')"
        class="mr-3"
        severity="secondary"
      >
        <AppLink :to="{ name: 'settings'}" class="text-white"><i class="fa-solid fa-arrow-left" /></AppLink>
      </Button>
      {{ $t('settings.title') }}
    </h1>
    <hr>
<!--ToDo fix style-->
    <Card class="border bg-white">
      <template #content>
        <router-view />
      </template>
    </Card>
  </div>
</template>

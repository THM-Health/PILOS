<template>
  <div>
    <h2>{{ $t('settings.overview') }}</h2>
    <p>{{ $t('settings.overview_description') }}</p>
    <hr>
    <div class="grid">
      <can
        method="viewAny"
        policy="ApplicationSettingPolicy"
      >
        <div class="col-12 md:col-4 lg:col-4 sm:col-6 p-2">
          <Card class="h-100">
<!--        ToDo fix links and style-->
            <router-link
              class="stretched-link"
              :to="{ name: 'settings.application' }"
            >
            </router-link>
            <template #header>
              <h2 class="text-center text-primary">
                <i class="fa-solid fa-cogs" />
              </h2>
            </template>
            <template #title>
              <span class="text-center text-primary">
                 {{ $t('settings.application.title') }}
              </span>
            </template>
            <template #content>
              {{ $t('settings.application.tile_description') }}
            </template>
          </Card>
        </div>
      </can>
      <can
        method="viewAny"
        policy="UserPolicy"
      >
        <div class="col-12 md:col-4 lg:col-4 sm:col-6 p-2">
          <Card class="h-100">
            <router-link
              class="stretched-link"
              :to="{ name: 'settings.users' }"
            >
            </router-link>
            <template #header>
              <h2 class="text-center text-primary">
                <i class="fa-solid fa-users" />
              </h2>
            </template>
            <template #title>
              <span class="text-center text-primary">
                 {{ $t('app.users') }}
              </span>
            </template>
            <template #content>
              {{ $t('settings.users.tile_description') }}
            </template>
          </Card>
        </div>
      </can>
      <can
        method="viewAny"
        policy="RolePolicy"
      >
        <div class="col-12 md:col-4 lg:col-4 sm:col-6 p-2">
          <Card class="h-100">
            <router-link
              class="stretched-link"
              :to="{ name: 'settings.roles' }"
            >
            </router-link>
            <template #header>
              <h2 class="text-center text-primary">
                <i class="fa-solid fa-user-tag" />
              </h2>
            </template>
            <template #title>
              <span class="text-center text-primary">
                 {{ $t('app.roles') }}
              </span>
            </template>
            <template #content>
              {{ $t('settings.roles.tile_description') }}
            </template>
          </Card>
        </div>
      </can>
      <can
        method="viewAny"
        policy="RoomTypePolicy"
      >
        <div class="col-12 md:col-4 lg:col-4 sm:col-6 p-2">
          <Card class="h-100">
            <router-link
              class="stretched-link"
              :to="{ name: 'settings.room_types' }"
            >
            </router-link>
            <template #header>
              <h2 class="text-center text-primary">
                <i class="fa-solid fa-tags" />
              </h2>
            </template>
            <template #title>
              <span class="text-center text-primary">
                 {{ $t('app.room_types') }}
              </span>
            </template>
            <template #content>
              {{ $t('settings.room_types.tile_description') }}
            </template>
          </Card>
        </div>
      </can>
      <can
        method="viewAny"
        policy="ServerPolicy"
      >
        <div class="col-12 md:col-4 lg:col-4 sm:col-6 p-2">
          <Card class="h-100">
            <router-link
              class="stretched-link"
              :to="{ name: 'settings.servers' }"
            >
            </router-link>
            <template #header>
              <h2 class="text-center text-primary">
                <i class="fa-solid fa-server" />
              </h2>
            </template>
            <template #title>
              <span class="text-center text-primary">
                 {{ $t('app.servers') }}
              </span>
            </template>
            <template #content>
              {{ $t('settings.servers.tile_description') }}
            </template>
          </Card>
        </div>
      </can>
      <can
        method="viewAny"
        policy="ServerPoolPolicy"
      >
        <div class="col-12 md:col-4 lg:col-4 sm:col-6 p-2">
          <Card class="h-100">
            <router-link
              class="stretched-link"
              :to="{ name: 'settings.server_pools' }"
            >
            </router-link>
            <template #header>
              <h2 class="text-center text-primary">
                <i class="fa-solid fa-th-large" />
              </h2>
            </template>
            <template #title>
              <span class="text-center text-primary">
                 {{ $t('app.server_pools') }}
              </span>
            </template>
            <template #content>
              {{ $t('settings.server_pools.tile_description') }}
            </template>
          </Card>
        </div>
      </can>
    </div>
  </div>
</template>

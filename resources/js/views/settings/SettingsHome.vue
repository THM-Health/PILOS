<template>
  <div>
    <h2>{{ $t('settings.overview') }}</h2>
    <p>{{ $t('settings.overview_description') }}</p>
    <hr>
    <div class="grid mt-1">
      <can
        method="viewAny"
        policy="ApplicationSettingPolicy"
      >
        <div class="col-12 md:col-4 lg:col-4 sm:col-6 p-2">
          <Card
            :pt="{title:{class:'text-center text-primary'},content:{class:'p-0'}}"
            class="h-full relative"
          >
            <template #title>
              <h2 class="m-0">
                <i class="fa-solid fa-cogs" />
              </h2>
              <span>
                 {{ $t('settings.application.title') }}
              </span>
            </template>
            <template #content>
              {{ $t('settings.application.tile_description') }}
              <router-link
                class="stretched-link"
                :to="{ name: 'settings.application' }"
              >
              </router-link>
            </template>
          </Card>
        </div>
      </can>
      <can
        method="viewAny"
        policy="UserPolicy"
      >
        <div class="col-12 md:col-4 lg:col-4 sm:col-6 p-2">
          <Card
            :pt="{title:{class:'text-center text-primary'},content:{class:'p-0'}}"
            class="h-full relative"
          >
            <template #title>
              <h2 class="m-0">
                <i class="fa-solid fa-users" />
              </h2>
              <span>
                 {{ $t('app.users') }}
              </span>
            </template>
            <template #content>
              {{ $t('settings.users.tile_description') }}
              <router-link
                class="stretched-link"
                :to="{ name: 'settings.users' }"
              >
              </router-link>
            </template>
          </Card>
        </div>
      </can>
      <can
        method="viewAny"
        policy="RolePolicy"
      >
        <div class="col-12 md:col-4 lg:col-4 sm:col-6 p-2">
          <Card
            :pt="{title:{class:'text-center text-primary'},content:{class:'p-0'}}"
            class="h-full relative"
          >
            <template #title>
              <h2 class="m-0">
                <i class="fa-solid fa-user-tag" />
              </h2>
              <span>
                 {{ $t('app.roles') }}
              </span>
            </template>
            <template #content>
              {{ $t('settings.roles.tile_description') }}
              <router-link
                class="stretched-link"
                :to="{ name: 'settings.roles' }"
              >
              </router-link>
            </template>
          </Card>
        </div>
      </can>
      <can
        method="viewAny"
        policy="RoomTypePolicy"
      >
        <div class="col-12 md:col-4 lg:col-4 sm:col-6 p-2">
          <Card
            :pt="{title:{class:'text-center text-primary'},content:{class:'p-0'}}"
            class="h-full relative"
          >
            <template #title>
              <h2 class="m-0">
                <i class="fa-solid fa-tags" />
              </h2>
              <span>
                 {{ $t('app.room_types') }}
              </span>
            </template>
            <template #content>
              {{ $t('settings.room_types.tile_description') }}
              <router-link
              class="stretched-link"
              :to="{ name: 'settings.room_types' }"
              >
              </router-link>
            </template>
          </Card>
        </div>
      </can>
      <can
        method="viewAny"
        policy="ServerPolicy"
      >
        <div class="col-12 md:col-4 lg:col-4 sm:col-6 p-2">
          <Card
            :pt="{title:{class:'text-center text-primary'},content:{class:'p-0'}}"
            class="h-full relative"
          >
            <template #title>
              <h2 class="m-0">
                <i class="fa-solid fa-server" />
              </h2>
              <span>
                 {{ $t('app.servers') }}
              </span>
            </template>
            <template #content>
              {{ $t('settings.servers.tile_description') }}
              <router-link
                class="stretched-link"
                :to="{ name: 'settings.servers' }"
              >
              </router-link>
            </template>
          </Card>
        </div>
      </can>
      <can
        method="viewAny"
        policy="ServerPoolPolicy"
      >
        <div class="col-12 md:col-4 lg:col-4 sm:col-6 p-2">
          <Card
            :pt="{title:{class:'text-center text-primary'},content:{class:'p-0'}}"
            class="h-full relative"
          >
            <template #title>
              <h2 class="m-0">
                <i class="fa-solid fa-th-large" />
              </h2>
              <span>
                 {{ $t('app.server_pools') }}
              </span>
            </template>
            <template #content>
              {{ $t('settings.server_pools.tile_description') }}
              <router-link
                class="stretched-link"
                :to="{ name: 'settings.server_pools' }"
              >
              </router-link>
            </template>
          </Card>
        </div>
      </can>
    </div>
  </div>
</template>

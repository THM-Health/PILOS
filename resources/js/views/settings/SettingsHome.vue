<template>
  <div>
    <h3>{{ $t('settings.overview') }}</h3>
    <p>{{ $t('settings.overview_description') }}</p>
    <hr>
    <b-row
      cols="1"
      cols-sm="2"
      cols-md="3"
      cols-lg="3"
      align-v="stretch"
    >
      <Can
        method="viewAny"
        policy="ApplicationSettingPolicy"
      >
        <b-col class="p-2">
          <b-card class="h-100">
            <router-link
              class="stretched-link"
              :to="{ name: 'settings.application' }"
            >
              <h2 class="text-center text-primary">
                <i class="fa-solid fa-cogs" />
              </h2>
            </router-link>
            <b-card-title class="text-center text-primary">
              {{ $t('settings.application.title') }}
            </b-card-title>
            <b-card-text>
              {{ $t('settings.application.tile_description') }}
            </b-card-text>
          </b-card>
        </b-col>
      </can>
      <Can
        method="viewAny"
        policy="UserPolicy"
      >
        <b-col class="p-2">
          <b-card class="h-100">
            <router-link
              class="stretched-link"
              :to="{ name: 'settings.users' }"
            >
              <h2 class="text-center text-primary">
                <i class="fa-solid fa-users" />
              </h2>
            </router-link>
            <b-card-title class="text-center text-primary">
              {{ $t('app.users') }}
            </b-card-title>
            <b-card-text>
              {{ $t('settings.users.tile_description') }}
            </b-card-text>
          </b-card>
        </b-col>
      </can>
      <Can
        method="viewAny"
        policy="RolePolicy"
      >
        <b-col class="p-2">
          <b-card class="h-100">
            <router-link
              class="stretched-link"
              :to="{ name: 'settings.roles' }"
            >
              <h2 class="text-center text-primary">
                <i class="fa-solid fa-user-tag" />
              </h2>
            </router-link>
            <b-card-title class="text-center text-primary">
              {{ $t('app.roles') }}
            </b-card-title>
            <b-card-text>
              {{ $t('settings.roles.tile_description') }}
            </b-card-text>
          </b-card>
        </b-col>
      </can>
      <Can
        method="viewAny"
        policy="RoomTypePolicy"
      >
        <b-col class="p-2">
          <b-card class="h-100">
            <router-link
              class="stretched-link"
              :to="{ name: 'settings.room_types' }"
            >
              <h2 class="text-center text-primary">
                <i class="fa-solid fa-tags" />
              </h2>
            </router-link>
            <b-card-title class="text-center text-primary">
              {{ $t('app.room_types') }}
            </b-card-title>
            <b-card-text>
              {{ $t('settings.room_types.tile_description') }}
            </b-card-text>
          </b-card>
        </b-col>
      </can>
      <Can
        method="viewAny"
        policy="ServerPolicy"
      >
        <b-col class="p-2">
          <b-card class="h-100">
            <router-link
              class="stretched-link"
              :to="{ name: 'settings.servers' }"
            >
              <h2 class="text-center text-primary">
                <i class="fa-solid fa-server" />
              </h2>
            </router-link>
            <b-card-title class="text-center text-primary">
              {{ $t('app.servers') }}
            </b-card-title>
            <b-card-text>
              {{ $t('settings.servers.tile_description') }}
            </b-card-text>
          </b-card>
        </b-col>
      </can>
      <Can
        method="viewAny"
        policy="ServerPoolPolicy"
      >
        <b-col class="p-2">
          <b-card class="h-100">
            <router-link
              class="stretched-link"
              :to="{ name: 'settings.server_pools' }"
            >
              <h2 class="text-center text-primary">
                <i class="fa-solid fa-th-large" />
              </h2>
            </router-link>
            <b-card-title class="text-center text-primary">
              {{ $t('app.server_pools') }}
            </b-card-title>
            <b-card-text>
              {{ $t('settings.server_pools.tile_description') }}
            </b-card-text>
          </b-card>
        </b-col>
      </can>
    </b-row>
  </div>
</template>

<script>

</script>

<style scoped>
</style>

<template>
  <div>
    <h3>{{ $t('settings.overview') }}</h3>
    <div v-html="$t('settings.overviewDescription')"></div>
    <hr>
    <b-row cols="1" cols-sm="2" cols-md="3" cols-lg="3" align-v="stretch">
      <can method='viewAny' policy='SettingPolicy'>
       <b-col class="p-2 h-100">
          <b-card class="h-100">
            <router-link class="stretched-link" :to="{ name: 'settings.application' }">
            <h2 class="text-center text-success"><i class='fas fa-cogs'></i></h2>
            </router-link>
            <b-card-title class="text-center text-success">{{ $t('settings.application.title') }}</b-card-title>
            <b-card-text>
              {{ $t('settings.application.tileDescription') }}
            </b-card-text>
          </b-card>
        </b-col>
      </can>
      <can method='viewAny' policy='UserPolicy'>
       <b-col class="p-2 h-100">
          <b-card class="h-100">
            <router-link class="stretched-link" :to="{ name: 'settings.users' }">
              <h2 class="text-center text-success"><i class='fas fa-users'></i></h2>
            </router-link>
            <b-card-title class="text-center text-success">{{ $t('settings.users.title') }}</b-card-title>
            <b-card-text>
              {{ $t('settings.users.tileDescription') }}
            </b-card-text>
          </b-card>
        </b-col>
      </can>
      <can method='viewAny' policy='RolePolicy'>
       <b-col class="p-2 h-100">
          <b-card class="h-100">
            <router-link class="stretched-link" :to="{ name: 'settings.roles' }">
              <h2 class="text-center text-success"><i class='fas fa-user-tag'></i></h2>
            </router-link>
            <b-card-title class="text-center text-success">{{ $t('settings.roles.title') }}</b-card-title>
            <b-card-text>
              {{ $t('settings.roles.tileDescription') }}
            </b-card-text>
          </b-card>
        </b-col>
      </can>
      <can method='viewAny' policy='RoomTypePolicy'>
       <b-col class="p-2 h-100">
          <b-card class="h-100">
            <router-link class="stretched-link" :to="{ name: 'settings.room_types' }">
              <h2 class="text-center text-success"><i class='fas fa-tags'></i></h2>
            </router-link>
            <b-card-title class="text-center text-success">{{ $t('settings.roomTypes.title') }}</b-card-title>
            <b-card-text>
              {{ $t('settings.roomTypes.tileDescription') }}
            </b-card-text>
          </b-card>
        </b-col>
      </can>
      <can method='viewAny' policy='ServerPolicy'>
        <b-col class="p-2 h-100">
          <b-card class="h-100">
            <router-link class="stretched-link" :to="{ name: 'settings.servers' }">
              <h2 class="text-center text-success"><i class='fas fa-server'></i></h2>
            </router-link>
            <b-card-title class="text-center text-success">{{ $t('settings.servers.title') }}</b-card-title>
            <b-card-text>
              {{ $t('settings.servers.tileDescription') }}
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

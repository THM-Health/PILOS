<template>
  <b-container class='mt-3 mb-5'>
    <h2>{{ $t('settings.title') }}</h2>
    <hr>
    <b-row class='mt-5'>
      <b-col lg='3' class='mb-4'>
        <b-nav vertical class='flex-nowrap'>
          <can method='viewAny' policy='ApplicationSettingPolicy'>
            <b-nav-item class='setting-nav-link' exact-active-class='setting-nav-link-active' :to="{ name: 'settings.application' }">
              <b-row>
                <b-col cols='3'><span><i class='fas fa-cogs'></i></span></b-col>
                <b-col cols='7'>{{ $t('settings.application.title') }}</b-col>
              </b-row>
            </b-nav-item>
            <b-nav-text class="p-0"><hr></b-nav-text>
          </can>

          <can method='viewAny' policy='UserPolicy'>
            <b-nav-item class='setting-nav-link' exact-active-class='setting-nav-link-active' :to="{ name: 'settings.users' }">
              <b-row>
                <b-col cols='3'><span><i class='fas fa-users'></i></span></b-col>
                <b-col cols='7'>{{ $t('settings.users.title') }}</b-col>
              </b-row>
            </b-nav-item>
            <cannot method='viewAny' policy='RolePolicy'>
              <b-nav-text class="p-0"><hr></b-nav-text>
            </cannot>
          </can>

          <can method='viewAny' policy='RolePolicy'>
            <b-nav-item class='setting-nav-link' exact-active-class='setting-nav-link-active' :to="{ name: 'settings.roles' }">
              <b-row>
                <b-col cols='3'><span><i class='fas fa-user-tag'></i></span></b-col>
                <b-col cols='7'>{{ $t('settings.roles.title') }}</b-col>
              </b-row>
            </b-nav-item>
            <b-nav-text class="p-0"><hr></b-nav-text>
          </can>

          <can method='viewAny' policy='RoomTypePolicy'>
            <b-nav-item class='setting-nav-link' exact-active-class='setting-nav-link-active' :to="{ name: 'settings.room_types' }">
              <b-row>
                <b-col cols='3'><span><i class='fas fa-tags'></i></span></b-col>
                <b-col cols='7'>{{ $t('settings.roomTypes.title') }}</b-col>
              </b-row>
            </b-nav-item>
          </can>

          <can method='viewAny' policy='ServerPolicy'>
            <b-nav-item class='setting-nav-link' exact-active-class='setting-nav-link-active' :to="{ name: 'settings.servers' }">
              <b-row>
                <b-col cols='3'><span><i class='fas fa-server'></i></span></b-col>
                <b-col cols='7'>{{ $t('settings.servers.title') }}</b-col>
              </b-row>
            </b-nav-item>
          </can>
        </b-nav>
      </b-col>
      <b-col lg='9'>
        <b-card class='p-3 border bg-white'>
          <router-view></router-view>
        </b-card>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import Can from '../../components/Permissions/Can';
import Cannot from '../../components/Permissions/Cannot';

export default {
  components: { Cannot, Can }
};
</script>
<style scoped>
</style>

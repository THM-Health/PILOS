<template>
  <b-container class='mt-3 mb-5'>
    <h2>{{ $t('settings.title') }}</h2>
    <hr>
    <b-row class='mt-5'>
      <b-col lg='3' class='mb-4'>
        <b-nav vertical>
          <can method='viewAny' policy='UserPolicy'>
            <b-nav-item class='setting-nav-link' exact-active-class='setting-nav-link-active' :to="{ name: 'settings.users' }">
              <b-row>
                <b-col cols='3'><span><i class='fas fa-users'></i></span></b-col>
                <b-col cols='7'>{{ $t('settings.users.title') }}</b-col>
              </b-row>
            </b-nav-item>
          </can>

          <can method='viewAny' policy='RolePolicy'>
            <b-nav-item class='setting-nav-link' exact-active-class='setting-nav-link-active' :to="{ name: 'settings.roles' }">
              <b-row>
                <b-col cols='3'><span><i class='fas fa-user-tag'></i></span></b-col>
                <b-col cols='7'>{{ $t('settings.roles.title') }}</b-col>
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

export default {
  components: { Can }
};
</script>
<style scoped>
</style>

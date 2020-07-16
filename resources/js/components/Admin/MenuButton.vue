<template>

  <div>
    <!--TODO add role permission to view the buttons-->
    <b-nav vertical>
      <b-nav-item class="focus-hover" :to="{ name: 'admin.index' }">
        <b-row>
          <b-col cols="3"><span><i class="fas fa-users"></i></span></b-col>
          <b-col cols="9">{{$t('admin.users.title')}}</b-col>
        </b-row>
      </b-nav-item>
      <b-nav-item class="focus-hover" :to="{ name: 'admin.rooms' }">
        <b-row>
          <b-col cols="3"><span><i class="fas fa-binoculars"></i></span></b-col>
          <b-col cols="9">{{$t('admin.rooms.title')}}</b-col>
        </b-row>
      </b-nav-item>
      <b-nav-item class="focus-hover" :to="{ name: 'admin.recordings' }">
        <b-row>
          <b-col cols="3"><span><i class="fas fa-video"></i></span></b-col>
          <b-col cols="9">{{$t('admin.recordings.title')}}</b-col>
        </b-row>
      </b-nav-item>
      <b-nav-item class="focus-hover" :to="{ name: 'admin.siteSettings' }">
        <b-row>
          <b-col cols="3"><span><i class="fas fa-cogs"></i></span></b-col>
          <b-col cols="9">{{$t('admin.siteSettings.title')}}</b-col>
        </b-row>
      </b-nav-item>
      <b-nav-item class="focus-hover" :to="{ name: 'admin.roles' }">
        <b-row>
          <b-col cols="3"><span><i class="fas fa-user-tag"></i></span></b-col>
          <b-col cols="9">{{$t('admin.roles.title')}}</b-col>
        </b-row>
      </b-nav-item>
    </b-nav>
  </div>
</template>

<script>

</script>

<style scoped>

  .focus-hover:hover {
    background-color: rgba(128, 186, 39, 0.5);
    color: #80BA27;
  }

  .active {
    color: #80BA27;
    background-color: rgba(128, 186, 39, 0.5);
    font-weight: 600;
  }

</style>

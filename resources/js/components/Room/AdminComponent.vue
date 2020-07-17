<template>
  <div>

    <div class="row">
      <div class="col-12">
        <b-card no-body>
      <b-tabs content-class="p-3" fill  active-nav-item-class="bg-success text-white">
        <b-tab  active>
          <template v-slot:title>
            <i class="fas fa-users"></i> Mitglieder <span class="badge badge-pill badge-dark">{{ countUsers }}</span>
          </template>
          <user-component @userChanged="onUserChange" :room="room"></user-component>
        </b-tab>
        <b-tab>
          <template v-slot:title>
            <i class="fas fa-folder-open"></i> Dateien
          </template>
          <file-component :room="room"></file-component>
        </b-tab>
        <b-tab>
          <template v-slot:title>
            <i class="fas fa-chart-line"></i> Statistiken
          </template>

        </b-tab>
        <b-tab>
          <template v-slot:title>
            <i class="fas fa-cog"></i> Einstellungen
          </template>
          <settings-component :room="room"></settings-component>
        </b-tab>
      </b-tabs>
        </b-card>
      </div>
    </div>
  </div>
</template>

<script>
  import SettingsComponent from './SettingsComponent'
  import UserComponent from './UserComponent'
  import FileComponent from './FileComponent'
  import Base from "../../api/base";

export default {

  components: {
    SettingsComponent,
    UserComponent,
    FileComponent
  },
  props: {
    room: Object,
  },
  data() {
    return {
      countUsers: 0,
      welcomeMessageLimit: 500,
    };
  },
  methods: {
    onUserChange (value){
      this.countUsers = value;
    }
  }



};
</script>
<style scoped></style>

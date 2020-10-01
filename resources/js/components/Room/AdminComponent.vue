<template>
  <div>
    <div class="row">
      <div class="col-12">
        <b-card no-body>
          <b-tabs content-class="p-3" fill  active-nav-item-class="bg-success text-white">
            <!-- Membership tab -->
            <b-tab  active>
              <template v-slot:title>
                <i class="fas fa-users"></i> {{ $t('rooms.members.title') }} <span v-if="countMembers>0" class="ml-2 badge badge-pill badge-dark">{{ countMembers }}</span>
              </template>
              <members-component @membersChanged="onMembersChange" :room="room"></members-component>
            </b-tab>
            <!-- File management tab -->
            <b-tab>
              <template v-slot:title>
                <i class="fas fa-folder-open"></i> {{ $t('rooms.files.title') }}
              </template>
              <file-component :room-id="room.id" :is-owner="room.isOwner"></file-component>
            </b-tab>
            <!-- Statistics tab -->
            <!-- TODO Implementaion
            <b-tab>
              <template v-slot:title>
                <i class="fas fa-chart-line"></i> {{ $t('rooms.statistics.title') }}
              </template>
            </b-tab>
            -->
            <!-- Room settings tab -->
            <b-tab>
              <template v-slot:title>
                <i class="fas fa-cog"></i> {{ $t('rooms.settings.title') }}
              </template>
              <settings-component @settingsChanged="onSettingsChange" :room="room"></settings-component>
            </b-tab>
          </b-tabs>
        </b-card>
      </div>
    </div>
  </div>
</template>
<script>
import SettingsComponent from './SettingsComponent';
import MembersComponent from './MembersComponent';
import FileComponent from './FileComponent';

export default {

  components: {
    SettingsComponent,
    MembersComponent,
    FileComponent
  },
  props: {
    room: Object
  },
  data () {
    return {
      // Amount of members
      countMembers: 0
    };
  },
  methods: {
    // Handle event from members component to display amount of members
    onMembersChange (value) {
      this.countMembers = value;
    },
    // Handle event from settings component and emit to room view to reload
    onSettingsChange () {
      this.$emit('settingsChanged');
    }
  }
};
</script>
<style scoped></style>

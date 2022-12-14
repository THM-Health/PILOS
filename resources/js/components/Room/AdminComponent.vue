<template>
  <div>
    <div class="row">
      <div class="col-12">
        <b-card no-body>
          <b-tabs content-class="p-3" fill active-nav-item-class="bg-primary">
            <!-- Membership tab -->
            <b-tab  active>
              <template v-slot:title>
                <i class="fa-solid fa-users"></i> {{ $t('rooms.members.title') }}
              </template>
              <members-component :room="room"></members-component>
            </b-tab>
            <b-tab>
              <template v-slot:title>
                <i class="fa-solid fa-link"></i> {{ $t('rooms.tokens.title') }}
              </template>
              <tokens-component :room="room"></tokens-component>
            </b-tab>
            <!-- File management tab -->
            <b-tab>
              <template v-slot:title>
                <i class="fa-solid fa-folder-open"></i> {{ $t('rooms.files.title') }}
              </template>
              <file-component :room="room" ></file-component>
            </b-tab>
            <!-- Statistics tab -->
            <b-tab>
              <template v-slot:title>
                <i class="fa-solid fa-history"></i> {{ $t('rooms.meeting_history.title') }}
              </template>
              <history-component :room="room"></history-component>
            </b-tab>
            <!-- Room settings tab -->
            <b-tab>
              <template v-slot:title>
                <i class="fa-solid fa-cog"></i> {{ $t('rooms.settings.title') }}
              </template>
              <settings-component @settingsChanged="$emit('settingsChanged')" :room="room"></settings-component>
            </b-tab>
          </b-tabs>
        </b-card>
      </div>
    </div>
  </div>
</template>
<script>
import SettingsComponent from './SettingsComponent.vue';
import MembersComponent from './MembersComponent.vue';
import FileComponent from './FileComponent.vue';
import HistoryComponent from './HistoryComponent.vue';
import TokensComponent from './TokensComponent.vue';

export default {

  components: {
    HistoryComponent,
    SettingsComponent,
    MembersComponent,
    FileComponent,
    TokensComponent
  },
  props: {
    room: Object
  }
};
</script>
<style scoped></style>

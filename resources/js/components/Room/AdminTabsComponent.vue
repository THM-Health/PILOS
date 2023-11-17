<template>
  <div>
    <div class="row">
      <div class="col-12">
        <b-card no-body>
          <b-tabs
            content-class="p-3"
            fill
            active-nav-item-class="bg-primary"
          >
            <!-- Room description tab -->
            <b-tab>
              <template #title>
                <i class="fa-solid fa-file-lines" /> {{ $t('rooms.description.title') }}
              </template>
              <room-description-component
                :room="room"
                @settings-changed="$emit('settings-changed')"
              />
            </b-tab>
            <!-- Membership tab -->
            <b-tab>
              <template #title>
                <i class="fa-solid fa-users" /> {{ $t('rooms.members.title') }}
              </template>
              <members-component
                :room="room"
              />
            </b-tab>
            <!-- Personal room links tab -->
            <b-tab>
              <template #title>
                <i class="fa-solid fa-link" /> {{ $t('rooms.tokens.title') }}
              </template>
              <tokens-component
                :room="room"
              />
            </b-tab>
            <!-- File management tab -->
            <b-tab>
              <template #title>
                <i class="fa-solid fa-folder-open" /> {{ $t('rooms.files.title') }}
              </template>
              <file-component
                :room="room"
                @invalid-code="$emit('invalid-code')"
                @invalid-token="$emit('invalid-token')"
                @guests-not-allowed="$emit('guests-not-allowed')"
              />
            </b-tab>
            <!-- Statistics tab -->
            <b-tab>
              <template #title>
                <i class="fa-solid fa-history" /> {{ $t('rooms.meeting_history.title') }}
              </template>
              <history-component
                :room="room"
              />
            </b-tab>
            <!-- Room settings tab -->
            <b-tab>
              <template #title>
                <i class="fa-solid fa-cog" /> {{ $t('rooms.settings.title') }}
              </template>
              <settings-component
                :room="room"
                @settings-changed="$emit('settings-changed')"
              />
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
import RoomDescriptionComponent from './RoomDescriptionComponent.vue';

export default {

  name: 'AdminTabsComponent',
  components: {
    RoomDescriptionComponent,
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

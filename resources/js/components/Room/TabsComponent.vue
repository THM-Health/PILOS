<template>
  <div>
    <div class="row">
      <div class="col-12">
        <b-card no-body>
          <b-tabs content-class="p-3" fill active-nav-item-class="bg-primary">
            <!-- Room description tab -->
            <b-tab active v-if="room.description">
              <template v-slot:title>
                <i class="fa-solid fa-file-lines"></i> {{ $t('rooms.description.title') }}
              </template>
              <room-description-component :room="room"></room-description-component>
            </b-tab>
            <!-- File management tab -->
            <b-tab>
              <template v-slot:title>
                <i class="fa-solid fa-folder-open"></i> {{ $t('rooms.files.title') }}
              </template>
              <file-component
                ref="publicFileList"
                :emit-errors="true"
                v-on:error="onTabComponentError"
                :access-code="accessCode"
                :token="token"
                :room="room"
                :require-agreement="true"
                :hide-reload="true"
              ></file-component>
            </b-tab>
            <!-- Recordings management tab -->
            <b-tab>
              <template v-slot:title>
                <i class="fa-solid fa-circle-play"></i> {{ $t('rooms.recordings.title') }}
              </template>
              <recording-component

                ref="publicRecordingList"
                :emit-errors="true"
                v-on:error="onTabComponentError"
                :access-code="accessCode"
                :token="token"
                :room="room"
                :hide-reload="true"
                :show-disabled="false"

              ></recording-component>
            </b-tab>
          </b-tabs>
        </b-card>
      </div>
    </div>
  </div>
</template>
<script>
import FileComponent from './FileComponent.vue';
import RoomDescriptionComponent from './RoomDescriptionComponent.vue';
import RecordingComponent from './RecordingComponent.vue';

export default {

  components: {
    RoomDescriptionComponent,
    FileComponent,
    RecordingComponent
  },
  props: {
    room: Object,
    accessCode: String,
    token: String
  },
  methods: {
    /**
     * Handle errors from tab components by emitting them to parent to be handled
     */
    onTabComponentError: function (error) {
      this.$emit('tabComponentError', error);
    },

    /**
     * Reload components (called by parent) due to changes in access code, token or room
     */
    reload: function () {
      this.$refs.publicFileList.reload();
      this.$refs.publicRecordingList.reload();
    }
  }
};
</script>
<style scoped></style>

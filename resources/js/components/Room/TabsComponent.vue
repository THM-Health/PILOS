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
            <b-tab
              v-if="room.description"
              active
            >
              <template #title>
                <i class="fa-solid fa-file-lines" /> {{ $t('rooms.description.title') }}
              </template>
              <room-description-component
                :room="room"
              />
            </b-tab>
            <!-- File management tab -->
            <b-tab>
              <template #title>
                <i class="fa-solid fa-folder-open" /> {{ $t('rooms.files.title') }}
              </template>
              <file-component
                :access-code="accessCode"
                :token="token"
                :room="room"

                :require-agreement="true"
                :hide-reload="true"
                @invalid-code="$emit('invalid-code')"
                @invalid-token="$emit('invalid-token')"
                @guests-not-allowed="$emit('guests-not-allowed')"
              />
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

export default {

  name: 'TabsComponent',
  components: {
    RoomDescriptionComponent,
    FileComponent
  },
  props: {
    room: Object,
    accessCode: Number,
    token: String
  }
};
</script>

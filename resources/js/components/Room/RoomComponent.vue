<template>
  <div class="h-100">
    <b-overlay :show="loading" rounded="sm" class="h-100">
      <b-card no-body bg-variant="white" class="room-card h-100" @click="open()" :class="{'running': running}">
        <b-card-body class="p-3 h-100">
          <div class="d-flex flex-column h-100">
            <div class="flex-grow-1">
              <b-row>
                <b-col>
                  <b-badge :style="{ 'background-color': type.color}">{{this.type.description}}</b-badge>
                </b-col>
                <b-col>
                  <div class="text-right">
                    <b-button @click.stop="toastInfo('Test')" size="sm" class="fa-solid fa-info"></b-button>
                  </div>
                </b-col>
              </b-row>
              <h5 class="mt-2 text-break " style="width: 100% ">{{name}}</h5>
            </div>
            <div>
              <small style="display: block"><i class="fa-solid fa-user"></i> {{ owner.name }} </small>
              <small style="display: block"><i class="fa-solid fa-clock"></i>
                <span v-if="meeting==null"> {{$t('rooms.index.room_component.never_started')}}</span>
                <span v-else-if="meeting.start!=null && meeting.end!=null">{{$t('rooms.index.room_component.last_ran_till', {date:$d(new Date(meeting.end),'datetimeShort')})}}</span>
                <span v-else-if="meeting.end==null"> {{$t('rooms.index.room_component.running_since', {date:$d(new Date(meeting.start),'datetimeShort')})}}</span>
                <span v-else> {{$t('rooms.index.room_component.meeting_starting')}}</span>
              </small>
            </div>
          </div>
      </b-card-body>
    </b-card>
    </b-overlay>
  </div>
</template>
<script>
import RoomStatusComponent from './RoomStatusComponent.vue';
export default {
  components: { RoomStatusComponent },
  data () {
    return {
      loading: false
    };
  },
  props: {
    id: String,
    name: String,
    meeting:Object,
    shared: {
      type: Boolean,
      default: false
    },
    type: Object,
    owner: Object
  },
  methods: {

    open: function () {
      this.loading = true;
      this.$router.push({ name: 'rooms.view', params: { id: this.id } }).finally(() => {
        this.loading = false;
      });
    }

  },
  computed:{
    running: function (){
      return this.meeting!=null && this.meeting.start!=null && this.meeting.end == null
    }
  }
};
</script>
<style scoped>

</style>

<template>
  <div>
    <b-overlay :show="loading" rounded="sm">
    <b-card no-body bg-variant="white" class="room-card" @click="open()" style="border-Color: #7FBA24">
      <b-card-body class="p-3">
        <room-status-component :running="running"></room-status-component>
        <b-row>
          <b-col>
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
            <small v-if="shared" style="display: block"><i class="fa-solid fa-user"></i> {{ sharedBy.name }} </small>
            <small v-if="!shared" style="display: block"><i class="fa-solid fa-user"></i> Besitzer </small>
            <small  v-if="running" style="display: block"><i class="fa-solid fa-clock"></i> Läuft</small>
            <small  v-if="!running" style="display: block"><i class="fa-solid fa-clock"></i> 20.06.23</small>
          </b-col>
<!--         <b-col cols="3" ><div v-if="type" v-b-tooltip.hover :title="type.description" class="room-icon" :style="{ 'background-color': type.color}">{{type.short}}</div></b-col>-->
        </b-row>
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
    running: {
      type: Boolean,
      default: false
    },
    shared: {
      type: Boolean,
      default: false
    },
    type: Object,
    sharedBy: Object
  },
  methods: {

    open: function () {
      this.loading = true;
      this.$router.push({ name: 'rooms.view', params: { id: this.id } }).finally(() => {
        this.loading = false;
      });
    }

  }
};
</script>
<style scoped>

</style>

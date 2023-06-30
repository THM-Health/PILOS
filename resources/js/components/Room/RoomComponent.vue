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
              <small  v-if="running" style="display: block"><i class="fa-solid fa-clock"></i> Läuft</small>
              <small  v-if="!running" style="display: block"><i class="fa-solid fa-clock"></i> 20.06.23</small>
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
    running: {
      type: Boolean,
      default: false
    },
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

  }
};
</script>
<style scoped>

</style>

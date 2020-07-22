<template>
  <div>
    <b-card no-body bg-variant="white" class="roomcard" v-on:click="say('hi')">
      <b-card-body class="p-3">
      <b-media>
        <template v-slot:aside>
          <div v-if="type" class="roomicon" :style="{ 'background-color': type.color}">{{type.short}}</div>
          <div v-else class="roomicon">{{ $t('rooms.roomTypeMeeting') }}</div>
        </template>

        <h4 class="mt-2 ">{{name}}</h4>
      </b-media>
      </b-card-body>
      <template v-slot:footer v-if="shared">
        <small><i class="fas fa-share"></i> {{ $t('sharedBy', { name: sharedBy }) }}</small>
      </template>

    </b-card>

  </div>
</template>

<script>
export default {
  props: {
    id: String,
    name: String,
    shared: {
      type: Boolean,
      default: false
    },
    type: Object,
    sharedBy: String
  },

  data () {
    return {

    }
  },

  methods: {
    say: function (message) {
      this.$router.push({ name: 'rooms.view', params: { id: this.id } })
    }
  }

}
</script>

<style scoped>
.roomcard{
  pointer-events: auto;
  cursor: pointer;
}
</style>

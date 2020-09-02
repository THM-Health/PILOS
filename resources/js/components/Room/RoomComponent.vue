<template>
  <div>
    <b-overlay :show="loading" rounded="sm">
    <b-card no-body bg-variant="white" class="roomcard" @click="open()">
      <b-card-body class="p-3">
      <b-media>
        <template v-slot:aside>
          <div v-if="type" class="roomicon" :style="{ 'background-color': type.color}">{{type.short}}</div>
        </template>
        <h4 class="mt-2 ">{{name}}</h4>
      </b-media>
      </b-card-body>
      <template v-slot:footer v-if="shared">
        <small><i class="fas fa-share"></i> {{ $t('rooms.sharedBy', { name: sharedBy }) }}</small>
      </template>
    </b-card>
    </b-overlay>
  </div>
</template>
<script>
export default {
  data () {
    return {
      loading: false
    };
  },
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
  methods: {

    open: function () {
      this.loading = true;
      this.$router.push({ name: 'rooms.view', params: { id: this.id } });
    }

  }
};
</script>
<style scoped>

</style>

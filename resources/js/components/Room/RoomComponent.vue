<template>
  <div>
    <b-overlay :show="loading" rounded="sm">
    <b-card no-body bg-variant="white" class="roomcard" @click="open()">
      <b-card-body class="p-3">
        <b-row>
          <b-col cols="3" sm="3"><div v-if="type" v-b-tooltip.hover :title="type.description" class="roomicon" :style="{ 'background-color': type.color}">{{type.short}}</div></b-col>
          <b-col col><h5 class="mt-2 text-break " style="width: 100%">{{name}}</h5></b-col>
        </b-row>
      </b-card-body>
      <template v-slot:footer v-if="shared">
        <small><i class="fas fa-share"></i> {{ $t('rooms.sharedBy', { name: sharedBy.name }) }}</small>
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
    sharedBy: Object
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

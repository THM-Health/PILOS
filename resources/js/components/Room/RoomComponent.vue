<template>
  <div>
    <b-card no-body bg-variant="white" class="roomcard" @click="$router.push({ name: 'rooms.view', params: { id: id }})">
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
  }
};
</script>
<style scoped>
.roomcard{
  pointer-events: auto;
  cursor: pointer;
}
</style>

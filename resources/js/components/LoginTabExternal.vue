<template>
  <div>
    <p class="p-card-title">{{ props.title }}</p>
    <a
      class="p-button"
      :href="redirectUrl"
    >
      <i class="fa-solid fa-arrow-up-right-from-square mr-2"></i> {{ redirectLabel }}
    </a>
  </div>
</template>

<script setup>

const props = defineProps({
  redirectLabel: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  redirectUrl: {
    type: String,
    required: true
  }
});

</script>

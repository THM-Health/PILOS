<template>
  <b-alert v-if='enabled' :show='true' :style="{ 'border-color': background, 'background-color': background, 'color': color }" class='mb-0 p-2'>
    <div class='container'>
      <h4 v-if='title' class='alert-heading'>
        <i v-if='icon' :class='`${icon}`'></i>
        {{ title }}
      </h4>
      <div class='banner-message'>{{ message }}</div>
      <a :class='`btn btn-${linkStyle} banner-link`' v-if='link' :href='link' :target='`_${linkTarget}`'>{{ linkText ? linkText : link }}</a>
    </div>
  </b-alert>
</template>

<script>
export default {
  props: {
    background: {
      type: String
    },

    color: {
      type: String
    },

    enabled: {
      type: Boolean
    },

    icon: {
      type: String
    },

    link: {
      type: String
    },

    linkStyle: {
      type: String
    },

    linkTarget: {
      type: String
    },

    linkText: {
      type: String
    },

    message: {
      type: String
    },

    title: {
      type: String
    }
  }
};
</script>
<style scoped>
  .banner-message {
    white-space: pre-wrap;
  }

  .banner-link {
    color: inherit;
  }
</style>

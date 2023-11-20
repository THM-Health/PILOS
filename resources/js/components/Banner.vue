<template>
  <b-alert
    :show="true"
    :style="{ 'border-color': background, 'background-color': background, 'color': color }"
    class="mb-0 p-2 rounded-0"
  >
    <div class="container">
      <h4
        v-if="title"
        class="alert-heading"
      >
        <i
          v-if="icon"
          :class="`${icon}`"
        />
        {{ title }}
      </h4>
      <div class="banner-message">
        {{ message }}
      </div>
      <a
        v-if="link"
        :class="`btn btn-${linkStyle}`"
        :href="link"
        :target="`_${linkTarget}`"
      >{{ linkText ? linkText : link }}</a>
    </div>
  </b-alert>
</template>

<script>
export default {
  props: {
    background: {
      type: String,
      default: null,
      required: false
    },

    color: {
      type: String,
      default: null,
      required: false
    },

    icon: {
      type: String,
      default: null,
      required: false
    },

    link: {
      type: String,
      default: null,
      required: false
    },

    linkStyle: {
      type: String,
      default: 'primary'
    },

    linkTarget: {
      type: String,
      default: '_self'
    },

    linkText: {
      type: String,
      default: null,
      required: false
    },

    message: {
      type: String,
      required: true
    },

    title: {
      type: String,
      default: null,
      required: false
    }
  }
};
</script>
<style scoped>
  .banner-message {
    white-space: pre-wrap;
  }
</style>

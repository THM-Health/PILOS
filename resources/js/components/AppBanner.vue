<template>
  <Message
    :style="{ 'border-color': background, 'background-color': background, 'color': color }"
    class="m-0 py-4 rounded-none"
    :closable="false"
    :pt="{
      icon: {
        class: 'hidden'
      },
      wrapper: {
        class: 'p-4 container'
      }
    }"
    :unstyled="true"
  >
    <template #messageicon>
    </template>

    <div class="container flex flex-col gap-2">
      <p
        v-if="title"
        class="text-lg font-bold m-0"
      >
        <i
          v-if="icon"
          :class="`${icon}`"
        />
        {{ title }}
      </p>
      <p class="m-0 whitespace-pre-wrap">
        {{ message }}
      </p>
      <a v-if="link" :href="link" :target="`_${linkTarget}`">
        <Button
          :link="linkStyle === 'link'"
          :style="linkStyle === 'link' ? {'color': color}: {}"
          :class="linkStyle === 'link' ? 'underline p-0': '' "
          :severity="linkStyle"
          :label="linkText ? linkText : link"
        />
      </a>
    </div>
  </Message>
</template>

<script setup>
defineProps({
  background: {
    type: String,
    default: null
  },

  color: {
    type: String,
    default: null
  },

  icon: {
    type: String,
    default: null
  },

  link: {
    type: String,
    default: null
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
    default: null
  },

  message: {
    type: String,
    default: null
  },

  title: {
    type: String,
    default: null
  }
});

</script>
<style scoped>
  .banner-message {
    white-space: pre-wrap;
  }
</style>

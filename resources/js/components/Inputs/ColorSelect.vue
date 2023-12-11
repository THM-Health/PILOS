<template>
    <div class="d-flex">
        <div
            role="button"
            v-for="color in colors"
            :key="color"
            class="color-select"
            :style="{'background-color': color}"
            :class="{'selected': value.toLowerCase() === color.toLowerCase(), 'disabled': disabled}"
            @click="input(color)"
            >
                <div class="overlay">
                    <i v-if="value.toLowerCase() === color.toLowerCase()" class="fa-solid fa-circle-check"></i>
                </div>

        </div>
    </div>
  </template>

<script>
export default {
  props: {
    colors: {
      type: Array
    },
    value: {
      type: String,
      default: null
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    /**
       * Emits the input event.
       *
       * @param {string} value
       */
    input (value) {
      if (this.disabled) return;
      this.$emit('input', value);
    }
  }
};
</script>

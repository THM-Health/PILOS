<template>
  <div
    ref="overflow"
    v-b-tooltip.hover
    :title="!disabled ? $slots.default[0].text : null"
    class="text-ellipsis"
    :disabled="disabled"
  >
    <slot />
  </div>
</template>

<script>
export default {
  data () {
    return {
      disabled: false
    };
  },
  mounted () {
    this.checkOverflow();
    this.$nextTick(() => {
      window.addEventListener('resize', this.checkOverflow);
    });
  },

  beforeDestroy () {
    window.removeEventListener('resize', this.checkOverflow);
  },

  methods: {
    /**
     * Enable tooltip if text overflows and is truncated
     */
    checkOverflow () {
      this.disabled = this.$refs.overflow.offsetWidth >= this.$refs.overflow.scrollWidth;
    }
  }

};
</script>

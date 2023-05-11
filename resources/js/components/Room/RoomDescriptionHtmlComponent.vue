<template>
    <div>
        <div class="px-2 room-description" v-html="html"></div>
        <b-modal
            id="linkModal"
            :title="$t('rooms.description.link.warning.title')"
            :ok-title="$t('app.continue')"
            :cancel-title="$t('app.cancel')"
            @ok="onConfirm"
        >
        {{ $t('rooms.description.link.warning.description') }} {{ link }}
        </b-modal>
    </div>

</template>
<script>
export default {
  props: {
    html: String
  },
  data () {
    return {
      link: null
    };
  },
  updated () {
    this.addSafeLinkListeners();
  },
  mounted () {
    this.addSafeLinkListeners();
  },
  methods: {
    addSafeLinkListeners () {
      // Add a listener to all links with target safeLink
      const safeLinks = document.querySelectorAll('[data-target="safeLink"]');
      safeLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
          event.preventDefault();
          this.link = link.getAttribute('data-href');
          this.$bvModal.show('linkModal');
        });
      });
    },
    onConfirm () {
      window.open(this.link, '_blank');
      this.$bvModal.hide('linkModal');
    }
  }
};
</script>

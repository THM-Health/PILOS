<template>
    <div>
        <div class="px-2 room-description" v-html="html"></div>
        <b-modal
            :static='modalStatic'
            id="linkModal"
            :title="$t('rooms.description.external_link_warning.title')"
            :ok-title="$t('app.continue')"
            :cancel-title="$t('app.cancel')"
            @ok="onConfirm"
        >
        {{ $t('rooms.description.external_link_warning.description', {link: link}) }}
        </b-modal>
    </div>

</template>
<script>
export default {
  props: {
    html: String,
    modalStatic: {
      type: Boolean,
      default: false,
      required: false
    }
  },
  data () {
    return {
      link: null
    };
  },
  updated () {
    // Call addSafeLinkListeners on update to make sure all links
    // are covered even after the description was updated
    this.addSafeLinkListeners();
  },
  mounted () {
    // Call addSafeLinkListeners on mount to make sure all links
    // are covered on first render
    this.addSafeLinkListeners();
  },
  methods: {
    /**
     * Add listeners to all links with target safeLink to open a modal before opening the link
     */
    addSafeLinkListeners () {
      const safeLinks = document.querySelectorAll('[data-target="safeLink"]');
      safeLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
          event.preventDefault();
          this.link = link.getAttribute('data-href');
          this.$bvModal.show('linkModal');
        });
      });
    },

    /**
     * Handle confirm button click on link modal, open link in new tab
     */
    onConfirm () {
      window.open(this.link, '_blank');
      this.$bvModal.hide('linkModal');
    }
  }
};
</script>

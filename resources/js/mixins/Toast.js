export default {
  methods: {
    $toastMessage (variant, message, title = null) {
      this.$root.$bvToast.toast(message, {
        title,
        variant
      });
    },

    toastError (message, title = null) {
      this.$toastMessage('danger', message, title);
    },

    toastInfo (message, title = null) {
      this.$toastMessage('info', message, title);
    },

    toastWarning (message, title = null) {
      this.$toastMessage('warning', message, title);
    },

    toastSuccess (message, title = null) {
      this.$toastMessage('success', message, title);
    }
  }
};

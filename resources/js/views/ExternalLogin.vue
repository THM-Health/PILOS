<template>
    <div></div>
</template>

<script>
export default {

  mounted () {
    this.toastSuccess(this.$t('auth.flash.login'));
    // check if user should be redirected back after login
    if (this.$route.query.redirect !== undefined) {
      this.$router.push(this.$route.query.redirect);
    } else {
      this.$router.push({ name: 'rooms.own_index' });
    }
  }
};
</script>

<template>
  <footer class="footer">
    <b-container class="border-top bg-white" fluid>
      <b-row align-h="center" align-v="center">
        <a :href="$t('app.footer.legalNoticeUrl')">
          <small>{{$t('app.footer.legalNotice')}}</small>
        </a>

        <a class="mr-2 ml-2"><small>{{$t('app.footer.separator')}}</small></a>

        <a :href="$t('app.footer.privacyPolicyUrl')">
          <small>{{$t('app.footer.privacyPolicy')}}</small>
        </a>
      </b-row>
    </b-container>
  </footer>
</template>

<script>
</script>

<style scoped>

</style>

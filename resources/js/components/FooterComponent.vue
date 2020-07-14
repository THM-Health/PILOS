<template>
  <footer class="footer">
    <b-container class="d-flex justify-content-center border-top bg-white" fluid>
      <b-row>
        <a :href="$t('app.footer.legalNoticeUrl')">
          <small>{{$t('app.footer.legalNotice')}}</small>
        </a>

        <p class="mr-2 ml-2">{{$t('app.footer.separator')}}</p>

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
  .footer {
    height: 25px;
  }
</style>

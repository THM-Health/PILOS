<template>
  <div class="footer pilos-footer">
    <b-navbar class="mainnav" toggleable="lg" type="light" variant="white">
      <b-container>
        <b-nav>
          <h1>
            <b-navbar-brand disabled>
              <img style="height: 2rem;" src="/images/THM-logo.svg" alt="THMLogo">
            </b-navbar-brand>
          </h1>
        </b-nav>

        <b-nav>
          <b-row>
            <b-nav-item>{{$t('app.footer.legalNotice')}}</b-nav-item>
            <b-nav-item>{{$t('app.footer.privacyPolicy')}}</b-nav-item>
          </b-row>
        </b-nav>
      </b-container>
    </b-navbar>
  </div>
</template>

<script>
</script>

<style scoped>
  .pilos-footer {
    margin-top: 275px;
  }
</style>

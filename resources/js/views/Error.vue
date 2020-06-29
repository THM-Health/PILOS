<template>
  <div>
    <div class="container pt-5 pb-5">
      <div class="row">
        <div class="col-md-12 col-sm-12 text-center">
          <h1>{{ $t('app.error') }}</h1>
          <h2>{{ $t('app.errorMessage', { statusCode: statusCode, message: message }) }}</h2>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['statusCode', 'message']
}
</script>

<style scoped>

</style>

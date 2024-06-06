<template>
  <div class="container">
    <div class="grid mt-4 mb-5">
      <div class="col-12 md:col-8 lg:col-6 md:col-offset-2 lg:col-offset-3">
        <Card>
          <template #title> {{ $t('app.verify_email.title') }} </template>
          <template #content>
            <OverlayComponent :show="loading">
              <div v-if="!loading">
                <Message
                  v-if="success"
                  severity="success"
                  icon="fa-solid fa-envelope-circle-check"
                  :closable="false"
                >
                  {{ $t('app.verify_email.success') }}
                </Message>
                <Message
                  v-else-if="error === env.HTTP_UNPROCESSABLE_ENTITY"
                  severity="error"
                  icon="fa-solid fa-triangle-exclamation"
                  :closable="false"
                >
                  {{ $t('app.verify_email.invalid') }}
                </Message>
                <Message
                  v-else
                  severity="error"
                  icon="fa-solid fa-triangle-exclamation"
                  :closable="false"
                >
                  {{ $t('app.verify_email.fail') }}
                </Message>
              </div>
            </OverlayComponent>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup>
import env from '../env';
import { onMounted, ref } from 'vue';
import { useApi } from '../composables/useApi.js';

const props = defineProps({
  token: {
    type: String,
    default: null
  },

  email: {
    type: String,
    default: null
  }
});

const loading = ref(true);
const success = ref(true);
const error = ref(null);

const api = useApi();

onMounted(() => {
  verifyEmail();
});

function verifyEmail () {
  loading.value = true;
  api.call('email/verify', {
    method: 'POST',
    data: {
      email: props.email,
      token: props.token
    }
  })
    .then(response => {
      success.value = true;
    })
    .catch((error) => {
      if (error.response) {
        error.value = error.response.status;
        if (error.response.status !== env.HTTP_UNPROCESSABLE_ENTITY) {
          api.error(error);
        }
      }
      success.value = false;
    }).finally(() => {
      loading.value = false;
    });
}
</script>

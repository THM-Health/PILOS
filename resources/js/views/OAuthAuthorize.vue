<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useApi } from "../composables/useApi.js";
import { useToast } from "../composables/useToast.js";
import env from "../env.js";
import { useAuthStore } from "../stores/auth.js";
import { useSettingsStore } from "../stores/settings.js";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const settingsStore = useSettingsStore();
const api = useApi();
const toast = useToast();

const loadingAuthorization = ref(false);
const authToken = ref(null);
const scopes = ref([]);
const client = ref(null);

const error = ref(null);
const errorDescription = ref(null);

onMounted(() => {
  if (settingsStore.getSetting("auth.oauth")) {
    authorize();
  }
});

function authorize() {
  loadingAuthorization.value = true;
  authToken.value = null;
  client.value = null;
  scopes.value = [];

  api
    .call("oauth/authorize", {
      params: route.query,
    })
    .then((response) => {
      if (response.data.redirect) {
        window.location.href = response.data.redirect;
        return;
      }

      authToken.value = response.data.authToken;
      client.value = response.data.client;
      scopes.value = response.data.scopes;
    })
    .catch((apiError) => {
      if (apiError.response) {
        if (
          apiError.response.status === env.HTTP_UNAUTHORIZED &&
          apiError.response.data.message === "Unauthenticated."
        ) {
          auth.setCurrentUser(null);
          router.replace({
            name: "login",
            query: { redirect: route.fullPath },
          });
        }

        if (
          apiError.response.data.error &&
          apiError.response.data.error_description
        ) {
          error.value = apiError.response.data.error;
          errorDescription.value = apiError.response.data.error_description;
        }

        return;
      }

      api.error(error);
    })
    .finally(() => {
      loadingAuthorization.value = false;
    });
}

function approve() {
  //loadingAuthorization.value = true;

  api
    .call("oauth/authorize", {
      method: "post",
      data: {
        auth_token: authToken.value,
      },
    })
    .then((response) => {
      if (response.data.redirect) {
        window.location.href = response.data.redirect;
      }
    })
    .catch((apiError) => {
      api.error(apiError);
    })
    .finally(() => {
      // loadingAuthorization.value = false;
    });
}

function deny() {
  //loadingAuthorization.value = true;

  api
    .call("oauth/authorize", {
      method: "delete",
      data: {
        auth_token: authToken.value,
      },
    })
    .then((response) => {
      if (response.data.redirect) {
        window.location.href = response.data.redirect;
      }
    })
    .catch((apiError) => {
      api.error(apiError);
    })
    .finally(() => {
      // loadingAuthorization.value = false;
    });
}
</script>

<template>
  <div class="mt-20 flex justify-center">
    <Card
      style="width: 500px; max-width: 90vw"
      :pt="{ header: { class: 'flex justify-center' } }"
    >
      <template #header>
        <Badge
          severity="info"
          class="-mt-8 flex h-16! w-16! items-center justify-center rounded-full"
        >
          <i class="fa-solid fa-user-lock text-2xl text-white"></i>
        </Badge>
      </template>

      <template #content>
        <Message
          v-if="!settingsStore.getSetting('auth.oauth')"
          severity="error"
          icon="fa-solid fa-triangle-exclamation"
          :closable="false"
        >
          OAuth 2.0 is not enabled
        </Message>

        <h1 v-if="client" class="text-xl font-semibold">
          {{ $t("auth.oauth.authorize_client", { client: client }) }}
        </h1>

        <Message
          v-if="error"
          severity="error"
          icon="fa-solid fa-triangle-exclamation"
          :closable="false"
        >
          Error {{ error }}: {{ errorDescription }}
        </Message>

        <OverlayComponent :show="loadingAuthorization">
          <div v-if="scopes.length > 0" class="mt-4">
            <p><strong>This application will be able to:</strong></p>

            <ul class="mt-1 ml-6 list-disc">
              <li v-for="scope in scopes">
                {{ $t("auth.oauth.scopes." + scope.id.replaceAll(":", "_")) }}
              </li>
            </ul>
          </div>
        </OverlayComponent>
      </template>
      <template #footer>
        <div v-if="client">
          <div class="flex justify-end gap-2">
            <Button severity="secondary" @click="deny">{{
              $t("app.cancel")
            }}</Button>
            <Button severity="primary" @click="approve">Allow</Button>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped></style>

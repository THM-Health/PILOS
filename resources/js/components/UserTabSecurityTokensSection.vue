<template>
  <div>
    <OverlayComponent :show="loading || loadingError">
      <template #overlay>
        <LoadingRetryButton :error="loadingError" @reload="getTokens()" />
      </template>

      <Panel
        v-for="token in tokens"
        :key="token.id"
        class="mb-2"
        data-test="oauth-token-panel"
      >
        <template #header>
          <h3 class="text-lg font-semibold">
            {{ token.name || `OAuth Token ${token.id.substring(0, 8)}` }}
          </h3>
        </template>

        <p class="mb-1">
          <strong>{{ $t("auth.tokens.created_at") }}</strong>
          {{ $d(new Date(token.created_at), "datetimeShort") }}
        </p>
        <p v-if="token.last_used_at" class="mb-1">
          <strong>{{ $t("auth.tokens.last_used_at") }}</strong>
          {{ $d(new Date(token.last_used_at), "datetimeShort") }}
        </p>
        <p v-else class="mb-1">
          <strong>{{ $t("auth.tokens.last_used_at") }}</strong>
          {{ $t("auth.tokens.never_used") }}
        </p>
        <p v-if="token.expires_at" class="mb-1">
          <strong>{{ $t("auth.tokens.expires_at") }}</strong>
          {{ $d(new Date(token.expires_at), "datetimeShort") }}
        </p>
        <div v-if="token.scopes && token.scopes.length > 0" class="mb-3">
          <strong>{{ $t("auth.tokens.scopes") }}</strong>
          <div class="mt-1 flex flex-wrap gap-1">
            <Badge
              v-for="scope in token.scopes"
              :key="scope"
              :value="$t('auth.oauth.scopes.' + scope.replaceAll(':', '_'))"
              severity="info"
            />
          </div>
        </div>

        <div class="mt-3 flex justify-end">
          <Button
            severity="danger"
            :disabled="loading || loadingError"
            :label="$t('auth.tokens.revoke')"
            icon="fa-solid fa-trash"
            @click="revokeToken(token.id)"
          />
        </div>
      </Panel>

      <InlineNote v-if="!tokens.length">{{
        $t("auth.tokens.nodata")
      }}</InlineNote>
    </OverlayComponent>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useApi } from "../composables/useApi.js";
import { useToast } from "../composables/useToast.js";
import { useI18n } from "vue-i18n";

const tokens = ref([]);
const loading = ref(false);
const loadingError = ref(false);

const api = useApi();
const toast = useToast();
const { t } = useI18n();

onMounted(() => {
  getTokens();
});

function getTokens() {
  loading.value = true;

  api
    .call("tokens")
    .then((response) => {
      loadingError.value = false;
      tokens.value = response.data.data;
    })
    .catch((error) => {
      loadingError.value = true;
      api.error(error);
    })
    .finally(() => {
      loading.value = false;
    });
}

function revokeToken(tokenId) {
  loading.value = true;

  api
    .call(`tokens/${tokenId}`, { method: "DELETE" })
    .then(() => {
      toast.success(t("auth.flash.token_revoked"));
      tokens.value = tokens.value.filter((token) => token.id !== tokenId);
    })
    .catch((error) => {
      api.error(error);
    })
    .finally(() => {
      loading.value = false;
    });
}
</script>

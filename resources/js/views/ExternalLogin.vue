<!--
SPDX-FileCopyrightText: 2023 Technische Hochschule Mittelhessen (THM) and PILOS contributors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <div v-if="!authStore.isAuthenticated" class="container">
    <div class="mt-6 mb-8 grid grid-cols-12 gap-4">
      <div
        class="col-span-12 md:col-span-8 md:col-start-3 lg:col-span-6 lg:col-start-4"
      >
        <Card v-if="error">
          <template #title> {{ $t("auth.error.login_failed") }} </template>
          <template #content>
            <Message
              v-if="props.error === 'missing_attributes'"
              severity="error"
              :closable="false"
              >{{ $t("auth.error.missing_attributes") }}
              {{ $t("auth.error.try_again") }}</Message
            >
            <Message
              v-if="props.error === 'invalid_request'"
              severity="error"
              :closable="false"
              >{{ $t("auth.error.invalid_request") }}
              {{ $t("auth.error.try_again") }}</Message
            >
            <Message
              v-if="props.error === 'shibboleth_session_duplicate_exception'"
              severity="error"
              :closable="false"
              >{{ $t("auth.error.shibboleth_session_duplicate_exception") }}
              {{ $t("auth.error.try_again") }}</Message
            >
            <Message
              v-if="props.error === 'openid_connect_network_exception'"
              severity="error"
              :closable="false"
              >{{ $t("auth.error.openid_connect_network_exception") }}
              {{ $t("auth.error.try_again") }}</Message
            >
            <Message
              v-if="props.error === 'openid_connect_exception'"
              severity="error"
              :closable="false"
              >{{ $t("auth.error.openid_connect_exception") }}
              {{ $t("auth.error.try_again") }}</Message
            >
          </template>
          <template #footer>
            <Button
              data-test="login-button"
              as="router-link"
              :to="{ name: 'login' }"
              :label="$t('auth.login')"
            />
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useToast } from "../composables/useToast.js";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "../stores/auth";

const props = defineProps({
  error: {
    type: String,
    default: null,
  },
  noMessage: {
    type: Boolean,
    default: false,
  },
});

const toast = useToast();
const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const normalizedRedirect = computed(() => {
  const value = route.query.redirect;
  const redirectValue = Array.isArray(value) ? value[0] : value;
  return redirectValue || undefined;
});

onMounted(() => {
  // Successfully login via external provider
  if (!props.error) {
    if (!props.noMessage) {
      // show toast message
      toast.success(t("auth.flash.login"));
    }

    // check if user should be redirected back after login,
    // otherwise redirect to own rooms (dashboard)
    if (normalizedRedirect.value !== undefined) {
      router.push(normalizedRedirect.value);
    } else {
      router.push({ name: "rooms.index" });
    }
  } else {
    // an error occurred during an external authentication
    // however the user is logged in, redirect to rooms overview
    if (authStore.isAuthenticated) {
      router.push({ name: "rooms.index" });
    }
  }
});
</script>

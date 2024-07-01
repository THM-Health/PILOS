<template>
  <div>
    <OverlayComponent :show="loading || loadingError">
      <template #overlay>
        <LoadingRetryButton :error="loadingError" @reload="getSessions()" />
      </template>
      <Panel
        v-for="session in sessions"
        :key="session.id"
        class="mb-2"
      >
        <template #header>
          <div class="flex items-center gap-2">
            <i
              v-if="session.user_agent.device.type === 'mobile'"
              class="fa-solid fa-mobile-screen mr-2"
            />
            <i
              v-else-if="session.user_agent.device.type === 'tablet'"
              class="fa-solid fa-tablet-screen-button mr-2"
            />
            <i
              v-else
              class="fa-solid fa-display mr-2"
            />
            <span>{{ session.user_agent.os.name || $t('auth.sessions.unknown_agent') }}</span>
          </div>
        </template>

        <template #icons>
          <Tag
            severity="secondary"
            v-if="!session.current"
            v-tooltip="$t('auth.sessions.last_active')"
            icon="fa-solid fa-clock"
            :value="$d(new Date( session.last_activity),'datetimeShort')"
          />
          <Tag
            v-else
            severity="primary"
            :value="$t('auth.sessions.current')"
          />
        </template>
        <p
          v-if="session.user_agent.browser.name"
          class="mb-1"
        >
          <strong>{{ $t('auth.sessions.browser') }}</strong> {{ session.user_agent.browser.name }}
        </p>
        <p>
          <strong>{{ $t('auth.sessions.ip') }}</strong> {{ session.ip_address }}
        </p>
      </Panel>
      <div class="flex justify-end">
        <Button
          severity="danger"
          :disabled="loading || loadingError"
          class="mt-4"
          @click="deleteAllSessions"
          :label="$t('auth.sessions.logout_all')"
          icon="fa-solid fa-right-from-bracket"
          :loading="loading"
        />
      </div>
    </OverlayComponent>
  </div>
</template>

<script setup>

import { onMounted, ref } from 'vue';
import { useApi } from '../composables/useApi.js';
import { useToast } from '../composables/useToast.js';
import { useI18n } from 'vue-i18n';
import UAParser from 'ua-parser-js';

const sessions = ref([]);
const loading = ref(false);
const loadingError = ref(false);

const api = useApi();
const toast = useToast();
const { t } = useI18n();

onMounted(() => {
  getSessions();
});

/**
 * Get the user's sessions.
 */
function getSessions () {
  loading.value = true;
  api.call('sessions')
    .then(response => {
      loadingError.value = false;
      sessions.value = response.data.data.map(session => {
        session.user_agent = parseAgent(session.user_agent);
        return session;
      });
    })
    .catch(error => {
      loadingError.value = true;
      api.error(error);
    }).finally(() => {
      loading.value = false;
    });
}

/**
 * Parse the user agent.
 *
 * @param {string} agent
 * @returns {object}
 */
function parseAgent (agent) {
  const parser = new UAParser();
  parser.setUA(agent);
  return parser.getResult();
}

/**
 * Delete all other sessions
 */
function deleteAllSessions () {
  loading.value = true;

  api.call('sessions', { method: 'DELETE' })
    .then(() => {
      toast.success(t('auth.flash.logout_all_others'));
      getSessions();
    })
    .catch(error => {
      api.error(error);
    }).finally(() => {
      loading.value = false;
    });
}
</script>

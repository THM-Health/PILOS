<template>
  <div>
    <b-overlay :show="loading || loadingError">
      <template #overlay>
        <div class="text-center">
          <b-spinner v-if="loading" />
          <b-button
            v-else
            ref="reload"
            @click="getSessions()"
          >
            <i class="fa-solid fa-sync" /> {{ $t('app.reload') }}
          </b-button>
        </div>
      </template>
      <b-list-group>
        <b-list-group-item
          v-for="session in sessions"
          :key="session.id"
          class="flex-column align-items-start"
        >
          <div class="flex w-full justify-content-between align-items-start">
            <h5 class="mb-1">
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
              {{ session.user_agent.os.name || $t('auth.sessions.unknown_agent') }}
            </h5>
            <small
              v-if="!session.current"
              v-b-tooltip.hover
              :title="$t('auth.sessions.last_active')"
            >
              <i class="fa-solid fa-clock" /> {{ $d(new Date( session.last_activity),'datetimeShort') }}
            </small>
            <b-badge
              v-else
              variant="dark"
            >
              {{ $t('auth.sessions.current') }}
            </b-badge>
          </div>
          <p
            v-if="session.user_agent.browser.name"
            class="mb-1"
          >
            <strong>{{ $t('auth.sessions.browser') }}</strong> {{ session.user_agent.browser.name }}
          </p>
          <p>
            <strong>{{ $t('auth.sessions.ip') }}</strong> {{ session.ip_address }}
          </p>
        </b-list-group-item>
      </b-list-group>
      <b-button
        variant="danger"
        :disabled="loading || loadingError"
        class="mt-3"
        @click="deleteAllSessions"
      >
        <i class="fa-solid fa-right-from-bracket" /> {{ $t('auth.sessions.logout_all') }}
      </b-button>
    </b-overlay>
  </div>
</template>

<script>
import Base from '@/api/base';
import UAParser from 'ua-parser-js';

export default {
  name: 'SessionsComponent',
  data () {
    return {
      sessions: [],
      loading: false,
      loadingError: false
    };
  },
  mounted () {
    this.getSessions();
  },
  methods: {
    /**
     * Get the user's sessions.
     */
    getSessions () {
      this.loading = true;
      Base.call('sessions')
        .then(response => {
          this.loadingError = false;
          this.sessions = response.data.data.map(session => {
            session.user_agent = this.parseAgent(session.user_agent);
            return session;
          });
        })
        .catch(error => {
          this.loadingError = true;
          Base.error(error, this.$root, error.message);
        }).finally(() => {
          this.loading = false;
        });
    },

    /**
     * Parse the user agent.
     *
     * @param {string} agent
     * @returns {object}
     */
    parseAgent (agent) {
      const parser = new UAParser();
      parser.setUA(agent);
      return parser.getResult();
    },

    /**
     * Delete all other sessions
     */
    deleteAllSessions () {
      this.loading = true;

      Base.call('sessions', { method: 'DELETE' })
        .then(() => {
          this.toastSuccess(this.$t('auth.flash.logout_all_others'));
          this.getSessions();
        })
        .catch(error => {
          Base.error(error, this.$root, error.message);
        }).finally(() => {
          this.loading = false;
        });
    }
  }
};
</script>

<style scoped>

</style>

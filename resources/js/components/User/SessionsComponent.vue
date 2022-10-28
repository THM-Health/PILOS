<template>
  <div>
    <b-overlay :show="loading || loadingError" >
      <template #overlay>
        <div class="text-center">
          <b-spinner v-if="loading" ></b-spinner>
          <b-button
            ref="reload"
            v-else
            @click="getSessions()"
          >
            <i class="fa-solid fa-sync"></i> {{ $t('app.reload') }}
          </b-button>
        </div>
      </template>
      <b-list-group>
        <b-list-group-item v-for="session in sessions" :key="session.id" class="flex-column align-items-start">
          <div class="d-flex w-100 justify-content-between align-items-start">
            <h5 class="mb-1">
              <i v-if="session.user_agent.device.type === 'mobile'" class="fa-solid fa-mobile-screen mr-2"></i>
              <i v-else-if="session.user_agent.device.type === 'tablet'" class="fa-solid fa-tablet-screen-button mr-2"></i>
              <i v-else class="fa-solid fa-display mr-2"></i>
              {{ session.user_agent.os.name || $t('settings.users.authentication.sessions.unknown') }}
            </h5>
            <small
              v-if="!session.current"
              :title="$t('settings.users.authentication.sessions.last_active')"
              v-b-tooltip.hover
              v-tooltip-hide-click
            >
              <i class="fa-solid fa-clock"></i> {{  $d(new Date( session.last_activity),'datetimeShort') }}
            </small>
            <b-badge v-else variant="dark">{{ $t('settings.users.authentication.sessions.current') }}</b-badge>
          </div>
          <p class="mb-1" v-if="session.user_agent.browser.name">
            <strong>{{ $t('settings.users.authentication.sessions.browser') }}</strong> {{ session.user_agent.browser.name }}
          </p>
          <p>
            <strong>{{ $t('settings.users.authentication.sessions.ip') }}</strong> {{ session.ip_address }}
          </p>
        </b-list-group-item>
      </b-list-group>
      <b-button
        variant="danger"
        :disabled="loading || loadingError"
        class="mt-3"
        @click="deleteAllSessions"
      >
        <i class="fa-solid fa-right-from-bracket"></i> {{ $t('settings.users.authentication.sessions.logout_all') }}
      </b-button>
    </b-overlay>
  </div>
</template>

<script>
import Base from '../../api/base';
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
          this.flashMessage.success(this.$t('auth.flash.logoutAllOthers'));
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

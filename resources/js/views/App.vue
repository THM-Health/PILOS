<template>
  <div>
    <b-overlay
      :show="loadingCounter > 0 || overlayLoadingCounter > 0"
      z-index="10000"
      no-wrap
    >
      <template #overlay>
        <div class="text-center">
          <b-spinner variant="secondary" />
        </div>
      </template>
    </b-overlay>
    <div v-if="loadingCounter == 0">
      <banner
        v-if="getSetting('banner.enabled')"
        :background="getSetting('banner.background')"
        :color="getSetting('banner.color')"
        :icon="getSetting('banner.icon')"
        :link="getSetting('banner.link')"
        :message="getSetting('banner.message')"
        :title="getSetting('banner.title')"
        :link-style="getSetting('banner.link_style')"
        :link-text="getSetting('banner.link_text')"
        :link-target="getSetting('banner.link_target')"
      />
      <b-navbar
        class="mainnav"
        toggleable="lg"
        type="light"
        variant="white"
      >
        <b-container>
          <h1>
            <b-navbar-brand :to="{ name: 'home' }">
              <img
                v-if="getSetting('logo')"
                style="height: 2rem;"
                :src="getSetting('logo')"
                alt="Logo"
              >
            </b-navbar-brand>
          </h1>

          <b-navbar-toggle target="nav-collapse" />

          <b-collapse
            id="nav-collapse"
            is-nav
          >
            <b-navbar-nav v-if="isAuthenticated">
              <b-nav-item :to="{ name: 'rooms.index' }">
                {{ $t('app.rooms') }}
              </b-nav-item>
              <can
                method="viewAny"
                policy="MeetingPolicy"
              >
                <b-nav-item :to="{ name: 'meetings.index' }">
                  {{ $t('meetings.currently_running') }}
                </b-nav-item>
              </can>
              <can
                method="manage"
                policy="SettingPolicy"
              >
                <b-nav-item :to="{ name: 'settings' }">
                  {{ $t('settings.title') }}
                </b-nav-item>
              </can>
            </b-navbar-nav>

            <!-- Right aligned nav items -->
            <b-navbar-nav class="ml-auto">
              <b-nav-item
                v-if="!isAuthenticated"
                :to="loginRoute"
                right
              >
                {{ $t('auth.login') }}
              </b-nav-item>

              <b-nav-item-dropdown
                v-if="isAuthenticated"
                right
              >
                <!-- Using 'button-content' slot -->
                <template
                  v-if="currentUser"
                  #button-content
                >
                  {{ currentUser.firstname }} {{ currentUser.lastname }}
                </template>

                <b-dropdown-item :to="{ name: 'profile' }">
                  {{ $t('app.profile') }}
                </b-dropdown-item>
                <b-dropdown-divider />

                <b-dropdown-item
                  ref="logout"
                  @click="logout"
                >
                  {{ $t('auth.logout') }}
                </b-dropdown-item>
              </b-nav-item-dropdown>
              <b-nav-item
                v-if="!!getSetting('help_url')"
                v-b-tooltip.hover
                class="d-none d-lg-block"
                :title="$t('app.help')"
                link-classes="text-primary nav-icon-item"
                target="_blank"
                :href="getSetting('help_url')"
                right
              >
                <i class="fa-solid fa-circle-question" />
              </b-nav-item>
              <b-nav-item
                v-if="!!getSetting('help_url')"
                class="d-block d-lg-none"
                target="_blank"
                :href="getSetting('help_url')"
              >
                {{ $t('app.help') }}
              </b-nav-item>
              <locale-selector />
            </b-navbar-nav>
          </b-collapse>
        </b-container>
      </b-navbar>

      <main>
        <router-view />
      </main>

      <footer-component />
    </div>
  </div>
</template>

<script>
import LocaleSelector from '@/components/LocaleSelector.vue';
import Can from '@/components/Permissions/Can.vue';
import Banner from '@/components/Banner.vue';
import { mapActions, mapState } from 'pinia';
import { useAuthStore } from '@/stores/auth';
import { useLoadingStore } from '@/stores/loading';
import { useSettingsStore } from '@/stores/settings';

const FooterComponent = Object.values(import.meta.glob(['../../custom/js/components/FooterComponent.vue', '@/components/FooterComponent.vue'], { eager: true }))[0].default;

export default {
  components: { Banner, Can, LocaleSelector, FooterComponent },
  computed: {
    ...mapState(useAuthStore, ['currentUser', 'isAuthenticated']),
    ...mapState(useSettingsStore, ['getSetting']),
    ...mapState(useLoadingStore, ['loadingCounter', 'overlayLoadingCounter']),

    // Add a redirect query parameter to the login route if the current route has the redirectBackAfterLogin meta set to true
    // This ensures that the user is redirected to the page he is currently on after login
    // By default the user is redirected to the home page after login (see comment in router.js)
    loginRoute () {
      const route = { name: 'login' };
      if (this.$route.meta.redirectBackAfterLogin === true) { route.query = { redirect: this.$route.path }; }
      return route;
    }
  },
  methods: {

    ...mapActions(useAuthStore, { logoutSession: 'logout' }),
    ...mapActions(useLoadingStore, ['setLoading', 'setLoadingFinished']),

    async logout () {
      let response;
      try {
        this.setLoading();
        response = await this.logoutSession();
      } catch (error) {
        this.setLoadingFinished();
        this.toastError(this.$t('auth.flash.logout_error'));
        return;
      }

      if (response.data.redirect) {
        window.location = response.data.redirect;
        return;
      }

      await this.$router.push({ name: 'logout' });

      this.setLoadingFinished();
    }
  }
};
</script>

<style scoped>
  .mainnav {
    border-bottom: 1px solid rgba(0, 40, 100, 0.12);
  }
</style>

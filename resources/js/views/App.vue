<template>
  <div>
    <b-overlay :show="loadingCounter > 0 || overlayLoadingCounter > 0" z-index="10000" no-wrap>
      <template v-slot:overlay>
        <div class="text-center">
          <b-spinner variant="secondary"></b-spinner>
        </div>
      </template>
    </b-overlay>
    <div v-if="loadingCounter == 0">
      <banner
        :background="getSetting('banner.background')"
        :color="getSetting('banner.color')"
        :enabled="getSetting('banner.enabled')"
        :icon="getSetting('banner.icon')"
        :link="getSetting('banner.link')"
        :message="getSetting('banner.message')"
        :title="getSetting('banner.title')"
        :link-style="getSetting('banner.link_style')"
        :link-text="getSetting('banner.link_text')"
        :link-target="getSetting('banner.link_target')"
      ></banner>
      <b-navbar class="mainnav" toggleable="lg" type="light" variant="white">
        <b-container>
          <h1>
            <b-navbar-brand :to="{ name: 'home' }">
              <img style="height: 2rem;" v-if="getSetting('logo')" :src="getSetting('logo')" alt="Logo">
            </b-navbar-brand>
          </h1>

          <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

          <b-collapse id="nav-collapse" is-nav>
            <b-navbar-nav v-if='isAuthenticated'>
              <b-nav-item :to="{ name: 'rooms.own_index' }">{{ $t('rooms.my_rooms') }}</b-nav-item>
              <b-nav-item :to="{ name: 'rooms.index' }">
                <can method='viewAll' policy='RoomPolicy'>
                  {{ $t('rooms.all_rooms') }}
                </can>
                <cannot method='viewAll' policy='RoomPolicy'>
                  {{ $t('rooms.find_rooms') }}
                </cannot>
              </b-nav-item>
              <can method='viewAny' policy='MeetingPolicy'>
                <b-nav-item :to="{ name: 'meetings.index' }">{{ $t('meetings.currently_running') }}</b-nav-item>
              </can>
              <can method='manage' policy='SettingPolicy'>
                <b-nav-item :to="{ name: 'settings' }">
                  {{ $t('settings.title') }}
                </b-nav-item>
              </can>
            </b-navbar-nav>

            <!-- Right aligned nav items -->
            <b-navbar-nav class="ml-auto">
              <b-nav-item :to="{ name: 'login' }" v-if='!isAuthenticated' right>{{ $t('auth.login') }}</b-nav-item>

              <b-nav-item-dropdown right v-if='isAuthenticated'>
                <!-- Using 'button-content' slot -->
                <template v-if='currentUser' v-slot:button-content>
                  {{currentUser.firstname}} {{currentUser.lastname}}
                </template>

                <b-dropdown-item :to="{ name: 'profile' }">
                  {{ $t('app.profile') }}
                </b-dropdown-item>
                <b-dropdown-divider></b-dropdown-divider>

                <b-dropdown-item @click="logout">{{ $t('auth.logout') }}</b-dropdown-item>
              </b-nav-item-dropdown>
              <b-nav-item class="d-none d-lg-block" v-b-tooltip.hover :title="$t('app.help')" link-classes='text-primary nav-icon-item' target="_blank" :href="getSetting('help_url')" v-if="!!getSetting('help_url')" right>
                <i class="fa-solid fa-circle-question"></i>
              </b-nav-item>
              <b-nav-item class="d-block d-lg-none" target="_blank" :href="getSetting('help_url')" v-if="!!getSetting('help_url')">
                {{$t('app.help')}}
              </b-nav-item>
              <locale-selector :available-locales="availableLocales"></locale-selector>
            </b-navbar-nav>
          </b-collapse>
        </b-container>
      </b-navbar>

      <main>
        <router-view></router-view>
      </main>

      <footer-component></footer-component>
    </div>
  </div>
</template>

<script>
import LocaleSelector from '../components/LocaleSelector.vue';
import Can from '../components/Permissions/Can.vue';
import Cannot from '../components/Permissions/Cannot.vue';
import Banner from '../components/Banner.vue';
import { mapActions, mapState } from 'pinia';
import { useAuthStore } from '../stores/auth';
import { useLoadingStore } from '../stores/loading';
import { useSettingsStore } from '../stores/settings';

const FooterComponent = Object.values(import.meta.glob(['../../custom/js/components/FooterComponent.vue', '@/components/FooterComponent.vue'], { eager: true }))[0].default;

export default {
  components: { Banner, Can, Cannot, LocaleSelector, FooterComponent },
  computed: {
    ...mapState(useAuthStore, ['currentUser', 'isAuthenticated']),
    ...mapState(useSettingsStore, ['getSetting']),
    ...mapState(useLoadingStore, ['loadingCounter', 'overlayLoadingCounter'])
  },
  data () {
    return {
      availableLocales: import.meta.env.VITE_AVAILABLE_LOCALES.split(',')
    };
  },
  methods: {

    ...mapActions(useAuthStore, { logoutSession: 'logout' }),

    async logout () {
      const response = await this.logoutSession();

      if (response.status !== 200) {
        this.toastError(this.$t('auth.flash.logout_error'));
        return;
      }

      if (response.data.redirect) {
        window.location.href = response.data.redirect;
        return;
      }

      let incompleteWarning = null;
      if (response.data.external_auth && !response.data.external_sign_out) {
        incompleteWarning = response.data.external_auth;
      }

      await this.$router.push({ name: 'logout', params: { incompleteWarning } });
    }
  }
};
</script>

<style scoped>
  .mainnav {
    border-bottom: 1px solid rgba(0, 40, 100, 0.12);
  }
</style>

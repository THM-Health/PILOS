<template>
  <div>
    <b-overlay :show="loadingCounter > 0" z-index="10000" no-wrap>
      <template v-slot:overlay>
        <div class="text-center">
          <b-spinner variant="dark" :label="$t('app.wait')"></b-spinner>
          <p>{{ $t('app.wait') }}</p>
        </div>
      </template>
    </b-overlay>

    <banner
      :background="settings('banner.background')"
      :color="settings('banner.color')"
      :enabled="settings('banner.enabled')"
      :icon="settings('banner.icon')"
      :link="settings('banner.link')"
      :message="settings('banner.message')"
      :title="settings('banner.title')"
      :link-style="settings('banner.link_style')"
      :link-text="settings('banner.link_text')"
      :link-target="settings('banner.link_target')"
    ></banner>
    <b-navbar class="mainnav" toggleable="lg" type="light" variant="white">
      <b-container>
        <h1>
          <b-navbar-brand :to="{ name: 'home' }">
            <img style="height: 2rem;" v-if="settings('logo')" :src="settings('logo')" alt="Logo">
          </b-navbar-brand>
        </h1>

        <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

        <b-collapse id="nav-collapse" is-nav>
          <b-navbar-nav>
            <b-nav-item :to="{ name: 'rooms.own_index' }" v-if='isAuthenticated'>{{ $t('rooms.myRooms') }}</b-nav-item>
            <b-nav-item :to="{ name: 'rooms.index' }" v-if='isAuthenticated'>{{ $t('rooms.allRooms') }}</b-nav-item>
            <can v-if='isAuthenticated' method='viewAny' policy='MeetingPolicy'>
              <b-nav-item :to="{ name: 'meetings.index' }">{{ $t('meetings.currentlyRunning') }}</b-nav-item>
            </can>
            <can v-if='isAuthenticated' method='manage' policy='SettingPolicy'>
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
            <locale-selector :available-locales="availableLocales"></locale-selector>
          </b-navbar-nav>
        </b-collapse>
      </b-container>
    </b-navbar>

    <main>
      <FlashMessage position="right top"/>
      <router-view></router-view>
    </main>

    <footer-component></footer-component>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import LocaleSelector from '../components/LocaleSelector';
import FooterComponent from '../components/FooterComponent';
import Can from '../components/Permissions/Can';
import Banner from '../components/Banner';

export default {
  components: { Banner, Can, LocaleSelector, FooterComponent },
  computed: {
    ...mapState({
      currentUser: state => state.session.currentUser,
      application: state => state.session.application,
      loadingCounter: state => state.loadingCounter
    }),
    ...mapGetters({
      isAuthenticated: 'session/isAuthenticated',
      settings: 'session/settings'
    })
  },
  data () {
    return {
      availableLocales: process.env.MIX_AVAILABLE_LOCALES.split(',')
    };
  },
  methods: {
    async logout () {
      await this.$store.dispatch('session/logout');
      this.flashMessage.success(this.$t('auth.flash.logout'));
      if (this.$router.currentRoute.name !== 'home') {
        await this.$router.push({ name: 'home' });
      }
    }
  }
};
</script>

<style scoped>
  .mainnav {
    border-bottom: 1px solid rgba(0, 40, 100, 0.12);
  }
</style>

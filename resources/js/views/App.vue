<template>
  <div>
    <b-overlay :show="loadingCounter > 0">
      <template v-slot:overlay>
        <div class="text-center">
          <b-spinner variant="dark" :label="$t('app.wait')"></b-spinner>
          <p>{{ $t('app.wait') }}</p>
        </div>
      </template>

      <b-navbar class="mainnav" toggleable="lg" type="light" variant="white">
        <b-container>
          <h1>
            <b-navbar-brand :to="{ name: 'home' }">
              <img style="height: 2rem;" src="/images/logo.svg" alt="Logo">
            </b-navbar-brand>
          </h1>

          <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

          <b-collapse id="nav-collapse" is-nav>
            <b-navbar-nav>
              <b-nav-item :to="{ name: 'rooms.index' }" v-if='isAuthenticated'>{{ $t('rooms.rooms') }}</b-nav-item>
            </b-navbar-nav>

            <!-- Right aligned nav items -->
            <b-navbar-nav class="ml-auto">
              <b-nav-item :to="{ name: 'login' }" v-if='!isAuthenticated' right>{{ $t('auth.login') }}</b-nav-item>
              <b-nav-item-dropdown right v-if='isAuthenticated'>
                <!-- Using 'button-content' slot -->
                <template v-slot:button-content>
                  {{currentUser.firstname}} {{currentUser.lastname}}
                </template>
                <!--TODO Hide Administrator Link if not the role-->
                <b-dropdown-item :to="{ name: 'admin.index' }" v-if='isAuthenticated'>
                  {{ $t('settings.settings') }}
                </b-dropdown-item>
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
    </b-overlay>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import LocaleSelector from '../components/LocaleSelector';
import FooterComponent from '../components/FooterComponent';

export default {
  components: { LocaleSelector, FooterComponent },
  computed: {
    ...mapState({
      currentUser: state => state.session.currentUser,
      loadingCounter: state => state.loadingCounter
    }),
    ...mapGetters({
      isAuthenticated: 'session/isAuthenticated'
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
      await this.$router.push({ name: 'home' });
    }
  }
};
</script>

<style scoped>
  .mainnav {
    border-bottom: 1px solid rgba(0, 40, 100, 0.12);
  }

  main {
    min-height: calc(100vh - 80px);
  }
</style>

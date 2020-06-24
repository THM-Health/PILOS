<template>
  <div>
    <b-overlay :show="loadingCounter > 0">
      <template v-slot:overlay>
        <div class="text-center">
          <b-spinner variant="dark" label="Bitte warten..."></b-spinner>
          <p>Bitte warten...</p>
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
              <b-nav-item :to="{ name: 'rooms.index' }" v-if='isAuthenticated'>Rooms</b-nav-item>
            </b-navbar-nav>

            <!-- Right aligned nav items -->
            <b-navbar-nav class="ml-auto">
              <b-nav-item :to="{ name: 'login' }" v-if='!isAuthenticated' right>Login</b-nav-item>
              <b-nav-item-dropdown right v-if='isAuthenticated'>
                <!-- Using 'button-content' slot -->
                <template v-slot:button-content>
                  {{currentUser.firstname}} {{currentUser.lastname}}
                </template>
                <b-dropdown-item href="#">Profile</b-dropdown-item>
                <b-dropdown-item @click="logout">Sign Out</b-dropdown-item>
              </b-nav-item-dropdown>
            </b-navbar-nav>
          </b-collapse>
        </b-container>
      </b-navbar>

      <main>
        <router-view></router-view>
      </main>
    </b-overlay>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

export default {
  computed: {
    ...mapState({
      currentUser: state => state.session.currentUser,
      loadingCounter: state => state.loadingCounter
    }),
    ...mapGetters({
      isAuthenticated: 'session/isAuthenticated'
    })
  },
  methods: {
    async logout () {
      await this.$store.dispatch('session/logout')
      // TODO: Message for successful logout
      this.$router.push({ name: 'home' })
    }
  }
}
</script>

<style scoped>
.mainnav {
  border-bottom: 1px solid rgba(0, 40, 100, 0.12);
}
</style>

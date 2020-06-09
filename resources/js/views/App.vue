<template>
    <div>
        <b-navbar class="mainnav" toggleable="lg" type="light" variant="white">
            <b-container>
                <b-navbar-brand :to="{ name: 'home' }">
                    <img style="height: 2rem;" src="https://11.pilos-thm.de/logo/default/THMPilos.svg">
                </b-navbar-brand>

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
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

export default {
  computed: {
    ...mapState({
      currentUser: state => state.session.currentUser
    }),
    ...mapGetters({
      isAuthenticated: 'session/isAuthenticated'
    })
  },
  methods: {
    async logout () {
      // TODO: Loading indicator
      await this.$store.dispatch('session/logout')
      // TODO: Message for successful logout
      this.$router.push({ name: 'home' })
    }
  }
}
</script>

<style scoped>
  .mainnav {
    border-bottom: 1px solid rgba(0,40,100,0.12);
  }
</style>

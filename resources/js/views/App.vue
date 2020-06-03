<template>
    <div>
        <b-navbar class="mainnav" toggleable="lg" type="light" variant="light">
            <b-container>
                <b-navbar-brand href="#">
                    <img style="height: 2rem;" src="https://11.pilos-thm.de/logo/default/THMPilos.svg">
                </b-navbar-brand>

                <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

                <b-collapse id="nav-collapse" is-nav>
                    <b-navbar-nav v-if='isAuthenticated'>
                        <b-nav-item :to="{ name: 'room', params: { id: 123 } }" href="#">Room</b-nav-item>
                    </b-navbar-nav>

                    <!-- Right aligned nav items -->
                    <b-navbar-nav class="ml-auto">
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
import { mapState, mapGetters, mapActions } from 'vuex'

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
    ...mapActions({
      logout: 'session/logout'
    })
  },
  mounted () {
    this.$store.dispatch('session/getCurrentUser')
  }
}
</script>

<style scoped>
  .mainnav {
    border-bottom: 1px solid rgba(0,40,100,0.12);
  }
</style>

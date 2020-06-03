import auth from '../../api/auth'

const state = () => ({
  currentUser: null
})

const getters = {
  isAuthenticated: state => {
    return !$.isEmptyObject(state.currentUser)
  }
}

const actions = {
  async login ({ dispatch, commit }, credentials) {
    await auth.login(credentials)
    await dispatch('getCurrentUser')
  },

  async getCurrentUser ({ commit }) {
    commit('setCurrentUser', await auth.getCurrentUser())
  },

  async logout ({ commit }) {
    await auth.logout()
    commit('setCurrentUser', null)
  }
}

const mutations = {
  setCurrentUser (state, currentUser) {
    state.currentUser = currentUser
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}

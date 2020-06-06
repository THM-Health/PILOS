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
  async login ({ dispatch, commit }, { credentials, method }) {
    await auth.login(credentials, method)
    await dispatch('getCurrentUser')
    // TODO: Redirect to home page!
  },

  async getCurrentUser ({ commit }) {
    let currentUser
    try {
      currentUser = await auth.getCurrentUser()
    } catch (error) {
      currentUser = null
    } finally {
      commit('setCurrentUser', currentUser)
    }
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

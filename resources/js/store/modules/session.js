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
  },

  async getCurrentUser ({ commit }) {
    const currentUser = await auth.getCurrentUser()
    commit('setCurrentUser', currentUser)
  },

  async logout ({ commit }) {
    commit('loading', null, { root: true })
    await auth.logout()
    commit('setCurrentUser', null)
    commit('loadingFinished', null, { root: true })
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

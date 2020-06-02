const state = () => ({
  currentUser: null
})

const getters = {}

const actions = {
  login ({ commit }) {

  },

  getCurrentUser () {

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

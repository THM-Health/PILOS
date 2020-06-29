import VueRouter from 'vue-router'
import Login from './views/Login'
import Error from './views/Error'
import RoomsIndex from './views/rooms/Index'
import RoomView from './views/rooms/View'
import store from './store'
import Home from './views/Home'
import Vue from 'vue'
import i18n from './i18n'

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/rooms',
      name: 'rooms.index',
      component: RoomsIndex,
      meta: { requiresAuth: true }
    },
    {
      path: '/room/:id',
      name: 'room',
      component: RoomView,
      meta: { requiresAuth: true }
    },
    {
      path: '/error',
      name: 'error',
      component: Error,
      props: true
    },
    {
      path: '/404',
      name: '404',
      component: Error,
      props: {
        statusCode: 404,
        message: i18n.t('app.notFound')
      }
    },
    {
      path: '*',
      redirect: '/404'
    }
  ]
})

router.beforeEach((to, from, next) => {
  const promise = !store.state.initialized ? store.dispatch('initialize') : Promise.resolve()

  promise.then(() => {
    if (to.matched.some(record => record.meta.requiresAuth)) {
      if (!store.getters['session/isAuthenticated']) {
        next({
          name: 'login',
          query: { redirect: to.fullPath }
        })
      } else {
        next()
      }
    } else {
      next()
    }
  })
})

export default router

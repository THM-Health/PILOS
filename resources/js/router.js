import VueRouter from 'vue-router'
import Login from './views/Login'
import NotFound from './views/NotFound'
import RoomsIndex from './views/rooms/Index'
import RoomView from './views/rooms/View'
import RolesIndex from './views/roles/Index'
import RolesView from './views/roles/View'
import Settings from './views/Settings'
import store from './store'
import Home from './views/Home'
import Vue from 'vue'
import PermissionService from './services/PermissionService'

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
      path: '/settings',
      name: 'settings',
      component: Settings,
      meta: {
        requiresAuth: true,
        accessPermitted: () => Promise.resolve(PermissionService.can({ permission: 'manage_settings' }))
      },
      children: [
        {
          path: 'roles',
          name: 'roles.index',
          component: RolesIndex,
          children: [{
            path: ':roleId',
            name: 'roles.view',
            component: RolesView
          }],
          alias: ''
        }
      ]
    },
    {
      path: '/404',
      name: '404',
      component: NotFound
    },
    {
      path: '*',
      redirect: '/404'
    }
  ]
})

/**
 * TODO: Add documentation!!!
 */
router.beforeEach((to, from, next) => {
  const locale = $('html').prop('lang') || 'en'
  const initializationPromise = !store.state.initialized ? store.dispatch('initialize', { locale }) : Promise.resolve()

  initializationPromise.then(() => {
    return Promise.all(to.matched.map((record) =>
      record.meta.accessPermitted ? record.meta.accessPermitted() : Promise.resolve(true)
    ))
  }).then((recordsPermissions) => {
    if (to.matched.some(record => record.meta.requiresAuth) && !store.getters['session/isAuthenticated']) {
      next({
        name: 'login',
        query: { redirect: to.fullPath }
      })
    } else if (!recordsPermissions.every(permission => permission)) {
      router.app.$root.flashMessage.error(router.app.$t('app.flash.unauthorized'))
      next(from.matched.length !== 0 ? false : '/')
    } else {
      next()
    }
  })
})

export default router

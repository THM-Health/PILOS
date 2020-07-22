<template>
  <div v-if="slotVisible">
    <!-- @slot Content that should be only visible if necessary permissions are given. -->
    <slot></slot>
  </div>
</template>

<script>
import EventBus from '../../services/EventBus'
import PermissionService from '../../services/PermissionService'

/**
 * Checks whether the passed permissions are given and depending
 * on the result the content of the slot will be added or removed
 * from the dom.
 *
 * @example
 *   ```vue
 *   <can :permissions="{ permission: 'test' }">
 *     Hello World!
 *   </can>
 *   ```
 */
export default {
  props: {
    /**
     * Permissions to check against.
     *
     * @see {@link PermissionService.can}
     * @property permissions
     * @type Object
     */
    permissions: {
      type: Object
    }
  },

  /**
   * Returns a object containing the data of the component with default values.
   *
   * @method data
   * @returns Object
   */
  data () {
    return {
      /**
       * Boolean that indicates whether the content of the slot should be displayed or not.
       *
       * @private
       * @property slotVisible
       * @type boolean
       */
      slotVisible: false
    }
  },

  methods: {
    /**
     * Re-evaluates on permission change whether the slot content should be shown or not.
     *
     * @method evaluatePermissions
     * @return undefined
     */
    evaluatePermissions () {
      this.slotVisible = PermissionService.can(this.permissions)
    }
  },

  /**
   * Sets the event listener on permissions change to re-evaluate whether the
   * slot content can be shown or not.
   *
   * @method mounted
   * @return undefined
   */
  mounted () {
    EventBus.$on('permissionsChangedEvent', this.evaluatePermissions)
    this.evaluatePermissions()
  },

  /**
   * Removes the listener for permissions change on destroy of this component.
   *
   * @method beforeDestroy
   * @return undefined
   */
  beforeDestroy () {
    EventBus.$off('permissionsChangedEvent', this.evaluatePermissions)
  }
}
</script>

<style scoped>

</style>

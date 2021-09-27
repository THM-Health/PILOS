<template>
  <div v-frag v-if="slotVisible">
    <!-- @slot Content that should be only visible if permissions aren't given. -->
    <slot></slot>
  </div>
</template>

<script>
import EventBus from '../../services/EventBus';
import PermissionService from '../../services/PermissionService';
import frag from 'vue-frag';

/**
 * Checks whether the passed permissions aren't given and depending
 * on the result the content of the slot will be added or removed
 * from the dom.
 *
 * @example
 *   ```vue
 *   <cannot method="viewAll" policy="UserPolicy">
 *     Hello World!
 *   </cannot>
 *   <!-- or -->
 *   <cannot method="viewAll" :policy="{ model_name: 'User', id: 1 ... }">
 *     Hello World!
 *   </cannot>
 *   ```
 */
export default {
  directives: {
    frag
  },

  props: {
    /**
     * Method to check permissions with.
     *
     * @see {@link PermissionService.cannot}
     * @property method
     * @type String
     */
    method: {
      type: String,
      required: true
    },

    /**
     * Policy which contains method to check permissions with.
     *
     * @see {@link PermissionService.cannot}
     * @property policy
     * @type String|Object
     */
    policy: {
      type: [String, Object],
      required: true
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
    };
  },

  watch: {
    /**
     * Re-evaluates on policy change, eg. object attributes
     *
     */
    policy: {
      handler () {
        this.evaluatePermissions();
      },
      deep: true
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
      this.slotVisible = PermissionService.cannot(this.method, this.policy);
    }
  },

  /**
   * Sets the event listener on current user change to re-evaluate whether the
   * slot content can be shown or not.
   *
   * @method mounted
   * @return undefined
   */
  mounted () {
    EventBus.$on('currentUserChangedEvent', this.evaluatePermissions);
    this.evaluatePermissions();
  },

  /**
   * Removes the listener for current user change on destroy of this component.
   *
   * @method beforeDestroy
   * @return undefined
   */
  beforeDestroy () {
    EventBus.$off('currentUserChangedEvent', this.evaluatePermissions);
  }
};
</script>

<style scoped>

</style>

import EventBus from '../services/EventBus';
import PermissionService from '../services/PermissionService';

/**
 * Mixin that provides necessary functionality for showing and hiding action columns in tables depending on the
 * permissions of the current user. If the user has not at least one permission of the list `actionPermissions`
 * defined in the component or view, the flag `actionColumnVisible` will be set to false.
 *
 * @example
 *    export default {
 *      mixins: [ActionsColumn],
 *
 *      data () {
 *        actionPermissions: ['foo', 'bar', 'qux']
 *      },
 *
 *      computed: {
 *        tableFields () {
 *          const fields = [
 *            // ...
 *          ];
 *
 *          if (this.actionColumnVisible) {
 *            fields.push(this.actionColumnDefinition);
 *          }
 *
 *          return fields;
 *        }
 *      }
 *    };
 */
export default {
  data () {
    return {
      /**
       * Flag that indicates whether the action column should be visible or
       * not, due to missing permissions of the user.
       *
       * @type boolean
       * @property actionColumnVisible
       * @default false
       */
      actionColumnVisible: false,
      /**
       * CSS class of the column heading
       * @type string
       * @property actionColumnThClass
       * @default action-column
       */
      actionColumnThClass: 'action-column',
      /**
       * CSS style(s) of the column heading
       * @type string
       * @property actionColumnThStyle
       */
      actionColumnThStyle: '',
      /**
       * CSS class of the column cell
       * @type string
       * @property actionColumnTdClass
       * @default action-button
       */
      actionColumnTdClass: 'action-button'
    };
  },

  computed: {
    /**
     * Object containing the definition for the action column,
     * that could be pushed to the fields array.
     *
     * @type Object
     * @property actionColumnDefinition
     */
    actionColumnDefinition () {
      return { key: 'actions', label: this.$t('app.actions'), sortable: false, thClass: this.actionColumnThClass, thStyle: this.actionColumnThStyle, tdClass: this.actionColumnTdClass };
    }
  },

  methods: {
    /**
     * Sets the flag `actionColumnVisible` to true if the user has at least one permission
     * of the defined `actionPermissions` and false otherwise.
     *
     * @method toggleActionsColumn
     */
    toggleActionsColumn () {
      this.actionColumnVisible = PermissionService.currentUser && PermissionService.currentUser.permissions &&
        this.actionPermissions.some(permission => PermissionService.currentUser.permissions.includes(permission));
    }
  },

  /**
   * Sets the event listener for current user change to re-evaluate whether the
   * action column should be shown or not.
   *
   * @method mounted
   * @return undefined
   */
  mounted () {
    EventBus.$on('currentUserChangedEvent', this.toggleActionsColumn);
    this.toggleActionsColumn();
  },

  /**
   * Removes the listener for current user change on destroy of this component.
   *
   * @method beforeDestroy
   * @return undefined
   */
  beforeDestroy () {
    EventBus.$off('currentUserChangedEvent', this.toggleActionsColumn);
  }
};

/**
 * Mixin that provides methods to get error states and error messages for form inputs in edit or create views.
 */
export default {
  methods: {
    /**
     * Returns the state for a field with the given name.
     *
     * @param field Name of field to get the error state for.
     * @return {null|boolean} null if there is no errors object or there is no error
     *    for the passed field and otherwise false.
     */
    fieldState (field) {
      return !this.errors || this.errors[field] === undefined ? null : false;
    },

    /**
     * Returns the error message for the passed field.
     *
     * Since a html list gets returned for the passed field the string cannot be used directly in the
     * html code but the v-html tag must be used.
     *
     * @example
     *    <b-form-group :state="fieldState('...')" ...>
     *      <template slot='invalid-feedback'><div v-html="fieldError('...')"></div></template>
     *    </b-form-group>
     *
     *    <!-- or -->
     *    <b-form-invalid-feedback :state="fieldState('...')" v-html="fieldError('...')"></b-form-invalid-feedback>
     *
     * @param field Name of field to get the error message for.
     * @return {string} Empty string if there is no error for the passed field otherwise an string with html
     *    that contains a list of the messages for the passed field.
     */
    fieldError (field) {
      if (this.fieldState(field) !== false) { return ''; }
      return '<ul><li>' + this.errors[field].join('</li><li>') + '</li></ul>';
    }
  }
};

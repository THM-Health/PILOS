/**
 * Mixin that provides methods to get error states and error messages for form inputs in edit or create views.
 */
export default {
  methods: {
    /**
     * Returns the state for a field with the given name.
     *
     * @param field Name of field to get the error state for.
     * @param [wildcard=false] Flag that indicates whether all errors that starting with the field name should be checked.
     * @return {null|boolean} null if there is no errors object or there is no error
     *    for the passed field and otherwise false.
     */
    fieldState (field, wildcard = false) {
      if (wildcard) {
        return Object.keys(this.errors).some(error => error === field || error.startsWith(`${field}.`)) ? false : null;
      }

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
     * @param [wildcard=false] Flag that indicates whether all errors that starting with the field name should be checked.
     * @return {string} Empty string if there is no error for the passed field otherwise an string with html
     *    that contains a list of the messages for the passed field.
     */
    fieldError (field, wildcard = false) {
      if (this.fieldState(field, wildcard) !== false) { return ''; }

      let errors = this.errors[field];

      if (wildcard) {
        errors = Object.keys(this.errors).filter(key => key.startsWith(field)).map(key => this.errors[key]).flat();
      }

      return errors.length > 1 ? ('<ul><li>' + errors.join('</li><li>') + '</li></ul>') : errors[0];
    }
  }
};

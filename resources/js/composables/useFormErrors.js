/**
 * Mixin that provides methods to get error states and error messages for form inputs in edit or create views.
 */

class FormError {
  errors = {};

  set(errors) {
    this.errors = errors;
  }

  clear() {
    this.errors = {};
  }

  /**
   * Returns the state for a field with the given name.
   *
   * @param {string} field Name of field to get the error state for.
   * @param {boolean} [wildcard=false] Flag that indicates whether all errors that starting with the field name should be checked.
   * @return {null|boolean} null if there is no errors object or there is no error
   *    for the passed field and otherwise false.
   */
  fieldInvalid(field, wildcard = false) {
    if (wildcard && this.errors) {
      return Object.keys(this.errors).some(
        (error) => error === field || error.startsWith(`${field}.`),
      );
    }

    return !(!this.errors || this.errors[field] === undefined);
  }

  /**
   * Returns an array of error messages for the passed field.
   *
   * The result should be passed to the FormError component to render
   * the error list consistently and provide UX and A11y features
   *
   * @example
   *    <FormError :errors="formErrors.fieldError('FIELD_NAME')" />
   *
   * @param {string} field Name of field to get the error message for.
   * @param {boolean} [wildcard=false] Flag that indicates whether all errors that starting with the field name should be checked.
   * @return {string[]} Empty array if there is no error for the passed field otherwise an array of strings with the messages for the passed field.
   */
  fieldError(field, wildcard = false) {
    if (!this.fieldInvalid(field, wildcard)) {
      return [];
    }

    let errors = this.errors[field];

    if (wildcard) {
      errors = Object.keys(this.errors)
        .filter((key) => key.startsWith(field))
        .map((key) => this.errors[key])
        .flat();
    }

    return errors;
  }
}

export function useFormErrors() {
  return new FormError();
}

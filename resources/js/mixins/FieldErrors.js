export default {
  methods: {
    fieldState (field) {
      return this.errors[field] === undefined ? null : false;
    },

    fieldError (field) {
      if (this.fieldState(field) !== false) { return ''; }
      return '<ul><li>' + this.errors[field].join('</li><li>') + '</li></ul>';
    }
  }
};

import FieldErrors from '../../../resources/js/mixins/FieldErrors';
import { mount } from '@vue/test-utils';

describe('FieldErrors', function () {
  describe('fieldState', function () {
    it('returns null if the errors object is not defined', function () {
      const Test = {
        mixins: [FieldErrors],
        render () {}
      };

      const view = mount(Test);

      expect(view.vm.fieldState('test')).toBe(null);
    });

    it('returns null if the error object does not contain errors for the passed field and false for existing errors', function () {
      const Test = {
        mixins: [FieldErrors],
        data() {
          return {
            errors: {
              foo: []
            }
          };
        },
        render () {}
      };

      const view = mount(Test);

      expect(view.vm.fieldState('test')).toBe(null);
      expect(view.vm.fieldState('foo')).toBe(false);
    });
  });

  describe('fieldError', function () {
    it('returns empty string if the errors object is not defined', function () {
      const Test = {
        mixins: [FieldErrors],
        render () {}
      };

      const view = mount(Test);

      expect(view.vm.fieldError('test')).toBe('');
    });

    it('returns empty string if the error object does not contain errors for the passed field and html list for existing errors', function () {
      const Test = {
        mixins: [FieldErrors],
        data() {
          return {
            errors: {
              foo: ['a', 'b']
            }
          };
        },
        render () {}
      };

      const view = mount(Test);

      expect(view.vm.fieldError('test')).toBe('');
      expect(view.vm.fieldError('foo')).toBe('<ul><li>a</li><li>b</li></ul>');
    });
  });
});

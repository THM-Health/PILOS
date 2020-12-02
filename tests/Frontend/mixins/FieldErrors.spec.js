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
      expect(view.vm.fieldState('test', true)).toBe(null);
    });

    it('returns null if the error object does not contain errors for the passed field and false for existing errors', function () {
      const Test = {
        mixins: [FieldErrors],
        data () {
          return {
            errors: {
              foo: [],
              bar: [],
              'bar.0': []
            }
          };
        },
        render () {}
      };

      const view = mount(Test);

      expect(view.vm.fieldState('test')).toBe(null);
      expect(view.vm.fieldState('foo')).toBe(false);
      expect(view.vm.fieldState('bar')).toBe(false);
      expect(view.vm.fieldState('bar', true)).toBe(false);
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

    it('returns empty string if the error object does not contain errors for the passed field, html list for multiple existing errors and just text if only one', function () {
      const Test = {
        mixins: [FieldErrors],
        data () {
          return {
            errors: {
              foo: ['a', 'b'],
              baa: ['a'],
              bar: ['a'],
              'bar.0': ['a', 'b', 'c']
            }
          };
        },
        render () {}
      };

      const view = mount(Test);

      expect(view.vm.fieldError('test')).toBe('');
      expect(view.vm.fieldError('test', true)).toBe('');
      expect(view.vm.fieldError('foo')).toBe('<ul><li>a</li><li>b</li></ul>');
      expect(view.vm.fieldError('baa')).toBe('a');
      expect(view.vm.fieldError('bar')).toBe('a');
      expect(view.vm.fieldError('bar', true)).toBe('<ul><li>a</li><li>a</li><li>b</li><li>c</li></ul>');
    });
  });
});

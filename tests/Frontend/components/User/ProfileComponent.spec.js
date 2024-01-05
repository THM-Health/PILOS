import { mount } from '@vue/test-utils';
import { createContainer, createLocalVue, mockAxios } from '../../helper';
import { createTestingPinia } from '@pinia/testing';
import { PiniaVuePlugin } from 'pinia';
import ProfileComponent from '@/components/User/ProfileComponent.vue';
import { BButton, BForm, BFormInput, BImg } from 'bootstrap-vue';
import PermissionService from '@/services/PermissionService';
import LocaleSelect from '@/components/Inputs/LocaleSelect.vue';
import TimezoneSelect from '@/components/Inputs/TimezoneSelect.vue';
import _ from 'lodash';
import { useAuthStore } from '@/stores/auth';
import { useLocaleStore } from '@/stores/locale';
import i18n from '@/i18n';
import Base from '@/api/base';

const localVue = createLocalVue();
localVue.use(PiniaVuePlugin);

const ldapUser = {
  id: 1,
  authenticator: 'ldap',
  email: 'john@doe.com',
  external_id: 'jdo',
  firstname: 'John',
  lastname: 'Doe',
  model_name: 'User',
  image: null,
  timezone: 'Europe/Berlin',
  user_locale: 'de',
  permissions: []
};

const user = {
  id: 2,
  authenticator: 'local',
  email: 'john@doe.com',
  external_id: null,
  firstname: 'John',
  lastname: 'Doe',
  model_name: 'User',
  image: null,
  timezone: 'Europe/Berlin',
  user_locale: 'de',
  permissions: []
};

const adminUser = {
  id: 3,
  authenticator: 'local',
  email: 'admin@domin.com',
  external_id: null,
  firstname: 'Admin',
  lastname: 'User',
  model_name: 'User',
  permissions: ['users.update']
};
describe('ProfileComponent', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  afterEach(() => {
    PermissionService.setCurrentUser(undefined);
  });

  it('check admin view and edit normal user', async () => {
    PermissionService.setCurrentUser(adminUser);

    const wrapper = mount(ProfileComponent, {
      pinia: createTestingPinia(),
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        user,
        modalStatic: false,
        viewOnly: false
      },
      stubs: {
        VueCropper: true,
        'timezone-select': true,
        'locale-select': true
      },
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();

    const inputs = wrapper.findAllComponents(BFormInput);

    // Check firstname and lastname
    expect(inputs.at(0).props('id')).toBe('firstname');
    expect(inputs.at(0).props('value')).toBe('John');
    expect(inputs.at(0).props('disabled')).toBeFalsy();

    expect(inputs.at(1).props('id')).toBe('lastname');
    expect(inputs.at(1).props('value')).toBe('Doe');
    expect(inputs.at(1).props('disabled')).toBeFalsy();

    // Check authenticator
    expect(inputs.at(2).props('value')).toBe('settings.users.authenticator.local');
    expect(inputs.at(2).props('disabled')).toBeTruthy();

    // Check no username
    expect(inputs.length).toBe(3);

    // Check empty image
    const image = wrapper.findComponent(BImg);
    expect(image.exists()).toBe(true);
    expect(image.attributes('src')).toBe('/images/default_profile.png');

    // Check locale select
    const localeSelect = wrapper.findComponent(LocaleSelect);
    expect(localeSelect.exists()).toBe(true);
    expect(localeSelect.props('disabled')).toBeFalsy();
    expect(localeSelect.props('value')).toBe('de');

    // Check timezone select
    const timezoneSelect = wrapper.findComponent(TimezoneSelect);
    expect(timezoneSelect.exists()).toBe(true);
    expect(timezoneSelect.props('disabled')).toBeFalsy();
    expect(timezoneSelect.props('value')).toBe('Europe/Berlin');

    // Check buttons
    const buttons = wrapper.findAllComponents(BButton);
    expect(buttons.length).toBe(2);
    // Upload image
    expect(buttons.at(0).text()).toBe('settings.users.image.upload');
    expect(buttons.at(0).attributes('disabled')).toBeFalsy();
    // Save
    expect(buttons.at(1).text()).toBe('app.save');
    expect(buttons.at(1).attributes('disabled')).toBeFalsy();

    // View only mode
    await wrapper.setProps({ viewOnly: true });
    await wrapper.vm.$nextTick();
    expect(inputs.at(0).props('disabled')).toBeTruthy();
    expect(inputs.at(1).props('disabled')).toBeTruthy();
    expect(wrapper.findAllComponents(BButton).length).toBe(0);
    expect(localeSelect.props('disabled')).toBeTruthy();
    expect(timezoneSelect.props('disabled')).toBeTruthy();

    wrapper.destroy();
  });

  it('check admin view and edit ldap user', async () => {
    PermissionService.setCurrentUser(adminUser);

    const wrapper = mount(ProfileComponent, {
      pinia: createTestingPinia(),
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        user: ldapUser,
        modalStatic: false,
        viewOnly: false
      },
      stubs: {
        VueCropper: true,
        'timezone-select': true,
        'locale-select': true
      },
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();

    const inputs = wrapper.findAllComponents(BFormInput);

    // Check authenticator
    expect(inputs.at(2).props('value')).toBe('settings.users.authenticator.ldap');
    expect(inputs.at(2).props('disabled')).toBeTruthy();

    // Check username
    expect(inputs.length).toBe(4);
    expect(inputs.at(3).props('id')).toBe('external_id');
    expect(inputs.at(3).props('value')).toBe('jdo');
    expect(inputs.at(3).props('disabled')).toBeTruthy();

    wrapper.destroy();
  });

  it('check admin view and edit self without permission to change own attributes', async () => {
    PermissionService.setCurrentUser({ id: 2, permissions: [] });

    const wrapper = mount(ProfileComponent, {
      pinia: createTestingPinia(),
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        user,
        modalStatic: false,
        viewOnly: false
      },
      stubs: {
        VueCropper: true,
        'timezone-select': true,
        'locale-select': true
      },
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();

    const inputs = wrapper.findAllComponents(BFormInput);

    // Check firstname and lastname
    expect(inputs.at(0).props('id')).toBe('firstname');
    expect(inputs.at(0).props('disabled')).toBeTruthy();

    expect(inputs.at(1).props('id')).toBe('lastname');
    expect(inputs.at(0).props('disabled')).toBeTruthy();

    // -- Only firstname and lastname should be disabled --

    // Check buttons
    const buttons = wrapper.findAllComponents(BButton);
    expect(buttons.length).toBe(2);
    // Upload image
    expect(buttons.at(0).text()).toBe('settings.users.image.upload');
    expect(buttons.at(0).attributes('disabled')).toBeFalsy();
    // Save
    expect(buttons.at(1).text()).toBe('app.save');
    expect(buttons.at(1).attributes('disabled')).toBeFalsy();

    // Check locale select
    const localeSelect = wrapper.findComponent(LocaleSelect);
    expect(localeSelect.props('disabled')).toBeFalsy();

    // Check timezone select
    const timezoneSelect = wrapper.findComponent(TimezoneSelect);
    expect(timezoneSelect.props('disabled')).toBeFalsy();

    wrapper.destroy();
  });

  it('check admin view and edit self with permission to change own attributes', async () => {
    PermissionService.setCurrentUser({ id: 2, permissions: ['users.updateOwnAttributes'] });

    const wrapper = mount(ProfileComponent, {
      pinia: createTestingPinia(),
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        user,
        modalStatic: false,
        viewOnly: false
      },
      stubs: {
        VueCropper: true,
        'timezone-select': true,
        'locale-select': true
      },
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();

    const inputs = wrapper.findAllComponents(BFormInput);

    // Check firstname and lastname
    expect(inputs.at(0).props('id')).toBe('firstname');
    expect(inputs.at(0).props('disabled')).toBeFalsy();

    expect(inputs.at(1).props('id')).toBe('lastname');
    expect(inputs.at(0).props('disabled')).toBeFalsy();

    // Check buttons
    const buttons = wrapper.findAllComponents(BButton);
    expect(buttons.length).toBe(2);
    // Upload image
    expect(buttons.at(0).text()).toBe('settings.users.image.upload');
    expect(buttons.at(0).attributes('disabled')).toBeFalsy();
    // Save
    expect(buttons.at(1).text()).toBe('app.save');
    expect(buttons.at(1).attributes('disabled')).toBeFalsy();

    // Check locale select
    const localeSelect = wrapper.findComponent(LocaleSelect);
    expect(localeSelect.props('disabled')).toBeFalsy();

    // Check timezone select
    const timezoneSelect = wrapper.findComponent(TimezoneSelect);
    expect(timezoneSelect.props('disabled')).toBeFalsy();

    wrapper.destroy();
  });

  it('check reactivity for user prop', async () => {
    const wrapper = mount(ProfileComponent, {
      pinia: createTestingPinia(),
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        user,
        modalStatic: false,
        viewOnly: false
      },
      stubs: {
        VueCropper: true,
        'timezone-select': true,
        'locale-select': true
      },
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();
    const inputs = wrapper.findAllComponents(BFormInput);

    // Check firstname
    expect(inputs.at(0).props('value')).toBe('John');

    const newUser = { ...user, firstname: 'Jane' };
    wrapper.setProps({ user: newUser });
    await wrapper.vm.$nextTick();

    // Check firstname
    expect(inputs.at(0).props('value')).toBe('Jane');

    wrapper.destroy();
  });

  it('submit form', async () => {
    PermissionService.setCurrentUser(adminUser);

    const wrapper = mount(ProfileComponent, {
      pinia: createTestingPinia(),
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        user,
        modalStatic: false,
        viewOnly: false
      },
      stubs: {
        VueCropper: true,
        'timezone-select': true,
        'locale-select': true
      },
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();

    const inputs = wrapper.findAllComponents(BFormInput);

    await inputs.at(0).setValue('Max');
    await inputs.at(1).setValue('Mustermann');

    // Check buttons
    const buttons = wrapper.findAllComponents(BButton);

    const request = mockAxios.request('/api/v1/users/2');

    await buttons.at(1).trigger('click');

    await request.wait();
    expect(request.config.method).toBe('post');
    expect(request.config.data.get('firstname')).toBe('Max');
    expect(request.config.data.get('lastname')).toBe('Mustermann');
    expect(request.config.data.get('_method')).toBe('PUT');

    // Check button and input disabled during request
    expect(buttons.at(1).attributes('disabled')).toBeTruthy();
    expect(inputs.at(0).props('disabled')).toBeTruthy();
    expect(inputs.at(1).props('disabled')).toBeTruthy();

    const userAfterChanges = { ...user, firstname: 'Max', lastname: 'Mustermann' };

    await request.respondWith({
      status: 200,
      data: {
        data: userAfterChanges
      }
    });

    // Check if changes are emitted
    expect(wrapper.emitted('update-user')[0][0]).toStrictEqual(userAfterChanges);
    // Update user prop
    await wrapper.setProps({ user: userAfterChanges });
    await wrapper.vm.$nextTick();

    // Check button and input enabled after request and have correct values
    expect(buttons.at(1).attributes('disabled')).toBeFalsy();
    expect(inputs.at(0).props('disabled')).toBeFalsy();
    expect(inputs.at(1).props('disabled')).toBeFalsy();

    expect(inputs.at(0).props('value')).toBe('Max');
    expect(inputs.at(1).props('value')).toBe('Mustermann');

    wrapper.destroy();
  });

  it('delete image', async () => {
    PermissionService.setCurrentUser(adminUser);

    const userWithImage = { ...user, image: 'http://domain.tld/storage/profile_images/abc.jpg' };
    const wrapper = mount(ProfileComponent, {
      pinia: createTestingPinia(),
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        user: userWithImage,
        modalStatic: false,
        viewOnly: false
      },
      stubs: {
        VueCropper: true,
        'timezone-select': true,
        'locale-select': true
      },
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();

    // Check if image is shown
    const img = wrapper.findComponent(BImg);
    expect(img.attributes('src')).toBe('http://domain.tld/storage/profile_images/abc.jpg');

    // Check if buttons to upload new image and delete image are shown
    let buttons = wrapper.findAllComponents(BButton);
    expect(buttons.length).toBe(3);
    expect(buttons.at(0).text()).toBe('settings.users.image.upload');
    expect(buttons.at(1).text()).toBe('settings.users.image.delete');

    // Delete image, check if default image is shown
    await buttons.at(1).trigger('click');
    expect(img.attributes('src')).toBe('/images/default_profile.png');

    // Check if undo button is shown
    buttons = wrapper.findAllComponents(BButton);
    expect(buttons.length).toBe(2);
    expect(buttons.at(0).text()).toBe('settings.users.image.undo_delete');

    // Trigger undo, check if image is shown again
    await buttons.at(0).trigger('click');
    expect(img.attributes('src')).toBe('http://domain.tld/storage/profile_images/abc.jpg');

    // Delete image again, check if default image is shown
    buttons = wrapper.findAllComponents(BButton);
    expect(buttons.length).toBe(3);
    expect(buttons.at(1).text()).toBe('settings.users.image.delete');
    await buttons.at(1).trigger('click');
    expect(img.attributes('src')).toBe('/images/default_profile.png');

    // Save changes (delete image on server)
    buttons = wrapper.findAllComponents(BButton);
    expect(buttons.length).toBe(2);
    expect(buttons.at(1).text()).toBe('app.save');

    const request = mockAxios.request('/api/v1/users/2');

    await buttons.at(1).trigger('click');

    await request.wait();
    expect(request.config.method).toBe('post');
    expect(request.config.data.get('image')).toBe('');
    expect(request.config.data.get('_method')).toBe('PUT');

    await request.respondWith({
      status: 200,
      data: {
        data: user
      }
    });

    await wrapper.vm.$nextTick();

    // Check if event is emitted and update prop
    expect(wrapper.emitted('update-user')[0][0]).toStrictEqual(user);
    await wrapper.setProps({ user });
    await wrapper.vm.$nextTick();

    // Check if image is removed
    expect(img.attributes('src')).toBe('/images/default_profile.png');

    // Check if only upload and save button are shown (no delete or undo button)
    buttons = wrapper.findAllComponents(BButton);
    expect(buttons.length).toBe(2);
    expect(buttons.at(0).text()).toBe('settings.users.image.upload');
    expect(buttons.at(1).text()).toBe('app.save');

    wrapper.destroy();
  });

  it('error on submit', async () => {
    PermissionService.setCurrentUser(adminUser);
    const baseErrorSpy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const wrapper = mount(ProfileComponent, {
      pinia: createTestingPinia(),
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        user,
        modalStatic: false,
        viewOnly: false
      },
      stubs: {
        VueCropper: true,
        'timezone-select': true,
        'locale-select': true
      },
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();

    const buttons = wrapper.findAllComponents(BButton);
    expect(buttons.at(1).text()).toBe('app.save');

    // --- Check 404 error ---
    let request = mockAxios.request('/api/v1/users/2');
    await buttons.at(1).trigger('click');
    await request.wait();
    await request.respondWith({
      status: 404,
      data: {
        message: 'User not found'
      }
    });

    await wrapper.vm.$nextTick();

    // Check if error is emitted
    expect(wrapper.emitted('not-found-error')).toBeTruthy();

    // --- Check stale error ---
    request = mockAxios.request('/api/v1/users/2');
    await buttons.at(1).trigger('click');
    await request.wait();
    const response = {
      error: 428,
      message: 'test',
      new_model: { ...user, firstname: 'Max' }
    };

    await request.respondWith({
      status: 428,
      data: response
    });

    await wrapper.vm.$nextTick();

    // Check if error is emitted
    expect(wrapper.emitted('stale-error')).toBeTruthy();
    expect(wrapper.emitted('stale-error')[0]).toEqual([response]);

    // --- Check form validation error ---
    request = mockAxios.request('/api/v1/users/2');
    await buttons.at(1).trigger('click');
    await request.wait();
    // Respond with errors
    await request.respondWith({
      status: 422,
      data: {
        errors: {
          firstname: ['The Firstname field is required.'],
          lastname: ['The Lastname field is required.']
        }
      }
    });

    await wrapper.vm.$nextTick();

    // Check if errors are shown
    const fields = wrapper.findAllComponents(BFormInput);
    expect(fields.at(0).props('state')).toBe(false);
    expect(fields.at(1).props('state')).toBe(false);

    // --- Check other errors ---
    request = mockAxios.request('/api/v1/users/2');
    await buttons.at(1).trigger('click');
    await request.wait();

    // Reset form validation error shown on next request
    expect(fields.at(0).props('state')).toBeNull();
    expect(fields.at(1).props('state')).toBeNull();

    await request.respondWith({
      status: 500,
      data: {
        message: 'Internal server error'
      }
    });

    await wrapper.vm.$nextTick();

    // Check if error handler is called
    expect(baseErrorSpy).toBeCalledTimes(1);
    expect(baseErrorSpy.mock.calls[0][0].response.status).toBe(500);

    wrapper.destroy();
  });

  it('uploading own profile caused reload of store state', async () => {
    PermissionService.setCurrentUser({ id: 2, permissions: ['users.updateOwnAttributes'] });

    const wrapper = mount(ProfileComponent, {
      pinia: createTestingPinia({ initialState: { auth: { currentUser: _.clone(user) } }, stubActions: false }),
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        user,
        modalStatic: false,
        viewOnly: false
      },
      stubs: {
        VueCropper: true,
        'timezone-select': true,
        'locale-select': true
      },
      attachTo: createContainer()
    });

    const authStore = useAuthStore();
    const localeStore = useLocaleStore();

    await wrapper.vm.$nextTick();

    const inputs = wrapper.findAllComponents(BFormInput);

    await inputs.at(0).setValue('Max');
    await inputs.at(1).setValue('Mustermann');
    wrapper.vm.$data.model.user_locale = 'fr';

    // Check buttons
    const buttons = wrapper.findAllComponents(BButton);
    const request = mockAxios.request('/api/v1/users/2');
    await buttons.at(1).trigger('click');

    await request.wait();
    expect(request.config.method).toBe('post');
    expect(request.config.data.get('firstname')).toBe('Max');
    expect(request.config.data.get('lastname')).toBe('Mustermann');
    expect(request.config.data.get('user_locale')).toBe('fr');
    expect(request.config.data.get('_method')).toBe('PUT');

    // Check button and input disabled during request
    expect(buttons.at(1).attributes('disabled')).toBeTruthy();
    expect(inputs.at(0).props('disabled')).toBeTruthy();
    expect(inputs.at(1).props('disabled')).toBeTruthy();

    const userAfterChanges = { ...user, firstname: 'Max', lastname: 'Mustermann', user_locale: 'fr' };

    const reloadUserRequest = mockAxios.request('/api/v1/currentUser');

    await request.respondWith({
      status: 200,
      data: {
        data: userAfterChanges
      }
    });

    await mockAxios.request('/api/v1/locale/fr').respondWith({
      status: 200,
      data: {
        data: {
          app: {
            demo: 'Il s\'agit d\'une :value'
          }
        },
        meta: {
          dateTimeFormat: {
            datetimeShort: {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }
          },
          name: 'English'
        }
      }
    });

    await reloadUserRequest.wait();
    expect(reloadUserRequest.config.method).toBe('get');
    await reloadUserRequest.respondWith({
      status: 200,
      data: {
        data: userAfterChanges
      }
    });

    await wrapper.vm.$nextTick();

    // Check global state and locale change
    expect(authStore.currentUser).toEqual(userAfterChanges);
    expect(localeStore.currentLocale).toEqual('fr');
    expect(i18n.locale).toEqual('fr');

    // Check button and input enabled after request and have correct values
    expect(buttons.at(1).attributes('disabled')).toBeFalsy();
    expect(inputs.at(0).props('disabled')).toBeFalsy();
    expect(inputs.at(1).props('disabled')).toBeFalsy();

    expect(inputs.at(0).props('value')).toBe('Max');
    expect(inputs.at(1).props('value')).toBe('Mustermann');

    wrapper.destroy();
  });

  it('select image', async () => {
    PermissionService.setCurrentUser(adminUser);

    // Base64 content of a black cross on white background
    const ImageCanvasBuffer = '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';

    // Mock cropped canvas
    const croppedCanvas = {

      toBlob: (callback, type) => {
        const buffer = Buffer.from(ImageCanvasBuffer, 'base64');
        const blob = new Blob(buffer, { type });

        // Add timeout to simulate processing
        setTimeout(() => callback(blob));
      },
      toDataURL: (type) => {
        return 'data:image/jpeg;base64,' + ImageCanvasBuffer;
      }
    };

    const cropperSpy = vi.fn();
    const cropperComponent = {
      name: 'test-cropper',
      template: '<p>test</p>',
      methods: {
        replace (imageData) {
          cropperSpy(imageData);
        },
        getCroppedCanvas (options) {
          return croppedCanvas;
        }
      }
    };

    const toastErrorSpy = vi.fn();

    const userWithImage = { ...user, image: 'http://domain.tld/storage/profile_images/abc.jpg' };

    const view = mount(ProfileComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $te: () => false,
        toastError: toastErrorSpy
      },
      propsData: {
        user: userWithImage,
        viewOnly: false,
        modalStatic: true
      },
      pinia: createTestingPinia(),
      stubs: {
        VueCropper: cropperComponent,
        'timezone-select': true,
        'locale-select': true
      }
    });

    await view.vm.$nextTick();

    // Try to find profile image with image of the user
    let image = view.findComponent(BImg);
    expect(image.exists()).toBeTruthy();
    expect(image.attributes('src')).toBe('http://domain.tld/storage/profile_images/abc.jpg');

    // check crop modal is closed
    const modal = view.findComponent({ ref: 'modal-image-upload' });
    expect(modal.vm.$data.isVisible).toBeFalsy();

    const eventError = {
      target: {
        files: [
          { type: 'image/gif' }
        ]
      }
    };

    // check if error is shown on invalid image type and modal is not shown
    view.vm.onFileSelect(eventError);
    await view.vm.$nextTick();
    expect(toastErrorSpy).toBeCalledTimes(1);
    expect(toastErrorSpy.mock.calls[0][0]).toEqual('settings.users.image.invalid_mime');
    expect(modal.vm.$data.isVisible).toBeFalsy();

    const event = {
      target: {
        files: [
          { type: 'image/png' }
        ]
      }
    };

    const imageUpload = 'data:image/png;base64,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';

    vi.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function () {
      this.onload({
        target: {
          result: imageUpload
        }
      });
    });

    // check for valid image type, check modal for copper is open and cropper gets the image data

    view.vm.onFileSelect(event);
    await view.vm.$nextTick();
    expect(modal.vm.$data.isVisible).toBeTruthy();
    expect(modal.vm.$props.busy).toBeFalsy();
    expect(view.vm.$data.selectedFile).toBe(imageUpload);
    expect(cropperSpy).toBeCalledTimes(1);
    expect(cropperSpy.mock.calls[0][0]).toBe(imageUpload);

    // find modal button to confirm and click
    const modalButtons = modal.findAllComponents(BButton);
    expect(modalButtons.at(1).text()).toContain('settings.users.image.save');
    await modalButtons.at(1).trigger('click');

    // modal is open and busy while images are processed
    expect(modal.vm.$data.isVisible).toBeTruthy();
    expect(modal.vm.$props.busy).toBeTruthy();
    // wait for image to be processed

    await new Promise((resolve, reject) => {
      setTimeout(() => resolve());
    });

    // check image as data url and blob
    const croppedImage = view.vm.$data.croppedImage;
    const croppedImageBlob = view.vm.$data.croppedImageBlob;
    const croppedExpectedImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCABkAGQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD5/qezvLnT7yG8s53guYXDxyxthlYdCDReWdzp17NZ3kEkFzC5SSKQYZWHUEVBQB9Z/Cr4q23jazXTtRZINdhTLoOFuFH8ae/qvbqOOnplfA9neXOn3kN5ZzvBcwuHjljbDKw6EGvqz4VfFW28bWa6dqLRwa7Cnzp0W4UfxoPX1Xt1HHQA9MooooAKKKKACq2oahaaVp89/f3EdvawIXklkOAoo1DULTStPnv7+4jt7WBC8kshwFAr5O+KPxRu/HWoG0tDJb6HA+YYTwZSP439/QdvrQAfFH4o3fjrUDaWhkt9DgfMMJ4MpH8b+/oO31rzqiigAorc0jwb4k16zN5pWi3l3bBynmxRkruGMjP4iigD6Y+KnwrtvG9k2oaescGuwp8jnhbhR/A/v6N26Hjp8pXlnc6dezWd5BJBcwuUkikGGVh1BFffFeafFT4V23jeybUNPWODXYU+Rzwtwo/gf39G7dDx0APkup7O8udPvIbyzneC5hcPHLG2GVh0INF5Z3OnXs1neQSQXMLlJIpBhlYdQRUFAH1n8KvirbeNrNdO1Fkg12FPnTotwo/jT39V7dRx09Mr4Hs7y50+8hvLOd4LmFw8csbYZWHQg19WfCr4q23jazXTtRZINdhT506LcKP409/Ve3UcdAD0yq2oahaaVp89/f3EdvawIXklkOAoFGoahaaVp89/f3EdvawIXklkOAoFfJ3xR+KN3461A2loZLfQ4HzDCeDKR/G/v6Dt9aAD4o/FG78dagbS0MlvocD5hhPBlI/jf39B2+tedUUUAFeifC/4X3njvUBdXQkt9DgfE044Mp/uJ7+p7fXAo+F/wvvPHeoC6uhJb6HA+JpxwZT/AHE9/U9vrgV9Zadp1npOnwWFhbx29rAgSOKMYCigA07TrPSdPgsLC3jt7WBAkcUYwFFFWaKACiiigDzT4qfCu28b2Tahp6xwa7CnyOeFuFH8D+/o3boeOnyleWdzp17NZ3kEkFzC5SSKQYZWHUEV98V5p8VPhXbeN7JtQ09Y4NdhT5HPC3Cj+B/f0bt0PHQA+S6ns7y50+8hvLOd4LmFw8csbYZWHQg0Xlnc6dezWd5BJBcwuUkikGGVh1BFQUAdp40+J/iDxxZWdnqMiRW1ug3xQDas0g/5aMPX26DnFcXRRQAV6J8L/hfeeO9QF1dCS30OB8TTjgyn+4nv6nt9cCj4X/C+88d6gLq6ElvocD4mnHBlP9xPf1Pb64FfWWnadZ6Tp8FhYW8dvawIEjijGAooANO06z0nT4LCwt47e1gQJHFGMBRVmiigAooooAKKKKACq2oahaaVp89/f3EdvawIXklkOAoFGoahaaVp89/f3EdvawIXklkOAoFfJ3xR+KN3461A2loZLfQ4HzDCeDKR/G/v6Dt9aAM/4n+NLbxx4sfULOxjtraJPJjfbiSZR0Z/f0HYcVxVFFABRRRQB9VfBr4iaX4h0O28PtDBYanZRBFt4xtSZB/Gg9e7D8fp6rXwPZ3lzp95DeWc7wXMLh45Y2wysOhBr6s+FXxVtvG1munaiyQa7Cnzp0W4Ufxp7+q9uo46AHplFFFABRRRQAVW1DULTStPnv7+4jt7WBC8kshwFAo1DULTStPnv7+4jt7WBC8kshwFAr5O+KPxRu/HWoG0tDJb6HA+YYTwZSP439/QdvrQAfFH4o3fjrUDaWhkt9DgfMMJ4MpH8b+/oO31rzqiigAr0T4X/C+88d6gLq6ElvocD4mnHBlP9xPf1Pb64FHwv+F95471AXV0JLfQ4HxNOODKf7ie/qe31wK+stO06z0nT4LCwt47e1gQJHFGMBRQB5p8RPg1pXiHQojoFrBYanYxBIFQbUmQdEb39GP4+3y3eWdzp17NZ3kEkFzC5SSKQYZWHUEV98V5p8VPhXbeN7JtQ09Y4NdhT5HPC3Cj+B/f0bt0PHQA+S6ns7y50+8hvLOd4LmFw8csbYZWHQg0Xlnc6dezWd5BJBcwuUkikGGVh1BFQUAfWfwq+Ktt42s107UWSDXYU+dOi3Cj+NPf1Xt1HHT0yvgezvLnT7yG8s53guYXDxyxthlYdCDX1Z8KvirbeNrNdO1Fkg12FPnTotwo/jT39V7dRx0APTKKKKAPkT4o/FG78dagbS0MlvocD5hhPBlI/jf39B2+ted0UUAFeifC/wCF93471D7VdB7fQ4HxNOBgyn+4nv6nt9eKPhf8L7vx3qH2q6ElvocD4mnAwZT/AHE9/U9vrivrLTtOs9J0+CwsLeO3tYECRxRjAUUAGnadZ6Tp8FhYW8dvawIEjijGAoqzRRQAUUUUAeafFT4V23jeybUNPWODXYU+Rzwtwo/gf39G7dDx0+UryzudOvZrO8gkguYXKSRSDDKw6givvivNPip8K7bxvZNqGnrHBrsKfI54W4UfwP7+jduh46AHyXU9neXOn3kN5ZzvBcwuHjljbDKw6EGi8s7nTr2azvIJILmFykkUgwysOoIqCgD6S8MftC6O2hQr4khuY9TT5JGtogySY6P1GCe4or5tooAK3PBuk22veMtI0q8Mgtrq5SKTyzhtpPODRRQB9tadp1npOnwWFhbx29rAgSOKMYCirNFFABRRRQAUUUUAFFFFAHif7QvhjS38OReJBB5epxzpA0qceYhzww74xwa+bKKKACiiigD/2Q==';
    expect(croppedImage).toBe(croppedExpectedImage);
    expect(croppedImageBlob.type).toBe('image/jpeg');

    // check if image was replaced by cropped image
    image = view.findComponent(BImg);
    expect(image.exists()).toBeTruthy();
    expect(image.attributes('src')).toBe(croppedExpectedImage);

    // check if modal is not busy anymore and closed
    expect(modal.vm.$props.busy).toBeFalsy();
    expect(modal.vm.$data.isVisible).toBeFalsy();

    // submit form to send cropped image to server
    const request = mockAxios.request('/api/v1/users/2');
    view.findComponent(BForm).trigger('submit');
    await request.wait();
    // check if blob is sent to server
    expect(request.config.data.get('image') instanceof Blob).toBeTruthy();
    expect(request.config.data.get('image').type).toBe('image/jpeg');

    view.destroy();
  });
});

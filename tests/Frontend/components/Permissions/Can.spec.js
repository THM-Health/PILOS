import PermissionService from '../../../../resources/js/services/PermissionService'
import { mount } from '@vue/test-utils'
import Can from '../../../../resources/js/components/Permissions/Can'
import Vue from 'vue'

const testComponent = {
  name: 'test-component',
  /* eslint-disable @intlify/vue-i18n/no-raw-text */
  template: '<p>test</p>'
}

describe('Can', function () {
  it('hides the content if the necessary permission isn\'t available', async function () {
    const oldPermissions = PermissionService.permissions
    PermissionService.setPermissions(['foo'])

    const wrapper = mount(Can, {
      propsData: {
        permissions: { permission: 'bar' }
      },
      slots: {
        default: testComponent
      }
    })

    await Vue.nextTick()
    expect(wrapper.findComponent(testComponent).exists()).toBe(false)

    PermissionService.setPermissions(oldPermissions)
  })

  it('shows the content if the necessary permission is available', async function () {
    const oldPermissions = PermissionService.permissions
    PermissionService.setPermissions(['foo'])

    const wrapper = mount(Can, {
      propsData: {
        permissions: { permission: 'foo' }
      },
      slots: {
        default: testComponent
      }
    })

    await Vue.nextTick()
    expect(wrapper.findComponent(testComponent).exists()).toBe(true)

    PermissionService.setPermissions(oldPermissions)
  })

  it('updates state on changes in the permissions of the permission service', async function () {
    const oldPermissions = PermissionService.permissions

    const wrapper = mount(Can, {
      propsData: {
        permissions: { permission: 'bar' }
      },
      slots: {
        default: testComponent
      }
    })

    await Vue.nextTick()
    expect(wrapper.findComponent(testComponent).exists()).toBe(false)

    PermissionService.setPermissions(['bar'])
    await Vue.nextTick()
    expect(wrapper.findComponent(testComponent).exists()).toBe(true)

    PermissionService.setPermissions(oldPermissions)
  })
})

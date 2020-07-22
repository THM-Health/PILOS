<template>
  <div v-if="slotVisible">
    <slot></slot>
  </div>
</template>

<script>
import EventBus from '../../services/EventBus'
import PermissionService from '../../services/PermissionService'

export default {
  props: ['permissions'],
  data () {
    return {
      slotVisible: false
    }
  },
  methods: {
    evaluatePermissions () {
      this.slotVisible = PermissionService.can(this.permissions)
    }
  },
  mounted () {
    EventBus.$on('permissionsChangedEvent', this.evaluatePermissions)
    this.evaluatePermissions()
  },
  beforeDestroy () {
    EventBus.$off('permissionsChangedEvent', this.evaluatePermissions)
  }
}
</script>

<style scoped>

</style>

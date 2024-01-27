<template>
  <slot v-if="!userPermissions.can(props.method, props.policy)"></slot>
</template>

<script setup>

import { useUserPermissions } from '@/composables/useUserPermission.js';
import { onMounted } from 'vue';

const props = defineProps([
  'method',
  'policy'
]);

const userPermissions = useUserPermissions();

onMounted(() => {
  console.warn('DEPRECATED, Use userPermissions instead');
});

</script>

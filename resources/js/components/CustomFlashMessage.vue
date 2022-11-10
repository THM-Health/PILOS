<template>
	<div>
    {{ messageObj }}
	</div>
</template>

<script>
export default {
  props: {
    messageId: {
      type: Number,
      required: true
    },
    messageObj: {
      type: Object
    },
  }
}
</script>

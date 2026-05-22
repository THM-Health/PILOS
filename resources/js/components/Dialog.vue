<template>
  <Dialog
    ref="dialog"
    :pt:header:data-scroll-shaddow="
      !dialogContentScrollable || arrivedState.top ? 'false' : 'true'
    "
    :pt:footer:data-scroll-shaddow="
      !dialogContentScrollable || arrivedState.bottom ? 'false' : 'true'
    "
    @show="onModalShow"
    @hide="onModalHide"
  >
    <template v-for="(_, slotName) in $slots" #[slotName]>
      <slot :name="slotName" />
    </template>
  </Dialog>
</template>
<script setup>
import { Dialog } from "primevue";
import { useResizeObserver, useScroll } from "@vueuse/core";
import { ref, useTemplateRef } from "vue";

const dialogRef = useTemplateRef("dialog");
const dialogContentRef = ref(null);
const dialogContentScrollable = ref(false);

const { arrivedState, measure } = useScroll(dialogContentRef);

function onModalShow() {
  dialogContentRef.value = dialogRef.value.content;
}

function onModalHide() {
  dialogContentRef.value = null;
}

useResizeObserver(dialogContentRef, (entries) => {
  const element = entries[0].target;
  dialogContentScrollable.value = element.scrollHeight > element.clientHeight;
  measure();
});
</script>

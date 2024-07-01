<template>
  <div class="h-100">
    <!--      room card-->
    <div
      tabindex="0"
      class="room-card h-full relative bg-white border border-surface-300 dark:border-surface-500 rounded-border shadow-none hover:shadow"
    >
      <div class="p-4 h-100">
        <div class="flex flex-col h-100">
          <div class="grow">
            <div class="flex justify-between items-start">
              <Skeleton :animation="animation" height="1.5rem" width="5rem" class="mb-2"></Skeleton>
              <div class="room-card__buttons shrink-0">
                <Skeleton :animation="animation" size="1.5rem" class="mr-2"></Skeleton>
              </div>
            </div>
            <p
              class="mt-2 text-break font-bold text-color"
              style="width: 100% "
            >
              <Skeleton :animation="animation" height="1.5rem" class="mb-2"></Skeleton>
            </p>
          </div>
          <div
            class="flex flex-col gap-2 text-color"
          >
            <div class="flex">
              <div class="room-details__icon">
                <Skeleton :animation="animation" size="1rem"></Skeleton>
              </div>
              <div class="room-details__text">
                <Skeleton :animation="animation" height="1rem" class="mb-2"></Skeleton>
              </div>
            </div>
            <div class="flex">
              <div class="room-details__icon">
                <Skeleton :animation="animation" size="1rem"></Skeleton>
              </div>
              <div class="room-details__text">
                <Skeleton :animation="animation" height="1rem" class="mb-2"></Skeleton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>

defineProps({
  animation: {
    type: String,
    default: 'wave'
  }
});
</script>

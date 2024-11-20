<template>
  <div class="h-100">
    <!--      room card-->
    <div
      tabindex="0"
      class="room-card relative h-full border-surface-300 shadow-none rounded-border dark:border-surface-500"
    >
      <div class="h-100 p-4">
        <div class="h-100 flex flex-col">
          <div class="grow">
            <div class="flex items-start justify-between">
              <Skeleton
                :animation="animation"
                height="1.5rem"
                width="5rem"
                class="mb-2"
              ></Skeleton>
              <div class="room-card__buttons shrink-0">
                <Skeleton
                  :animation="animation"
                  size="1.5rem"
                  class="mr-2"
                ></Skeleton>
              </div>
            </div>
            <p class="text-break mt-2 font-bold text-color" style="width: 100%">
              <Skeleton
                :animation="animation"
                height="1.5rem"
                class="mb-2"
              ></Skeleton>
            </p>
          </div>
          <div class="flex flex-col gap-2 text-color">
            <div class="flex">
              <div class="room-details__icon">
                <Skeleton :animation="animation" size="1rem"></Skeleton>
              </div>
              <div class="room-details__text">
                <Skeleton
                  :animation="animation"
                  height="1rem"
                  class="mb-2"
                ></Skeleton>
              </div>
            </div>
            <div class="flex">
              <div class="room-details__icon">
                <Skeleton :animation="animation" size="1rem"></Skeleton>
              </div>
              <div class="room-details__text">
                <Skeleton
                  :animation="animation"
                  height="1rem"
                  class="mb-2"
                ></Skeleton>
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
    default: "wave",
  },
});
</script>

<template>
  <div class="h-100">
    <!--      room card-->
    <div
      tabindex="0"
      class="room-card h-full relative bg-white border-1 border-300 border-round shadow-none hover:shadow-2"
    >
      <div class="p-3 h-100">
        <div class="flex flex-column h-100">
          <div class="flex-grow-1">
            <div class="flex justify-content-between align-items-start">
              <Skeleton :animation="animation" height="1.5rem" width="5rem" class="mb-2"></Skeleton>
              <div class="room-card__buttons flex-shrink-0">
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
            class="flex flex-column gap-2 text-color"
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
<script>
export default {
  name: 'RoomSkeletonComponent',
  props: {
    animation: {
      type: String,
      default: 'wave'
    }
  }
};
</script>

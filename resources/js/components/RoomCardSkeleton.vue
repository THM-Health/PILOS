<template>
  <div class="h-100">
    <!--      room card-->
    <b-card
      no-body
      bg-variant="white"
      class="room-card h-100"
    >
      <b-card-body class="p-3 h-100">
        <div class="flex flex-column h-100">
          <div class="flex-grow-1">
            <b-row>
              <b-col>
                <b-skeleton />
              </b-col>
              <b-col>
                <div class="flex justify-content-end">
                  <b-skeleton
                    type="button"
                    size="25px"
                    class="mr-1"
                  />
                  <b-skeleton
                    type="button"
                    size="25px"
                  />
                </div>
              </b-col>
            </b-row>
            <h5
              class="mt-2 text-break "
              style="width: 100% "
            >
              <b-skeleton height="1.5rem" />
            </h5>
          </div>
          <div>
            <div class="flex">
              <div class="room-card-info-icon">
                <i class="fa-solid fa-user" />
              </div>
              <div class="room-info-text">
                <small><b-skeleton class="mt-1" /></small>
              </div>
            </div>
            <div class="flex">
              <div class="room-card-info-icon">
                <i class="fa-solid fa-clock" />
              </div>
              <div class="room-info-text">
                <small>
                  <b-skeleton class="mt-1" />
                </small>
              </div>
            </div>
          </div>
        </div>
      </b-card-body>
    </b-card>
  </div>
</template>
<script>
export default {
  name: 'RoomSkeletonComponent'
};
</script>

<template>
  <div>
    <div
      v-if="list.length > 0"
      class="mb-3"
    >
      <p>
        {{ description }} <b-badge :variant="variant">
          {{ list.length }}
        </b-badge>
      </p>
      <b-list-group class="room-bulk-import-preview">
        <b-list-group-item
          v-for="user in list"
          :key="user.email"
          :variant="variant"
        >
          <div class="flex justify-content-between">
            <span> {{ user.email }}</span>
            <b-button
              v-if="user.error"
              v-b-toggle="user.email"
              variant="light"
              size="sm"
            >
              <span class="when-open">
                <i class="fa-solid fa-chevron-up" />
              </span><span class="when-closed">
                <i class="fa-solid fa-chevron-down" />
              </span>
            </b-button>
          </div>
          <b-collapse
            v-if="user.error"
            :id="user.email"
            class="mt-2"
          >
            <i>{{ user.error }}</i>
          </b-collapse>
        </b-list-group-item>
      </b-list-group>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    list: Array,
    variant: String,
    description: String
  }
};
</script>

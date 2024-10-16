<template>
  <div>
    <div
      v-if="list.length > 0"
      class="mb-4"
      data-test="room-members-bulk-import-list"
    >
      <p class="font-bold">
        {{ description }} <Badge :severity="variant">
          {{ list.length }}
        </Badge>
      </p>
      <Accordion
        expandIcon="fa-solid fa-plus"
        collapseIcon="fa-solid fa-minus"
        class="room-bulk-import-preview"
        :multiple="true"
      >
        <AccordionPanel
          v-for="user in list"
          :key="user.email"
          :value="user.email"
          :disabled="!user.error"
          class="opacity-100"
          data-test="room-members-bulk-import-list-item"
        >
          <AccordionHeader
            :pt="{
              toggleIcon: {
                class: {
                  '!hidden': !user.error
                }
              }
            }"
          >
            {{ user.email }}
          </AccordionHeader>
          <AccordionContent>
            <InlineNote severity="error">{{ user.error }}</InlineNote>
          </AccordionContent>

        </AccordionPanel>
      </Accordion>
    </div>
  </div>
</template>

<script setup>

defineProps({
  list: {
    type: Array,
    required: true
  },
  variant: {
    type: String
  },
  description: {
    type: String,
    required: true
  }
});
</script>

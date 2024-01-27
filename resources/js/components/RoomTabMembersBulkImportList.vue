<template>
  <div>
    <div
      v-if="list.length > 0"
      class="mb-3"
    >
      <p>
        {{ description }} <Badge :severity="variant">
          {{ list.length }}
        </Badge>
      </p>
      <Accordion class="room-bulk-import-preview" :multiple="true">
        <AccordionTab
          v-for="user in list"
          :key="user.email"
          :variant="variant"
          :header="user.email"
          :disabled="!user.error"
          :pt="{
            headerAction: {
              class: {
                'p-2': true,
                'flex-row-reverse': user.error,
                'justify-content-between': true
              }
            },
            headerIcon: {
              class: {
                'hidden': !user.error
              }
            },
            content: {
              class: {
                'p-2': true
              }
            }

          }"
        >
          <i>{{ user.error }}</i>
        </AccordionTab>
      </Accordion>
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

<template>
  <div>
    <div
      v-if="list.length > 0"
      class="mb-3"
    >
      <p class="font-bold">
        {{ description }} <Badge :severity="variant">
          {{ list.length }}
        </Badge>
      </p>
      <Accordion class="room-bulk-import-preview" :multiple="true">
        <AccordionTab
          v-for="user in list"
          :key="user.email"
          :header="user.email"
          :disabled="!user.error"
          :pt="{
            header: {
              class: 'opacity-100'
            },
            headerAction: {
              class: {
                'p-2': true,
                'justify-content-end': !user.error
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
          <InlineNote severity="error">{{ user.error }}</InlineNote>
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

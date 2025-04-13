<template>
  <DataTable
    v-model:filters="filters"
    :value="roomTypes"
    sort-field="name"
    :sort-order="1"
    paginator
    :paginator-template="paginator.getTemplate()"
    :current-page-report-template="paginator.getCurrentPageReportTemplate()"
    striped-rows
    row-hover
    :rows="settingsStore.getSetting('general.pagination_page_size')"
    :pt="{
      table: 'table-auto lg:table-fixed',
      bodyRow: {
        'data-test': 'room-type-item',
      },
      mask: {
        'data-test': 'overlay',
      },
      column: {
        bodyCell: {
          'data-test': 'room-type-item-cell',
        },
        headerCell: {
          'data-test': 'room-type-header-cell',
        },
      },
      pcPaginator: {
        page: {
          'data-test': 'paginator-page',
        },
        next: {
          'data-test': 'paginator-next-button',
        },
      },
    }"
  >
    <template #empty>
      <InlineNote v-if="roomTypes.length === 0">{{
        $t("admin.room_types.no_data")
      }}</InlineNote>
      <InlineNote v-else>{{
        $t("admin.room_types.no_data_filtered")
      }}</InlineNote>
    </template>
    <Column
      key="name"
      field="name"
      :header="$t('app.model_name')"
      :sortable="true"
    >
      <template #body="slotProps">
        <TextTruncate>{{ slotProps.data.name }}</TextTruncate>
      </template>
    </Column>

    <Column
      key="enabled"
      field="streaming_settings.enabled"
      :header="$t('admin.streaming.enabled')"
      :sortable="true"
    >
      <template #body="slotProps">
        <Badge
          v-if="slotProps.data.streaming_settings.enabled"
          severity="success"
        >
          <i class="fa-solid fa-check" />
        </Badge>
        <Badge v-else severity="danger">
          <i class="fa-solid fa-times" />
        </Badge>
      </template>
    </Column>

    <Column
      key="default_pause_image"
      field="streaming_settings.default_pause_image"
      :header="$t('admin.streaming.default_pause_image')"
      :sortable="true"
    >
      <template #body="slotProps">
        <Badge
          v-if="slotProps.data.streaming_settings.default_pause_image"
          severity="success"
        >
          <i class="fa-solid fa-check" />
        </Badge>
        <Badge v-else severity="danger">
          <i class="fa-solid fa-times" />
        </Badge>
      </template>
    </Column>

    <Column
      v-if="actionColumn.visible"
      field="actions"
      :header="$t('app.actions')"
      class="action-column"
      :class="actionColumn.classes"
    >
      <template #body="slotProps">
        <div>
          <AdminStreamingRoomTypeEditButton
            :room-type="slotProps.data"
            @edited="emit('edited')"
          />
        </div>
      </template>
    </Column>
  </DataTable>
</template>
<script setup>
import { ref } from "vue";
import { useActionColumn } from "../composables/useActionColumn.js";
import { usePaginator } from "../composables/usePaginator.js";
import { useSettingsStore } from "../stores/settings";

const actionColumn = useActionColumn([{ permissions: ["streaming.update"] }]);

const paginator = usePaginator();
const settingsStore = useSettingsStore();

const filters = ref({
  name: { value: null, matchMode: "contains" },
});

const emit = defineEmits(["edited", "gone"]);

defineProps({
  roomTypes: {
    type: Array,
    required: true,
  },
});
</script>

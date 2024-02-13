<template>
  <div>
    <div class="grid">
      <div class="col">
        <h2>
          {{ $t('app.room_types') }}
        </h2>
      </div>
    <div class="col flex justify-content-end align-items-center">
      <Can
        method="create"
        policy="RoomTypePolicy"
      >
        <router-link
          v-tooltip.left="$t('settings.room_types.new')"
          class="p-button p-button-success"
          :to="{ name: 'settings.room_types.view', params: { id: 'new' } }"
        >
          <i class="fa-solid fa-plus" />
        </router-link>
      </can>
      </div>
    </div>
    <Divider/>

    <DataTable
      :value="roomTypes"
      sort-field="description"
      :sort-order="1"
      paginator
      :loading="isBusy"
      :rows="settingsStore.getSetting('pagination_page_size')"
    >
<!--      ToDo change?-->
<!--      <Column v-for="col of columns" :key="col.field" :field="col.field" :header="col.header" :sortable="col.sortable"></Column>-->
      <Column field="description" key="description" :header="$t('app.description')" :sortable="true"></Column>
      <Column field="actions" :header="$t('app.actions')" class="text-right">
        <template #body="{data}">
          <span class="p-buttongroup">
            <Can
              method="view"
              :policy="data"
            >
              <router-link
                class="p-button p-button-info"
                v-tooltip="$t('settings.room_types.view', { name: data.description })"
                :disabled="isBusy"
                :to="{ name: 'settings.room_types.view', params: { id: data.id }, query: { view: '1' } }"
              >
                <i class="fa-solid fa-eye" />
              </router-link>
            </can>
            <Can
              method="update"
              :policy="data"
            >
              <router-link
                class="p-button p-button-secondary"
                v-tooltip="$t('settings.room_types.edit', { name: data.description })"
                :disabled="isBusy"
                :to="{ name: 'settings.room_types.view', params: { id: data.id } }"
              >
                <i class="fa-solid fa-edit" />
              </router-link>
            </can>
            <Can
              method="delete"
              :policy="data"
            >
              <Button
                v-tooltip="$t('settings.room_types.delete.item', { id: data.description })"
                :disabled="isBusy"
                severity="danger"
                @click="showDeleteModal(data)"
              >
                <i class="fa-solid fa-trash" />
              </Button>
            </can>
            </span>
        </template>
      </Column>
      <template #empty>
        <i>{{ $t('settings.room_types.no_data') }}</i>
      </template>
    </DataTable>

    <Dialog
    v-model:visible="deleteModalVisible"
    modal
    :header="$t('settings.room_types.delete.title')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :closeOnEscape="!isBusy"
    :dismissableMask="!isBusy"
    :closeable="!isBusy"
    :draggable = false
    @hide="clearRoomTypeToDelete"
    >
      <span v-if="roomTypeToDelete">
        {{ $t('settings.room_types.delete.confirm', { name: roomTypeToDelete.description }) }}
      </span>
      <hr>
      <div class="flex flex-column gap-2">
      <label for="replacement-room-type">{{$t('settings.room_types.delete.replacement')}}</label>
        <Dropdown
          id="replacement-room-type"
          v-model.number="replacement"
          :disabled="isBusy"
          :class="{'p-invalid':formErrors.fieldInvalid('replacement_room_type')}"
          :options="roomTypeSelect"
          :placeholder="$t('settings.room_types.delete.no_replacement')"
          option-value="value"
          option-label="text"
          aria-describedby="replacement-help"
        />
        <p class="p-error" v-html="formErrors.fieldError('replacement_room_type')" />
        <small id="replacement-help">{{$t('settings.room_types.delete.replacement_info')}}</small>
      </div>
      <template #footer>
        <Button :label="$t('app.no')" severity="secondary" @click="clearRoomTypeToDelete"></Button>
        <Button :label="$t('app.yes')" severity="danger" :loading="isBusy" @click="deleteRoomType"></Button>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
  import env from '@/env';
  import { useFormErrors } from '@/composables/useFormErrors.js';
  import { useApi } from '@/composables/useApi.js';
  import { useSettingsStore } from '@/stores/settings';
  import {onMounted, ref, computed} from "vue";
  import { useI18n } from 'vue-i18n';

  const formErrors = useFormErrors();
  const api = useApi();
  const settingsStore= useSettingsStore();
  const { t } = useI18n();

  //ToDo check if could be deleted
  const props = defineProps({
    modalStatic: {
      type: Boolean,
      default: false
    }
  });

  /**
   * Sets the event listener for current user change to re-evaluate whether the
   * action column should be shown or not.
   *
   * @method mounted
   * @return undefined
   */
  onMounted(() =>{
    fetchRoomTypes();
  });

  /**
   * Calculate the room type selection options
   */
  const roomTypeSelect = computed(()=>{
    const noReplacement = {};
    noReplacement.value = null;
    noReplacement.text = t('settings.room_types.delete.no_replacement');

    if (roomTypes) {
      const list = roomTypes.value.filter((roomtype) => {
        return roomtype.id !== roomTypeToDelete.value.id;
      }).map(roomtype => {
        return {
          value: roomtype.id,
          text: roomtype.description
        };
      });
      list.unshift(noReplacement);
      return list;
    }
    return [];
  });
  // ToDo change?
  // data actionPermissions: ['roomTypes.view', 'roomTypes.update', 'roomTypes.delete']
  //    tableFields () {
  //       const fields = [
  //        { field: 'description', header: this.$t('app.description'), sortable: true, class: 'td-max-width-0-lg' }
  //     ];
  //
  //      if (this.actionColumnVisible) {
  //        fields.push(this.actionColumnDefinition);
  //       }
  //
  //     return fields;
  //   },

  const deleteModalVisible = ref(false);
  const isBusy = ref(false);
  const roomTypeToDelete = ref(undefined);
  const replacement = ref(null);
  const roomTypes= ref([]);

  /**
   * Loads the roles from the backend and calls on finish the callback function.
   */
  function fetchRoomTypes() {
    isBusy.value = true;
    api.call('roomTypes').then(response => {
      roomTypes.value = response.data.data;
    }).catch(error => {
      api.error(error);
    }).finally(() => {
      isBusy.value = false;
    });
  }

  /**
   * Shows the delete modal with the passed room type.
   *
   * @param roomType room type that should be deleted.
   */
  function showDeleteModal (roomType) {
    formErrors.clear();
    replacement.value=null;
    roomTypeToDelete.value = roomType;
    deleteModalVisible.value = true;
  }

  /**
   * Deletes the room type that is set in the property `roomTypeToDelete`.
   */
  function deleteRoomType(){
    isBusy.value = true;

    api.call(`roomTypes/${roomTypeToDelete.value.id}`, {
      method: 'delete',
      data: { replacement_room_type: replacement.value }
    }).then(() => {
      formErrors.clear();
      clearRoomTypeToDelete();
      fetchRoomTypes();

    }).catch(error => {
      // failed due to form validation errors
      if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
        formErrors.set(error.response.data.errors);
      } else {
        if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
          fetchRoomTypes();
        }
        api.error(error);
        clearRoomTypeToDelete();
      }
    }).finally(() => {
        isBusy.value = false;
    });
  }
  /**
   * Clears the temporary property `roomTypeToDelete` and  on canceling or
   * after success delete when the modal gets hidden.
   */
  function clearRoomTypeToDelete(){
    deleteModalVisible.value=false;
    roomTypeToDelete.value = undefined;
  }

</script>

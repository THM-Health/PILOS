<script setup>
import { ref } from 'vue';
import _ from 'lodash';
const model = defineModel();

const modalVisible = ref(false);

const newRoomType = ref(null);

function editRoomType () {
  newRoomType.value = _.cloneDeep(model.value);
  modalVisible.value = true;
}

function handleOk () {
  model.value = _.cloneDeep(newRoomType.value);
  modalVisible.value = false;
}

</script>

<template>
  <InputGroup v-if="model">
    <InputText :value="model.description" readonly />
    <Button icon="fa-solid fa-edit" @click="editRoomType" />
  </InputGroup>

  <Dialog
    v-model:visible="modalVisible"
    modal
    :header="$t('rooms.change_type.title')"
    :style="{ width: '900px' }"
    :breakpoints="{ '975px': '90vw' }"
    :draggable="false"
  >
    <RoomTypeSelect
      ref="roomTypeSelect"
      v-model="newRoomType"
    />

    <template #footer>
      <div class="flex justify-content-end gap-2">
        <Button :label="$t('app.cancel')" outlined @click="modalVisible = false" />
        <Button :label="$t('app.save')" :disabled="!newRoomType" @click="handleOk" />
      </div>
    </template>
  </Dialog>
</template>

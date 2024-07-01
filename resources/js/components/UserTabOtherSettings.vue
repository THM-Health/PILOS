<template>
  <div>
    <h4>{{ $t('settings.users.bbb') }}</h4>
    <form @submit="save" v-if="model">
      <div class="field grid grid-cols-12 gap-4">
        <label for="bbb_skip_check_audio" class="col-span-12 mb-2 md:col-span-3 md:mb-0">{{ $t('settings.users.skip_check_audio') }}</label>
        <div class="col-span-12 md:col-span-9">
          <InputSwitch
            id="bbb_skip_check_audio"
            v-model="model.bbb_skip_check_audio"
            required
            :disabled="isBusy || viewOnly"
            :invalid="formErrors.fieldInvalid('bbb_skip_check_audio')"
          />
          <p class="p-error" v-html="formErrors.fieldError('bbb_skip_check_audio')" />
        </div>
      </div>

      <div class="flex justify-end">
        <Button
          v-if="!viewOnly"
          :disabled="isBusy"
          severity="success"
          type="submit"
          :loading="isBusy"
          icon="fa-solid fa-save"
          :label="$t('app.save')"
        />
      </div>
    </form>
  </div>
</template>

<script setup>
import env from '../env';
import _ from 'lodash';
import { useApi } from '../composables/useApi.js';
import { useFormErrors } from '../composables/useFormErrors.js';
import { onMounted, ref, watch } from 'vue';

const props = defineProps({
  user: {
    type: Object,
    required: true
  },
  viewOnly: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['updateUser', 'notFoundError', 'staleError']);

const model = ref(null);
const isBusy = ref(false);

const api = useApi();
const formErrors = useFormErrors();

watch(() => props.user, (user) => {
  model.value = _.cloneDeep(user);
}, { deep: true });

onMounted(() => {
  model.value = _.cloneDeep(props.user);
});

/**
 * Saves the changes of the user to the database by making a api call.
 *
 */
function save (event) {
  if (event) {
    event.preventDefault();
  }

  isBusy.value = true;
  formErrors.clear();

  api.call('users/' + model.value.id, {
    method: 'POST',
    data: {
      _method: 'PUT',
      updated_at: model.value.updated_at,
      bbb_skip_check_audio: model.value.bbb_skip_check_audio

    }
  }).then(response => {
    emit('updateUser', response.data.data);
  }).catch(error => {
    if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
      emit('notFoundError', error);
    } else if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
      // Validation errors
      formErrors.set(error.response.data.errors);
    } else if (error.response && error.response.status === env.HTTP_STALE_MODEL) {
      // Stale error
      emit('staleError', error.response.data);
    } else {
      // Other errors
      api.error(error);
    }
  }).finally(() => {
    isBusy.value = false;
  });
}
</script>

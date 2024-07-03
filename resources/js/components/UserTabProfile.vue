<template>
  <div>
    <h4>{{ $t('admin.users.base_data') }}</h4>
    <form @submit.prevent="save">

      <div class="field grid">
        <label for="firstname" class="col-12 mb-2 md:col-3 md:mb-0">{{ $t('app.firstname') }}</label>
        <div class="col-12 md:col-9">
          <InputText
            id="firstname"
            v-model="model.firstname"
            type="text"
            required
            :disabled="isBusy || viewOnly || !canUpdateAttributes"
            class="w-full"
            :invalid="formErrors.fieldInvalid('firstname')"
          />
          <p class="p-error" v-html="formErrors.fieldError('firstname')" />
        </div>
      </div>

      <div class="field grid">
        <label for="lastname" class="col-12 mb-2 md:col-3 md:mb-0">{{ $t('app.lastname') }}</label>
        <div class="col-12 md:col-9">
          <InputText
            id="lastname"
            v-model="model.lastname"
            type="text"
            required
            :disabled="isBusy || viewOnly || !canUpdateAttributes"
            class="w-full"
            :invalid="formErrors.fieldInvalid('lastname')"
          />
          <p class="p-error" v-html="formErrors.fieldError('lastname')" />
        </div>
      </div>

      <div class="field grid">
        <label for="authenticator" class="col-12 mb-2 md:col-3 md:mb-0">{{ $t('auth.authenticator') }}</label>
        <div class="col-12 md:col-9">
          <InputText
            id="authenticator"
            :value="$t(`admin.users.authenticator.${model.authenticator}`)"
            type="text"
            disabled
            class="w-full"
          />
        </div>
      </div>

      <div class="field grid" v-if="model.authenticator !== 'local'">
        <label for="authenticator_id" class="col-12 mb-2 md:col-3 md:mb-0">{{ $t('auth.authenticator_id') }}</label>
        <div class="col-12 md:col-9">
          <InputText
            id="authenticator_id"
            v-model="model.external_id"
            type="text"
            disabled
            class="w-full"
          />
        </div>
      </div>

      <!-- Profile image-->
      <div class="grid">
        <label class="col-12 mb-2 md:col-3 md:mb-0">{{ $t('admin.users.image.title') }}</label>
        <div class="col-12 md:col-9">
          <UserProfileImageSelector
            :image="model.image"
            :busy="isBusy"
            :view-only="viewOnly"
            :firstname="model.firstname"
            :lastname="model.lastname"
            :image-deleted="imageDeleted"
            @newImage="onNewImage"
            @deleteImage="onDeleteImage"
          />
          <p class="p-error" v-html="formErrors.fieldError('image')" />
        </div>
      </div>

      <div class="field grid">
        <label for="user_locale" class="col-12 mb-2 md:col-3 md:mb-0">{{ $t('admin.users.user_locale') }}</label>
        <div class="col-12 md:col-9">
          <LocaleSelect
            id="user_locale"
            v-model="model.user_locale"
            required
            :invalid="formErrors.fieldInvalid('user_locale')"
            :disabled="isBusy || viewOnly"
          />
          <p class="p-error" v-html="formErrors.fieldError('user_locale')" />
        </div>
      </div>

      <div class="field grid">
        <label for="timezone" class="col-12 mb-2 md:col-3 md:mb-0">{{ $t('admin.users.timezone') }}</label>
        <div class="col-12 md:col-9">
          <timezone-select
            id="timezone"
            v-model="model.timezone"
            required
            :invalid="formErrors.fieldInvalid('timezone')"
            :disabled="isBusy || viewOnly"
            :placeholder="$t('admin.users.timezone')"
            @loading-error="(value) => timezonesLoadingError = value"
            @busy="(value) => timezonesLoading = value"
          />
          <p class="p-error" v-html="formErrors.fieldError('timezone')" />
        </div>
      </div>

      <div class="flex justify-content-end">
        <Button
          v-if="!viewOnly"
          :disabled="isBusy || timezonesLoading || timezonesLoadingError || imageToBlobLoading"
          type="submit"
          severity="success"
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
import { useAuthStore } from '../stores/auth';
import { onMounted, ref, computed, watch } from 'vue';
import { useFormErrors } from '../composables/useFormErrors.js';
import { useApi } from '../composables/useApi.js';
import { useUserPermissions } from '../composables/useUserPermission.js';

const props = defineProps({
  viewOnly: {
    type: Boolean,
    default: false
  },
  user: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['updateUser', 'notFoundError', 'staleError']);

const isBusy = ref(false);
const model = ref({});
const timezonesLoading = ref(false);
const timezonesLoadingError = ref(false);

const imageToBlobLoading = ref(false);
const croppedImageBlob = ref(null);
const imageDeleted = ref(false);

const authStore = useAuthStore();
const formErrors = useFormErrors();
const api = useApi();
const userPermissions = useUserPermissions();

watch(() => props.user, (user) => {
  model.value = _.cloneDeep(user);
}, { deep: true });

onMounted(() => {
  model.value = _.cloneDeep(props.user);
});

const canUpdateAttributes = computed(() => {
  if (!model.value?.id) { return false; }
  return userPermissions.can('updateAttributes', model.value);
});

function onNewImage (newImage) {
  croppedImageBlob.value = newImage;
}

function onDeleteImage (deleteImage) {
  imageDeleted.value = deleteImage;
}

/**
 * Saves the changes of the user to the database by making a api call.
 *
 */
function save () {
  isBusy.value = true;

  const formData = new FormData();

  formData.append('user_locale', model.value.user_locale);
  formData.append('timezone', model.value.timezone);
  formData.append('firstname', model.value.firstname);
  formData.append('lastname', model.value.lastname);

  formData.append('updated_at', model.value.updated_at);

  formData.append('_method', 'PUT');

  // croppedImage
  if (croppedImageBlob.value != null) {
    formData.append('image', croppedImageBlob.value, 'image.png');
  } else if (imageDeleted.value) {
    formData.append('image', '');
  }

  formErrors.clear();

  api.call('users/' + model.value.id, {
    method: 'POST',
    data: formData
  }).then(async response => {
    // if the updated user is the current user, then renew also the currentUser by calling getCurrentUser of the store
    if (authStore.currentUser && model.value.id === authStore.currentUser.id) {
      await authStore.getCurrentUser();
    }

    emit('updateUser', response.data.data);
    imageDeleted.value = false;
  }).catch(error => {
    if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
      emit('notFoundError', error);
    } else if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
      // Validation error
      formErrors.set(error.response.data.errors);
    } else if (error.response && error.response.status === env.HTTP_STALE_MODEL) {
      // Stale error
      emit('staleError', error.response.data);
    } else {
      api.error(error);
    }
  }).finally(() => {
    isBusy.value = false;
  });
}
</script>

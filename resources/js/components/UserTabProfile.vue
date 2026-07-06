<!--
SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <div>
    <AdminPanel :title="$t('admin.users.base_data')">
      <Form
        class="flex flex-col gap-4"
        :disabled="
          isBusy ||
          timezonesLoading ||
          timezonesLoadingError ||
          imageToBlobLoading
        "
        @submit="save"
      >
        <div class="field grid grid-cols-12 gap-4" data-test="firstname-field">
          <label
            for="firstname"
            class="col-span-12 mb-2 md:col-span-3 md:mb-0"
            >{{ $t("app.firstname") }}</label
          >
          <div class="col-span-12 md:col-span-9">
            <InputText
              id="firstname"
              v-model="model.firstname"
              type="text"
              required
              :disabled="isBusy || viewOnly || !canUpdateAttributes"
              class="w-full"
              :invalid="formErrors.fieldInvalid('firstname')"
            />
            <FormError :errors="formErrors.fieldError('firstname')" />
          </div>
        </div>

        <div class="field grid grid-cols-12 gap-4" data-test="lastname-field">
          <label
            for="lastname"
            class="col-span-12 mb-2 md:col-span-3 md:mb-0"
            >{{ $t("app.lastname") }}</label
          >
          <div class="col-span-12 md:col-span-9">
            <InputText
              id="lastname"
              v-model="model.lastname"
              type="text"
              required
              :disabled="isBusy || viewOnly || !canUpdateAttributes"
              class="w-full"
              :invalid="formErrors.fieldInvalid('lastname')"
            />
            <FormError :errors="formErrors.fieldError('lastname')" />
          </div>
        </div>

        <div
          class="field grid grid-cols-12 gap-4"
          data-test="authenticator-field"
        >
          <label
            for="authenticator"
            class="col-span-12 mb-2 md:col-span-3 md:mb-0"
            >{{ $t("admin.users.authenticator.title") }}</label
          >
          <div class="col-span-12 md:col-span-9">
            <InputText
              id="authenticator"
              :value="$t(`admin.users.authenticator.${model.authenticator}`)"
              type="text"
              disabled
              class="w-full"
            />
          </div>
        </div>

        <div
          v-if="model.authenticator !== 'local'"
          class="field grid grid-cols-12 gap-4"
          data-test="external-user-id-field"
        >
          <label
            for="external-user-id"
            class="col-span-12 mb-2 md:col-span-3 md:mb-0"
            >{{ $t("auth.external_user_id") }}</label
          >
          <div class="col-span-12 md:col-span-9">
            <InputText
              id="external-user-id"
              v-model="model.external_id"
              type="text"
              disabled
              class="w-full"
            />
          </div>
        </div>

        <!-- Profile image-->
        <div class="grid grid-cols-12 gap-4" data-test="profile-image-field">
          <label class="col-span-12 mb-2 md:col-span-3 md:mb-0">{{
            $t("admin.users.image.title")
          }}</label>
          <div class="col-span-12 md:col-span-9">
            <UserProfileImageSelector
              :image="model.image"
              :disabled="isBusy"
              :view-only="viewOnly || model.external_image"
              :firstname="model.firstname"
              :lastname="model.lastname"
              :image-deleted="imageDeleted"
              @new-image="onNewImage"
              @delete-image="onDeleteImage"
            />
            <FormError :errors="formErrors.fieldError('image')" />
          </div>
        </div>

        <div class="field grid grid-cols-12 gap-4" data-test="locale-field">
          <label
            id="locale-label"
            class="col-span-12 mb-2 md:col-span-3 md:mb-0"
            >{{ $t("admin.users.user_locale") }}</label
          >
          <div class="col-span-12 md:col-span-9">
            <LocaleSelect
              v-model="model.user_locale"
              aria-labelledby="locale-label"
              required
              :invalid="formErrors.fieldInvalid('user_locale')"
              :disabled="isBusy || viewOnly"
            />
            <FormError :errors="formErrors.fieldError('user_locale')" />
          </div>
        </div>

        <div class="field grid grid-cols-12 gap-4" data-test="timezone-field">
          <label
            id="timezone-label"
            class="col-span-12 mb-2 md:col-span-3 md:mb-0"
            >{{ $t("admin.users.timezone") }}</label
          >
          <div class="col-span-12 md:col-span-9">
            <timezone-select
              v-model="model.timezone"
              aria-labelledby="timezone-label"
              required
              :invalid="formErrors.fieldInvalid('timezone')"
              :disabled="isBusy || viewOnly"
              :placeholder="$t('admin.users.timezone')"
              @loading-error="(value) => (timezonesLoadingError = value)"
              @busy="(value) => (timezonesLoading = value)"
            />
            <FormError :errors="formErrors.fieldError('timezone')" />
          </div>
        </div>

        <div class="flex justify-end">
          <Button
            v-if="!viewOnly"
            :disabled="
              isBusy ||
              timezonesLoading ||
              timezonesLoadingError ||
              imageToBlobLoading
            "
            type="submit"
            :loading="isBusy"
            icon="fa-solid fa-save"
            :label="$t('app.save')"
            data-test="user-tab-profile-save-button"
          />
        </div>
      </Form>
    </AdminPanel>
  </div>
</template>

<script setup>
import * as _ from "lodash-es";
import { useAuthStore } from "../stores/auth";
import { ref, computed, watch, onBeforeMount } from "vue";
import { useFormErrors } from "../composables/useFormErrors.js";
import { useApi } from "../composables/useApi.js";
import { useUserPermissions } from "../composables/useUserPermission.js";
import AdminPanel from "./AdminPanel.vue";
import {
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_STALE_MODEL,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
} from "../constants/httpStatusCodes.js";

const props = defineProps({
  viewOnly: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["updateUser", "notFoundError", "staleError", "busy"]);

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

watch(
  () => props.user,
  (user) => {
    model.value = _.cloneDeep(user);
  },
  { deep: true },
);

watch(isBusy, () => {
  emit("busy", isBusy.value);
});

onBeforeMount(() => {
  model.value = _.cloneDeep(props.user);
});

const canUpdateAttributes = computed(() => {
  if (!model.value?.id) {
    return false;
  }
  return userPermissions.can("updateAttributes", model.value);
});

function onNewImage(newImage) {
  croppedImageBlob.value = newImage;
}

function onDeleteImage(deleteImage) {
  imageDeleted.value = deleteImage;
}

/**
 * Saves the changes of the user to the database by making a api call.
 *
 */
function save() {
  isBusy.value = true;

  const formData = new FormData();

  formData.append("user_locale", model.value.user_locale);
  formData.append("timezone", model.value.timezone);
  formData.append("firstname", model.value.firstname);
  formData.append("lastname", model.value.lastname);

  formData.append("updated_at", model.value.updated_at);

  formData.append("_method", "PUT");

  // image should be deleted
  if (imageDeleted.value) {
    formData.append("image", "");
  } else if (croppedImageBlob.value != null) {
    // cropped image
    formData.append("image", croppedImageBlob.value, "image.png");
  }

  formErrors.clear();
  api
    .call("users/" + model.value.id, {
      method: "POST",
      data: formData,
    })
    .then(async (response) => {
      // if the updated user is the current user, then renew also the currentUser by calling getCurrentUser of the store
      if (
        authStore.currentUser &&
        model.value.id === authStore.currentUser.id
      ) {
        await authStore.getCurrentUser();
      }

      emit("updateUser", response.data.data);
      imageDeleted.value = false;
    })
    .catch((error) => {
      if (error.response && error.response.status === HTTP_STATUS_NOT_FOUND) {
        emit("notFoundError", error);
      } else if (
        error.response &&
        error.response.status === HTTP_STATUS_UNPROCESSABLE_ENTITY
      ) {
        // Validation error
        formErrors.set(error.response.data.errors);
        api.validationError(error);
      } else if (
        error.response &&
        error.response.status === HTTP_STATUS_STALE_MODEL
      ) {
        // Stale error
        emit("staleError", error.response.data);
      } else {
        api.error(error);
      }
    })
    .finally(() => {
      isBusy.value = false;
    });
}
</script>

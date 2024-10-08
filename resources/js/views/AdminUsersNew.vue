<template>
  <div>
      <OverlayComponent :show="isBusy">
        <form @submit.prevent="save" class="flex flex-col gap-4">
          <AdminPanel :title="$t('rooms.settings.general.title')">
            <div class="field grid grid-cols-12 gap-4">
              <label for="firstname" class="col-span-12 md:col-span-4 md:mb-0">{{$t('app.firstname')}}</label>
              <div class="col-span-12 md:col-span-8">
                <InputText
                  id="firstname"
                  class="w-full"
                  v-model="model.firstname"
                  required
                  type="text"
                  :invalid="formErrors.fieldInvalid('firstname')"
                  :disabled="isBusy"
                />
                <FormError :errors="formErrors.fieldError('firstname')"/>
              </div>
            </div>
            <div class="field grid grid-cols-12 gap-4">
              <label for="lastname" class="col-span-12 md:col-span-4 md:mb-0">{{$t('app.lastname')}}</label>
              <div class="col-span-12 md:col-span-8">
                <InputText
                  id="lastname"
                  class="w-full"
                  v-model="model.lastname"
                  type="text"
                  required
                  :invalid="formErrors.fieldInvalid('lastname')"
                  :disabled="isBusy"
                />
                <FormError :errors="formErrors.fieldError('lastname')"/>
              </div>
            </div>
            <div class="field grid grid-cols-12 gap-4">
              <label for="email" class="col-span-12 md:col-span-4 md:mb-0">{{$t('app.email')}}</label>
              <div class="col-span-12 md:col-span-8">
                <InputText
                  id="email"
                  autocomplete="off"
                  class="w-full"
                  v-model="model.email"
                  type="email"
                  required
                  :invalid="formErrors.fieldInvalid('email')"
                  :disabled="isBusy"
                />
                <FormError :errors="formErrors.fieldError('email')"/>
              </div>
            </div>
            <div class="field grid grid-cols-12 gap-4">
              <label for="user_locale" class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.users.user_locale')}}</label>
              <div class="col-span-12 md:col-span-8">
                <LocaleSelect
                  class="w-full"
                  id="user_locale"
                  v-model="model.user_locale"
                  required
                  :invalid="formErrors.fieldInvalid('user_locale')"
                  :disabled="isBusy"
                />
                <FormError :errors="formErrors.fieldError('user_locale')"/>
              </div>
            </div>
            <div class="field grid grid-cols-12 gap-4">
              <label for="timezone" class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.users.timezone')}}</label>
              <div class="col-span-12 md:col-span-8">
                <TimezoneSelect
                  id="timezone"
                  v-model="model.timezone"
                  required
                  :invalid="formErrors.fieldInvalid('timezone')"
                  :disabled="isBusy"
                  :placeholder="$t('admin.users.timezone')"
                  @loading-error="(value) => timezonesLoadingError = value"
                  @busy="(value) => timezonesLoading = value"
                />
                <FormError :errors="formErrors.fieldError('timezone')"/>
              </div>
            </div>
            <div class="field grid grid-cols-12 gap-4">
              <label for="roles" class="col-span-12 md:col-span-4 md:mb-0">{{$t('app.roles')}}</label>
              <div class="col-span-12 md:col-span-8">
                <RoleSelect
                  id="roles"
                  v-model="model.roles"
                  :invalid="formErrors.fieldInvalid('roles', true)"
                  :disabled="isBusy"
                  @loading-error="(value) => rolesLoadingError = value"
                  @busy="(value) => rolesLoading = value"
                />
                <FormError :errors="formErrors.fieldError('roles', true)"/>
              </div>
            </div>
          </AdminPanel>
          <AdminPanel :title="$t('auth.password')">
            <div class="field grid grid-cols-12 gap-4">
              <label for="generate_password" class="col-span-12 md:col-span-4 md:mb-0 items-start">{{$t('admin.users.generate_password')}}</label>
              <div class="col-span-12 md:col-span-8">
                <div>
                  <ToggleSwitch
                    input-id="generate_password"
                    v-model="generatePassword"
                    :invalid="formErrors.fieldInvalid('generate_password')"
                    :disabled="isBusy"
                    aria-describedby="generate_password-help"
                  />
                </div>
                <FormError :errors="formErrors.fieldError('generate_password')"/>
                <small id="generate_password-help">{{$t('admin.users.generate_password_description')}}</small>
              </div>
            </div>
            <div class="field grid grid-cols-12 gap-4" v-if="!generatePassword">
              <label for="new_password" class="col-span-12 md:col-span-4 md:mb-0">{{$t('auth.new_password')}}</label>
              <div class="col-span-12 md:col-span-8">
                <Password
                  fluid
                  id="new_password"
                  :inputProps="{ autocomplete: 'off' }"
                  v-model="model.new_password"
                  required
                  :feedback="false"
                  :toggleMask="true"
                  :invalid="formErrors.fieldInvalid('new_password')"
                  :disabled="isBusy"
                />
                <FormError :errors="formErrors.fieldError('new_password')"/>
              </div>
            </div>

            <div class="field grid grid-cols-12 gap-4" v-if="!generatePassword">
              <label for="new_password_confirmation" class="col-span-12 md:col-span-4 md:mb-0">{{$t('auth.new_password_confirmation')}}</label>
              <div class="col-span-12 md:col-span-8">
                <Password
                  id="new_password_confirmation"
                  fluid
                  v-model="model.new_password_confirmation"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  :feedback="false"
                  :invalid="formErrors.fieldInvalid('new_password_confirmation')"
                  :disabled="isBusy"
                />
                <FormError :errors="formErrors.fieldError('new_password_confirmation')"/>
              </div>
            </div>
          </AdminPanel>
            <Divider/>
            <div class="flex justify-end">
              <Button
                :disabled="isBusy || rolesLoadingError || timezonesLoadingError || rolesLoading || timezonesLoading"
                type="submit"
                icon="fa-solid fa-save"
                :label="$t('app.save')"
              />
            </div>
        </form>
      </OverlayComponent>
  </div>
</template>
<script setup>
import env from '../env.js';
import 'cropperjs/dist/cropper.css';
import { useApi } from '../composables/useApi.js';
import { useFormErrors } from '../composables/useFormErrors.js';
import { useSettingsStore } from '../stores/settings';
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

const formErrors = useFormErrors();
const api = useApi();
const settingsStore = useSettingsStore();
const router = useRouter();

const isBusy = ref(false);
const showPassword = ref(false);
const model = reactive({
  firstname: null,
  lastname: null,
  email: null,
  new_password: null,
  new_password_confirmation: null,
  user_locale: null,
  timezone: null,
  roles: []
});
const generatePassword = ref(false);
const rolesLoading = ref(false);
const rolesLoadingError = ref(false);
const timezonesLoading = ref(false);
const timezonesLoadingError = ref(false);

/**
 * Loads the user, part of roles that can be selected and enables an event listener
 * to enable or disable the edition of roles and attributes when the permissions
 * of the current user gets changed.
 */
onMounted(() => {
  model.user_locale = settingsStore.getSetting('general.default_locale');
  model.timezone = settingsStore.getSetting('general.default_timezone');
});

/**
 * Create new user by making a POST request to the API.
 *
 */
function save () {
  isBusy.value = true;
  formErrors.clear();

  const data = {
    firstname: model.firstname,
    lastname: model.lastname,
    username: model.username,
    email: model.email,
    user_locale: model.user_locale,
    timezone: model.timezone,
    roles: model.roles.map(role => role.id),
    generate_password: generatePassword.value
  };

  if (!generatePassword.value) {
    data.new_password = model.new_password;
    data.new_password_confirmation = model.new_password_confirmation;
  }

  api.call('users', {
    method: 'POST',
    data
  }).then(response => {
    router.push({ name: 'admin.users.view', params: { id: response.data.data.id } });
  }).catch(error => {
    if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
      formErrors.set(error.response.data.errors);
    } else {
      api.error(error);
    }
  }).finally(() => {
    isBusy.value = false;
  });
}
</script>

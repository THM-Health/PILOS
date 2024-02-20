<template>
  <div>
    <h2>
      {{ $t('settings.users.new') }}
    </h2>
    <Divider/>
      <OverlayComponent :show="isBusy">
        <form @submit.prevent="save">
<!--          Todo check if needed-->
          <div class="container container-fluid">
          <div>
            <h3>{{ $t('rooms.settings.general.title') }}</h3>
            <div class="field grid">
              <label for="firstname" class="col-12 md:col-4 md:mb-0">{{$t('app.firstname')}}</label>
              <div class="col-12 md:col-8">
                <InputText
                  id="firstname"
                  class="w-full"
                  v-model="model.firstname"
                  required
                  type="text"
                  :invalid="formErrors.fieldInvalid('firstname')"
                  :disabled="isBusy"
                />
                <p class="p-error" v-html="formErrors.fieldError('firstname')"></p>
              </div>
            </div>
            <div class="field grid">
              <label for="lastname" class="col-12 md:col-4 md:mb-0">{{$t('app.lastname')}}</label>
              <div class="col-12 md:col-8">
                <InputText
                  id="lastname"
                  class="w-full"
                  v-model="model.lastname"
                  type="text"
                  required
                  :invalid="formErrors.fieldInvalid('lastname')"
                  :disabled="isBusy"
                />
                <p class="p-error" v-html="formErrors.fieldError('lastname')"></p>
              </div>
            </div>
            <div class="field grid">
              <label for="email" class="col-12 md:col-4 md:mb-0">{{$t('app.email')}}</label>
              <div class="col-12 md:col-8">
                <InputText
                  id="email"
                  class="w-full"
                  v-model="model.email"
                  type="email"
                  required
                  :invalid="formErrors.fieldInvalid('email')"
                  :disabled="isBusy"
                />
                <p class="p-error" v-html="formErrors.fieldError('email')"></p>
              </div>
            </div>
            <div class="field grid">
              <label for="user_locale" class="col-12 md:col-4 md:mb-0">{{$t('settings.users.user_locale')}}</label>
              <div class="col-12 md:col-8">
                <locale-select
                  class="w-full"
                  id="user_locale"
                  v-model="model.user_locale"
                  required
                  :invalid="formErrors.fieldInvalid('user_locale')"
                  :disabled="isBusy"
                />
                <p class="p-error" v-html="formErrors.fieldError('user_locale')"></p>
              </div>
            </div>

            <div class="field grid">
              <label for="timezone" class="col-12 md:col-4 md:mb-0">{{$t('settings.users.timezone')}}</label>
              <div class="col-12 md:col-8">
                <timezone-select
                  id="timezone"
                  v-model="model.timezone"
                  required
                  :invalid="formErrors.fieldInvalid('timezone')"
                  :disabled="isBusy"
                  :placeholder="$t('settings.users.timezone')"
                  @loading-error="(value) => timezonesLoadingError = value"
                  @busy="(value) => timezonesLoading = value"
                />
                <p class="p-error" v-html="formErrors.fieldError('timezone')"></p>
              </div>
            </div>
            <div class="field grid">
              <label for="roles" class="col-12 md:col-4 md:mb-0">{{$t('app.roles')}}</label>
              <div class="col-12 md:col-8">
                <role-select
                  id="roles"
                  v-model="model.roles"
                  :invalid="formErrors.fieldInvalid('roles', true)===false"
                  :disabled="isBusy"
                  @loading-error="(value) => rolesLoadingError = value"
                  @busy="(value) => rolesLoading = value"
                />
                <p class="p-error" v-html="formErrors.fieldError('roles', true)"></p>
              </div>
            </div>
            <Divider/>
          </div>
          <div>
          <h3>{{$t('auth.password')}}</h3>
            <div class="field grid">
              <label for="generate_password" class="col-12 md:col-4 md:mb-0 align-items-start">{{$t('settings.users.generate_password')}}</label>
              <div class="col-12 md:col-8">
                <div>
                  <InputSwitch
                    id="generate_password"
                    v-model="generatePassword"
                    :invalid="formErrors.fieldInvalid('generate_password')"
                    :disabled="isBusy"
                    aria-describedby="generate_password-help"
                  />
                </div>
                <p class="p-error" v-html="formErrors.fieldError('generate_password')"></p>
                <small id="generate_password-help">{{$t('settings.users.generate_password_description')}}</small>
              </div>
            </div>
            <div class="field grid" v-if="!generatePassword">
              <label for="new_password" class="col-12 md:col-4 md:mb-0">{{$t('auth.new_password')}}</label>
              <div class="col-12 md:col-8">
                <Password
                  class="w-full"
                  id="new_password"
                    v-model="model.new_password"
                    required
                    :feedback="false"
                    :toggleMask="true"
                    :invalid="formErrors.fieldInvalid('new_password')"
                    :disabled="isBusy"
                />
                <p class="p-error" v-html="formErrors.fieldError('new_password')"></p>
              </div>
            </div>

            <div class="field grid" v-if="!generatePassword">
              <label for="new_password_confirmation" class="col-12 md:col-4 md:mb-0">{{$t('auth.new_password_confirmation')}}</label>
              <div class="col-12 md:col-8">
                <Password
                  id="new_password_confirmation"
                  class="w-full"
                  v-model="model.new_password_confirmation"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  :feedback="false"
                  :invalid="formErrors.fieldInvalid('new_password_confirmation')"
                  :disabled="isBusy"
                />
                <p class="p-error" v-html="formErrors.fieldError('new_password_confirmation')"></p>
              </div>
            </div>
          </div>

            <Divider/>
            <div class="flex justify-content-end">
              <Button
                :disabled="isBusy"
                severity="secondary"
                @click="$router.push({ name: 'settings.users' })"
                icon="fa-solid fa-arrow-left"
                :label="$t('app.back')"
              >
              </Button>
              <Button
                :disabled="isBusy || rolesLoadingError || timezonesLoadingError || rolesLoading || timezonesLoading"
                severity="success"
                type="submit"
                class="ml-1"
                icon="fa-solid fa-save"
                :label="$t('app.save')"
              />
            </div>
          </div>
        </form>
      </OverlayComponent>
  </div>
</template>
<script setup>
import env from '@/env.js';
import 'cropperjs/dist/cropper.css';
import { useApi } from '@/composables/useApi.js';
import { useFormErrors } from '@/composables/useFormErrors.js';
import { useSettingsStore } from '@/stores/settings';
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
  model.user_locale = settingsStore.getSetting('default_locale');
  model.timezone = settingsStore.getSetting('default_timezone');
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
    router.push({ name: 'settings.users.view', params: { id: response.data.data.id } });
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

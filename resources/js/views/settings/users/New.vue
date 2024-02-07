<template>
  <div>
    <h2>
      {{ $t('settings.users.new') }}
    </h2>
    <hr>
    <!--ToDo Overlay-->
    <b-overlay :show="isBusy">
      <template #overlay>
        <div class="text-center">
          <b-spinner />
        </div>
      </template>

        <form @submit="save">
<!--          <b-form-group-->
<!--            label-cols-lg="12"-->
<!--            :label="$t('settings.users.base_data')"-->
<!--            label-size="lg"-->
<!--            label-class="font-weight-bold pt-0"-->
<!--            class="mb-0"-->
<!--          >-->
          <div>
            <p class="text-lg font-semibold">{{ $t('rooms.settings.general.title') }}</p>
            <div class="field grid">
              <label for="firstname" class="col-12 md:col-4 md:mb-0">{{$t('app.firstname')}}</label>
              <div class="col-12 md:col-8">
                <InputText
                  id="firstname"
                  class="w-full"
                  v-model="model.firstname"
                  required
                  type="text"
                  :class="{'p-invalid': formErrors.fieldInvalid('firstname')}"
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
                  :class="{'p-invalid': formErrors.fieldInvalid('lastname')}"
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
                  :class="{'p-invalid': formErrors.fieldInvalid('email')}"
                  :disabled="isBusy"
                />
                <p class="p-error" v-html="formErrors.fieldError('email')"></p>
              </div>
            </div>
            <div class="field grid">
              <label for="user_locale" class="col-12 md:col-4 md:mb-0">{{$t('settings.users.user_locale')}}</label>
              <div class="col-12 md:col-8">
<!--                ToDo fix (default)-->
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
<!--                ToDo fix (default)-->
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
<!--            ToDo fix (default)-->
                <role-select
                  id="roles"
                  v-model="model.roles"
                  :invalid="formErrors.fieldInvalid('allow_listing', true)===false"
                  :disabled="isBusy"
                  @loading-error="(value) => rolesLoadingError = value"
                  @busy="(value) => rolesLoading = value"
                />
                <p class="p-error" v-html="formErrors.fieldError('allow_listing', true)"></p>
              </div>
            </div>

<!--          </b-form-group>-->
          <Divider/>
          </div>
<!--          <b-form-group-->
<!--            label-cols-lg="12"-->
<!--            :label="$t('auth.password')"-->
<!--            label-size="lg"-->
<!--            label-class="font-weight-bold pt-0"-->
<!--            class="mb-0"-->
<!--          >-->
          <div>
          <p class="text-lg font-semibold">{{$t('auth.password')}}</p>
            <div class="field grid">
              <label for="generate_password" class="col-12 md:col-4 md:mb-0 align-items-start">{{$t('settings.users.generate_password')}}</label>
              <div class="col-12 md:col-8">
                <div>
                  <InputSwitch
                    id="generate_password"
                    v-model="generate_password"
                    :class="{'p-invalid': formErrors.fieldInvalid('generate_password')}"
                    :disabled="isBusy"
                    aria-describedby="generate_password-help"
                  />
                </div>
                <p class="p-error" v-html="formErrors.fieldError('generate_password')"></p>
                <small id="generate_password-help">{{$t('settings.users.generate_password_description')}}</small>
              </div>
            </div>
            <div class="field grid" v-if="!generate_password">
              <label for="new_password" class="col-12 md:col-4 md:mb-0">{{$t('auth.new_password')}}</label>
              <div class="col-12 md:col-8">
                <InputGroup>
                  <InputText
                    id="new_password"
                    v-model="model.new_password"
                    :type="showPassword ? 'text' : 'password'"
                    required
                    :class="{'p-invalid': formErrors.fieldInvalid('new_password')}"
                    :disabled="isBusy"
                  />
                    <Button
                      v-tooltip="!showPassword ? $t('settings.users.show_password') : $t('settings.users.hide_password')"
                      :disabled="isBusy"
                      severity="secondary"
                      @click="showPassword = !showPassword"
                    >
                      <i
                        v-if="!showPassword"
                        class="fa-solid fa-eye"
                      /><i
                      v-else
                      class="fa-solid fa-eye-slash"
                    />
                    </Button>
                </InputGroup>
                <p class="p-error" v-html="formErrors.fieldError('new_password')"></p>
              </div>
            </div>

            <div class="field grid" v-if="!generate_password">
              <label for="new_password_confirmation" class="col-12 md:col-4 md:mb-0">{{$t('auth.new_password_confirmation')}}</label>
              <div class="col-12 md:col-8">
                <InputText
                  id="new_password_confirmation"
                  class="w-full"
                  v-model="model.new_password_confirmation"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  :class="{'p-invalid': formErrors.fieldInvalid('new_password_confirmation')}"
                  :disabled="isBusy"
                />
                <p class="p-error" v-html="formErrors.fieldError('new_password_confirmation')"></p>
              </div>
            </div>
          </div>

<!--          </b-form-group>-->
          <hr>
          <div class="grid my-1" >
            <div class="col flex justify-content-end">
              <Button
                :disabled="isBusy || rolesLoadingError || timezonesLoadingError || rolesLoading || timezonesLoading"
                severity="success"
                type="submit"
                icon="fa-solid fa-save"
                :label="$t('app.save')"
              />
            </div>
          </div>
        </form>
    </b-overlay>
  </div>
</template>
<script setup>
import env from '@/env.js';
import 'cropperjs/dist/cropper.css';
import { useApi } from '@/composables/useApi.js';
import { useFormErrors } from '@/composables/useFormErrors.js';
import { useSettingsStore } from '@/stores/settings';
import {onMounted, reactive, ref} from "vue";
import {useRouter} from "vue-router";

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
const generate_password = ref(false);
const rolesLoading = ref(false);
const rolesLoadingError = ref(false);
const timezonesLoading = ref(false);
const timezonesLoadingError = ref(false);

/**
 * Loads the user, part of roles that can be selected and enables an event listener
 * to enable or disable the edition of roles and attributes when the permissions
 * of the current user gets changed.
 */
onMounted(()=>{
  //ToDo fix default locale and timezone (works with strings)
  model.user_locale = settingsStore.getSettings('default_locale');
  model.timezone = settingsStore.getSettings('default_timezone');
});

/**
 * Create new user by making a POST request to the API.
 *
 */
function save (evt) {
  if (evt) {
    evt.preventDefault();
  }

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
    generate_password: generate_password.value
  };

  if (!generate_password.value) {
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

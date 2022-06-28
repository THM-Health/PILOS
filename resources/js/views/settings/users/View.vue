<template>
  <component
    v-bind:is="config.type === 'profile' ? 'b-container' : 'div'"
    v-bind:class="{ 'mt-3': config.type === 'profile', 'mb-5': config.type === 'profile' }"
  >
    <component
      v-bind:is="config.type === 'profile' ? 'b-card' : 'div'"
      v-bind:class="{ 'p-3': config.type === 'profile', border: config.type === 'profile', 'bg-white': config.type === 'profile' }">
      <h3>
        {{ config.id === 'new' ? $t('settings.users.new') : (
          config.type === 'profile' ? $t('app.profile') :
            $t(`settings.users.${config.type}`, { firstname: model.firstname, lastname: model.lastname })
        ) }}
      </h3>
      <hr>

      <b-overlay :show="isBusy || modelLoadingError">
        <template #overlay>
          <div class="text-center">
            <b-spinner v-if="isBusy" ></b-spinner>
            <b-button
              v-else
              @click="loadUserModel()"
            >
              <i class="fa-solid fa-sync"></i> {{ $t('app.reload') }}
            </b-button>
          </div>
        </template>

        <b-form @submit='saveUser' :aria-hidden="modelLoadingError">
          <b-container :fluid='true'>
            <b-form-group
              label-cols-lg="12"
              :label="$t('settings.users.base_data')"
              label-size="lg"
              label-class="font-weight-bold pt-0"
              class="mb-0"
            >
              <b-form-group
                label-cols-sm='3'
                :label="$t('settings.users.firstname')"
                label-for='firstname'
                :state='fieldState("firstname")'
              >
                <b-form-input
                  id='firstname'
                  type='text'
                  v-model='model.firstname'
                  :state='fieldState("firstname")'
                  :disabled="isBusy || modelLoadingError || config.type === 'view' || !canUpdateAttributes"
                ></b-form-input>
                <template slot='invalid-feedback'><div v-html="fieldError('firstname')"></div></template>
              </b-form-group>
              <b-form-group
                label-cols-sm='3'
                :label="$t('settings.users.lastname')"
                label-for='lastname'
                :state='fieldState("lastname")'
              >
                <b-form-input
                  id='lastname'
                  type='text'
                  v-model='model.lastname'
                  :state='fieldState("lastname")'
                  :disabled="isBusy || modelLoadingError || config.type === 'view' || !canUpdateAttributes"
                ></b-form-input>
                <template slot='invalid-feedback'><div v-html="fieldError('lastname')"></div></template>
              </b-form-group>
              <b-form-group
                label-cols-sm='3'
                :label="$t('auth.ldap.username')"
                label-for='username'
                :state='fieldState("username")'
                v-if="model.authenticator === 'ldap'"
              >
                <b-form-input
                  id='username'
                  type='text'
                  v-model='model.username'
                  :state='fieldState("username")'
                  :disabled="true"
                ></b-form-input>
                <template slot='invalid-feedback'><div v-html="fieldError('username')"></div></template>
              </b-form-group>
              <b-form-group
                label-cols-sm='3'
                :label="$t('settings.users.email')"
                label-for='email'
                :state='fieldState("email")'
              >
                <b-form-input
                  id='email'
                  type='email'
                  v-model='model.email'
                  :state='fieldState("email")'
                  :disabled="isBusy || modelLoadingError || config.type === 'view' || !canUpdateAttributes"
                ></b-form-input>
                <template slot='invalid-feedback'><div v-html="fieldError('email')"></div></template>
              </b-form-group>

              <!-- Profile image-->
              <b-form-group
                label-cols-sm='3'
                label-for="profile-image"
                :state='fieldState("image")'
                :label="$t('settings.users.image.title')"
              >
                <b-row>
                  <b-col sm="12" lg="9" v-if="config.type !== 'view'">
                    <input ref="ProfileImage" id="profile-image" type="file" style="display: none;" accept="image/png, image/jpeg"  @change="onFileSelect" />

                    <b-button class="my-1 my-lg-0" variant='dark' :disabled="isBusy || modelLoadingError" @click="resetFileUpload(); $refs.ProfileImage.click()"  v-if="!image_deleted"><i class="fa-solid fa-upload"></i> {{ $t('settings.users.image.upload')}}</b-button>
                    <b-button class="my-1 my-lg-0" variant='danger' v-if="croppedImage" @click="resetFileUpload"><i class="fa-solid fa-times"></i> {{ $t('settings.users.image.cancel') }}</b-button>
                    <b-button class="my-1 my-lg-0" v-if="!image_deleted && !croppedImage && model.image" :disabled="isBusy || modelLoadingError" @click="image_deleted = true" variant="danger"><i class="fa-solid fa-trash"></i> {{ $t('settings.users.image.delete') }}</b-button>
                    <b-button class="my-1 my-lg-0" v-if="image_deleted" @click="image_deleted = false" variant="secondary"><i class="fa-solid fa-undo"></i> {{ $t('settings.users.image.undo_delete') }}</b-button>

                  </b-col>

                  <b-col sm="12" lg="3" class="text-left text-lg-right">
                    <b-img
                      v-if="(croppedImage!==null || model.image!==null) && !image_deleted"
                      :src="croppedImage ? croppedImage : model.image"
                      :alt="$t('settings.users.image.title')"
                      width="80"
                      height="80"
                    >
                    </b-img>
                    <b-img
                      v-else
                      src="/images/default_profile.png"
                      :alt="$t('settings.users.image.title')"
                      width="80"
                      height="80"
                    >
                    </b-img>
                  </b-col>
                </b-row>

                <template slot='invalid-feedback'>
                  <div v-html="fieldError('image')"></div>
                </template>

                <b-modal
                  :static='modalStatic'
                  id="modal-image-upload"
                  ref="modal-image-upload"
                  :busy="imageToBlobLoading"
                  :hide-header-close="true"
                  :no-close-on-backdrop="true"
                  :no-close-on-esc="true"
                  :title="$t('settings.users.image.crop')"
                  @ok="saveImage"
                  ok-variant="success"
                  :ok-title="$t('settings.users.image.save')"
                  cancel-variant="dark"
                  :cancel-title="$t('settings.users.image.cancel')"
                >
                  <VueCropper v-show="selectedFile" :autoCropArea="1" :aspectRatio="1" :viewMode="1" ref="cropper" :src="selectedFile" :alt="$t('settings.users.image.title')"></VueCropper>
                </b-modal>
              </b-form-group>
              <b-form-group
                label-cols-sm='3'
                :label="$t('settings.users.user_locale')"
                label-for='user_locale'
                :state='fieldState("user_locale")'
              >
                <b-form-select
                  :options='locales'
                  id='user_locale'
                  v-model='model.user_locale'
                  :state='fieldState("user_locale")'
                  :disabled="isBusy || modelLoadingError || config.type === 'view'"
                >
                  <template v-slot:first>
                    <b-form-select-option :value="null" disabled>{{ $t('settings.users.select_locale') }}</b-form-select-option>
                  </template>
                </b-form-select>
                <template slot='invalid-feedback'><div v-html="fieldError('user_locale')"></div></template>
              </b-form-group>
              <b-form-group
                label-cols-sm='3'
                :label="$t('settings.users.timezone')"
                label-for='timezone'
                :state='fieldState("timezone")'
              >
                <b-input-group>
                  <b-form-select
                    :options="timezones"
                    id='timezone'
                    v-model='model.timezone'
                    :state='fieldState("timezone")'
                    :disabled="isBusy || timezonesLoading || timezonesLoadingError || modelLoadingError || config.type === 'view'"
                  >
                    <template v-slot:first>
                      <b-form-select-option :value="null" disabled>{{ $t('settings.users.timezone') }}</b-form-select-option>
                    </template>
                  </b-form-select>
                  <template slot='invalid-feedback'><div v-html="fieldError('timezone')"></div></template>

                  <b-input-group-append>
                    <b-button
                      v-if="timezonesLoadingError"
                      @click="loadTimezones()"
                      variant="outline-secondary"
                    ><i class="fa-solid fa-sync"></i></b-button>
                  </b-input-group-append>
                </b-input-group>
              </b-form-group>
              <b-form-group
                label-cols-sm='3'
                :label="$t('settings.users.roles')"
                label-for='roles'
                :state='fieldState("roles", true)'
              >
                <b-input-group>
                  <multiselect
                    :placeholder="$t('settings.users.select_roles')"
                    ref="roles-multiselect"
                    v-model='model.roles'
                    track-by='id'
                    open-direction='bottom'
                    :multiple='true'
                    :searchable='false'
                    :internal-search='false'
                    :clear-on-select='false'
                    :close-on-select='false'
                    :show-no-results='false'
                    :showLabels='false'
                    :options='roles'
                    :disabled="isBusy || modelLoadingError || rolesLoadingError || config.type === 'view' || !canEditRoles"
                    id='roles'
                    :loading='rolesLoading'
                    :allowEmpty='false'
                    :class="{ 'is-invalid': fieldState('roles', true), 'multiselect-form-control': true }">
                    <template slot='noOptions'>{{ $t('settings.roles.nodata') }}</template>
                    <template slot='option' slot-scope="props">{{ $te(`app.roles.${props.option.name}`) ? $t(`app.roles.${props.option.name}`) : props.option.name }}</template>
                    <template slot='tag' slot-scope='{ option, remove }'>
                      <h5 class='d-inline mr-1 mb-1'>
                        <b-badge variant='primary'>
                          {{ $te(`app.roles.${option.name}`) ? $t(`app.roles.${option.name}`) : option.name }}
                          <span @click='remove(option)'><i class="fa-solid fa-xmark" :aria-label="$t('settings.users.removeRole')"></i></span>
                        </b-badge>
                      </h5>
                    </template>
                    <template slot='afterList'>
                      <b-button
                        :disabled='rolesLoading || currentPage === 1'
                        variant='outline-secondary'
                        @click='loadRoles(Math.max(1, currentPage - 1))'>
                        <i class='fa-solid fa-arrow-left'></i> {{ $t('app.previousPage') }}
                      </b-button>
                      <b-button
                        :disabled='rolesLoading || !hasNextPage'
                        variant='outline-secondary'
                        @click='loadRoles(currentPage + 1)'>
                        <i class='fa-solid fa-arrow-right'></i> {{ $t('app.nextPage') }}
                      </b-button>
                    </template>
                  </multiselect>
                  <b-input-group-append>
                    <b-button
                      ref="reloadRolesButton"
                      v-if="rolesLoadingError"
                      @click="loadRoles(currentPage)"
                      variant="outline-secondary"
                    ><i class="fa-solid fa-sync"></i></b-button>
                  </b-input-group-append>
                </b-input-group>
                <template slot='invalid-feedback'><div v-html="fieldError('roles', true)"></div></template>
              </b-form-group>
            </b-form-group>
            <hr>
            <b-form-group
              label-cols-lg="12"
              :label="$t('settings.users.password')"
              label-size="lg"
              label-class="font-weight-bold pt-0"
              class="mb-0"
              v-if="model.authenticator === 'users' && config.type !== 'view'"
            >
              <b-form-group
                v-if="config.id === 'new'"
                label-cols-sm='3'
                :label="$t('settings.users.generate_password')"
                label-for='generate_password'
                :state="fieldState('generate_password')"
                :description="$t('settings.users.generate_password_description')"
                class="align-items-center d-flex"
              >
                <b-form-checkbox
                  id='generate_password'
                  v-model='generate_password'
                  :state="fieldState('generate_password')"
                  :disabled="isBusy || modelLoadingError"
                  switch
                ></b-form-checkbox>
                <template slot='invalid-feedback'><div v-html="fieldError('generate_password')"></div></template>
              </b-form-group>
              <b-form-group
                v-if="!generate_password"
                label-cols-sm='3'
                :label="$t('settings.users.password')"
                label-for='password'
                :state='fieldState("password")'
              >
                <b-form-input
                  id='password'
                  type='password'
                  v-model='model.password'
                  :state='fieldState("password")'
                  :disabled="isBusy || modelLoadingError"
                ></b-form-input>
                <template slot='invalid-feedback'><div v-html="fieldError('password')"></div></template>
              </b-form-group>
              <b-form-group
                v-if="!generate_password"
                label-cols-sm='3'
                :label="$t('settings.users.password_confirmation')"
                label-for='password_confirmation'
                :state='fieldState("password_confirmation")'
              >
                <b-form-input
                  id='password_confirmation'
                  type='password'
                  v-model='model.password_confirmation'
                  :state='fieldState("password_confirmation")'
                  :disabled="isBusy || modelLoadingError"
                ></b-form-input>
                <template slot='invalid-feedback'><div v-html="fieldError('password_confirmation')"></div></template>
              </b-form-group>
            </b-form-group>
            <hr v-if="model.authenticator === 'users' && config.type !== 'view'">
            <b-form-group
              label-cols-lg="12"
              :label="$t('settings.users.room_settings')"
              label-size="lg"
              label-class="font-weight-bold pt-0"
              class="mb-0"
            >
              <b-form-group
                label-cols-sm='3'
                :label="$t('settings.users.skip_check_audio')"
                label-for='bbb_skip_check_audio'
                :state="fieldState('bbb_skip_check_audio')"
                class="align-items-center d-flex"
              >
                <b-form-checkbox
                  id='bbb_skip_check_audio'
                  v-model='model.bbb_skip_check_audio'
                  :state="fieldState('bbb_skip_check_audio')"
                  :disabled="isBusy || config.type === 'view' || modelLoadingError"
                  switch
                ></b-form-checkbox>
                <template slot='invalid-feedback'><div v-html="fieldError('bbb_skip_check_audio')"></div></template>
              </b-form-group>
            </b-form-group>
            <hr>
            <b-row class='my-1 float-right'>
              <b-col sm='12'>
                <b-button
                  :disabled='isBusy'
                  variant='secondary'
                  @click="$router.push({ name: 'settings.users' })"
                  v-if="config.type !== 'profile'">
                  <i class='fa-solid fa-arrow-left'></i> {{ $t('app.back') }}
                </b-button>
                <b-button
                  :disabled='isBusy || modelLoadingError || rolesLoadingError || timezonesLoadingError || imageToBlobLoading'
                  variant='success'
                  type='submit'
                  class='ml-1'
                  v-if="config.type !== 'view'">
                  <i class='fa-solid fa-save'></i> {{ $t('app.save') }}
                </b-button>
              </b-col>
            </b-row>
          </b-container>
        </b-form>

        <b-modal
          :static='modalStatic'
          :busy='isBusy'
          ok-variant='danger'
          cancel-variant='dark'
          @ok='forceOverwrite'
          @cancel='refreshUser'
          :hide-header-close='true'
          :no-close-on-backdrop='true'
          :no-close-on-esc='true'
          ref='stale-user-modal'
          :hide-header='true'>
          <template v-slot:default>
            <h5>{{ staleError.message }}</h5>
          </template>
          <template v-slot:modal-ok>
            <b-spinner small v-if="isBusy"></b-spinner>  {{ $t('app.overwrite') }}
          </template>
          <template v-slot:modal-cancel>
            <b-spinner small v-if="isBusy"></b-spinner>  {{ $t('app.reload') }}
          </template>
        </b-modal>
      </b-overlay>
    </component>
  </component>
</template>

<script>
import FieldErrors from '../../../mixins/FieldErrors';
import Base from '../../../api/base';
import LocaleMap from '../../../lang/LocaleMap';
import Multiselect from 'vue-multiselect';
import EventBus from '../../../services/EventBus';
import PermissionService from '../../../services/PermissionService';
import env from '../../../env';
import { loadLanguageAsync } from '../../../i18n';
import VueCropper from 'vue-cropperjs';
import 'cropperjs/dist/cropper.css';

export default {
  mixins: [FieldErrors],
  components: { Multiselect, VueCropper },

  computed: {
    /**
     * The available locales that the user can select from.
     */
    locales () {
      const availableLocales = this.availableLocales;

      return Object.keys(LocaleMap)
        .filter(key => availableLocales.includes(key))
        .map(key => {
          return {
            value: key,
            text: LocaleMap[key]
          };
        });
    }
  },

  props: {
    config: {
      type: Object,
      required: true,
      default: function () {
        return {};
      },
      validator ({ id, type }) {
        if (['string', 'number'].indexOf(typeof id) === -1) {
          return false;
        }
        if (typeof type !== 'string' || ['view', 'edit', 'profile'].indexOf(type) === -1) {
          return false;
        }
        if (type === 'profile' && (!PermissionService.currentUser || PermissionService.currentUser.id !== id)) {
          return false;
        }
        return !(id === 'new' && type !== 'edit');
      }
    },

    modalStatic: {
      type: Boolean,
      default: false
    },

    availableLocales: {
      type: Array,
      default: function () {
        return process.env.MIX_AVAILABLE_LOCALES.split(',');
      }
    }
  },

  data () {
    return {
      isBusy: false,
      model: {
        firstname: null,
        lastname: null,
        username: null,
        email: null,
        password: null,
        password_confirmation: null,
        user_locale: null,
        bbb_skip_check_audio: false,
        timezone: null,
        roles: []
      },
      generate_password: false,
      errors: {},
      rolesLoading: false,
      roles: [],
      currentPage: 1,
      hasNextPage: false,
      modelLoadPromise: Promise.resolve(),
      canEditRoles: false,
      canUpdateAttributes: false,
      staleError: {},
      modelLoadingError: false,
      rolesLoadingError: false,
      timezonesLoading: false,
      timezonesLoadingError: false,
      timezones: [],

      imageToBlobLoading: false,
      croppedImage: null,
      croppedImageBlob: null,
      selectedFile: null,
      image_deleted: false
    };
  },

  /**
   * Removes the event listener to enable or disable the edition of roles
   * and attributes when the permissions of the current user gets changed.
   */
  beforeDestroy () {
    EventBus.$off('currentUserChangedEvent', this.togglePermissionFlags);
  },

  /**
   * Loads the user, part of roles that can be selected and enables an event listener
   * to enable or disable the edition of roles and attributes when the permissions
   * of the current user gets changed.
   */
  mounted () {
    EventBus.$on('currentUserChangedEvent', this.togglePermissionFlags);
    this.loadTimezones();

    if (this.config.id === 'new' || (
      PermissionService.can('editUserRole', {
        id: this.config.id,
        model_name: 'User'
      }) && this.config.type === 'edit')
    ) {
      this.loadRoles();
    }

    if (this.config.id !== 'new') {
      this.loadUserModel();
    } else {
      this.model.authenticator = 'users';
      this.canEditRoles = true;
      this.canUpdateAttributes = true;
      this.model.user_locale = process.env.MIX_DEFAULT_LOCALE;
      this.model.timezone = this.$store.getters['session/settings']('default_timezone');
    }
  },

  methods: {
    /**
     * Reset other previously uploaded images
     */
    resetFileUpload () {
      this.croppedImage = null;
      this.croppedImageBlob = null;
      this.$refs.ProfileImage.value = null;
      this.selectedFile = null;
    },

    /**
     * User cropped image and confirmed to continue
     * Convert image to data url to display and to blob to upload to server
     */
    saveImage (event) {
      event.preventDefault();
      this.imageToBlobLoading = true;
      setTimeout(() => {
        const oc = document.createElement('canvas');
        oc.width = 100;
        oc.height = 100;
        const octx = oc.getContext('2d');
        octx.fillStyle = 'white';
        octx.fillRect(0, 0, oc.width, oc.height);
        octx.drawImage(this.$refs.cropper.getCroppedCanvas(), 0, 0, oc.width, oc.height);

        this.croppedImage = oc.toDataURL('image/jpeg');
        oc.toBlob((blob) => {
          this.croppedImageBlob = blob;
          this.imageToBlobLoading = false;
          this.$bvModal.hide('modal-image-upload');
        }, 'image/jpeg');
      }, 100);
    },

    /**
     * User selected file, open modal and show image in cropper
     */
    onFileSelect (e) {
      const file = e.target.files[0];
      if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
        this.resetFileUpload();
        this.flashMessage.error(this.$t('settings.users.image.invalidMime'));
        return;
      }
      this.$bvModal.show('modal-image-upload');
      const reader = new FileReader();
      reader.onload = (event) => {
        this.selectedFile = event.target.result;
        this.$refs.cropper.replace(this.selectedFile);
      };
      reader.readAsDataURL(file);
    },

    loadUserModel () {
      this.isBusy = true;

      this.modelLoadPromise = Base.call(`users/${this.config.id}`).then(response => {
        this.modelLoadingError = false;
        this.model = response.data.data;
        this.model.roles.forEach(role => {
          role.$isDisabled = role.automatic;
        });
        this.togglePermissionFlags();
      }).catch(error => {
        if (PermissionService.currentUser && this.config.id === PermissionService.currentUser.id && error.response && error.response.status === env.HTTP_NOT_FOUND) {
          this.$store.dispatch('session/logout').then(() => {
            this.$router.push({ name: 'home' });
          });
        } else if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
          this.$router.push({ name: 'settings.users' });
        }

        this.modelLoadingError = true;
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        this.isBusy = false;
      });
    },

    /**
     * Loads the roles for the passed page, that can be selected through the multiselect.
     *
     * @param [page=1] The page to load the roles for.
     */
    loadRoles (page = 1) {
      this.rolesLoading = true;

      const config = {
        params: {
          page
        }
      };

      Base.call('roles', config).then(response => {
        this.rolesLoadingError = false;
        this.roles = response.data.data;
        this.currentPage = page;
        this.hasNextPage = page < response.data.meta.last_page;
        return this.modelLoadPromise;
      }).then(() => {
        this.roles.forEach(role => {
          role.$isDisabled = !!this.model.roles.find(selectedRole => selectedRole.id === role.id && selectedRole.automatic);
        });
      }).catch(error => {
        this.$refs['roles-multiselect'].deactivate();
        this.rolesLoadingError = true;
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        this.rolesLoading = false;
      });
    },

    /**
     * Loads the possible selectable timezones.
     */
    loadTimezones () {
      this.timezonesLoading = true;
      this.timezonesLoadingError = false;

      Base.call('getTimezones').then(response => {
        this.timezones = response.data.timezones;
      }).catch(error => {
        this.timezonesLoadingError = true;
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        this.timezonesLoading = false;
      });
    },

    /**
     * Saves the changes of the user to the database by making a api call.
     *
     * @param evt
     */
    saveUser (evt) {
      if (evt) {
        evt.preventDefault();
      }

      this.isBusy = true;

      const formData = new FormData();

      for (var i = 0; i < this.model.roles.length; i++) {
        const role = this.model.roles[i].id;
        formData.append('roles[' + i + ']', role);
      }

      formData.append('user_locale', this.model.user_locale);
      formData.append('bbb_skip_check_audio', this.model.bbb_skip_check_audio ? 1 : 0);
      formData.append('timezone', this.model.timezone);
      formData.append('firstname', this.model.firstname);
      formData.append('lastname', this.model.lastname);
      formData.append('email', this.model.email);

      formData.append('updated_at', this.model.updated_at);

      if (this.config.id === 'new') {
        formData.append('generate_password', this.generate_password ? 1 : 0);
      }
      if (!this.generate_password && this.model.password != null) {
        formData.append('password', this.model.password);
        formData.append('password_confirmation', this.model.password_confirmation);
      }

      // croppedImage
      if (this.croppedImageBlob != null) {
        formData.append('image', this.croppedImageBlob, 'image.png');
      } else if (this.image_deleted) {
        formData.append('image', '');
      }

      formData.append('_method', this.config.id === 'new' ? 'POST' : 'PUT');

      const config = {
        method: 'POST',
        data: formData
      };

      Base.call(this.config.id === 'new' ? 'users' : `users/${this.config.id}`, config).then(response => {
        this.errors = {};
        const localeChanged = this.$store.state.session.currentLocale !== this.model.user_locale;

        // if the updated user is the current user, then renew also the currentUser by calling getCurrentUser of the store
        if (PermissionService.currentUser && this.config.id === PermissionService.currentUser.id) {
          return this.$store.dispatch('session/getCurrentUser').then(() => {
            if (localeChanged) {
              return loadLanguageAsync(this.model.user_locale).then(() => {
                this.$store.commit('session/setCurrentLocale', this.model.user_locale);
                return response;
              });
            }

            return Promise.resolve(response);
          });
        }

        return Promise.resolve(response);
      }).then(response => {
        // don't change page on save on profile page
        if (this.config.type !== 'profile') {
          this.$router.push({ name: 'settings.users' });
        } else {
          this.model = response.data.data;
          this.roles.forEach(role => {
            role.$isDisabled = !!this.model.roles.find(selectedRole => selectedRole.id === role.id && selectedRole.automatic);
          });
          this.model.roles.forEach(role => {
            role.$isDisabled = role.automatic;
          });

          this.resetFileUpload();
          this.image_deleted = false;
        }
      }).catch(error => {
        // If the user wasn't found and it is the current user log him out!
        if (PermissionService.currentUser && this.config.id === PermissionService.currentUser.id && error.response && error.response.status === env.HTTP_NOT_FOUND) {
          this.$store.dispatch('session/logout').then(() => {
            this.$router.push({ name: 'home' });
          });
          Base.error(error, this.$root, error.message);
        } else if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          this.errors = error.response.data.errors;
        } else if (error.response && error.response.status === env.HTTP_STALE_MODEL) {
          // handle stale errors
          this.staleError = error.response.data;
          this.$refs['stale-user-modal'].show();
        } else {
          if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
            this.$router.push({ name: 'settings.users' });
          }

          Base.error(error, this.$root, error.message);
        }
      }).finally(() => {
        this.isBusy = false;
      });
    },

    /**
     * Enable or disable the edition of roles and attributes depending on the permissions of the current user.
     */
    togglePermissionFlags () {
      if (this.model.id && this.model.model_name) {
        this.canEditRoles = PermissionService.can('editUserRole', this.model);
        this.canUpdateAttributes = PermissionService.can('updateAttributes', this.model);
      }
    },

    /**
     * Force a overwrite of the user in the database by setting the `updated_at` field to the new one.
     */
    forceOverwrite () {
      this.model.updated_at = this.staleError.new_model.updated_at;
      this.staleError = {};
      this.$refs['stale-user-modal'].hide();
      this.saveUser();
    },

    /**
     * Refreshes the current model with the new passed from the stale error response.
     */
    refreshUser () {
      this.model = this.staleError.new_model;
      this.roles.forEach(role => {
        role.$isDisabled = !!this.model.roles.find(selectedRole => selectedRole.id === role.id && selectedRole.automatic);
      });
      this.model.roles.forEach(role => {
        role.$isDisabled = role.automatic;
      });
      this.staleError = {};
      this.$refs['stale-user-modal'].hide();
    }
  }
};

</script>

<style scoped>

</style>

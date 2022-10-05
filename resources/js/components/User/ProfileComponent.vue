<template>
  <div>

      <h4>{{ $t('settings.users.base_data') }}</h4>

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
          :disabled="isBusy || modelLoadingError || !edit || !canUpdateAttributes"
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
          :disabled="isBusy || modelLoadingError || !edit || !canUpdateAttributes"
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
      <!-- Profile image-->
      <b-form-group
        label-cols-sm='3'
        label-for="profile-image"
        :state='fieldState("image")'
        :label="$t('settings.users.image.title')"
      >
        <b-row>
          <b-col sm="12" lg="9" v-if="edit">
            <input ref="ProfileImage" id="profile-image" type="file" style="display: none;" accept="image/png, image/jpeg"  @change="onFileSelect" />

            <b-button class="my-1 my-lg-0" variant='secondary' :disabled="isBusy || modelLoadingError" @click="resetFileUpload(); $refs.ProfileImage.click()"  v-if="!image_deleted"><i class="fa-solid fa-upload"></i> {{ $t('settings.users.image.upload')}}</b-button>
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
          cancel-variant="secondary"
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
          :disabled="isBusy || modelLoadingError || !edit"
        >
          <template v-slot:first>
            <b-form-select-option :value="null" disabled>{{ $t('settings.users.authentication.roles_and_perm.select_locale') }}</b-form-select-option>
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
            :disabled="isBusy || timezonesLoading || timezonesLoadingError || modelLoadingError || !edit"
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

      <b-button
        :disabled='isBusy || modelLoadingError || timezonesLoadingError || imageToBlobLoading'
        variant='success'
        type='submit'
        v-if="edit"
        @click="save"
      >
        <i class='fa-solid fa-save'></i> {{ $t('app.save') }}
      </b-button>
  </div>
</template>

<script>
import FieldErrors from '../../mixins/FieldErrors';
import LocaleMap from '../../lang/LocaleMap';
import PermissionService from '../../services/PermissionService';
import EventBus from '../../services/EventBus';
import Base from '../../api/base';
import env from '../../env';
import { loadLanguageAsync } from '../../i18n';
import VueCropper from 'vue-cropperjs';
import _ from 'lodash';

export default {
  name: 'ProfileComponent',
  components: { VueCropper },
  props: {
    edit: {
      type: Boolean,
      required: true
    },
    user: {
      type: Object,
      required: true
    },
    modalStatic: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    user: {
      handler (user) {
        this.model = _.cloneDeep(user);
      },
      deep: true
    }
  },
  mixins: [FieldErrors],
  computed: {
    /**
     * The available locales that the user can select from.
     */
    locales () {
      const availableLocales = process.env.MIX_AVAILABLE_LOCALES.split(',');

      return Object.keys(LocaleMap)
        .filter(key => availableLocales.includes(key))
        .map(key => {
          return {
            value: key,
            text: LocaleMap[key]
          };
        });
    },

    isOwnUser () {
      return PermissionService.currentUser.id === this.model.id;
    }
  },

  data () {
    return {
      isBusy: false,
      model: {},
      generate_password: false,
      errors: {},
      currentPage: 1,
      hasNextPage: false,
      modelLoadPromise: Promise.resolve(),
      canUpdateAttributes: false,
      staleError: {},
      modelLoadingError: false,
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

    this.model = _.cloneDeep(this.user);

    this.togglePermissionFlags();
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
     */
    save () {
      this.isBusy = true;

      const formData = new FormData();

      formData.append('user_locale', this.model.user_locale);
      formData.append('timezone', this.model.timezone);
      formData.append('firstname', this.model.firstname);
      formData.append('lastname', this.model.lastname);

      formData.append('updated_at', this.model.updated_at);

      formData.append('_method', 'PUT');

      // croppedImage
      if (this.croppedImageBlob != null) {
        formData.append('image', this.croppedImageBlob, 'image.png');
      } else if (this.image_deleted) {
        formData.append('image', '');
      }

      Base.call('users/' + this.model.id, {
        method: 'POST',
        data: formData
      }).then(response => {
        this.errors = {};
        const localeChanged = this.$store.state.session.currentLocale !== this.model.user_locale;

        // if the updated user is the current user, then renew also the currentUser by calling getCurrentUser of the store
        if (PermissionService.currentUser && this.model.id === PermissionService.currentUser.id) {
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
        this.$emit('updateUser', response.data.data);
        this.model = response.data.data;

        this.resetFileUpload();
        this.image_deleted = false;
      }).catch(error => {
        // If the user wasn't found and it is the current user log him out!
        if (PermissionService.currentUser && this.model.id === PermissionService.currentUser.id && error.response && error.response.status === env.HTTP_NOT_FOUND) {
          this.$store.dispatch('session/logout').then(() => {
            this.$router.push({ name: 'home' });
          });
          Base.error(error, this.$root, error.message);
        } else if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          // Validation error
          this.errors = error.response.data.errors;
        } else if (error.response && error.response.status === env.HTTP_STALE_MODEL) {
          // Stale error
          this.$emit('staleError', error.response.data);
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
     * Enable or disable the edition of attributes depending on the permissions of the current user.
     */
    togglePermissionFlags () {
      if (this.model.id && this.model.model_name) {
        this.canUpdateAttributes = PermissionService.can('updateAttributes', this.model);
      }
    },

    /**
     * Refreshes the current model with the new passed from the stale error response.
     */
    refreshUser () {
      this.model = this.staleError.new_model;
      this.$emit('updateUser', this.staleError.new_model);
      this.staleError = {};
      this.$refs['stale-user-modal'].hide();
    }
  }
};
</script>

<style scoped>

</style>

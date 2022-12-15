<template>
  <div>

      <h4>{{ $t('settings.users.base_data') }}</h4>
      <b-form @submit="save">
        <b-form-group
          label-cols-sm='3'
          :label="$t('app.firstname')"
          label-for='firstname'
          :state='fieldState("firstname")'
        >
          <b-form-input
            id='firstname'
            type='text'
            required
            v-model='model.firstname'
            :state='fieldState("firstname")'
            :disabled="isBusy || viewOnly || !canUpdateAttributes"
          ></b-form-input>
          <template slot='invalid-feedback'><div v-html="fieldError('firstname')"></div></template>
        </b-form-group>
        <b-form-group
          label-cols-sm='3'
          :label="$t('app.lastname')"
          label-for='lastname'
          :state='fieldState("lastname")'
        >
          <b-form-input
            id='lastname'
            required
            type='text'
            v-model='model.lastname'
            :state='fieldState("lastname")'
            :disabled="isBusy || viewOnly || !canUpdateAttributes"
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
            <b-col sm="12" lg="9" v-if="!viewOnly">
              <input ref="ProfileImage" id="profile-image" type="file" style="display: none;" accept="image/png, image/jpeg"  @change="onFileSelect" />

              <b-button class="my-1 my-lg-0" variant='secondary' :disabled="isBusy" @click="resetFileUpload(); $refs.ProfileImage.click()"  v-if="!image_deleted"><i class="fa-solid fa-upload"></i> {{ $t('settings.users.image.upload')}}</b-button>
              <b-button class="my-1 my-lg-0" variant='danger' v-if="croppedImage" @click="resetFileUpload"><i class="fa-solid fa-times"></i> {{ $t('app.cancel') }}</b-button>
              <b-button class="my-1 my-lg-0" v-if="!image_deleted && !croppedImage && model.image" :disabled="isBusy" @click="image_deleted = true" variant="danger"><i class="fa-solid fa-trash"></i> {{ $t('settings.users.image.delete') }}</b-button>
              <b-button class="my-1 my-lg-0" v-if="image_deleted" @click="image_deleted = false" variant="secondary"><i class="fa-solid fa-undo"></i> {{ $t('settings.users.image.undo_delete') }}</b-button>

            </b-col>

            <b-col sm="12" lg="3" class="text-left" v-bind:class="{'text-lg-right': !viewOnly}">
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
            :cancel-title="$t('app.cancel')"
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
          <locale-select
            id='user_locale'
            required
            v-model="model.user_locale"
            :state='fieldState("user_locale")'
            :disabled="isBusy || viewOnly"
          ></locale-select>
          <template slot='invalid-feedback'><div v-html="fieldError('user_locale')"></div></template>
        </b-form-group>
        <b-form-group
          label-cols-sm='3'
          :label="$t('settings.users.timezone')"
          label-for='timezone'
          :state='fieldState("timezone")'
        >
          <timezone-select
            id='timezone'
            required
            v-model="model.timezone"
            :state='fieldState("timezone")'
            :disabled="isBusy || viewOnly"
            @loadingError="(value) => this.timezonesLoadingError = value"
            @busy="(value) => this.timezonesLoading = value"
            :placeholder="$t('settings.users.timezone')"
          >
          </timezone-select>
          <template slot='invalid-feedback'><div v-html="fieldError('timezone')"></div></template>
        </b-form-group>

        <b-button
          :disabled='isBusy || timezonesLoading || timezonesLoadingError || imageToBlobLoading'
          variant='success'
          type='submit'
          v-if="!viewOnly"
        >
          <i class='fa-solid fa-save'></i> {{ $t('app.save') }}
        </b-button>
      </b-form>
  </div>
</template>

<script>
import FieldErrors from '../../mixins/FieldErrors';
import PermissionService from '../../services/PermissionService';
import Base from '../../api/base';
import env from '../../env';
import { loadLanguageAsync } from '../../i18n';
import VueCropper from 'vue-cropperjs';
import _ from 'lodash';
import LocaleSelect from '../Inputs/LocaleSelect.vue';
import TimezoneSelect from '../Inputs/TimezoneSelect.vue';
import { useLocaleStore } from '../../stores/locale';
import { useAuthStore } from '../../stores/auth';
import { mapActions, mapState } from 'pinia';

export default {
  name: 'ProfileComponent',
  components: { LocaleSelect, TimezoneSelect, VueCropper },
  props: {
    viewOnly: {
      type: Boolean,
      default: false
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
  data () {
    return {
      isBusy: false,
      model: {},
      errors: {},
      canUpdateAttributes: false,
      timezonesLoading: false,
      timezonesLoadingError: false,

      imageToBlobLoading: false,
      croppedImage: null,
      croppedImageBlob: null,
      selectedFile: null,
      image_deleted: false
    };
  },

  mounted () {
    this.model = _.cloneDeep(this.user);
    this.canUpdateAttributes = PermissionService.can('updateAttributes', this.model);
  },

  computed: {
    ...mapState(useAuthStore, ['currentUser'])
  },

  methods: {

    ...mapActions(useLocaleStore, ['setCurrentLocale']),
    ...mapActions(useAuthStore, ['logout', 'getCurrentUser']),

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
        this.toastError(this.$t('settings.users.image.invalid_mime'));
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
     * Saves the changes of the user to the database by making a api call.
     *
     */
    save (evt) {
      if (evt) {
        evt.preventDefault();
      }

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

      this.errors = {};

      Base.call('users/' + this.model.id, {
        method: 'POST',
        data: formData
      }).then(response => {
        const localeChanged = this.currentLocale !== this.model.user_locale;

        // if the updated user is the current user, then renew also the currentUser by calling getCurrentUser of the store
        if (this.currentUser && this.model.id === this.currentUser.id) {
          return this.getCurrentUser().then(() => {
            if (localeChanged) {
              return loadLanguageAsync(this.model.user_locale).then(() => {
                this.setCurrentLocale(this.model.user_locale);
                return response;
              });
            }
            return Promise.resolve(response);
          });
        }
        return Promise.resolve(response);
      }).then(response => {
        this.$emit('updateUser', response.data.data);
        this.resetFileUpload();
        this.image_deleted = false;
      }).catch(error => {
        if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
          this.$emit('notFoundError', error);
        } else if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          // Validation error
          this.errors = error.response.data.errors;
        } else if (error.response && error.response.status === env.HTTP_STALE_MODEL) {
          // Stale error
          this.$emit('staleError', error.response.data);
        } else {
          Base.error(error, this.$root, error.message);
        }
      }).finally(() => {
        this.isBusy = false;
      });
    }
  }
};
</script>

<style scoped>

</style>

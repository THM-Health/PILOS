<template>
  <div>
    <b-container fluid>
      <h3>
        {{ $t('settings.application.title') }}
        <b-button id="application-save-button"
                  class="float-right"
                  variant="success"
                  @click="updateSettings(settings)"
                  :disabled="isBusy">
          <span><i class="fas fa-save mr-2"></i>{{ $t('app.save') }}</span>
        </b-button>
      </h3>

      <hr>

      <!--Logo Settings-->
      <b-form-group
        label-for="application-logo-input"
        :state='(fieldState("logo") === null && fieldState("logo_file") === null) ? null : false'
      >

        <template v-slot:label>
          <span><i class="fas fa-camera-retro mr-3"></i></span>
          {{ $t('settings.application.logo.title') }}
        </template>

        <b-row  class="my-3">
          <b-col sm="6" lg="3" class="text-center">
            <b-img
              :src="uploadLogoFileSrc ? uploadLogoFileSrc : settings.logo"
              class="my-2"
              rounded="0"
              alt="application-logo-preview"
              width="150"
              height="100"
              fluid
            >
            </b-img>
          </b-col>
          <b-col sm="6" lg="9">
            <b-form-text v-if="!uploadLogoFile">{{ $t('settings.application.logo.urlTitle') }}</b-form-text>
            <b-input-group>
              <b-form-input
                id="application-logo-input"
                v-if="!uploadLogoFile"
                :placeholder="$t('settings.application.logo.hint')"
                v-model="settings.logo"
                :disabled="isBusy"
                class="my-2"
                :state='fieldState("logo")'
              >
              </b-form-input>
            </b-input-group>
            <b-form-text>{{ $t('settings.application.logo.uploadTitle') }}</b-form-text>
            <b-input-group>
              <b-form-file
                :state='fieldState("logo_file")'
                :disabled="isBusy"
                :browse-text="$t('app.browse')"
                :placeholder="$t('settings.application.logo.selectFile')"
                v-model="uploadLogoFile"
                accept="image/jpeg, image/png, image/gif, image/svg+xml"
              >
              </b-form-file>
              <template #append v-if="uploadLogoFile">
                <b-button variant="danger" @click="uploadLogoFile = null">
                  <b-icon-x></b-icon-x>
                </b-button>
              </template>
            </b-input-group>
          </b-col>
        </b-row>

        <template slot='invalid-feedback'>
          <div v-html="fieldError('logo')"></div>
          <div v-html="fieldError('logo_file')"></div>
        </template>
      </b-form-group>

      <!--Room limit settings-->
      <b-form-group
        label-for="application-room-limit-input"
        :description="$t('settings.application.roomLimit.description')"
        :state='fieldState("room_limit")'
      >

        <template v-slot:label>
          <span><i class="fas fa-person-booth mr-3"></i></span>
          {{ $t('settings.application.roomLimit.title') }}
        </template>

        <b-form-input id="application-room-limit-input"
                      v-model="settings.roomLimit"
                      type="number"
                      :disabled="isBusy"
                      :state='fieldState("room_limit")'
        >
        </b-form-input>

        <template slot='invalid-feedback'>
          <div v-html="fieldError('room_limit')"></div>
        </template>
      </b-form-group>

      <!--Pagination page size settings-->
      <b-form-group
        label-for="application-pagination-page-size-input"
        :description="$t('settings.application.paginationPageSize.description')"
        :state='fieldState("pagination_page_size")'
      >

        <template v-slot:label>
          <span><i class="fas fa-clone mr-3"></i></span>
          {{ $t('settings.application.paginationPageSize.title') }}
        </template>

        <b-form-input id="application-pagination-page-size-input"
                      v-model="settings.paginationPageSize"
                      type="number"
                      :disabled="isBusy"
                      :state='fieldState("pagination_page_size")'
        >
        </b-form-input>

        <template slot='invalid-feedback'>
          <div v-html="fieldError('pagination_page_size')"></div>
        </template>
      </b-form-group>

      <!--Own rooms pagination page size settings-->
      <b-form-group
        label-for="application-pagination-own-room-page-size-input"
        :description="$t('settings.application.ownRoomsPaginationPageSize.description')"
        :state='fieldState("own_rooms_pagination_page_size")'
      >

        <template v-slot:label>
          <span><i class="fas fa-window-restore mr-3"></i></span>
          {{ $t('settings.application.ownRoomsPaginationPageSize.title') }}
        </template>

        <b-form-input id="application-pagination-own-room-page-size-input"
                      v-model="settings.ownRoomsPaginationPageSize"
                      type="number"
                      :disabled="isBusy"
                      :state='fieldState("own_rooms_pagination_page_size")'
        >
        </b-form-input>

        <template slot='invalid-feedback'>
          <div v-html="fieldError('own_rooms_pagination_page_size')"></div>
        </template>
      </b-form-group>

    </b-container>
  </div>
</template>

<script>
import Base from '../../api/base';
import FieldErrors from '../../mixins/FieldErrors';
import env from '../../env';

/**
 * base64 encoder
 * @param data
 * @return {Promise<unknown>}
 */
const base64Encode = data =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(data);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

export default {
  mixins: [FieldErrors],

  data () {
    return {
      uploadLogoFile: null,
      uploadLogoFileSrc: null,
      isBusy: false,
      settings: {
        logo: null,
        roomLimit: null,
        paginationPageSize: null,
        ownRoomsPaginationPageSize: null
      },
      errors: {}
    };
  },
  methods: {
    /**
     * Handle get settings data
     */
    getSettings () {
      this.isBusy = true;
      Base.call('settings')
        .then(response => {
          this.settings.logo = response.data.data.logo;
          this.settings.roomLimit = response.data.data.room_limit;
          this.settings.ownRoomsPaginationPageSize = response.data.data.own_rooms_pagination_page_size;
          this.settings.paginationPageSize = response.data.data.pagination_page_size;
        })
        .catch((error) => {
          Base.error(error, this.$root, error.message);
        })
        .finally(() => {
          this.isBusy = false;
        });
    },

    /**
     * Handle update settings data
     *
     * @param settings Settings object to fill the payload
     */
    updateSettings (settings) {
      this.isBusy = true;

      // Build form data
      const formData = new FormData();
      if (this.uploadLogoFile) { formData.append('logo_file', this.uploadLogoFile); } else { formData.append('logo', settings.logo); }
      formData.append('room_limit', settings.roomLimit);
      formData.append('pagination_page_size', settings.paginationPageSize);
      formData.append('own_rooms_pagination_page_size', settings.ownRoomsPaginationPageSize);
      formData.append('_method', 'PUT');

      Base.call('settings',
        {
          method: 'post',
          data: formData,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        .then(response => {
          this.$store.dispatch('session/getSettings');
          this.errors = {};
          this.uploadLogoFile = null;

          // update form input
          this.settings.logo = response.data.data.logo;
          this.settings.roomLimit = response.data.data.room_limit;
          this.settings.ownRoomsPaginationPageSize = response.data.data.own_rooms_pagination_page_size;
          this.settings.paginationPageSize = response.data.data.pagination_page_size;
        })
        .catch((error) => {
          if (error.response) {
            if (error.response.status === env.HTTP_PAYLOAD_TOO_LARGE) {
              this.errors = { logo_file: [this.$t('app.validation.tooLarge')] };
              return;
            }
            if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
              this.errors = error.response.data.errors;
              return;
            }
          }
          Base.error(error, this.$root);
        })
        .finally(() => {
          this.isBusy = false;
        });
    }
  },
  mounted () {
    this.getSettings();
  },
  watch: {
    /**
     * watch for logo file select changes, encode to base64 and display image
     * @param newValue
     * @param oldValue
     */
    uploadLogoFile (newValue, oldValue) {
      if (newValue !== oldValue) {
        if (newValue) {
          base64Encode(newValue)
            .then(value => {
              this.uploadLogoFileSrc = value;
            })
            .catch(() => {
              this.uploadLogoFileSrc = null;
            });
        } else {
          this.uploadLogoFileSrc = null;
        }
      }
    }
  }
};
</script>

<style scoped>

</style>

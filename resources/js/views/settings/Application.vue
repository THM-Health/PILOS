<template>
  <b-container fluid>
      <h3>
        {{ $t('settings.application.title') }}
        <b-button id="application-save-button"
                  class="float-right"
                  variant="success"
                  @click="updateSettings(settings)"
                  v-if="!viewOnly"
                  :disabled="isBusy">
          <span><i class="fas fa-save mr-2"></i>{{ $t('app.save') }}</span>
        </b-button>
      </h3>

      <hr>

    <!--Pagination page size settings-->
    <b-form-group
      label-for="application-name-input"
      :description="$t('settings.application.name.description')"
      :state='fieldState("name")'
    >

      <template v-slot:label>
        {{ $t('settings.application.name.title') }}
      </template>

      <b-form-input id="application-name-input"
                    v-model="settings.name"
                    type="text"
                    :disabled="isBusy || viewOnly"
                    :state='fieldState("name")'
      >
      </b-form-input>

      <template slot='invalid-feedback'>
        <div v-html="fieldError('name')"></div>
      </template>
    </b-form-group>

    <!--Favicon Settings-->
    <b-form-group
      label-for="application-favicon-input"
      :state='(fieldState("favicon") === null && fieldState("favicon_file") === null) ? null : false'
    >

      <template v-slot:label>
        {{ $t('settings.application.favicon.title') }}
      </template>

      <b-row class="my-3" align-v="center">
        <b-col sm="6" lg="3" class="text-center">
          <b-img
            v-if="uploadFaviconFileSrc!==null || settings.favicon!==null"
            :src="uploadFaviconFileSrc ? uploadFaviconFileSrc : settings.favicon"
            class="my-2"
            rounded="0"
            alt="application-favicon-preview"
            width="32"
            height="32"
            fluid
          >
          </b-img>
        </b-col>
        <b-col sm="6" lg="9">
          <b-form-text v-if="!uploadFaviconFile">{{ $t('settings.application.favicon.urlTitle') }}</b-form-text>
          <b-input-group>
            <b-form-input
              id="application-favicon-input"
              v-if="!uploadLogoFile"
              :placeholder="$t('settings.application.favicon.hint')"
              v-model="settings.favicon"
              :disabled="isBusy || viewOnly"
              class="my-2"
              :state='fieldState("favicon")'
            >
            </b-form-input>
          </b-input-group>
          <b-form-text v-if="!viewOnly">{{ $t('settings.application.favicon.uploadTitle') }}</b-form-text>
          <b-input-group v-if="!viewOnly">
            <b-form-file
              id="application-favicon-form-file"
              :state='fieldState("favicon_file")'
              :disabled="isBusy"
              :browse-text="$t('app.browse')"
              :placeholder="$t('settings.application.favicon.selectFile')"
              v-model="uploadFaviconFile"
              accept="image/x-icon"
            >
            </b-form-file>
            <template #append v-if="uploadFaviconFile">
              <b-button variant="danger" @click="uploadFaviconFile = null">
                <b-icon-x></b-icon-x>
              </b-button>
            </template>
          </b-input-group>
        </b-col>
      </b-row>

      <template slot='invalid-feedback'>
        <div v-html="fieldError('favicon')"></div>
        <div v-html="fieldError('favicon_file')"></div>
      </template>
    </b-form-group>

      <!--Logo Settings-->
      <b-form-group
        label-for="application-logo-input"
        :state='(fieldState("logo") === null && fieldState("logo_file") === null) ? null : false'
      >

        <template v-slot:label>
          {{ $t('settings.application.logo.title') }}
        </template>

        <b-row class="my-3" align-v="center">
          <b-col sm="6" lg="3" class="text-center">
            <b-img
              v-if="uploadLogoFileSrc!==null || settings.logo!==null"
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
                :disabled="isBusy || viewOnly"
                class="my-2"
                :state='fieldState("logo")'
              >
              </b-form-input>
            </b-input-group>
            <b-form-text v-if="!viewOnly">{{ $t('settings.application.logo.uploadTitle') }}</b-form-text>
            <b-input-group v-if="!viewOnly">
              <b-form-file
                id="application-logo-form-file"
                :state='fieldState("logo_file")'
                :disabled="isBusy"
                :browse-text="$t('app.browse')"
                :placeholder="$t('settings.application.logo.selectFile')"
                v-model="uploadLogoFile"
                accept="image/jpeg, image/png, image/gif, image/svg+xml"
              >
              </b-form-file>
              <template #append v-if="uploadLogoFile">
                <b-button id="application-upload-button" variant="danger" @click="uploadLogoFile = null">
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
          {{ $t('settings.application.roomLimit.title') }}
        </template>

        <b-form-radio-group
          class='mb-2'
          id="application-room-limit-radio-group"
          v-model='roomLimitMode'
          :options='roomLimitModeOptions'
          :disabled='isBusy || viewOnly'
          :state='fieldState("room_limit")'
          @change="roomLimitModeChanged"
          stacked
        ></b-form-radio-group>

        <b-form-input
          id='application-room-limit-input'
          type='number'
          :state='fieldState("room_limit")'
          v-model='settings.roomLimit'
          min='0'
          :disabled='isBusy || viewOnly'
          v-if="roomLimitMode === 'custom'">
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
          {{ $t('settings.application.paginationPageSize.title') }}
        </template>

        <b-form-input id="application-pagination-page-size-input"
                      v-model="settings.paginationPageSize"
                      type="number"
                      :disabled="isBusy || viewOnly"
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
          {{ $t('settings.application.ownRoomsPaginationPageSize.title') }}
        </template>

        <b-form-input id="application-pagination-own-room-page-size-input"
                      v-model="settings.ownRoomsPaginationPageSize"
                      type="number"
                      :disabled="isBusy || viewOnly"
                      :state='fieldState("own_rooms_pagination_page_size")'
        >
        </b-form-input>

        <template slot='invalid-feedback'>
          <div v-html="fieldError('own_rooms_pagination_page_size')"></div>
        </template>
      </b-form-group>

    </b-container>
</template>

<script>
import Base from '../../api/base';
import FieldErrors from '../../mixins/FieldErrors';
import env from '../../env';
import PermissionService from '../../services/PermissionService';

export default {
  mixins: [FieldErrors],

  data () {
    return {
      roomLimitMode: 'custom',
      uploadLogoFile: null,
      uploadLogoFileSrc: null,
      uploadFaviconFile: null,
      uploadFaviconFileSrc: null,
      isBusy: false,
      settings: {
        name: null,
        logo: null,
        favicon: null,
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
          this.settings.name = response.data.data.name;
          this.settings.logo = response.data.data.logo;
          this.settings.favicon = response.data.data.favicon;
          this.settings.roomLimit = response.data.data.room_limit;
          this.settings.ownRoomsPaginationPageSize = response.data.data.own_rooms_pagination_page_size;
          this.settings.paginationPageSize = response.data.data.pagination_page_size;
          this.roomLimitMode = (this.settings.roomLimit === -1 ? 'unlimited' : 'custom');
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
      if (this.uploadLogoFile) {
        formData.append('logo_file', this.uploadLogoFile);
      } else {
        formData.append('logo', settings.logo);
      }
      if (this.uploadFaviconFile) {
        formData.append('favicon_file', this.uploadFaviconFile);
      } else {
        formData.append('favicon', settings.favicon);
      }
      formData.append('name', settings.name);
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
          this.settings.favicon = response.data.data.favicon;
          this.settings.name = response.data.data.name;
          this.settings.roomLimit = response.data.data.room_limit;
          this.settings.ownRoomsPaginationPageSize = response.data.data.own_rooms_pagination_page_size;
          this.settings.paginationPageSize = response.data.data.pagination_page_size;
          this.roomLimitMode = (this.settings.roomLimit === -1 ? 'unlimited' : 'custom');
        })
        .catch((error) => {
          if (error.response) {
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
    },
    /**
     * Sets the roomLimit on the model depending on the selected radio button.
     *
     * @param value Value of the radio button that was selected.
     */
    roomLimitModeChanged (value) {
      switch (value) {
        case 'unlimited':
          this.settings.roomLimit = -1;
          break;
        case 'custom':
          this.settings.roomLimit = 0;
          break;
      }
    },

    /**
     * base64 encoder for file
     * @param data
     * @return {Promise<unknown>}
     */
    base64Encode (data) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(data);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });
    }
  },
  mounted () {
    this.getSettings();
  },
  computed: {

    /**
     * Check if user is only allowed to read settings
     */
    viewOnly () {
      return PermissionService.cannot('update', 'SettingPolicy');
    },

    /**
     * Options for the room limit mode radio button group.
     */
    roomLimitModeOptions () {
      return [
        { text: this.$t('settings.roles.roomLimit.unlimited'), value: 'unlimited' },
        { text: this.$t('settings.roles.roomLimit.custom'), value: 'custom' }
      ];
    }
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
          this.base64Encode(newValue)
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
    },
    /**
     * watch for favicon file select changes, encode to base64 and display image
     * @param newValue
     * @param oldValue
     */
    uploadFaviconFile (newValue, oldValue) {
      if (newValue !== oldValue) {
        if (newValue) {
          this.base64Encode(newValue)
            .then(value => {
              this.uploadFaviconFileSrc = value;
            })
            .catch(() => {
              this.uploadFaviconFileSrc = null;
            });
        } else {
          this.uploadFaviconFileSrc = null;
        }
      }
    }
  }
};
</script>

<style scoped>

</style>

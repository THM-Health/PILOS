<template>
 <div>
    <h3>{{ $t('settings.application.title') }}</h3>
    <hr>
    <b-overlay :show="isBusy || !loaded">

      <template #overlay>
        <div class="text-center">
          <b-spinner v-if="isBusy" ></b-spinner>
          <b-button
           v-else
            @click="getSettings()"
          >
            <b-icon-arrow-clockwise></b-icon-arrow-clockwise> {{ $t('app.reload') }}
          </b-button>
        </div>
      </template>

      <b-form @submit="onSubmit" :aria-hidden="!loaded">

        <!--Application name-->
        <b-form-group
          label-class="font-weight-bold"
          class="mb-4"
          label-for="application-name-input"
          :description="$t('settings.application.name.description')"
          :state='fieldState("name")'
          :label="$t('settings.application.name.title')"
        >
          <b-form-input id="application-name-input"
                        v-model="settings.name"
                        type="text"
                        required
                        :disabled="isBusy || viewOnly || !loaded"
                        :state='fieldState("name")'
          >
          </b-form-input>

          <template slot='invalid-feedback'>
            <div v-html="fieldError('name')"></div>
          </template>
        </b-form-group>

        <!--Favicon Settings-->
        <b-form-group
          label-class="font-weight-bold"
          class="mb-4"
          label-for="application-favicon-input"
          :state='(fieldState("favicon") == null && fieldState("favicon_file") == null) ? null : false'
          :label="$t('settings.application.favicon.title')"
        >
          <b-row class="my-3" align-v="center">
            <b-col sm="6" lg="3" class="text-center">
              <b-img
                v-if="uploadFaviconFileSrc!==null || settings.favicon!==null"
                :src="uploadFaviconFileSrc ? uploadFaviconFileSrc : settings.favicon"
                class="my-2"
                rounded="0"
                :alt="$t('settings.application.favicon.alt')"
                width="32"
                height="32"
                fluid
              >
              </b-img>
            </b-col>
            <b-col sm="6" lg="9">
              <b-form-text v-if="!uploadFaviconFile">{{ $t('settings.application.favicon.urlTitle') }}</b-form-text>
              <b-form-input
                id="application-favicon-input"
                v-if="!uploadFaviconFile"
                required
                :placeholder="$t('settings.application.favicon.hint')"
                v-model="settings.favicon"
                :disabled="isBusy || viewOnly || !loaded"
                class="my-2"
                :state='fieldState("favicon")'
              >
              </b-form-input>
              <b-form-text v-if="!viewOnly">{{ $t('settings.application.favicon.uploadTitle') }}</b-form-text>
              <b-input-group v-if="!viewOnly">
                <b-form-file
                  id="application-favicon-form-file"
                  :state='fieldState("favicon_file")'
                  :disabled="isBusy || viewOnly || !loaded"
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
          label-class="font-weight-bold"
          class="mb-4"
          label-for="application-logo-input"
          :state='(fieldState("logo") == null && fieldState("logo_file") == null) ? null : false'
          :label="$t('settings.application.logo.title')"
        >
          <b-row class="my-3" align-v="center">
            <b-col sm="6" lg="3" class="text-center">
              <b-img
                v-if="uploadLogoFileSrc!==null || settings.logo!==null"
                :src="uploadLogoFileSrc ? uploadLogoFileSrc : settings.logo"
                class="my-2"
                rounded="0"
                :alt="$t('settings.application.logo.alt')"
                width="150"
                height="100"
                fluid
              >
              </b-img>
            </b-col>
            <b-col sm="6" lg="9">
              <b-form-text v-if="!uploadLogoFile">{{ $t('settings.application.logo.urlTitle') }}</b-form-text>
              <b-form-input
                id="application-logo-input"
                v-if="!uploadLogoFile"
                required
                :placeholder="$t('settings.application.logo.hint')"
                v-model="settings.logo"
                :disabled="isBusy || viewOnly || !loaded"
                class="my-2"
                :state='fieldState("logo")'
              >
              </b-form-input>
              <b-form-text v-if="!viewOnly">{{ $t('settings.application.logo.uploadTitle') }}</b-form-text>
              <b-input-group v-if="!viewOnly">
                <b-form-file
                  id="application-logo-form-file"
                  :state='fieldState("logo_file")'
                  :disabled="isBusy || viewOnly || !loaded"
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
          label-class="font-weight-bold"
          class="mb-4"
          label-for="application-room-limit-input"
          :description="$t('settings.application.roomLimit.description')"
          :state='fieldState("room_limit")'
          :label="$t('settings.application.roomLimit.title')"
        >
          <b-form-radio-group
            class='mb-2'
            id="application-room-limit-radio-group"
            v-model='roomLimitMode'
            :options='roomLimitModeOptions'
            :disabled='isBusy || viewOnly || !loaded'
            required
            :state='fieldState("room_limit")'
            @change="roomLimitModeChanged"
            stacked
          ></b-form-radio-group>

          <b-form-input
            id='application-room-limit-input'
            type='number'
            :state='fieldState("room_limit")'
            v-model='settings.room_limit'
            min='0'
            max="100"
            required
            :disabled='isBusy || viewOnly || !loaded'
            v-if="roomLimitMode === 'custom'">
          </b-form-input>

          <template slot='invalid-feedback'>
            <div v-html="fieldError('room_limit')"></div>
          </template>
        </b-form-group>

        <!--Pagination page size settings-->
        <b-form-group
          label-class="font-weight-bold"
          class="mb-4"
          label-for="application-pagination-page-size-input"
          :description="$t('settings.application.paginationPageSize.description')"
          :state='fieldState("pagination_page_size")'
          :label="$t('settings.application.paginationPageSize.title')"
        >
          <b-form-input id="application-pagination-page-size-input"
                        v-model="settings.pagination_page_size"
                        type="number"
                        :disabled="isBusy || viewOnly || !loaded"
                        min="1"
                        max="100"
                        required
                        :state='fieldState("pagination_page_size")'
          >
          </b-form-input>

          <template slot='invalid-feedback'>
            <div v-html="fieldError('pagination_page_size')"></div>
          </template>
        </b-form-group>

        <!--Own rooms pagination page size settings-->
        <b-form-group
          label-class="font-weight-bold"
          class="mb-4"
          label-for="application-pagination-own-room-page-size-input"
          :description="$t('settings.application.ownRoomsPaginationPageSize.description')"
          :state='fieldState("own_rooms_pagination_page_size")'
          :label="$t('settings.application.ownRoomsPaginationPageSize.title')"
        >
          <b-form-input id="application-pagination-own-room-page-size-input"
                        v-model="settings.own_rooms_pagination_page_size"
                        type="number"
                        min="1"
                        max="25"
                        required
                        :disabled="isBusy || viewOnly || !loaded"
                        :state='fieldState("own_rooms_pagination_page_size")'
          >
          </b-form-input>

          <template slot='invalid-feedback'>
            <div v-html="fieldError('own_rooms_pagination_page_size')"></div>
          </template>
        </b-form-group>

        <hr>

        <!-- Banner -->
        <b-form-group
          label-class="font-weight-bold"
          :state='fieldState("banner")'
          :label="$t('settings.application.banner.title')"
          ref='banner-form-group'
        >
          <b-form-group
            :state='fieldState("banner.enabled")'
          >
            <b-form-checkbox
              id='banner-enabled'
              v-model='settings.banner.enabled'
              :state="fieldState('banner.enabled')"
              :disabled='isBusy || viewOnly || !loaded'
              switch
            >
              {{ $t('settings.application.banner.enabled') }}
            </b-form-checkbox>

            <template slot='invalid-feedback'>
              <div v-html="fieldError('banner.enabled')"></div>
            </template>
          </b-form-group>

          <banner
            class='mt-4'
            v-if='settings.banner.enabled'
            :background='settings.banner.background'
            :color='settings.banner.color'
            :enabled='settings.banner.enabled'
            :icon='settings.banner.icon'
            :link='settings.banner.link'
            :message='settings.banner.message'
            :title='settings.banner.title'
            :link-target='settings.banner.link_target'
            :link-text='settings.banner.link_text'
            :link-style='settings.banner.link_style'
          ></banner>

          <b-row
            cols='12'
            class='mt-4'
            v-if='settings.banner.enabled'
          >
            <b-col sm='6'>
              <b-form-group
                label-for='banner-title-input'
                :state='fieldState("banner.title")'
                :label="$t('settings.application.banner.bannerTitle')"
              >
                <b-form-input
                  id='banner-title-input'
                  v-model='settings.banner.title'
                  type='text'
                  :disabled='isBusy || viewOnly || !loaded'
                  :state='fieldState("banner.title")'
                ></b-form-input>

                <template slot='invalid-feedback'>
                  <div v-html="fieldError('banner.title')"></div>
                </template>
              </b-form-group>
            </b-col>
            <b-col sm='6'>
              <b-form-group
                label-for='banner-icon-input'
                :state='fieldState("banner.icon")'
                :description="$t('settings.application.banner.iconDescription')"
                :label="$t('settings.application.banner.icon')"
              >
                <b-form-input
                  id='banner-icon-input'
                  v-model='settings.banner.icon'
                  type='text'
                  :disabled='isBusy || viewOnly || !loaded'
                  :state='fieldState("banner.icon")'
                ></b-form-input>

                <template slot='invalid-feedback'>
                  <div v-html="fieldError('banner.icon')"></div>
                </template>
              </b-form-group>
            </b-col>
          </b-row>

          <b-form-group
            label-for='banner-message-input'
            :state='fieldState("banner.message")'
            :label="$t('settings.application.banner.message')"
            v-if='settings.banner.enabled'
          >
            <b-form-textarea
              id='banner-message-input'
              v-model='settings.banner.message'
              rows='3'
              :disabled='isBusy || viewOnly || !loaded'
              :state='fieldState("banner.message")'
            ></b-form-textarea>

            <template slot='invalid-feedback'>
              <div v-html="fieldError('banner.message')"></div>
            </template>
          </b-form-group>

          <b-row
            cols='12'
            v-if='settings.banner.enabled'
          >
            <b-col sm='6'>
              <b-form-group
                label-for='banner-link-input'
                :state='fieldState("banner.link")'
                :label="$t('settings.application.banner.link')"
              >
                <b-form-input
                  id='banner-link-input'
                  v-model='settings.banner.link'
                  type='text'
                  :disabled='isBusy || viewOnly || !loaded'
                  :state='fieldState("banner.link")'
                ></b-form-input>

                <template slot='invalid-feedback'>
                  <div v-html="fieldError('banner.link')"></div>
                </template>
              </b-form-group>
            </b-col>
            <b-col sm='6'>
              <b-form-group
                label-for='banner-link-text-input'
                :state='fieldState("banner.link_text")'
                :label="$t('settings.application.banner.link_text')"
              >
                <b-form-input
                  id='banner-link-text-input'
                  v-model='settings.banner.link_text'
                  type='text'
                  :disabled='isBusy || viewOnly || !loaded'
                  :state='fieldState("banner.link_text")'
                ></b-form-input>

                <template slot='invalid-feedback'>
                  <div v-html="fieldError('banner.link_text')"></div>
                </template>
              </b-form-group>
            </b-col>
          </b-row>

          <b-row
            cols='12'
            v-if='settings.banner.enabled'
          >
            <b-col sm='6'>
              <b-form-group
                label-for='banner-link-style-input'
                :state='fieldState("banner.link_style")'
                :label="$t('settings.application.banner.link_style')"
              >
                <b-form-select
                  id='banner-link-style-input'
                  :disabled='isBusy || viewOnly || !loaded'
                  :state='fieldState("banner.link_style")'
                  v-model='settings.banner.link_style'
                  :options='linkBtnStyles'
                >
                  <template #first>
                    <b-form-select-option :value='null' disabled>
                      {{ $t('settings.application.banner.selectLinkStyle') }}
                    </b-form-select-option>
                  </template>
                </b-form-select>

                <template slot='invalid-feedback'>
                  <div v-html="fieldError('banner.link_style')"></div>
                </template>
              </b-form-group>
            </b-col>
            <b-col sm='6'>
              <b-form-group
                label-for='banner-link-target-input'
                :state='fieldState("banner.link_target")'
                :label="$t('settings.application.banner.link_target')"
              >
                <b-form-select
                  id='banner-link-target-input'
                  :disabled='isBusy || viewOnly || !loaded'
                  :state='fieldState("banner.link_target")'
                  v-model='settings.banner.link_target'
                  :options='linkTargets'
                >
                  <template #first>
                    <b-form-select-option :value='null' disabled>
                      {{ $t('settings.application.banner.selectLinkTarget') }}
                    </b-form-select-option>
                  </template>
                </b-form-select>

                <template slot='invalid-feedback'>
                  <div v-html="fieldError('banner.link_target')"></div>
                </template>
              </b-form-group>
            </b-col>
          </b-row>

          <b-row
            cols='12'
            v-if='settings.banner.enabled'
          >
            <b-col sm='6'>
              <b-form-group
                label-for='banner-color-input'
                :state='fieldState("banner.color")'
                :label="$t('settings.application.banner.color')"
              >
                <v-swatches
                  class='my-2'
                  :disabled='isBusy || !loaded || viewOnly'
                  :swatch-style="{ borderRadius: '0px', marginBottom: '11px' }"
                  :swatches='colorSwatches'
                  v-model='settings.banner.color'
                  inline></v-swatches>
                <b-form-text>{{ $t('settings.roomTypes.customColor') }}</b-form-text>
                <b-form-input
                  id='banner-color-input'
                  type='text'
                  v-model='settings.banner.color'
                  :state='fieldState("banner.color")'
                  :disabled='isBusy || !loaded || viewOnly'
                ></b-form-input>

                <template slot='invalid-feedback'>
                  <div v-html="fieldError('banner.color')"></div>
                </template>
              </b-form-group>
            </b-col>
            <b-col sm='6'>
              <b-form-group
                label-for='banner-background-input'
                :state='fieldState("banner.background")'
                :label="$t('settings.application.banner.background')"
              >
                <v-swatches
                  class='my-2'
                  :disabled='isBusy || !loaded || viewOnly'
                  :swatch-style="{ borderRadius: '0px', marginBottom: '11px' }"
                  :swatches='backgroundSwatches'
                  v-model='settings.banner.background'
                  inline></v-swatches>
                <b-form-text>{{ $t('settings.roomTypes.customColor') }}</b-form-text>
                <b-form-input
                  id='banner-background-input'
                  type='text'
                  v-model='settings.banner.background'
                  :state='fieldState("banner.background")'
                  :disabled='isBusy || !loaded || viewOnly'
                ></b-form-input>

                <template slot='invalid-feedback'>
                  <div v-html="fieldError('banner.background')"></div>
                </template>
              </b-form-group>
            </b-col>
          </b-row>

          <template slot='invalid-feedback'>
            <div v-html="fieldError('banner')"></div>
          </template>
        </b-form-group>

        <hr>
        <div class="clearfix">
          <b-button id="application-save-button"
                    class="float-right mr-1 mb-1"
                    variant="success"
                    type="submit"
                    v-if="!viewOnly"
                    :disabled="isBusy || !loaded">
            <span><i class="fas fa-save mr-2"></i>{{ $t('app.save') }}</span>
          </b-button>
        </div>
      </b-form>
    </b-overlay>
 </div>
</template>

<script>
import Base from '../../api/base';
import FieldErrors from '../../mixins/FieldErrors';
import env from '../../env';
import PermissionService from '../../services/PermissionService';
import Banner from '../../components/Banner';
import VSwatches from 'vue-swatches';
import 'vue-swatches/dist/vue-swatches.css';

export default {
  components: { Banner, VSwatches },
  mixins: [FieldErrors],

  data () {
    return {
      loaded: false,
      roomLimitMode: 'custom',
      uploadLogoFile: null,
      uploadLogoFileSrc: null,
      uploadFaviconFile: null,
      uploadFaviconFileSrc: null,
      isBusy: false,
      settings: {
        banner: {},
        link_btn_styles: [],
        link_targets: []
      },
      errors: {},
      colorSwatches: ['#fff', '#000'],
      backgroundSwatches: ['#4a5c66', '#80ba24', '#9C132E', '#F4AA00', '#00B8E4', '#002878']
    };
  },
  methods: {
    /**
     * Handle get settings data
     */
    getSettings () {
      this.isBusy = true;
      Base.call('settings/all')
        .then(response => {
          this.settings = response.data.data;
          this.roomLimitMode = (this.settings.room_limit === -1 ? 'unlimited' : 'custom');
          this.loaded = true;
        })
        .catch((error) => {
          Base.error(error, this.$root, error.message);
        })
        .finally(() => {
          this.isBusy = false;
        });
    },

    /**
     * Handle form submit event, prevent default form submission, instead call updateSettings to send data to server
     */
    onSubmit (evt) {
      evt.preventDefault();
      this.updateSettings();
    },

    /**
     * Handle update settings data
     *
     */
    updateSettings () {
      this.isBusy = true;

      // Build form data
      const formData = new FormData();
      if (this.uploadLogoFile) {
        formData.append('logo_file', this.uploadLogoFile);
      } else {
        formData.append('logo', this.settings.logo);
      }
      if (this.uploadFaviconFile) {
        formData.append('favicon_file', this.uploadFaviconFile);
      } else {
        formData.append('favicon', this.settings.favicon);
      }
      formData.append('name', this.settings.name);
      formData.append('room_limit', this.settings.room_limit);
      formData.append('pagination_page_size', this.settings.pagination_page_size);
      formData.append('own_rooms_pagination_page_size', this.settings.own_rooms_pagination_page_size);

      Object.keys(this.settings.banner).forEach(key => {
        let val = this.settings.banner[key];

        // Since the FormData always strings boolean and empty values must be
        // changed so that they can be handled correctly by the backend.
        if (typeof (val) === 'boolean') {
          val = val ? 1 : 0;
        } else if (!val) {
          val = '';
        }

        formData.append(`banner[${key}]`, val);
      });

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
          this.settings = response.data.data;
          this.roomLimitMode = (this.settings.room_limit === -1 ? 'unlimited' : 'custom');
        })
        .catch((error) => {
          if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
            this.errors = error.response.data.errors;
          } else {
            Base.error(error, this.$root);
          }
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
          this.$set(this.settings, 'room_limit', -1);
          break;
        case 'custom':
          this.$set(this.settings, 'room_limit', 0);
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
    linkBtnStyles () {
      return (this.settings.link_btn_styles || []).map((style) => {
        return { value: style, text: this.$t(`app.buttonStyles.${style}`) };
      });
    },

    linkTargets () {
      return (this.settings.link_targets || []).map((target) => {
        return { value: target, text: this.$t(`app.linkTargets.${target}`) };
      });
    },

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

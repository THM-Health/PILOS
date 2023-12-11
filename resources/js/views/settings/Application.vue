<template>
 <div>
    <h4>{{ $t('settings.application.title') }}</h4>
    <hr>
    <b-overlay :show="isBusy || !loaded">

      <template #overlay>
        <div class="text-center">
          <b-spinner v-if="isBusy" ></b-spinner>
          <b-button
           v-else
            @click="getSettings()"
          >
            <i class="fa-solid fa-sync"></i> {{ $t('app.reload') }}
          </b-button>
        </div>
      </template>

      <b-form @submit="onSubmit" :aria-hidden="!loaded">
        <b-row cols='12'>
          <b-col md='6'>
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

              <template #invalid-feedback>
                <div v-html="fieldError('name')"></div>
              </template>
            </b-form-group>
          </b-col>
          <b-col md='6'>
            <!--Help URL-->
            <b-form-group
              label-class="font-weight-bold"
              class="mb-4"
              label-for="help-url-input"
              :description="$t('settings.application.help_url.description')"
              :state='fieldState("help_url")'
              :label="$t('settings.application.help_url.title')"
            >
              <b-form-input id="help-url-input"
                            v-model="settings.help_url"
                            type="url"
                            :disabled="isBusy || viewOnly || !loaded"
                            :state='fieldState("help_url")'
              >
              </b-form-input>

              <template #invalid-feedback>
                <div v-html="fieldError('help_url')"></div>
              </template>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row cols='12'>
          <b-col md='6'>
            <!--Legal Notice URL-->
            <b-form-group
              label-class="font-weight-bold"
              class="mb-4"
              label-for="legal-notice-url-input"
              :description="$t('settings.application.legal_notice_url.description')"
              :state='fieldState("legal_notice_url")'
              :label="$t('settings.application.legal_notice_url.title')"
            >
              <b-form-input id="legal-notice-url-input"
                            v-model="settings.legal_notice_url"
                            type="url"
                            :disabled="isBusy || viewOnly || !loaded"
                            :state='fieldState("legal_notice_url")'
              >
              </b-form-input>

              <template #invalid-feedback>
                <div v-html="fieldError('legal_notice_url')"></div>
              </template>
            </b-form-group>
          </b-col>
          <b-col md='6'>
            <!--Privacy Policy URL-->
            <b-form-group
              label-class="font-weight-bold"
              class="mb-4"
              label-for="privacy-policy-url-input"
              :description="$t('settings.application.privacy_policy_url.description')"
              :state='fieldState("privacy_policy_url")'
              :label="$t('settings.application.privacy_policy_url.title')"
            >
              <b-form-input id="privacy-policy-url-input"
                            v-model="settings.privacy_policy_url"
                            type="url"
                            :disabled="isBusy || viewOnly || !loaded"
                            :state='fieldState("privacy_policy_url")'
              >
              </b-form-input>

              <template #invalid-feedback>
                <div v-html="fieldError('privacy_policy_url')"></div>
              </template>
            </b-form-group>
          </b-col>
        </b-row>
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
              <b-form-text v-if="!uploadFaviconFile">{{ $t('settings.application.favicon.url_title') }}</b-form-text>
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
              <b-form-text v-if="!viewOnly">{{ $t('settings.application.favicon.upload_title') }}</b-form-text>
              <b-input-group v-if="!viewOnly">
                <b-form-file
                  id="application-favicon-form-file"
                  :state='fieldState("favicon_file")'
                  :disabled="isBusy || viewOnly || !loaded"
                  :browse-text="$t('app.browse')"
                  :placeholder="$t('settings.application.favicon.select_file')"
                  v-model="uploadFaviconFile"
                  accept="image/x-icon"
                >
                </b-form-file>
                <template #append v-if="uploadFaviconFile">
                  <b-button variant="danger" @click="uploadFaviconFile = null">
                    <i class="fa-solid fa-xmark"></i>
                  </b-button>
                </template>
              </b-input-group>
            </b-col>
          </b-row>

          <template #invalid-feedback>
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
              <b-form-text v-if="!uploadLogoFile">{{ $t('settings.application.logo.url_title') }}</b-form-text>
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
              <b-form-text v-if="!viewOnly">{{ $t('settings.application.logo.upload_title') }}</b-form-text>
              <b-input-group v-if="!viewOnly">
                <b-form-file
                  id="application-logo-form-file"
                  :state='fieldState("logo_file")'
                  :disabled="isBusy || viewOnly || !loaded"
                  :browse-text="$t('app.browse')"
                  :placeholder="$t('settings.application.logo.select_file')"
                  v-model="uploadLogoFile"
                  accept="image/jpeg, image/png, image/gif, image/svg+xml"
                >
                </b-form-file>
                <template #append v-if="uploadLogoFile">
                  <b-button id="application-upload-button" variant="danger" @click="uploadLogoFile = null">
                    <i class="fa-solid fa-xmark"></i>
                  </b-button>
                </template>
              </b-input-group>
            </b-col>
          </b-row>

          <template #invalid-feedback>
            <div v-html="fieldError('logo')"></div>
            <div v-html="fieldError('logo_file')"></div>
          </template>
        </b-form-group>

        <b-row cols='12'>
          <b-col md='6'>
            <!--Pagination page size settings-->
            <b-form-group
              label-class="font-weight-bold"
              class="mb-4"
              label-for="application-pagination-page-size-input"
              :description="$t('settings.application.pagination_page_size.description')"
              :state='fieldState("pagination_page_size")'
              :label="$t('settings.application.pagination_page_size.title')"
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

              <template #invalid-feedback>
                <div v-html="fieldError('pagination_page_size')"></div>
              </template>
            </b-form-group>
          </b-col>

          <b-col md='6'>
            <!--Own rooms pagination page size settings-->
            <b-form-group
              label-class="font-weight-bold"
              class="mb-4"
              label-for="application-pagination-own-room-page-size-input"
              :description="$t('settings.application.own_rooms_pagination_page_size.description')"
              :state='fieldState("own_rooms_pagination_page_size")'
              :label="$t('settings.application.own_rooms_pagination_page_size.title')"
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
              <template #invalid-feedback>
                <div v-html="fieldError('own_rooms_pagination_page_size')"></div>
              </template>
            </b-form-group>
          </b-col>
        </b-row>

        <b-row cols='12'>
          <b-col md='6'>
            <b-form-group
              label-class="font-weight-bold"
              class="mb-4"
              :label="$t('settings.application.default_timezone')"
              label-for='timezone'
              :state='fieldState("default_timezone")'
            >
              <timezone-select
                id='timezone'
                required
                v-model="settings.default_timezone"
                :state='fieldState("default_timezone")'
                :disabled="isBusy || viewOnly || !loaded"
                @loadingError="(value) => this.timezonesLoadingError = value"
                @busy="(value) => this.timezonesLoading = value"
                :placeholder="$t('settings.application.default_timezone')"
              >
              </timezone-select>
              <template #invalid-feedback><div v-html="fieldError('default_timezone')"></div></template>
            </b-form-group>
          </b-col>

        </b-row>

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

            <template #invalid-feedback>
              <div v-html="fieldError('banner.enabled')"></div>
            </template>
          </b-form-group>

          <b-card v-if='settings.banner.enabled'>

          <banner
            class='mt-4'
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
          >
            <b-col md='6'>
              <b-form-group
                label-for='banner-title-input'
                :state='fieldState("banner.title")'
                :label="$t('settings.application.banner.banner_title')"
              >
                <b-form-input
                  id='banner-title-input'
                  v-model='settings.banner.title'
                  type='text'
                  :disabled='isBusy || viewOnly || !loaded'
                  :state='fieldState("banner.title")'
                ></b-form-input>

                <template #invalid-feedback>
                  <div v-html="fieldError('banner.title')"></div>
                </template>
              </b-form-group>
            </b-col>
            <b-col md='6'>
              <b-form-group
                label-for='banner-icon-input'
                :state='fieldState("banner.icon")'
                :description="$t('settings.application.banner.icon_description')"
                :label="$t('settings.application.banner.icon')"
              >
                <b-form-input
                  id='banner-icon-input'
                  v-model='settings.banner.icon'
                  type='text'
                  :disabled='isBusy || viewOnly || !loaded'
                  :state='fieldState("banner.icon")'
                ></b-form-input>

                <template #invalid-feedback>
                  <div v-html="fieldError('banner.icon')"></div>
                </template>
              </b-form-group>
            </b-col>
          </b-row>

          <b-form-group
            label-for='banner-message-input'
            :state='fieldState("banner.message")'
            :label="$t('settings.application.banner.message')"
          >
            <b-form-textarea
              id='banner-message-input'
              v-model='settings.banner.message'
              rows='3'
              :disabled='isBusy || viewOnly || !loaded'
              :state='fieldState("banner.message")'
            ></b-form-textarea>

            <template #invalid-feedback>
              <div v-html="fieldError('banner.message')"></div>
            </template>
          </b-form-group>

          <b-row
            cols='12'
          >
            <b-col md='6'>
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

                <template #invalid-feedback>
                  <div v-html="fieldError('banner.link')"></div>
                </template>
              </b-form-group>
            </b-col>
            <b-col md='6'>
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

                <template #invalid-feedback>
                  <div v-html="fieldError('banner.link_text')"></div>
                </template>
              </b-form-group>
            </b-col>
          </b-row>

          <b-row
            cols='12'
          >
            <b-col md='6'>
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
                      {{ $t('settings.application.banner.select_link_style') }}
                    </b-form-select-option>
                  </template>
                </b-form-select>

                <template #invalid-feedback>
                  <div v-html="fieldError('banner.link_style')"></div>
                </template>
              </b-form-group>
            </b-col>
            <b-col md='6'>
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
                      {{ $t('settings.application.banner.select_link_target') }}
                    </b-form-select-option>
                  </template>
                </b-form-select>

                <template #invalid-feedback>
                  <div v-html="fieldError('banner.link_target')"></div>
                </template>
              </b-form-group>
            </b-col>
          </b-row>

          <b-row
            cols='12'
          >
            <b-col md='6'>
              <b-form-group
                label-for='banner-color-input'
                :state='fieldState("banner.color")'
                :label="$t('settings.application.banner.color')"
              >
                <color-select class="my-2" :disabled='isBusy || !loaded || viewOnly' :colors="textColors" v-model="settings.banner.color"></color-select>

                <b-form-text>{{ $t('settings.room_types.custom_color') }}</b-form-text>
                <b-form-input
                  id='banner-color-input'
                  type='text'
                  v-model='settings.banner.color'
                  :state='fieldState("banner.color")'
                  :disabled='isBusy || !loaded || viewOnly'
                ></b-form-input>

                <template #invalid-feedback>
                  <div v-html="fieldError('banner.color')"></div>
                </template>
              </b-form-group>
            </b-col>
            <b-col md='6'>
              <b-form-group
                label-for='banner-background-input'
                :state='fieldState("banner.background")'
                :label="$t('settings.application.banner.background')"
              >
              <color-select class="my-2" :disabled='isBusy || !loaded || viewOnly' :colors="backgroundColors" v-model="settings.banner.background"></color-select>

                <b-form-text>{{ $t('settings.room_types.custom_color') }}</b-form-text>
                <b-form-input
                  id='banner-background-input'
                  type='text'
                  v-model='settings.banner.background'
                  :state='fieldState("banner.background")'
                  :disabled='isBusy || !loaded || viewOnly'
                ></b-form-input>

                <template #invalid-feedback>
                  <div v-html="fieldError('banner.background')"></div>
                </template>
              </b-form-group>
            </b-col>
          </b-row>

          </b-card>

          <template #invalid-feedback>
            <div v-html="fieldError('banner')"></div>
          </template>
        </b-form-group>

        <h4>{{ $t('app.rooms') }}</h4>
        <hr>

        <b-row cols='12'>
          <!--Room limit settings-->
          <b-col md='6'>
            <b-form-group
              label-class="font-weight-bold"
              class="mb-4"
              label-for="application-room-limit-input"
              :description="$t('settings.application.room_limit.description')"
              :state='fieldState("room_limit")'
              :label="$t('settings.application.room_limit.title')"
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

              <template #invalid-feedback>
                <div v-html="fieldError('room_limit')"></div>
              </template>
            </b-form-group>
          </b-col>
          <!--Token expiration time-->
          <b-col md='6'>
            <b-form-group
              label-class="font-weight-bold"
              class="mb-4"
              label-for="application-room-token-expiration"
              :description="$t('settings.application.room_token_expiration.description')"
              :state='fieldState("room_token_expiration")'
              :label="$t('settings.application.room_token_expiration.title')"
            >
              <b-form-select
                v-model="settings.room_token_expiration"
                :disabled='isBusy || viewOnly || !loaded'
                required
                :options="roomTokenExpirationOptions"
                :state='fieldState("room_token_expiration")'
                class='mb-2'
                id="application-room-token-expiration"
              ></b-form-select>
              <template #invalid-feedback>
                <div v-html="fieldError('room_token_expiration')"></div>
              </template>
            </b-form-group>
          </b-col>
        </b-row>

        <b-row cols='12'>
          <!--Enable room auto delete-->
          <b-col md='6'>
            <b-form-group
              label-class="font-weight-bold"
              :state='fieldState("room_auto_delete.enabled")'
              :label="$t('settings.application.room_auto_delete.enabled.title')"
              ref='application-room-auto-delete-enabled-form-group'
            >
              <b-form-checkbox
                id='application-room-auto-delete-enabled'
                v-model='settings.room_auto_delete.enabled'
                :state="fieldState('room_auto_delete.enabled')"
                :disabled='isBusy || viewOnly || !loaded'
                switch
              >
                {{ $t('app.enable') }}
              </b-form-checkbox>
              <template #invalid-feedback>
                <div v-html="fieldError('room_auto_delete.enabled')"></div>
              </template>
            </b-form-group>
          </b-col>
          <!--Room delete deadline-->
          <b-col md='6'>
            <b-form-group
              label-class="font-weight-bold"
              class="mb-4"
              label-for="application-room-token-expiration"
              :description="$t('settings.application.room_auto_delete.deadline_period.description')"
              :state='fieldState("room_auto_delete.deadline_period")'
              :label="$t('settings.application.room_auto_delete.deadline_period.title')"
            >
              <b-form-select
                v-model="settings.room_auto_delete.deadline_period"
                :disabled='isBusy || viewOnly || !loaded'
                required
                :options="roomDeleteDeadlineOptions"
                :state='fieldState("room_auto_delete.deadline_period")'
                class='mb-2'
                id="application-room-auto-delete-deadline-period"
              ></b-form-select>
              <template #invalid-feedback>
                <div v-html="fieldError('room_auto_delete.deadline_period')"></div>
              </template>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row cols='12'>
          <!--Room delete inactive-->
          <b-col md='6'>
            <b-form-group
              label-class="font-weight-bold"
              class="mb-4"
              label-for="application-room-token-expiration"
              :description="$t('settings.application.room_auto_delete.inactive_period.description')"
              :state='fieldState("room_auto_delete.inactive_period")'
              :label="$t('settings.application.room_auto_delete.inactive_period.title')"
            >
              <b-form-select
                v-model="settings.room_auto_delete.inactive_period"
                :disabled='isBusy || viewOnly || !loaded'
                required
                :options="roomDeleteNotificationOptions"
                :state='fieldState("room_auto_delete.inactive_period")'
                class='mb-2'
                id="application-room-auto-delete-inactive-period"
              ></b-form-select>
              <template #invalid-feedback>
                <div v-html="fieldError('room_auto_delete.inactive_period')"></div>
              </template>
            </b-form-group>
          </b-col>
          <!--Room delete never used-->
          <b-col md='6'>
            <b-form-group
              label-class="font-weight-bold"
              class="mb-4"
              label-for="application-room-token-expiration"
              :description="$t('settings.application.room_auto_delete.never_used_period.description')"
              :state='fieldState("room_auto_delete.never_used_period")'
              :label="$t('settings.application.room_auto_delete.never_used_period.title')"
            >
              <b-form-select
                v-model="settings.room_auto_delete.never_used_period"
                :disabled='isBusy || viewOnly || !loaded'
                required
                :options="roomDeleteNotificationOptions"
                :state='fieldState("room_auto_delete.never_used_period")'
                class='mb-2'
                id="application-room-auto-delete-never-used-period"
              ></b-form-select>
              <template #invalid-feedback>
                <div v-html="fieldError('room_auto_delete.never_used_period')"></div>
              </template>
            </b-form-group>
          </b-col>
        </b-row>

        <h4>{{ $t('app.users') }}</h4>
        <hr>

        <b-row cols='12'>
          <b-col md='6'>
            <b-form-group
              label-class="font-weight-bold"
              class="mb-4"
              :label="$t('settings.application.user_settings')"
              :state='fieldState("password_change_allowed")'
            >
              <b-form-checkbox
                v-model='settings.password_change_allowed'
                :state="fieldState('password_change_allowed')"
                :disabled='isBusy || viewOnly || !loaded'
                switch
              >
                {{ $t('settings.application.password_change_allowed') }}
              </b-form-checkbox>

              <template #invalid-feedback>
                <div v-html="fieldError('password_change_allowed')"></div>
              </template>
            </b-form-group>
          </b-col>
        </b-row>

        <h4>{{ $t('settings.application.attendance_and_statistics_title') }}</h4>
        <hr>
        <b-row cols='12'>
          <b-col md='6'>
            <b-form-group
              label-class="font-weight-bold"
              :state='fieldState("statistics.servers.enabled")'
              :label="$t('settings.application.statistics.servers.enabled_title')"
              ref='statistics-servers-enabled-form-group'
            >
                <b-form-checkbox
                  id='statistics-server-enabled'
                  v-model='settings.statistics.servers.enabled'
                  :state="fieldState('statistics.servers.enabled')"
                  :disabled='isBusy || viewOnly || !loaded'
                  switch
                >
                  {{ $t('app.enable') }}
                </b-form-checkbox>
                <template #invalid-feedback>
                  <div v-html="fieldError('statistics.servers.enabled')"></div>
                </template>
              </b-form-group>
          </b-col>
          <b-col md='6'>
            <b-form-group
              label-class="font-weight-bold"
              :state='fieldState("statistics.servers.retention_period")'
              :label="$t('settings.application.statistics.servers.retention_period_title')"
              ref='statistics-servers-retention-form-group'
            >
              <b-form-input
                id='statistics-server-retention-period-input'
                type='number'
                :state='fieldState("statistics.servers.retention_period")'
                v-model='settings.statistics.servers.retention_period'
                min='1'
                max="365"
                required
                :disabled='isBusy || viewOnly || !loaded'
               >
              </b-form-input>

              <template #invalid-feedback>
                <div v-html="fieldError('statistics.servers.retention_period')"></div>
              </template>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row cols='12'>
          <b-col md='6'>
            <b-form-group
              label-class="font-weight-bold"
              :state='fieldState("statistics.meetings.enabled")'
              :label="$t('settings.application.statistics.meetings.enabled_title')"
              ref='statistics-meetings-enabled-form-group'
            >
              <b-form-checkbox
                id='statistics-meetings-enabled'
                v-model='settings.statistics.meetings.enabled'
                :state="fieldState('statistics.meetings.enabled')"
                :disabled='isBusy || viewOnly || !loaded'
                switch
              >
                {{ $t('app.enable') }}
              </b-form-checkbox>
              <template #invalid-feedback>
                <div v-html="fieldError('statistics.meetings.enabled')"></div>
              </template>
            </b-form-group>
          </b-col>
          <b-col md='6'>
            <b-form-group
              label-class="font-weight-bold"
              :state='fieldState("statistics.meetings.retention_period")'
              :label="$t('settings.application.statistics.meetings.retention_period_title')"
              ref='statistics-meetings-retention-form-group'
            >
              <b-form-input
                id='statistics-meetings-retention-period-input'
                type='number'
                :state='fieldState("statistics.meetings.retention_period")'
                v-model='settings.statistics.meetings.retention_period'
                min='1'
                max="365"
                required
                :disabled='isBusy || viewOnly || !loaded'
              >
              </b-form-input>

              <template #invalid-feedback>
                <div v-html="fieldError('statistics.meetings.retention_period')"></div>
              </template>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row cols='12'>
          <b-col md='6'>
            <b-form-group
              label-class="font-weight-bold"
              :state='fieldState("attendance.enabled")'
              :label="$t('settings.application.attendance.enabled_title')"
              ref='attendance-enabled-form-group'
            >
              <b-form-checkbox
                id='attendance-enabled'
                v-model='settings.attendance.enabled'
                :state="fieldState('attendance.enabled')"
                :disabled='isBusy || viewOnly || !loaded'
                switch
              >
                {{ $t('app.enable') }}
              </b-form-checkbox>
              <template #invalid-feedback>
                <div v-html="fieldError('attendance.enabled')"></div>
              </template>
            </b-form-group>
          </b-col>
          <b-col md='6'>
            <b-form-group
              label-class="font-weight-bold"
              :state='fieldState("attendance.retention_period")'
              :label="$t('settings.application.attendance.retention_period_title')"
              ref='attendance-retention-form-group'
            >
              <b-form-input
                id='statistics-meetings-retention-period-input'
                type='number'
                :state='fieldState("attendance.retention_period")'
                v-model='settings.attendance.retention_period'
                min='1'
                max="365"
                required
                :disabled='isBusy || viewOnly || !loaded'
              >
              </b-form-input>

              <template #invalid-feedback>
                <div v-html="fieldError('attendance.retention_period')"></div>
              </template>
            </b-form-group>
          </b-col>
        </b-row>

        <h4>{{ $t('settings.application.bbb.title') }}</h4>
        <hr>
        <!--Logo Settings-->
        <b-form-group
          label-class="font-weight-bold"
          ref='bbb-logo-form-group'
          class="mb-4"
          label-for="bbb-logo-input"
          :state='(fieldState("bbb.logo") == null && fieldState("bbb.logo_file") == null) ? null : false'
          :label="$t('settings.application.bbb.logo.title')"
        >
          <b-row class="my-3" align-v="center">
            <b-col sm="6" lg="3" class="text-center">
              <b-img
                v-if="(uploadBBBLogoFileSrc!==null || settings.bbb.logo!==null) && !bbb_logo_deleted"
                :src="uploadBBBLogoFileSrc ? uploadBBBLogoFileSrc : settings.bbb.logo"
                class="my-2"
                rounded="0"
                :alt="$t('settings.application.bbb.logo.alt')"
                width="150"
                height="100"
                fluid
              >
              </b-img>
            </b-col>
            <b-col sm="6" lg="9">
              <b-form-text v-if="!uploadBBBLogoFile">{{ $t('settings.application.bbb.logo.url_title') }}</b-form-text>
              <b-input-group class="my-2" v-if="!uploadBBBLogoFile">
              <b-form-input
                id="bbb-logo-input"
                :placeholder="$t('settings.application.bbb.logo.hint')"
                v-model="settings.bbb.logo"
                :disabled="isBusy || viewOnly || !loaded || bbb_logo_deleted"
                :state='fieldState("bbb.logo")'
                trim
              >
              </b-form-input>
              <template #append>
                <b-button
                  v-if='!viewOnly && bbb_logo_deleted'
                  variant='secondary'
                  @click='bbb_logo_deleted = false'
                  ref='reset-bbb-logo'
                  v-b-tooltip
                  :title="$t('app.reset')"
                >
                  <i class="fa-solid fa-undo"></i>
                </b-button>
                <!-- Delete file -->
                <b-button
                  v-if='!viewOnly && !bbb_logo_deleted && settings.bbb.logo!=null'
                  variant='danger'
                  @click="bbb_logo_deleted = true"
                  ref='delete-bbb-logo'
                  v-b-tooltip
                  :title="$t('app.delete')"
                >
                  <i class="fa-solid fa-trash"></i>
                </b-button>
              </template>
              </b-input-group>
              <b-form-text v-if="!viewOnly && !bbb_logo_deleted">{{ $t('settings.application.bbb.logo.upload_title') }}</b-form-text>
              <b-input-group v-if="!viewOnly && !bbb_logo_deleted">
                <b-form-file
                  id="bbb-logo-form-file"
                  :state='fieldState("bbb.logo_file")'
                  :disabled="isBusy || viewOnly || !loaded"
                  :browse-text="$t('app.browse')"
                  :placeholder="$t('settings.application.bbb.logo.select_file')"
                  v-model="uploadBBBLogoFile"
                  accept="image/jpeg, image/png, image/gif, image/svg+xml"
                >
                </b-form-file>
                <template #append v-if="uploadBBBLogoFile">
                  <b-button id="bbb-upload-button" variant="danger" @click="uploadBBBLogoFile = null">
                    <i class="fa-solid fa-xmark"></i>
                  </b-button>
                </template>
              </b-input-group>
            </b-col>
          </b-row>

          <template #invalid-feedback>
            <div v-html="fieldError('logo')"></div>
            <div v-html="fieldError('logo_file')"></div>
          </template>
        </b-form-group>

        <b-form-group
          label-class="font-weight-bold"
          ref='bbb-style-form-group'
          class="mb-4"
          :label="$t('settings.application.bbb.style.title')"
          label-for='bbb-style-form-file'
          :state='fieldState("bbb.style")'
        >
          <b-input-group>
            <b-form-file
              accept="text/css,.css"
              :disabled="isBusy || viewOnly || !loaded"
              id='bbb-style-form-file'
              :state="fieldState('bbb.style')"
              :browse-text="$t('app.browse')"
              :placeholder="$t('settings.application.bbb.style.title')"
              v-model="bbb_style"
            >
            </b-form-file>
            <b-input-group-append v-if='settings.bbb.style || !!bbb_style'>
              <!-- View file -->
              <b-button
                v-if='settings.bbb.style'
                variant='secondary'
                :href='settings.bbb.style'
                target='_blank'
                ref='view-bbb-style'
                v-b-tooltip
                :title="$t('app.view')"
              >
                <i class="fa-solid fa-eye"></i>
              </b-button>
              <b-button
                v-if='!viewOnly && (bbb_style !== null || bbb_style_deleted)'
                variant='secondary'
                @click='bbb_style = null; bbb_style_deleted = false'
                ref='reset-bbb-style'
                v-b-tooltip
                :title="$t('app.reset')"
              >
                <i class="fa-solid fa-undo"></i>
              </b-button>
              <!-- Delete file -->
              <b-button
                v-if='!viewOnly && bbb_style === null && !bbb_style_deleted'
                variant='danger'
                @click="bbb_style_deleted = true"
                ref='delete-bbb-style'
                v-b-tooltip
                :title="$t('app.delete')"
              >
                <i class="fa-solid fa-trash"></i>
              </b-button>

            </b-input-group-append>
          </b-input-group>
          <template v-slot:invalid-feedback v-if="!viewOnly">
            <div v-html="fieldError('bbb.style')"></div>
          </template>
        </b-form-group>

        <b-form-group
            label-class="font-weight-bold"
            class="mb-4"
            :label="$t('settings.application.default_presentation')"
            label-for='default_presentation'
            :state='fieldState("default_presentation")'
          >
            <b-input-group>
              <b-form-file
                :disabled="isBusy || viewOnly || !loaded"
                id='default_presentation'
                :state="fieldState('default_presentation')"
                :browse-text="$t('app.browse')"
                :placeholder="$t('settings.application.default_presentation')"
                v-model="default_presentation"
              >
              </b-form-file>
              <b-input-group-append v-if='settings.default_presentation || !!default_presentation'>
                <!-- View file -->
                <b-button
                  v-if='settings.default_presentation'
                  variant='secondary'
                  :href='settings.default_presentation'
                  target='_blank'
                  ref='view-default-presentation'
                  v-b-tooltip
                  :title="$t('app.view')"
                >
                  <i class="fa-solid fa-eye"></i>
                </b-button>
                <b-button
                  v-if='!viewOnly && (default_presentation !== null || default_presentation_deleted)'
                  variant='secondary'
                  @click='default_presentation = null; default_presentation_deleted = false'
                  ref='reset-default-presentation'
                  v-b-tooltip
                  :title="$t('app.reset')"
                >
                  <i class="fa-solid fa-undo"></i>
                </b-button>
                <!-- Delete file -->
                <b-button
                  v-if='!viewOnly && default_presentation === null && !default_presentation_deleted'
                  variant='danger'
                  @click="default_presentation_deleted = true"
                  ref='delete-default-presentation'
                  v-b-tooltip
                  :title="$t('app.delete')"
                >
                  <i class="fa-solid fa-trash"></i>
                </b-button>

              </b-input-group-append>
            </b-input-group>
            <b-form-text v-if="!viewOnly">{{ $t('rooms.files.formats', { formats: String(settings.bbb.file_mimes).split(",").join(', ') }) }}<br>{{ $t('rooms.files.size', { size: settings.bbb.max_filesize }) }}</b-form-text>
            <template v-slot:invalid-feedback v-if="!viewOnly">
              <div v-html="fieldError('default_presentation')"></div>
            </template>
          </b-form-group>

        <hr>

        <div class="clearfix">
          <b-button id="application-save-button"
                    class="float-right mr-1 mb-1"
                    variant="success"
                    type="submit"
                    v-if="!viewOnly"
                    :disabled="isBusy || !loaded || timezonesLoadingError || timezonesLoading">
            <span><i class="fa-solid fa-save mr-2"></i>{{ $t('app.save') }}</span>
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
import Banner from '../../components/Banner.vue';
import { mapActions } from 'pinia';
import { useSettingsStore } from '../../stores/settings';
import TimezoneSelect from '../../components/Inputs/TimezoneSelect.vue';
import ColorSelect from '../../components/Inputs/ColorSelect.vue';

export default {
  components: { Banner, TimezoneSelect, ColorSelect },
  mixins: [FieldErrors],

  data () {
    return {
      loaded: false,
      roomLimitMode: 'custom',
      uploadLogoFile: null,
      uploadLogoFileSrc: null,
      uploadBBBLogoFile: null,
      uploadBBBLogoFileSrc: null,
      uploadFaviconFile: null,
      uploadFaviconFileSrc: null,
      isBusy: false,
      default_presentation: null,
      default_presentation_deleted: false,
      bbb_style: null,
      bbb_style_deleted: false,
      bbb_logo_deleted: false,
      settings: {
        banner: {},
        link_btn_styles: [],
        link_targets: [],
        bbb: {
          style: undefined
        },
        default_presentation: undefined,
        room_token_expiration: undefined,
        statistics: {
          servers: {},
          meetings: {}
        },
        attendance: {},
        room_auto_delete: {}
      },
      errors: {},
      textColors: env.BANNER_TEXT_COLORS,
      backgroundColors: env.BANNER_BACKGROUND_COLORS,
      timezonesLoading: false,
      timezonesLoadingError: false
    };
  },
  methods: {

    ...mapActions(useSettingsStore, {
      getGlobalSettings: 'getSettings'
    }),

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

      if (this.uploadBBBLogoFile) {
        formData.append('bbb[logo_file]', this.uploadBBBLogoFile);
      } else if (!this.bbb_logo_deleted && this.settings.bbb.logo != null) {
        formData.append('bbb[logo]', this.settings.bbb.logo);
      }

      formData.append('name', this.settings.name);
      formData.append('room_limit', this.settings.room_limit);
      formData.append('room_token_expiration', this.settings.room_token_expiration);
      formData.append('pagination_page_size', this.settings.pagination_page_size);
      formData.append('own_rooms_pagination_page_size', this.settings.own_rooms_pagination_page_size);
      formData.append('password_change_allowed', this.settings.password_change_allowed ? 1 : 0);
      formData.append('default_timezone', this.settings.default_timezone);
      formData.append('help_url', this.settings.help_url || '');
      formData.append('legal_notice_url', this.settings.legal_notice_url || '');
      formData.append('privacy_policy_url', this.settings.privacy_policy_url || '');

      formData.append('statistics[servers][enabled]', this.settings.statistics.servers.enabled ? 1 : 0);
      formData.append('statistics[servers][retention_period]', this.settings.statistics.servers.retention_period);
      formData.append('statistics[meetings][enabled]', this.settings.statistics.meetings.enabled ? 1 : 0);
      formData.append('statistics[meetings][retention_period]', this.settings.statistics.meetings.retention_period);
      formData.append('attendance[enabled]', this.settings.attendance.enabled ? 1 : 0);
      formData.append('attendance[retention_period]', this.settings.attendance.retention_period);

      formData.append('room_auto_delete[enabled]', this.settings.room_auto_delete.enabled ? 1 : 0);
      formData.append('room_auto_delete[deadline_period]', this.settings.room_auto_delete.deadline_period);
      formData.append('room_auto_delete[inactive_period]', this.settings.room_auto_delete.inactive_period);
      formData.append('room_auto_delete[never_used_period]', this.settings.room_auto_delete.never_used_period);

      if (this.default_presentation !== null) {
        formData.append('default_presentation', this.default_presentation);
      } else if (this.default_presentation_deleted) {
        formData.append('default_presentation', '');
      }

      if (this.bbb_style !== null) {
        formData.append('bbb[style]', this.bbb_style);
      } else if (this.bbb_style_deleted) {
        formData.append('bbb[style]', '');
      }

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
          this.getGlobalSettings();
          this.errors = {};
          this.uploadLogoFile = null;
          this.uploadFaviconFile = null;
          this.default_presentation = null;
          this.default_presentation_deleted = false;
          this.uploadBBBLogoFile = null;
          this.bbb_style = null;
          this.bbb_style_deleted = false;
          this.bbb_logo_deleted = false;

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
        return { value: style, text: this.$t(`app.button_styles.${style}`) };
      });
    },

    linkTargets () {
      return (this.settings.link_targets || []).map((target) => {
        return { value: target, text: this.$t(`app.link_targets.${target}`) };
      });
    },

    /**
     * Check if user is only allowed to read settings
     */
    viewOnly () {
      return PermissionService.cannot('update', 'ApplicationSettingPolicy');
    },

    /**
     * Options for the room limit mode radio button group.
     */
    roomLimitModeOptions () {
      return [
        { text: this.$t('settings.roles.room_limit.unlimited'), value: 'unlimited' },
        { text: this.$t('settings.roles.room_limit.custom'), value: 'custom' }
      ];
    },

    /**
     * Options for the room token expiration mode radio button group.
     */
    roomTokenExpirationOptions () {
      return [
        { value: 1440, text: this.$t('settings.application.one_day') },
        { value: 10080, text: this.$t('settings.application.one_week') },
        { value: 43200, text: this.$t('settings.application.one_month') },
        { value: 129600, text: this.$t('settings.application.three_month') },
        { value: 262800, text: this.$t('settings.application.six_month') },
        { value: 525600, text: this.$t('settings.application.one_year') },
        { value: -1, text: this.$t('settings.application.unlimited') }
      ];
    },

    /**
     * Options for the room auto deletion never used and inactive selects.
     */
    roomDeleteNotificationOptions () {
      return [
        { value: 7, text: this.$t('settings.application.one_week') },
        { value: 14, text: this.$t('settings.application.two_weeks') },
        { value: 30, text: this.$t('settings.application.one_month') },
        { value: 90, text: this.$t('settings.application.three_month') },
        { value: 180, text: this.$t('settings.application.six_month') },
        { value: 365, text: this.$t('settings.application.one_year') },
        { value: 730, text: this.$t('settings.application.two_years') },
        { value: -1, text: this.$t('settings.application.never') }
      ];
    },
    /**
     * Options for the room auto deletion deadline.
     */
    roomDeleteDeadlineOptions () {
      return [
        { value: 7, text: this.$t('settings.application.one_week') },
        { value: 14, text: this.$t('settings.application.two_weeks') },
        { value: 30, text: this.$t('settings.application.one_month') }
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
     * watch for bbb logo file select changes, encode to base64 and display image
     * @param newValue
     * @param oldValue
     */
    uploadBBBLogoFile (newValue, oldValue) {
      if (newValue !== oldValue) {
        if (newValue) {
          this.base64Encode(newValue)
            .then(value => {
              this.uploadBBBLogoFileSrc = value;
            })
            .catch(() => {
              this.uploadBBBLogoFileSrc = null;
            });
        } else {
          this.uploadBBBLogoFileSrc = null;
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

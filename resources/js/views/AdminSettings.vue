<template>
  <div>
    <h2>
      {{ $t('admin.settings.title') }}
    </h2>
    <Divider/>
      <form
        @submit.prevent="updateSettings"
      >
        <OverlayComponent :show="isBusy || modelLoadingError" :no-center="true">
          <template #overlay>
            <div class="flex justify-center mt-6">
              <LoadingRetryButton :error="modelLoadingError" @click="getSettings" />
            </div>
          </template>

        <h4 class="text-xl">{{ $t('admin.settings.application') }}</h4>

        <div class="grid grid-cols-12 gap-4">
          <label for="application-name" class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.name.title')}}</label>
          <div class="col-span-12 md:col-span-8 flex flex-col gap-1">
            <InputText
              id="application-name"
              v-model="settings.general_name"
              type="text"
              required
              :invalid="formErrors.fieldInvalid('general_name')"
              :disabled="disabled"
              aria-describedby="application-name-help"
            />
            <small id="application-name-help">{{ $t('admin.settings.name.description') }}</small>
            <p class="p-error" v-html="formErrors.fieldError('general_name')"></p>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-4">
          <label for="help-url" class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.help_url.title')}}</label>
          <div class="col-span-12 md:col-span-8 flex flex-col gap-1">
            <InputText
              id="help-url"
              v-model="settings.general_help_url"
              type="text"
              :invalid="formErrors.fieldInvalid('general_help_url')"
              :disabled="disabled"
              aria-describedby="help-url-help"
            />
            <small id="help-url-help">{{ $t('admin.settings.help_url.description') }}</small>
            <p class="p-error" v-html="formErrors.fieldError('general_help_url')"></p>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-4">
          <label for="legal-notice-url" class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.legal_notice_url.title')}}</label>
          <div class="col-span-12 md:col-span-8 flex flex-col gap-1">
            <InputText
              id="legal-notice-url"
              v-model="settings.general_legal_notice_url"
              type="text"
              :invalid="formErrors.fieldInvalid('general_legal_notice_url')"
              :disabled="disabled"
              aria-describedby="legal-notice-url-help"
            />
            <small id="legal-notice-url-help">{{ $t('admin.settings.legal_notice_url.description') }}</small>
            <p class="p-error" v-html="formErrors.fieldError('general_legal_notice_url')"></p>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-4">
          <label for="privacy-policy-url" class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.privacy_policy_url.title')}}</label>
          <div class="col-span-12 md:col-span-8 flex flex-col gap-1">
            <InputText
              id="privacy-policy-url"
              v-model="settings.general_privacy_policy_url"
              type="text"
              :invalid="formErrors.fieldInvalid('general_privacy_policy_url')"
              :disabled="disabled"
              aria-describedby="privacy-policy-url-help"
            />
            <small id="privacy-policy-url-help">{{ $t('admin.settings.privacy_policy_url.description') }}</small>
            <p class="p-error" v-html="formErrors.fieldError('general_privacy_policy_url')"></p>
          </div>
        </div>

        <fieldset class="grid grid-cols-12 gap-4">
          <legend id="favicon-label" class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.favicon.title')}}</legend>
          <div class="col-span-12 md:col-span-8">
            <SettingsImageSelector
              v-model:image-url="settings.general_favicon"
              v-model:image="uploadFaviconFile"
              :disabled="disabled"
              :readonly="viewOnly"
              :max-file-size="500000"
              preview-width="32"
              :preview-alt="$t('admin.settings.favicon.alt')"
              :allowed-extensions="['ico']"
              inputId="favicon"
              :url-invalid="formErrors.fieldInvalid('general_favicon')"
              :file-invalid="formErrors.fieldInvalid('general_favicon_file')"
              :url-error="formErrors.fieldError('general_favicon')"
              :file-error="formErrors.fieldError('general_favicon_file')"
            />
          </div>
        </fieldset>

        <fieldset class="grid grid-cols-12 gap-4">
          <legend id="logo-label" class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.logo.title')}}</legend>
          <div class="col-span-12 md:col-span-8">
            <SettingsImageSelector
              v-model:image-url="settings.general_logo"
              v-model:image="uploadLogoFile"
              :disabled="disabled"
              :readonly="viewOnly"
              :max-file-size="500000"
              preview-width="150"
              :preview-alt="$t('admin.settings.logo.alt')"
              :allowed-extensions="['jpg', 'jpeg', 'png', 'gif', 'svg']"
              inputId="logo"
              :url-invalid="formErrors.fieldInvalid('general_logo')"
              :file-invalid="formErrors.fieldInvalid('general_logo_file')"
              :url-error="formErrors.fieldError('general_logo')"
              :file-error="formErrors.fieldError('general_logo_file')"
            />
          </div>
        </fieldset>

        <div class="grid grid-cols-12 gap-4">
          <label for="pagination-page-size" class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.pagination_page_size.title')}}</label>
          <div class="col-span-12 md:col-span-8 flex flex-col gap-1">
            <InputText
              id="pagination-page-size"
              v-model.number="settings.general_pagination_page_size"
              required
              min="1"
              max="100"
              type="number"
              :invalid="formErrors.fieldInvalid('general_pagination_page_size')"
              :disabled="disabled"
              aria-describedby="pagination-page-size-help"
            />
            <small id="pagination-page-size-help">{{ $t('admin.settings.pagination_page_size.description') }}</small>
            <p class="p-error" v-html="formErrors.fieldError('pagination_page_size')"></p>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-4">
          <label for="room-pagination-page-size" class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.room_pagination_page_size.title')}}</label>
          <div class="col-span-12 md:col-span-8 flex flex-col gap-1">
            <InputText
              id="room-pagination-page-size"
              v-model.number="settings.room_pagination_page_size"
              required
              min="1"
              max="25"
              type="number"
              :invalid="formErrors.fieldInvalid('room_pagination_page_size')"
              :disabled="disabled"
              aria-describedby="room-pagination-page-size-help"
            />
            <small id="room-pagination-page-size-help">{{ $t('admin.settings.room_pagination_page_size.description') }}</small>
            <p class="p-error" v-html="formErrors.fieldError('room_pagination_page_size')"></p>
          </div>
        </div>

        <fieldset class="grid grid-cols-12 gap-4">
          <legend class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.toast_lifetime.title')}}</legend>
          <div class="col-span-12 md:col-span-8 flex flex-col gap-1">
            <div class="flex flex-wrap gap-4">
              <div class="flex items-center">
                <RadioButton
                  v-model="toastLifetimeMode"
                  inputId="toast-lifetime-mode-unlimited"
                  name="toast-lifetime-mode"
                  value="unlimited"
                  :disabled="disabled"
                  @update:modelValue="toastLifetimeModeChanged"
                  :pt="{
                  input: {
                     'aria-describedby':'toast-lifetime-custom-help'
                  }
                }"
                />
                <label for="toast-lifetime-mode-unlimited" class="ml-2">{{ $t('app.unlimited') }}</label>
              </div>
              <div class="flex items-center">
                <RadioButton
                  v-model="toastLifetimeMode"
                  inputId="toast-lifetime-custom"
                  name="toast-lifetime-mode"
                  value="custom"
                  :disabled="disabled"
                  @update:modelValue="toastLifetimeModeChanged"
                  :pt="{
                  input: {
                     'aria-describedby':'toast-lifetime-custom-help'
                  }
                }"
                />
                <label for="toast-lifetime-mode-custom" id="toast-lifetime-mode-custom-label" class="ml-2">{{ $t('admin.settings.toast_lifetime.custom') }}</label>
              </div>
            </div>
            <InputText
              v-if="toastLifetimeMode === 'custom'"
              class="mt-1"
              id="toast-lifetime-custom"
              v-model.number="settings.general_toast_lifetime"
              min="1"
              max="30"
              type="number"
              :invalid="formErrors.fieldInvalid('general_toast_lifetime')"
              :disabled="disabled"
              aria-labelledby="toast-lifetime-custom-label"
              aria-describedby="toast-lifetime-custom-help"
            />
            <small id="toast-lifetime-custom-help">{{ $t('admin.settings.toast_lifetime.description') }}</small>
            <p class="p-error" v-html="formErrors.fieldError('general_toast_lifetime')"></p>
          </div>
        </fieldset>

        <div class="grid grid-cols-12 gap-4">
          <label id="default-timezone-label" class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.default_timezone')}}</label>
          <div class="col-span-12 md:col-span-8 flex flex-col gap-1">
            <TimezoneSelect
              aria-labelledby="default-timezone-label"
              v-model="settings.general_default_timezone"
              required
              :invalid="formErrors.fieldInvalid('general_default_timezone')"
              :disabled="disabled"
              :placeholder="$t('admin.settings.default_timezone')"
              @loading-error="(value) => timezonesLoadingError = value"
              @busy="(value) => timezonesLoading = value"
            />
            <p class="p-error" v-html="formErrors.fieldError('general_default_timezone')"></p>
          </div>
        </div>

        <Divider/>
        <h4 class="text-xl">{{ $t('admin.settings.banner.title') }}</h4>

        <fieldset class="grid grid-cols-12 gap-4">
          <legend class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.banner.enabled')}}</legend>
          <div class="col-span-12 md:col-span-8 flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <ToggleSwitch
                inputId="banner-enabled"
                v-model="settings.banner_enabled"
                binary
                :disabled="disabled"
                :invalid="formErrors.fieldInvalid('banner_enabled')"
              />
              <label for="banner-enabled">{{ $t('app.enable') }}</label>
            </div>
            <p class="p-error" v-html="formErrors.fieldError('banner_enabled')"></p>
          </div>
        </fieldset>

        <fieldset class="grid grid-cols-12 gap-4">
          <legend class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.banner.preview')}}</legend>
          <div class="col-span-12 md:col-span-8">
            <AppBanner
              :background="settings.banner_background"
              :color="settings.banner_color"
              :enabled="settings.banner_enabled"
              :icon="settings.banner_icon"
              :link="settings.banner_link"
              :message="settings.banner_message"
              :title="settings.banner_title"
              :link-target="settings.banner_link_target"
              :link-text="settings.banner_link_text"
              :link-style="settings.banner_link_style"
            />
          </div>
        </fieldset>

        <div class="grid grid-cols-12 gap-4">
          <label for="banner-title" class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.banner.banner_title')}}</label>
          <div class="col-span-12 md:col-span-8 flex flex-col gap-1">
            <InputText
              id="banner-title"
              v-model="settings.banner_title"
              type="text"
              :invalid="formErrors.fieldInvalid('banner_title')"
              :disabled="disabled"
            />
            <p class="p-error" v-html="formErrors.fieldError('banner_title')"></p>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-4">
          <label for="banner-icon" class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.banner.icon')}}</label>
          <div class="col-span-12 md:col-span-8 flex flex-col gap-1">
            <InputText
              id="banner-icon"
              v-model="settings.banner_icon"
              type="text"
              :invalid="formErrors.fieldInvalid('banner_icon')"
              :disabled="disabled"
              aria-describedby="banner-icon-help"
            />
            <small id="banner-icon-help">{{ $t('admin.settings.banner.icon_description') }}</small>
            <p class="p-error" v-html="formErrors.fieldError('banner_icon')"></p>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-4">
          <label for="banner-message" class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.banner.message')}}</label>
          <div class="col-span-12 md:col-span-8 flex flex-col gap-1">
            <Textarea
              id="banner-message"
              v-model="settings.banner_message"
              rows="3"
              :invalid="formErrors.fieldInvalid('banner_message')"
              :disabled="disabled"
            />
            <p class="p-error" v-html="formErrors.fieldError('banner_message')"></p>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-4">
          <label for="banner-link" class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.banner.link')}}</label>
          <div class="col-span-12 md:col-span-8 flex flex-col gap-1">
            <InputText
              id="banner-link"
              v-model="settings.banner_link"
              type="text"
              :invalid="formErrors.fieldInvalid('banner_link')"
              :disabled="disabled"
            />
            <p class="p-error" v-html="formErrors.fieldError('banner_link')"></p>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-4">
          <label for="banner-link-text" class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.banner.link_text')}}</label>
          <div class="col-span-12 md:col-span-8 flex flex-col gap-1">
            <InputText
              id="banner-link-text"
              v-model="settings.banner_link_text"
              type="text"
              :invalid="formErrors.fieldInvalid('banner_link_text')"
              :disabled="disabled"
            />
            <p class="p-error" v-html="formErrors.fieldError('banner_link_text')"></p>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-4">
          <label for="banner-link-style" class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.banner.link_style')}}</label>
          <div class="col-span-12 md:col-span-8 flex flex-col gap-1">
            <Select
              input-id="banner-link-style"
              v-model="settings.banner_link_style"
              :options="linkBtnStyles"
              :placeholder="$t('admin.settings.banner.select_link_style')"
              optionLabel="text"
              optionValue="value"
              :invalid="formErrors.fieldInvalid('banner_link_style')"
              :disabled="disabled"
            />
            <p class="p-error" v-html="formErrors.fieldError('banner_link_style')"></p>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-4">
          <label for="banner-link-target" class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.banner.link_target')}}</label>
          <div class="col-span-12 md:col-span-8 flex flex-col gap-1">
            <Select
              input-id="banner-link-target"
              v-model="settings.banner_link_target"
              :options="linkTargets"
              :placeholder="$t('admin.settings.banner.select_link_target')"
              optionLabel="text"
              optionValue="value"
              :invalid="formErrors.fieldInvalid('banner_link_target')"
              :disabled="disabled"
            />
            <p class="p-error" v-html="formErrors.fieldError('banner_link_target')"></p>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-4">
          <label for="banner-color" class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.banner.color')}}</label>
          <div class="col-span-12 md:col-span-8 flex flex-col gap-1">
            <ColorSelect
              class="my-2"
              :disabled='disabled'
              :colors="textColors"
              v-model="settings.banner_color"
            />
            <label for="banner-color">{{ $t('admin.room_types.custom_color') }}</label>
            <InputText
              id="banner-color"
              v-model="settings.banner_color"
              type="text"
              :invalid="formErrors.fieldInvalid('banner_color')"
              :disabled="disabled"
            />
            <p class="p-error" v-html="formErrors.fieldError('banner_color')"></p>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-4">
          <label for="banner-background" class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.banner.background')}}</label>
          <div class="col-span-12 md:col-span-8 flex flex-col gap-1">
            <ColorSelect
              class="my-2"
              :disabled='disabled'
              :colors="colors.getAllColors()"
              v-model="settings.banner_background"
            />
            <label for="banner-background">{{ $t('admin.room_types.custom_color') }}</label>
            <InputText
              id="banner-background"
              v-model="settings.banner_background"
              type="text"
              :invalid="formErrors.fieldInvalid('banner_background')"
              :disabled="disabled"
            />
            <p class="p-error" v-html="formErrors.fieldError('banner_background')"></p>
          </div>
        </div>

        <Divider/>
        <h4 class="text-xl">{{ $t('app.rooms') }}</h4>

        <fieldset class="grid grid-cols-12 gap-4">
          <legend class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.room_limit.title')}}</legend>
          <div class="col-span-12 md:col-span-8 flex flex-col gap-1">
            <div class="flex flex-wrap gap-4">
              <div class="flex items-center">
                <RadioButton
                  v-model="roomLimitMode"
                  inputId="room-limit-mode-unlimited"
                  name="room-limit-mode"
                  value="unlimited"
                  :disabled="disabled"
                  @update:modelValue="roomLimitModeChanged"
                  :pt="{
                    input: {
                       'aria-describedby':'room-limit-custom-help'
                    }
                  }"
                />
                <label for="room-limit-mode-unlimited" class="ml-2">{{ $t('app.unlimited') }}</label>
              </div>
              <div class="flex items-center">
                <RadioButton
                  v-model="roomLimitMode"
                  inputId="room-limit-mode-custom"
                  name="room-limit-mode"
                  value="custom"
                  :disabled="disabled"
                  @update:modelValue="roomLimitModeChanged"
                  :pt="{
                    input: {
                       'aria-describedby':'room-limit-custom-help'
                    }
                  }"
                />
                <label for="room-limit-mode-custom" id="room-limit-mode-custom-label" class="ml-2">{{ $t('admin.roles.room_limit.custom') }}</label>
              </div>
            </div>
            <InputText
              v-if="roomLimitMode === 'custom'"
              class="mt-1"
              id="room-limit-custom"
              v-model.number="settings.room_limit"
              min="0"
              max="100"
              type="number"
              :invalid="formErrors.fieldInvalid('room_limit')"
              :disabled="disabled"
              aria-labelledby="room-limit-mode-custom-label"
              aria-describedby="room-limit-custom-help"
            />
            <small id="room-limit-custom-help">{{ $t('admin.settings.room_limit.description') }}</small>
            <p class="p-error" v-html="formErrors.fieldError('room_limit')"></p>
          </div>
        </fieldset>

        <div class="grid grid-cols-12 gap-4">
          <label id="room-token-expiration-label" class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.room_token_expiration.title')}}</label>
          <div class="col-span-12 md:col-span-8 flex flex-col gap-1">
            <Select
              v-model="settings.room_token_expiration"
              :options="timePeriods"
              optionLabel="text"
              optionValue="value"
              :invalid="formErrors.fieldInvalid('room_token_expiration')"
              :disabled="disabled"
              aria-labelledby="room-token-expiration-label"
              :pt="{
                    input: {
                       'aria-describedby':'room-token-expiration-help'
                    }
                  }"
            />
            <small id="room-token-expiration-help">{{ $t('admin.settings.room_token_expiration.description') }}</small>
            <p class="p-error" v-html="formErrors.fieldError('room_token_expiration')"></p>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-4">
          <label id="room-auto-delete-deadline-period-label" class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.room_auto_delete.deadline_period.title')}}</label>
          <div class="col-span-12 md:col-span-8 flex flex-col gap-1">
            <Select
              v-model="settings.room_auto_delete_deadline_period"
              :options="roomDeleteDeadlineOptions"
              optionLabel="text"
              optionValue="value"
              :invalid="formErrors.fieldInvalid('room_auto_delete_deadline_period')"
              :disabled="disabled"
              aria-labelledby="room-auto-delete-deadline-period-label"
              :pt="{
                    input: {
                       'aria-describedby':'room-auto-delete-deadline-period-help'
                    }
                  }"
            />
            <small id="room-auto-delete-deadline-period-help">{{ $t('admin.settings.room_auto_delete.deadline_period.description') }}</small>
            <p class="p-error" v-html="formErrors.fieldError('room_auto_delete_deadline_period')"></p>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-4">
          <label id="room-auto-delete-inactive-period-label" class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.room_auto_delete.inactive_period.title')}}</label>
          <div class="col-span-12 md:col-span-8 flex flex-col gap-1">
            <Select
              v-model="settings.room_auto_delete_inactive_period"
              :options="timePeriods"
              optionLabel="text"
              optionValue="value"
              :invalid="formErrors.fieldInvalid('room_auto_delete_inactive_period')"
              :disabled="disabled"
              aria-labelledby="room-auto-delete-inactive-period-label"
              :pt="{
                    input: {
                       'aria-describedby':'room-auto-delete-inactive-period-help'
                    }
                  }"
            />
            <small id="room-auto-delete-inactive-period-help">{{ $t('admin.settings.room_auto_delete.inactive_period.description') }}</small>
            <p class="p-error" v-html="formErrors.fieldError('room_auto_delete_inactive_period')"></p>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-4">
          <label id="room-auto-delete-never-used-period-label" class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.room_auto_delete.never_used_period.title')}}</label>
          <div class="col-span-12 md:col-span-8 flex flex-col gap-1">
            <Select
              v-model="settings.room_auto_delete_never_used_period"
              :options="timePeriods"
              optionLabel="text"
              optionValue="value"
              :invalid="formErrors.fieldInvalid('room_auto_delete_never_used_period')"
              :disabled="disabled"
              aria-labelledby="room-auto-delete-never-used-period-label"
              :pt="{
                    input: {
                       'aria-describedby':'room-auto-delete-never-used-period-help'
                    }
                  }"
            />
            <small id="room-auto-delete-never-used-period-help">{{ $t('admin.settings.room_auto_delete.never_used_period.description') }}</small>
            <p class="p-error" v-html="formErrors.fieldError('room_auto_delete_never_used_period')"></p>
          </div>
        </div>

        <Divider/>
        <h4 class="text-xl">{{ $t('app.users') }}</h4>

        <fieldset class="grid grid-cols-12 gap-4">
          <legend class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.password_change_allowed')}}</legend>
          <div class="col-span-12 md:col-span-8 flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <ToggleSwitch
                inputId="password-change-allowed"
                v-model="settings.user_password_change_allowed"
                binary
                :disabled="disabled"
                :invalid="formErrors.fieldInvalid('user_password_change_allowed')"
              />
              <label for="password-change-allowed">{{ $t('app.enable') }}</label>
            </div>
            <p class="p-error" v-html="formErrors.fieldError('user_password_change_allowed')"></p>
          </div>
        </fieldset>

        <Divider/>
        <h4 class="text-xl">{{ $t('admin.settings.attendance_and_statistics_title') }}</h4>

        <fieldset class="grid grid-cols-12 gap-4">
          <legend class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.statistics.servers.enabled_title')}}</legend>
          <div class="col-span-12 md:col-span-8 flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <ToggleSwitch
                inputId="statistics-servers-enabled"
                v-model="settings.recording_server_usage_enabled"
                binary
                :disabled="disabled"
                :invalid="formErrors.fieldInvalid('recording_server_usage_enabled')"
              />
              <label for="statistics-servers-enabled">{{ $t('app.enable') }}</label>
            </div>
            <p class="p-error" v-html="formErrors.fieldError('recording_server_usage_enabled')"></p>
          </div>
        </fieldset>

        <div class="grid grid-cols-12 gap-4">
          <label id="statistics-servers-retention-period-label" class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.statistics.servers.retention_period_title')}}</label>
          <div class="col-span-12 md:col-span-8 flex flex-col gap-1">
            <Select
              v-model="settings.recording_server_usage_retention_period"
              :options="timePeriods"
              optionLabel="text"
              optionValue="value"
              :invalid="formErrors.fieldInvalid('recording_server_usage_retention_period')"
              :disabled="disabled"
              aria-labelledby="statistics-servers-retention-period-label"
            />
            <p class="p-error" v-html="formErrors.fieldError('recording_server_usage_retention_period')"></p>
          </div>
        </div>

        <fieldset class="grid grid-cols-12 gap-4">
          <legend class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.statistics.meetings.enabled_title')}}</legend>
          <div class="col-span-12 md:col-span-8 flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <ToggleSwitch
                inputId="statistics-meetings-enabled"
                v-model="settings.recording_meeting_usage_enabled"
                binary
                :disabled="disabled"
                :invalid="formErrors.fieldInvalid('recording_meeting_usage_enabled')"
              />
              <label for="statistics-meetings-enabled">{{ $t('app.enable') }}</label>
            </div>
            <p class="p-error" v-html="formErrors.fieldError('recording_meeting_usage_enabled')"></p>
          </div>
        </fieldset>

        <div class="grid grid-cols-12 gap-4">
          <label id="statistics-meetings-retention-period-label" class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.statistics.meetings.retention_period_title')}}</label>
          <div class="col-span-12 md:col-span-8 flex flex-col gap-1">
            <Select
              v-model="settings.recording_meeting_usage_retention_period"
              :options="timePeriods"
              optionLabel="text"
              optionValue="value"
              :invalid="formErrors.fieldInvalid('recording_meeting_usage_retention_period')"
              :disabled="disabled"
              aria-labelledby="statistics-meetings-retention-period-label"
            />
            <p class="p-error" v-html="formErrors.fieldError('recording_meeting_usage_retention_period')"></p>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-4">
          <label id="attendance-retention-period-label" class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.attendance.retention_period_title')}}</label>
          <div class="col-span-12 md:col-span-8 flex flex-col gap-1">
            <Select
              v-model="settings.recording_attendance_retention_period"
              :options="timePeriods"
              optionLabel="text"
              optionValue="value"
              :invalid="formErrors.fieldInvalid('recording_attendance_retention_period')"
              :disabled="disabled"
              aria-labelledby="attendance-retention-period-label"
            />
            <p class="p-error" v-html="formErrors.fieldError('recording_attendance_retention_period')"></p>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-4">
          <label id="recording-retention-period-label" class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.recording.retention_period_title')}}</label>
          <div class="col-span-12 md:col-span-8 flex flex-col gap-1">
            <Select
              v-model="settings.recording_recording_retention_period"
              :options="recordingRetentionPeriods"
              optionLabel="text"
              optionValue="value"
              :invalid="formErrors.fieldInvalid('recording_recording_retention_period')"
              :disabled="disabled"
              aria-labelledby="recording-retention-period-label"
            />
            <p class="p-error" v-html="formErrors.fieldError('recording_recording_retention_period')"></p>
          </div>
        </div>

        <Divider/>
        <h4 class="text-xl">{{ $t('admin.settings.bbb.title') }}</h4>

        <fieldset class="grid grid-cols-12 gap-4">
          <legend id="bbb-logo-label" class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.logo.title')}}</legend>
          <div class="col-span-12 md:col-span-8">
            <SettingsImageSelector
              v-model:image-url="settings.bbb_logo"
              v-model:image="uploadBBBLogoFile"
              v-model:image-deleted="bbbLogoDeleted"
              :disabled="disabled"
              :readonly="viewOnly"
              :max-file-size="500000"
              preview-width="150"
              show-delete
              :preview-alt="$t('admin.settings.bbb.logo.alt')"
              :allowed-extensions="['jpg', 'jpeg', 'png', 'gif', 'svg']"
              inputId="bbb-logo"
              :url-invalid="formErrors.fieldInvalid('bbb_logo')"
              :file-invalid="formErrors.fieldInvalid('bbb_logo_file')"
              :url-error="formErrors.fieldError('bbb_logo')"
              :file-error="formErrors.fieldError('bbb_logo_file')"
            />
          </div>
        </fieldset>

        <fieldset class="grid grid-cols-12 gap-4">
          <legend id="bbb-style-label" class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.bbb.style.title')}}</legend>
          <div class="col-span-12 md:col-span-8">
            <SettingsFileSelector
              v-model:file-url="settings.bbb_style"
              v-model:file="bbbStyle"
              v-model:file-deleted="bbbStyleDeleted"
              :disabled="disabled"
              :readonly="viewOnly"
              :max-file-size="500000"
              show-delete
              :allowed-extensions="['css']"
              :file-invalid="formErrors.fieldInvalid('bbb_style')"
              :file-error="formErrors.fieldError('bbb_style')"
            />
          </div>
        </fieldset>

        <fieldset class="grid grid-cols-12 gap-4">
          <legend id="default-presentation-label" class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.settings.default_presentation')}}</legend>
          <div class="col-span-12 md:col-span-8">
            <SettingsFileSelector
              v-model:file-url="settings.bbb_default_presentation"
              v-model:file="defaultPresentation"
              v-model:file-deleted="defaultPresentationDeleted"
              :disabled="disabled"
              :readonly="viewOnly"
              :max-file-size="settingsStore.getSetting('bbb.max_filesize')*1000"
              show-delete
              :allowed-extensions="String(settingsStore.getSetting('bbb.file_mimes')).split(',')"
              :file-invalid="formErrors.fieldInvalid('bbb_default_presentation')"
              :file-error="formErrors.fieldError('bbb_default_presentation')"
            />
          </div>
        </fieldset>
        </OverlayComponent>
        <div v-if="!viewOnly">
        <Divider/>
          <div class="flex justify-end">
            <Button
                severity="success"
                type="submit"
                :disabled="disabled || timezonesLoadingError || timezonesLoading"
                :loading="isBusy"
                icon="fa-solid fa-save"
                :label="$t('app.save')"
              />
          </div>
        </div>
      </form>
  </div>
</template>

<script setup>
import env from '../env';
import { useSettingsStore } from '../stores/settings';
import { computed, onMounted, ref } from 'vue';
import { useApi } from '../composables/useApi.js';
import { useFormErrors } from '../composables/useFormErrors.js';
import { useUserPermissions } from '../composables/useUserPermission.js';
import { useColors } from '../composables/useColors.js';
import { useI18n } from 'vue-i18n';

const roomLimitMode = ref('custom');
const toastLifetimeMode = ref('custom');

const uploadFaviconFile = ref(null);
const uploadLogoFile = ref(null);
const uploadBBBLogoFile = ref(null);
const bbbLogoDeleted = ref(false);
const defaultPresentation = ref(null);
const defaultPresentationDeleted = ref(false);
const bbbStyle = ref(null);
const bbbStyleDeleted = ref(false);

const isBusy = ref(false);
const modelLoadingError = ref(false);

const settings = ref({});
const meta = ref({});

const textColors = ref(['#FFFFFF', '#000000']);
const timezonesLoading = ref(false);
const timezonesLoadingError = ref(false);

const settingsStore = useSettingsStore();
const api = useApi();
const formErrors = useFormErrors();
const userPermissions = useUserPermissions();
const { t } = useI18n();
const colors = useColors();

/**
 * Input fields are disabled
 */
const disabled = computed(() => {
  return viewOnly.value || isBusy.value || modelLoadingError.value;
});

const viewOnly = computed(() => {
  return !userPermissions.can('update', 'SettingsPolicy');
});

/**
 * Handle get settings data
 */
function getSettings () {
  modelLoadingError.value = false;
  isBusy.value = true;
  api.call('settings')
    .then(response => {
      settings.value = response.data.data;
      meta.value = response.data.meta;
      roomLimitMode.value = (settings.value.general_room_limit === -1 ? 'unlimited' : 'custom');
      toastLifetimeMode.value = (settings.value.general_toast_lifetime === 0 ? 'unlimited' : 'custom');
    })
    .catch((error) => {
      api.error(error);
      modelLoadingError.value = true;
    })
    .finally(() => {
      isBusy.value = false;
    });
}

/**
 * Handle update settings data
 *
 */
function updateSettings () {
  isBusy.value = true;
  formErrors.clear();

  // Build form data
  const formData = new FormData();

  if (uploadFaviconFile.value) {
    formData.append('general_favicon_file', uploadFaviconFile.value);
  } else {
    formData.append('general_favicon', settings.value.general_favicon);
  }

  if (uploadLogoFile.value) {
    formData.append('general_logo_file', uploadLogoFile.value);
  } else {
    formData.append('general_logo', settings.value.general_logo);
  }

  if (uploadBBBLogoFile.value) {
    formData.append('bbb_logo_file', uploadBBBLogoFile.value);
  } else if (!bbbLogoDeleted.value && settings.value.bbb_logo != null) {
    formData.append('bbb_logo', settings.value.bbb_logo);
  }

  if (bbbStyle.value !== null) {
    formData.append('bbb_style', bbbStyle.value);
  } else if (bbbStyleDeleted.value) {
    formData.append('bbb_style', '');
  }

  if (defaultPresentation.value !== null) {
    formData.append('bbb_default_presentation', defaultPresentation.value);
  } else if (defaultPresentationDeleted.value) {
    formData.append('bbb_default_presentation', '');
  }

  const exclude = ['general_favicon', 'general_logo', 'bbb_logo', 'bbb_style', 'bbb_default_presentation'];
  Object.keys(settings.value).forEach(key => {
    if (exclude.includes(key)) {
      return;
    }
    let val = settings.value[key];

    // Since the FormData always strings boolean and empty values must be
    // changed so that they can be handled correctly by the backend.
    if (typeof (val) === 'boolean') {
      val = val ? 1 : 0;
    } else if (val == null) {
      val = '';
    }

    formData.append(key, val);
  });

  formData.append('_method', 'PUT');

  api.call('settings',
    {
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then(response => {
      settingsStore.getSettings();
      uploadLogoFile.value = null;
      uploadFaviconFile.value = null;
      defaultPresentation.value = null;
      defaultPresentationDeleted.value = false;
      uploadBBBLogoFile.value = null;
      bbbStyle.value = null;
      bbbStyleDeleted.value = false;
      bbbLogoDeleted.value = false;

      // update form input
      settings.value = response.data.data;
      roomLimitMode.value = (settings.value.general_room_limit === -1 ? 'unlimited' : 'custom');
      toastLifetimeMode.value = (settings.value.general_toast_lifetime === 0 ? 'unlimited' : 'custom');
    })
    .catch((error) => {
      if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
        formErrors.set(error.response.data.errors);
      } else {
        api.error(error);
      }
    })
    .finally(() => {
      isBusy.value = false;
    });
}

const linkBtnStyles = computed(() => {
  return (meta.value.link_btn_styles || []).map((style) => {
    return { value: style, text: t(`app.button_styles.${style}`) };
  });
});

const linkTargets = computed(() => {
  return (meta.value.link_targets || []).map((target) => {
    return { value: target, text: t(`app.link_targets.${target}`) };
  });
});

/**
 * Sets the roomLimit on the model depending on the selected radio button.
 *
 * @param value Value of the radio button that was selected.
 */
function roomLimitModeChanged (value) {
  switch (value) {
    case 'unlimited':
      settings.value.general_room_limit = -1;
      break;
    case 'custom':
      settings.value.general_room_limit = 0;
      break;
  }
}

/**
 * Sets the toastLifetime on the model depending on the selected radio button.
 *
 * @param value Value of the radio button that was selected.
 */
function toastLifetimeModeChanged (value) {
  switch (value) {
    case 'unlimited':
      settings.value.general_toast_lifetime = 0;
      break;
    case 'custom':
      settings.value.general_toast_lifetime = 5;
      break;
  }
}

/**
 * Options for time period selects (room token expiration, room auto delete, etc.)
 */
const timePeriods = computed(() => {
  return [
    { value: 7, text: t('admin.settings.one_week') },
    { value: 14, text: t('admin.settings.two_weeks') },
    { value: 30, text: t('admin.settings.one_month') },
    { value: 90, text: t('admin.settings.three_month') },
    { value: 180, text: t('admin.settings.six_month') },
    { value: 365, text: t('admin.settings.one_year') },
    { value: 730, text: t('admin.settings.two_years') },
    { value: -1, text: t('app.unlimited') }
  ];
});

/**
 * Options for the recording retention period select.
 */
const recordingRetentionPeriods = computed(() => {
  return timePeriods.value.filter((period) => {
    if (meta.value.recording_max_retention_period === -1) {
      return true;
    }

    return period.value <= meta.value.recording_max_retention_period && period.value !== -1;
  });
});

/**
 * Options for the room auto deletion deadline select.
 */
const roomDeleteDeadlineOptions = computed(() => {
  return timePeriods.value.filter((period) => period.value <= 30 && period.value !== -1);
});

onMounted(() => {
  getSettings();
});
</script>

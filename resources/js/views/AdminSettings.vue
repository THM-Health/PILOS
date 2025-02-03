<template>
  <div>
    <form @submit.prevent="updateSettings">
      <OverlayComponent :show="isBusy || modelLoadingError" :no-center="true">
        <template #overlay>
          <div class="mt-6 flex justify-center">
            <LoadingRetryButton
              :error="modelLoadingError"
              @click="getSettings"
            />
          </div>
        </template>

        <div class="flex flex-col gap-6">
          <AdminPanel :title="$t('admin.settings.application')">
            <div
              class="grid grid-cols-12 gap-4"
              data-test="application-name-field"
            >
              <label
                for="application-name"
                class="col-span-12 md:col-span-4 md:mb-0"
                >{{ $t("admin.settings.name.title") }}</label
              >
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <InputText
                  id="application-name"
                  v-model="settings.general_name"
                  type="text"
                  required
                  :invalid="formErrors.fieldInvalid('general_name')"
                  :disabled="disabled"
                  aria-describedby="application-name-help"
                />
                <small id="application-name-help">{{
                  $t("admin.settings.name.description")
                }}</small>
                <FormError :errors="formErrors.fieldError('general_name')" />
              </div>
            </div>
            <div class="grid grid-cols-12 gap-4" data-test="help-url-field">
              <label for="help-url" class="col-span-12 md:col-span-4 md:mb-0">{{
                $t("admin.settings.help_url.title")
              }}</label>
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <InputText
                  id="help-url"
                  v-model="settings.general_help_url"
                  type="text"
                  :invalid="formErrors.fieldInvalid('general_help_url')"
                  :disabled="disabled"
                  aria-describedby="help-url-help"
                />
                <small id="help-url-help">{{
                  $t("admin.settings.help_url.description")
                }}</small>
                <FormError
                  :errors="formErrors.fieldError('general_help_url')"
                />
              </div>
            </div>
            <div
              class="grid grid-cols-12 gap-4"
              data-test="legal-notice-url-field"
            >
              <label
                for="legal-notice-url"
                class="col-span-12 md:col-span-4 md:mb-0"
                >{{ $t("admin.settings.legal_notice_url.title") }}</label
              >
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <InputText
                  id="legal-notice-url"
                  v-model="settings.general_legal_notice_url"
                  type="text"
                  :invalid="formErrors.fieldInvalid('general_legal_notice_url')"
                  :disabled="disabled"
                  aria-describedby="legal-notice-url-help"
                />
                <small id="legal-notice-url-help">{{
                  $t("admin.settings.legal_notice_url.description")
                }}</small>
                <FormError
                  :errors="formErrors.fieldError('general_legal_notice_url')"
                />
              </div>
            </div>
            <div
              class="grid grid-cols-12 gap-4"
              data-test="privacy-policy-url-field"
            >
              <label
                for="privacy-policy-url"
                class="col-span-12 md:col-span-4 md:mb-0"
                >{{ $t("admin.settings.privacy_policy_url.title") }}</label
              >
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <InputText
                  id="privacy-policy-url"
                  v-model="settings.general_privacy_policy_url"
                  type="text"
                  :invalid="
                    formErrors.fieldInvalid('general_privacy_policy_url')
                  "
                  :disabled="disabled"
                  aria-describedby="privacy-policy-url-help"
                />
                <small id="privacy-policy-url-help">{{
                  $t("admin.settings.privacy_policy_url.description")
                }}</small>
                <FormError
                  :errors="formErrors.fieldError('general_privacy_policy_url')"
                />
              </div>
            </div>
            <div
              class="grid grid-cols-12 gap-4"
              data-test="pagination-page-size-field"
            >
              <label
                for="pagination-page-size"
                class="col-span-12 md:col-span-4 md:mb-0"
                >{{ $t("admin.settings.pagination_page_size.title") }}</label
              >
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <InputText
                  id="pagination-page-size"
                  v-model.number="settings.general_pagination_page_size"
                  required
                  min="1"
                  max="100"
                  type="number"
                  :invalid="
                    formErrors.fieldInvalid('general_pagination_page_size')
                  "
                  :disabled="disabled"
                  aria-describedby="pagination-page-size-help"
                />
                <small id="pagination-page-size-help">{{
                  $t("admin.settings.pagination_page_size.description")
                }}</small>
                <FormError
                  :errors="
                    formErrors.fieldError('general_pagination_page_size')
                  "
                />
              </div>
            </div>
            <fieldset
              class="grid grid-cols-12 gap-4"
              data-test="toast-lifetime-field"
            >
              <legend class="col-span-12 md:col-span-4 md:mb-0">
                {{ $t("admin.settings.toast_lifetime.title") }}
              </legend>
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <div class="flex flex-wrap gap-4">
                  <div
                    class="flex items-center"
                    data-test="toast-lifetime-mode-unlimited-field"
                  >
                    <RadioButton
                      v-model="toastLifetimeMode"
                      input-id="toast-lifetime-mode-unlimited"
                      name="toast-lifetime-mode"
                      value="unlimited"
                      :disabled="disabled"
                      :pt="{
                        input: {
                          'aria-describedby': 'toast-lifetime-custom-help',
                        },
                      }"
                      @update:model-value="toastLifetimeModeChanged"
                    />
                    <label for="toast-lifetime-mode-unlimited" class="ml-2">{{
                      $t("app.unlimited")
                    }}</label>
                  </div>
                  <div
                    class="flex items-center"
                    data-test="toast-lifetime-mode-custom-field"
                  >
                    <RadioButton
                      v-model="toastLifetimeMode"
                      input-id="toast-lifetime-mode-custom"
                      name="toast-lifetime-mode"
                      value="custom"
                      :disabled="disabled"
                      :pt="{
                        input: {
                          'aria-describedby': 'toast-lifetime-custom-help',
                        },
                      }"
                      @update:model-value="toastLifetimeModeChanged"
                    />
                    <label
                      id="toast-lifetime-custom-label"
                      for="toast-lifetime-mode-custom"
                      class="ml-2"
                      >{{ $t("admin.settings.toast_lifetime.custom") }}</label
                    >
                  </div>
                </div>
                <InputText
                  v-if="toastLifetimeMode === 'custom'"
                  v-model.number="settings.general_toast_lifetime"
                  class="mt-1"
                  min="1"
                  max="30"
                  type="number"
                  :invalid="formErrors.fieldInvalid('general_toast_lifetime')"
                  :disabled="disabled"
                  aria-labelledby="toast-lifetime-custom-label"
                  aria-describedby="toast-lifetime-custom-help"
                  data-test="toast-lifetime-custom-input"
                />
                <small id="toast-lifetime-custom-help">{{
                  $t("admin.settings.toast_lifetime.description")
                }}</small>
                <FormError
                  :errors="formErrors.fieldError('general_toast_lifetime')"
                />
              </div>
            </fieldset>
            <div
              class="grid grid-cols-12 gap-4"
              data-test="default-timezone-field"
            >
              <label
                id="default-timezone-label"
                class="col-span-12 md:col-span-4 md:mb-0"
                >{{ $t("admin.settings.default_timezone") }}</label
              >
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <TimezoneSelect
                  v-model="settings.general_default_timezone"
                  aria-labelledby="default-timezone-label"
                  required
                  :invalid="formErrors.fieldInvalid('general_default_timezone')"
                  :disabled="disabled"
                  :placeholder="$t('admin.settings.default_timezone')"
                  @loading-error="(value) => (timezonesLoadingError = value)"
                  @busy="(value) => (timezonesLoading = value)"
                />
                <FormError
                  :errors="formErrors.fieldError('general_default_timezone')"
                />
              </div>
            </div>
            <fieldset
              class="grid grid-cols-12 gap-4"
              data-test="no-welcome-page-field"
            >
              <legend class="col-span-12 md:col-span-4 md:mb-0">
                {{ $t("admin.settings.no_welcome_page") }}
              </legend>
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <div class="flex items-center gap-2">
                  <ToggleSwitch
                    v-model="settings.general_no_welcome_page"
                    input-id="no-welcome-page"
                    binary
                    :disabled="disabled"
                    :invalid="
                      formErrors.fieldInvalid('general_no_welcome_page')
                    "
                  />
                  <label for="no-welcome-page">{{ $t("app.enable") }}</label>
                </div>
                <FormError
                  :errors="formErrors.fieldError('general_no_welcome_page')"
                />
              </div>
            </fieldset>
          </AdminPanel>

          <AdminPanel :title="$t('admin.settings.theme.title')">
            <fieldset class="grid grid-cols-12 gap-4" data-test="favicon-field">
              <legend
                id="favicon-label"
                class="col-span-12 md:col-span-4 md:mb-0"
              >
                {{ $t("admin.settings.favicon.title") }}
              </legend>
              <div class="col-span-12 md:col-span-8">
                <SettingsImageSelector
                  v-model:image-url="settings.theme_favicon"
                  v-model:image="uploadFaviconFile"
                  :disabled="disabled"
                  :readonly="viewOnly"
                  :max-file-size="500000"
                  preview-width="32"
                  preview-bg-class="bg-surface-0"
                  :preview-alt="$t('admin.settings.favicon.alt')"
                  :allowed-extensions="['ico']"
                  input-id="favicon"
                  :url-invalid="formErrors.fieldInvalid('theme_favicon')"
                  :file-invalid="formErrors.fieldInvalid('theme_favicon_file')"
                  :url-error="formErrors.fieldError('theme_favicon')"
                  :file-error="formErrors.fieldError('theme_favicon_file')"
                />
              </div>
            </fieldset>
            <fieldset
              class="grid grid-cols-12 gap-4"
              data-test="favicon-dark-field"
            >
              <legend
                id="favicon-dark-label"
                class="col-span-12 md:col-span-4 md:mb-0"
              >
                {{ $t("admin.settings.favicon_dark.title") }}
              </legend>
              <div class="col-span-12 md:col-span-8">
                <SettingsImageSelector
                  v-model:image-url="settings.theme_favicon_dark"
                  v-model:image="uploadFaviconDarkFile"
                  :disabled="disabled"
                  :readonly="viewOnly"
                  :max-file-size="500000"
                  preview-width="32"
                  preview-bg-class="bg-surface-900"
                  :preview-alt="$t('admin.settings.favicon.alt')"
                  :allowed-extensions="['ico']"
                  input-id="favicon-dark"
                  :url-invalid="formErrors.fieldInvalid('theme_favicon_dark')"
                  :file-invalid="
                    formErrors.fieldInvalid('theme_favicon_dark_file')
                  "
                  :url-error="formErrors.fieldError('theme_favicon_dark')"
                  :file-error="formErrors.fieldError('theme_favicon_dark_file')"
                />
              </div>
            </fieldset>
            <fieldset class="grid grid-cols-12 gap-4" data-test="logo-field">
              <legend id="logo-label" class="col-span-12 md:col-span-4 md:mb-0">
                {{ $t("admin.settings.logo.title") }}
              </legend>
              <div class="col-span-12 md:col-span-8">
                <SettingsImageSelector
                  v-model:image-url="settings.theme_logo"
                  v-model:image="uploadLogoFile"
                  :disabled="disabled"
                  :readonly="viewOnly"
                  :max-file-size="500000"
                  preview-width="150"
                  preview-bg-class="bg-surface-0"
                  :preview-alt="$t('admin.settings.logo.alt')"
                  :allowed-extensions="['jpg', 'jpeg', 'png', 'gif', 'svg']"
                  input-id="logo"
                  :url-invalid="formErrors.fieldInvalid('theme_logo')"
                  :file-invalid="formErrors.fieldInvalid('theme_logo_file')"
                  :url-error="formErrors.fieldError('theme_logo')"
                  :file-error="formErrors.fieldError('theme_logo_file')"
                />
              </div>
            </fieldset>
            <fieldset
              class="grid grid-cols-12 gap-4"
              data-test="logo-dark-field"
            >
              <legend
                id="logo-dark-label"
                class="col-span-12 md:col-span-4 md:mb-0"
              >
                {{ $t("admin.settings.logo_dark.title") }}
              </legend>
              <div class="col-span-12 md:col-span-8">
                <SettingsImageSelector
                  v-model:image-url="settings.theme_logo_dark"
                  v-model:image="uploadLogoDarkFile"
                  :disabled="disabled"
                  :readonly="viewOnly"
                  :max-file-size="500000"
                  preview-width="150"
                  preview-bg-class="bg-surface-900"
                  :preview-alt="$t('admin.settings.logo.alt')"
                  :allowed-extensions="['jpg', 'jpeg', 'png', 'gif', 'svg']"
                  input-id="logo-dark"
                  :url-invalid="formErrors.fieldInvalid('theme_logo_dark')"
                  :file-invalid="
                    formErrors.fieldInvalid('theme_logo_dark_file')
                  "
                  :url-error="formErrors.fieldError('theme_logo_dark')"
                  :file-error="formErrors.fieldError('theme_logo_dark_file')"
                />
              </div>
            </fieldset>
            <fieldset
              class="grid grid-cols-12 gap-4"
              data-test="primary-color-field"
            >
              <legend class="col-span-12 md:col-span-4 md:mb-0">
                {{ $t("admin.settings.theme.primary_color") }}
              </legend>
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <ColorSelect
                  v-model="settings.theme_primary_color"
                  class="my-2"
                  :disabled="disabled"
                  :colors="colors.getAllColors()"
                />
                <label for="theme-primary-color">{{
                  $t("admin.settings.theme.custom_color")
                }}</label>
                <InputText
                  id="theme-primary-color"
                  v-model="settings.theme_primary_color"
                  type="text"
                  :invalid="formErrors.fieldInvalid('theme_primary_color')"
                  :disabled="disabled"
                />
                <FormError
                  :errors="formErrors.fieldError('theme_primary_color')"
                />
              </div>
            </fieldset>
            <fieldset
              class="grid grid-cols-12 gap-4"
              data-test="theme-rounded-field"
            >
              <legend class="col-span-12 md:col-span-4 md:mb-0">
                {{ $t("admin.settings.theme.rounded") }}
              </legend>
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <div class="flex items-center gap-2">
                  <ToggleSwitch
                    v-model="settings.theme_rounded"
                    input-id="theme-rounded"
                    binary
                    :disabled="disabled"
                    :invalid="formErrors.fieldInvalid('theme_rounded')"
                  />
                  <label for="theme-rounded">{{ $t("app.enable") }}</label>
                </div>
                <FormError :errors="formErrors.fieldError('theme_rounded')" />
              </div>
            </fieldset>
          </AdminPanel>

          <AdminPanel :title="$t('admin.settings.banner.title')">
            <fieldset
              class="grid grid-cols-12 gap-4"
              data-test="banner-enabled-field"
            >
              <legend class="col-span-12 md:col-span-4 md:mb-0">
                {{ $t("admin.settings.banner.enabled") }}
              </legend>
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <div class="flex items-center gap-2">
                  <ToggleSwitch
                    v-model="settings.banner_enabled"
                    input-id="banner-enabled"
                    binary
                    :disabled="disabled"
                    :invalid="formErrors.fieldInvalid('banner_enabled')"
                  />
                  <label for="banner-enabled">{{ $t("app.enable") }}</label>
                </div>
                <FormError :errors="formErrors.fieldError('banner_enabled')" />
              </div>
            </fieldset>
            <fieldset
              class="grid grid-cols-12 gap-4"
              data-test="banner-preview-field"
            >
              <legend class="col-span-12 md:col-span-4 md:mb-0">
                {{ $t("admin.settings.banner.preview") }}
              </legend>
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
            <div class="grid grid-cols-12 gap-4" data-test="banner-title-field">
              <label
                for="banner-title"
                class="col-span-12 md:col-span-4 md:mb-0"
                >{{ $t("admin.settings.banner.banner_title") }}</label
              >
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <InputText
                  id="banner-title"
                  v-model="settings.banner_title"
                  type="text"
                  :invalid="formErrors.fieldInvalid('banner_title')"
                  :disabled="disabled"
                />
                <FormError :errors="formErrors.fieldError('banner_title')" />
              </div>
            </div>
            <div class="grid grid-cols-12 gap-4" data-test="banner-icon-field">
              <label
                for="banner-icon"
                class="col-span-12 md:col-span-4 md:mb-0"
                >{{ $t("admin.settings.banner.icon") }}</label
              >
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <InputText
                  id="banner-icon"
                  v-model="settings.banner_icon"
                  type="text"
                  :invalid="formErrors.fieldInvalid('banner_icon')"
                  :disabled="disabled"
                  aria-describedby="banner-icon-help"
                />
                <small id="banner-icon-help">{{
                  $t("admin.settings.banner.icon_description")
                }}</small>
                <FormError :errors="formErrors.fieldError('banner_icon')" />
              </div>
            </div>
            <div
              class="grid grid-cols-12 gap-4"
              data-test="banner-message-field"
            >
              <label
                for="banner-message"
                class="col-span-12 md:col-span-4 md:mb-0"
                >{{ $t("admin.settings.banner.message") }}</label
              >
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <Textarea
                  id="banner-message"
                  v-model="settings.banner_message"
                  rows="3"
                  :invalid="formErrors.fieldInvalid('banner_message')"
                  :disabled="disabled"
                />
                <FormError :errors="formErrors.fieldError('banner_message')" />
              </div>
            </div>
            <div class="grid grid-cols-12 gap-4" data-test="banner-link-field">
              <label
                for="banner-link"
                class="col-span-12 md:col-span-4 md:mb-0"
                >{{ $t("admin.settings.banner.link") }}</label
              >
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <InputText
                  id="banner-link"
                  v-model="settings.banner_link"
                  type="text"
                  :invalid="formErrors.fieldInvalid('banner_link')"
                  :disabled="disabled"
                />
                <FormError :errors="formErrors.fieldError('banner_link')" />
              </div>
            </div>
            <div
              class="grid grid-cols-12 gap-4"
              data-test="banner-link-text-field"
            >
              <label
                for="banner-link-text"
                class="col-span-12 md:col-span-4 md:mb-0"
                >{{ $t("admin.settings.banner.link_text") }}</label
              >
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <InputText
                  id="banner-link-text"
                  v-model="settings.banner_link_text"
                  type="text"
                  :invalid="formErrors.fieldInvalid('banner_link_text')"
                  :disabled="disabled"
                />
                <FormError
                  :errors="formErrors.fieldError('banner_link_text')"
                />
              </div>
            </div>
            <div
              class="grid grid-cols-12 gap-4"
              data-test="banner-link-style-field"
            >
              <label
                id="banner-link-style-label"
                class="col-span-12 md:col-span-4 md:mb-0"
                >{{ $t("admin.settings.banner.link_style") }}</label
              >
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <Select
                  v-model="settings.banner_link_style"
                  data-test="banner-link-style-dropdown"
                  aria-labelledby="banner-link-style-label"
                  :options="linkBtnStyles"
                  :placeholder="$t('admin.settings.banner.select_link_style')"
                  option-label="text"
                  option-value="value"
                  :invalid="formErrors.fieldInvalid('banner_link_style')"
                  :disabled="disabled"
                  :pt="{
                    listContainer: {
                      'data-test': 'banner-link-style-dropdown-items',
                    },
                    option: {
                      'data-test': 'banner-link-style-dropdown-option',
                    },
                  }"
                />
                <FormError
                  :errors="formErrors.fieldError('banner_link_style')"
                />
              </div>
            </div>
            <div
              class="grid grid-cols-12 gap-4"
              data-test="banner-link-target-field"
            >
              <label
                id="banner-link-target-label"
                class="col-span-12 md:col-span-4 md:mb-0"
                >{{ $t("admin.settings.banner.link_target") }}</label
              >
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <Select
                  v-model="settings.banner_link_target"
                  data-test="banner-link-target-dropdown"
                  aria-labelledby="banner-link-target-label"
                  :options="linkTargets"
                  :placeholder="$t('admin.settings.banner.select_link_target')"
                  option-label="text"
                  option-value="value"
                  :invalid="formErrors.fieldInvalid('banner_link_target')"
                  :disabled="disabled"
                  :pt="{
                    listContainer: {
                      'data-test': 'banner-link-target-dropdown-items',
                    },
                    option: {
                      'data-test': 'banner-link-target-dropdown-option',
                    },
                  }"
                />
                <FormError
                  :errors="formErrors.fieldError('banner_link_target')"
                />
              </div>
            </div>
            <fieldset
              class="grid grid-cols-12 gap-4"
              data-test="banner-color-field"
            >
              <legend class="col-span-12 md:col-span-4 md:mb-0">
                {{ $t("admin.settings.banner.color") }}
              </legend>
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <ColorSelect
                  v-model="settings.banner_color"
                  class="my-2"
                  :disabled="disabled"
                  :colors="textColors"
                />
                <label for="banner-color">{{
                  $t("admin.room_types.custom_color")
                }}</label>
                <InputText
                  id="banner-color"
                  v-model="settings.banner_color"
                  type="text"
                  :invalid="formErrors.fieldInvalid('banner_color')"
                  :disabled="disabled"
                />
                <FormError :errors="formErrors.fieldError('banner_color')" />
              </div>
            </fieldset>
            <fieldset
              class="grid grid-cols-12 gap-4"
              data-test="banner-background-field"
            >
              <legend class="col-span-12 md:col-span-4 md:mb-0">
                {{ $t("admin.settings.banner.background") }}
              </legend>
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <ColorSelect
                  v-model="settings.banner_background"
                  class="my-2"
                  :disabled="disabled"
                  :colors="colors.getAllColors()"
                />
                <label for="banner-background">{{
                  $t("admin.room_types.custom_color")
                }}</label>
                <InputText
                  id="banner-background"
                  v-model="settings.banner_background"
                  type="text"
                  :invalid="formErrors.fieldInvalid('banner_background')"
                  :disabled="disabled"
                />
                <FormError
                  :errors="formErrors.fieldError('banner_background')"
                />
              </div>
            </fieldset>
          </AdminPanel>

          <AdminPanel :title="$t('app.rooms')">
            <fieldset
              class="grid grid-cols-12 gap-4"
              data-test="room-limit-field"
            >
              <legend class="col-span-12 md:col-span-4 md:mb-0">
                {{ $t("admin.settings.room_limit.title") }}
              </legend>
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <div
                  class="flex flex-wrap gap-4"
                  data-test="room-limit-mode-unlimited-field"
                >
                  <div class="flex items-center">
                    <RadioButton
                      v-model="roomLimitMode"
                      input-id="room-limit-mode-unlimited"
                      name="room-limit-mode"
                      value="unlimited"
                      :disabled="disabled"
                      :pt="{
                        input: {
                          'aria-describedby': 'room-limit-custom-help',
                        },
                      }"
                      @update:model-value="roomLimitModeChanged"
                    />
                    <label for="room-limit-mode-unlimited" class="ml-2">{{
                      $t("app.unlimited")
                    }}</label>
                  </div>
                  <div
                    class="flex items-center"
                    data-test="room-limit-mode-custom-field"
                  >
                    <RadioButton
                      v-model="roomLimitMode"
                      input-id="room-limit-mode-custom"
                      name="room-limit-mode"
                      value="custom"
                      :disabled="disabled"
                      :pt="{
                        input: {
                          'aria-describedby': 'room-limit-custom-help',
                        },
                      }"
                      @update:model-value="roomLimitModeChanged"
                    />
                    <label
                      id="room-limit-mode-custom-label"
                      for="room-limit-mode-custom"
                      class="ml-2"
                      >{{ $t("admin.roles.room_limit.custom") }}</label
                    >
                  </div>
                </div>
                <InputText
                  v-if="roomLimitMode === 'custom'"
                  id="room-limit-custom"
                  v-model.number="settings.room_limit"
                  class="mt-1"
                  min="0"
                  max="100"
                  type="number"
                  :invalid="formErrors.fieldInvalid('room_limit')"
                  :disabled="disabled"
                  aria-labelledby="room-limit-mode-custom-label"
                  aria-describedby="room-limit-custom-help"
                />
                <small id="room-limit-custom-help">{{
                  $t("admin.settings.room_limit.description")
                }}</small>
                <FormError :errors="formErrors.fieldError('room_limit')" />
              </div>
            </fieldset>
            <div
              class="grid grid-cols-12 gap-4"
              data-test="room-token-expiration-field"
            >
              <label
                id="room-token-expiration-label"
                class="col-span-12 md:col-span-4 md:mb-0"
                >{{ $t("admin.settings.room_token_expiration.title") }}</label
              >
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <Select
                  v-model="settings.room_token_expiration"
                  data-test="room-token-expiration-dropdown"
                  :options="timePeriods"
                  option-label="text"
                  option-value="value"
                  :invalid="formErrors.fieldInvalid('room_token_expiration')"
                  :disabled="disabled"
                  aria-labelledby="room-token-expiration-label"
                  :pt="{
                    input: {
                      'aria-describedby': 'room-token-expiration-help',
                    },
                    listContainer: {
                      'data-test': 'room-token-expiration-dropdown-items',
                    },
                    option: {
                      'data-test': 'room-token-expiration-dropdown-option',
                    },
                  }"
                />
                <small id="room-token-expiration-help">{{
                  $t("admin.settings.room_token_expiration.description")
                }}</small>
                <FormError
                  :errors="formErrors.fieldError('room_token_expiration')"
                />
              </div>
            </div>
            <div
              class="grid grid-cols-12 gap-4"
              data-test="room-auto-delete-deadline-period-field"
            >
              <label
                id="room-auto-delete-deadline-period-label"
                class="col-span-12 md:col-span-4 md:mb-0"
                >{{
                  $t("admin.settings.room_auto_delete.deadline_period.title")
                }}</label
              >
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <Select
                  v-model="settings.room_auto_delete_deadline_period"
                  :options="roomDeleteDeadlineOptions"
                  data-test="room-auto-delete-deadline-dropdown"
                  option-label="text"
                  option-value="value"
                  :invalid="
                    formErrors.fieldInvalid('room_auto_delete_deadline_period')
                  "
                  :disabled="disabled"
                  aria-labelledby="room-auto-delete-deadline-period-label"
                  :pt="{
                    input: {
                      'aria-describedby':
                        'room-auto-delete-deadline-period-help',
                    },
                    listContainer: {
                      'data-test': 'room-auto-delete-deadline-dropdown-items',
                    },
                    option: {
                      'data-test': 'room-auto-delete-deadline-dropdown-option',
                    },
                  }"
                />
                <small id="room-auto-delete-deadline-period-help">{{
                  $t(
                    "admin.settings.room_auto_delete.deadline_period.description",
                  )
                }}</small>
                <FormError
                  :errors="
                    formErrors.fieldError('room_auto_delete_deadline_period')
                  "
                />
              </div>
            </div>
            <div
              class="grid grid-cols-12 gap-4"
              data-test="room-auto-delete-inactive-period-field"
            >
              <label
                id="room-auto-delete-inactive-period-label"
                class="col-span-12 md:col-span-4 md:mb-0"
                >{{
                  $t("admin.settings.room_auto_delete.inactive_period.title")
                }}</label
              >
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <Select
                  v-model="settings.room_auto_delete_inactive_period"
                  data-test="room-auto-delete-inactive-dropdown"
                  :options="timePeriods"
                  option-label="text"
                  option-value="value"
                  :invalid="
                    formErrors.fieldInvalid('room_auto_delete_inactive_period')
                  "
                  :disabled="disabled"
                  aria-labelledby="room-auto-delete-inactive-period-label"
                  :pt="{
                    input: {
                      'aria-describedby':
                        'room-auto-delete-inactive-period-help',
                    },
                    listContainer: {
                      'data-test': 'room-auto-delete-inactive-dropdown-items',
                    },
                    option: {
                      'data-test': 'room-auto-delete-inactive-dropdown-option',
                    },
                  }"
                />
                <small id="room-auto-delete-inactive-period-help">{{
                  $t(
                    "admin.settings.room_auto_delete.inactive_period.description",
                  )
                }}</small>
                <FormError
                  :errors="
                    formErrors.fieldError('room_auto_delete_inactive_period')
                  "
                />
              </div>
            </div>
            <div
              class="grid grid-cols-12 gap-4"
              data-test="room-auto-delete-never-used-period-field"
            >
              <label
                id="room-auto-delete-never-used-period-label"
                class="col-span-12 md:col-span-4 md:mb-0"
                >{{
                  $t("admin.settings.room_auto_delete.never_used_period.title")
                }}</label
              >
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <Select
                  v-model="settings.room_auto_delete_never_used_period"
                  data-test="room-auto-delete-never-used-dropdown"
                  :options="timePeriods"
                  option-label="text"
                  option-value="value"
                  :invalid="
                    formErrors.fieldInvalid(
                      'room_auto_delete_never_used_period',
                    )
                  "
                  :disabled="disabled"
                  aria-labelledby="room-auto-delete-never-used-period-label"
                  :pt="{
                    input: {
                      'aria-describedby':
                        'room-auto-delete-never-used-period-help',
                    },
                    listContainer: {
                      'data-test': 'room-auto-delete-never-used-dropdown-items',
                    },
                    option: {
                      'data-test':
                        'room-auto-delete-never-used-dropdown-option',
                    },
                  }"
                />
                <small id="room-auto-delete-never-used-period-help">{{
                  $t(
                    "admin.settings.room_auto_delete.never_used_period.description",
                  )
                }}</small>
                <FormError
                  :errors="
                    formErrors.fieldError('room_auto_delete_never_used_period')
                  "
                />
              </div>
            </div>
            <div
              class="grid grid-cols-12 gap-4"
              data-test="room-file-terms-of-use-field"
            >
              <label
                for="room-file-terms-of-use"
                class="col-span-12 md:col-span-4 md:mb-0"
                >{{ $t("admin.settings.room_file_terms_of_use.title") }}</label
              >
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <Textarea
                  id="room-file-terms-of-use"
                  v-model="settings.room_file_terms_of_use"
                  rows="3"
                  :invalid="formErrors.fieldInvalid('room_file_terms_of_use')"
                  :disabled="disabled"
                  aria-describedby="room-file-terms-of-use-help"
                />
                <small id="room-file-terms-of-use-help">{{
                  $t("admin.settings.room_file_terms_of_use.description")
                }}</small>

                <FormError
                  :errors="formErrors.fieldError('room_file_terms_of_use')"
                />
              </div>
            </div>
          </AdminPanel>

          <AdminPanel :title="$t('app.users')">
            <fieldset
              class="grid grid-cols-12 gap-4"
              data-test="password-change-allowed-field"
            >
              <legend class="col-span-12 md:col-span-4 md:mb-0">
                {{ $t("admin.settings.password_change_allowed") }}
              </legend>
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <div class="flex items-center gap-2">
                  <ToggleSwitch
                    v-model="settings.user_password_change_allowed"
                    input-id="password-change-allowed"
                    binary
                    :disabled="disabled"
                    :invalid="
                      formErrors.fieldInvalid('user_password_change_allowed')
                    "
                  />
                  <label for="password-change-allowed">{{
                    $t("app.enable")
                  }}</label>
                </div>
                <FormError
                  :errors="
                    formErrors.fieldError('user_password_change_allowed')
                  "
                />
              </div>
            </fieldset>
          </AdminPanel>

          <AdminPanel
            :title="$t('admin.settings.recording_and_statistics_title')"
          >
            <fieldset
              class="grid grid-cols-12 gap-4"
              data-test="statistics-servers-enabled-field"
            >
              <legend class="col-span-12 md:col-span-4 md:mb-0">
                {{ $t("admin.settings.statistics.servers.enabled_title") }}
              </legend>
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <div class="flex items-center gap-2">
                  <ToggleSwitch
                    v-model="settings.recording_server_usage_enabled"
                    input-id="statistics-servers-enabled"
                    binary
                    :disabled="disabled"
                    :invalid="
                      formErrors.fieldInvalid('recording_server_usage_enabled')
                    "
                  />
                  <label for="statistics-servers-enabled">{{
                    $t("app.enable")
                  }}</label>
                </div>
                <FormError
                  :errors="
                    formErrors.fieldError('recording_server_usage_enabled')
                  "
                />
              </div>
            </fieldset>
            <div
              class="grid grid-cols-12 gap-4"
              data-test="statistics-servers-retention-period-field"
            >
              <label
                id="statistics-servers-retention-period-label"
                class="col-span-12 md:col-span-4 md:mb-0"
                >{{
                  $t("admin.settings.statistics.servers.retention_period_title")
                }}</label
              >
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <Select
                  v-model="settings.recording_server_usage_retention_period"
                  data-test="statistics-servers-retention-period-dropdown"
                  :options="timePeriods"
                  option-label="text"
                  option-value="value"
                  :invalid="
                    formErrors.fieldInvalid(
                      'recording_server_usage_retention_period',
                    )
                  "
                  :disabled="disabled"
                  aria-labelledby="statistics-servers-retention-period-label"
                  :pt="{
                    listContainer: {
                      'data-test':
                        'statistics-servers-retention-period-dropdown-items',
                    },
                    option: {
                      'data-test':
                        'statistics-servers-retention-period-dropdown-option',
                    },
                  }"
                />
                <FormError
                  :errors="
                    formErrors.fieldError(
                      'recording_server_usage_retention_period',
                    )
                  "
                />
              </div>
            </div>
            <fieldset
              class="grid grid-cols-12 gap-4"
              data-test="statistics-meetings-enabled-field"
            >
              <legend class="col-span-12 md:col-span-4 md:mb-0">
                {{ $t("admin.settings.statistics.meetings.enabled_title") }}
              </legend>
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <div class="flex items-center gap-2">
                  <ToggleSwitch
                    v-model="settings.recording_meeting_usage_enabled"
                    input-id="statistics-meetings-enabled"
                    binary
                    :disabled="disabled"
                    :invalid="
                      formErrors.fieldInvalid('recording_meeting_usage_enabled')
                    "
                  />
                  <label for="statistics-meetings-enabled">{{
                    $t("app.enable")
                  }}</label>
                </div>
                <FormError
                  :errors="
                    formErrors.fieldError('recording_meeting_usage_enabled')
                  "
                />
              </div>
            </fieldset>
            <div
              class="grid grid-cols-12 gap-4"
              data-test="statistics-meetings-retention-period-field"
            >
              <label
                id="statistics-meetings-retention-period-label"
                class="col-span-12 md:col-span-4 md:mb-0"
                >{{
                  $t(
                    "admin.settings.statistics.meetings.retention_period_title",
                  )
                }}</label
              >
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <Select
                  v-model="settings.recording_meeting_usage_retention_period"
                  data-test="statistics-meetings-retention-period-dropdown"
                  :options="timePeriods"
                  option-label="text"
                  option-value="value"
                  :invalid="
                    formErrors.fieldInvalid(
                      'recording_meeting_usage_retention_period',
                    )
                  "
                  :disabled="disabled"
                  aria-labelledby="statistics-meetings-retention-period-label"
                  :pt="{
                    listContainer: {
                      'data-test':
                        'statistics-meetings-retention-period-dropdown-items',
                    },
                    option: {
                      'data-test':
                        'statistics-meetings-retention-period-dropdown-option',
                    },
                  }"
                />
                <FormError
                  :errors="
                    formErrors.fieldError(
                      'recording_meeting_usage_retention_period',
                    )
                  "
                />
              </div>
            </div>
            <div
              class="grid grid-cols-12 gap-4"
              data-test="attendance-retention-period-field"
            >
              <label
                id="attendance-retention-period-label"
                class="col-span-12 md:col-span-4 md:mb-0"
                >{{
                  $t("admin.settings.attendance.retention_period_title")
                }}</label
              >
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <Select
                  v-model="settings.recording_attendance_retention_period"
                  data-test="attendance-retention-period-dropdown"
                  :options="timePeriods"
                  option-label="text"
                  option-value="value"
                  :invalid="
                    formErrors.fieldInvalid(
                      'recording_attendance_retention_period',
                    )
                  "
                  :disabled="disabled"
                  aria-labelledby="attendance-retention-period-label"
                  :pt="{
                    listContainer: {
                      'data-test': 'attendance-retention-period-dropdown-items',
                    },
                    option: {
                      'data-test':
                        'attendance-retention-period-dropdown-option',
                    },
                  }"
                />
                <FormError
                  :errors="
                    formErrors.fieldError(
                      'recording_attendance_retention_period',
                    )
                  "
                />
              </div>
            </div>
            <div
              class="grid grid-cols-12 gap-4"
              data-test="recording-retention-period-field"
            >
              <label
                id="recording-retention-period-label"
                class="col-span-12 md:col-span-4 md:mb-0"
                >{{
                  $t("admin.settings.recording.retention_period_title")
                }}</label
              >
              <div class="col-span-12 flex flex-col gap-1 md:col-span-8">
                <Select
                  v-model="settings.recording_recording_retention_period"
                  data-test="recording-retention-period-dropdown"
                  :options="recordingRetentionPeriods"
                  option-label="text"
                  option-value="value"
                  :invalid="
                    formErrors.fieldInvalid(
                      'recording_recording_retention_period',
                    )
                  "
                  :disabled="disabled"
                  aria-labelledby="recording-retention-period-label"
                  :pt="{
                    listContainer: {
                      'data-test': 'recording-retention-period-dropdown-items',
                    },
                    option: {
                      'data-test': 'recording-retention-period-dropdown-option',
                    },
                  }"
                />
                <FormError
                  :errors="
                    formErrors.fieldError(
                      'recording_recording_retention_period',
                    )
                  "
                />
              </div>
            </div>
          </AdminPanel>

          <AdminPanel :title="$t('admin.settings.bbb.title')">
            <fieldset
              class="grid grid-cols-12 gap-4"
              data-test="bbb-logo-field"
            >
              <legend
                id="bbb-logo-label"
                class="col-span-12 md:col-span-4 md:mb-0"
              >
                {{ $t("admin.settings.logo.title") }}
              </legend>
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
                  input-id="bbb-logo"
                  :url-invalid="formErrors.fieldInvalid('bbb_logo')"
                  :file-invalid="formErrors.fieldInvalid('bbb_logo_file')"
                  :url-error="formErrors.fieldError('bbb_logo')"
                  :file-error="formErrors.fieldError('bbb_logo_file')"
                />
              </div>
            </fieldset>
            <fieldset
              class="grid grid-cols-12 gap-4"
              data-test="bbb-style-field"
            >
              <legend
                id="bbb-style-label"
                class="col-span-12 md:col-span-4 md:mb-0"
              >
                {{ $t("admin.settings.bbb.style.title") }}
              </legend>
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
            <fieldset
              class="grid grid-cols-12 gap-4"
              data-test="default-presentation-field"
            >
              <legend
                id="default-presentation-label"
                class="col-span-12 md:col-span-4 md:mb-0"
              >
                {{ $t("admin.settings.default_presentation") }}
              </legend>
              <div class="col-span-12 md:col-span-8">
                <SettingsFileSelector
                  v-model:file-url="settings.bbb_default_presentation"
                  v-model:file="defaultPresentation"
                  v-model:file-deleted="defaultPresentationDeleted"
                  :disabled="disabled"
                  :readonly="viewOnly"
                  :max-file-size="
                    settingsStore.getSetting('bbb.max_filesize') * 1000000
                  "
                  show-delete
                  :allowed-extensions="
                    String(settingsStore.getSetting('bbb.file_mimes')).split(
                      ',',
                    )
                  "
                  :file-invalid="
                    formErrors.fieldInvalid('bbb_default_presentation')
                  "
                  :file-error="
                    formErrors.fieldError('bbb_default_presentation')
                  "
                />
              </div>
            </fieldset>
          </AdminPanel>
        </div>
      </OverlayComponent>
      <div v-if="!viewOnly">
        <div class="mt-6 flex justify-end">
          <Button
            type="submit"
            :disabled="disabled || timezonesLoadingError || timezonesLoading"
            :loading="isBusy"
            icon="fa-solid fa-save"
            :label="$t('app.save')"
            data-test="settings-save-button"
          />
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import env from "../env";
import { useSettingsStore } from "../stores/settings";
import { computed, onMounted, ref, watch } from "vue";
import { useApi } from "../composables/useApi.js";
import { useFormErrors } from "../composables/useFormErrors.js";
import { useUserPermissions } from "../composables/useUserPermission.js";
import { useColors } from "../composables/useColors.js";
import { useI18n } from "vue-i18n";
import { updateTheme } from "../composables/useTheme";
import AdminPanel from "../components/AdminPanel.vue";

const roomLimitMode = ref("custom");
const toastLifetimeMode = ref("custom");

const uploadFaviconFile = ref(null);
const uploadLogoFile = ref(null);
const uploadFaviconDarkFile = ref(null);
const uploadLogoDarkFile = ref(null);
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

const textColors = ref(["#FFFFFF", "#000000"]);
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
  return !userPermissions.can("update", "SettingsPolicy");
});

/**
 * Handle get settings data
 */
function getSettings() {
  modelLoadingError.value = false;
  isBusy.value = true;
  api
    .call("settings")
    .then((response) => {
      settings.value = response.data.data;
      meta.value = response.data.meta;
      roomLimitMode.value =
        settings.value.room_limit === -1 ? "unlimited" : "custom";
      toastLifetimeMode.value =
        settings.value.general_toast_lifetime === 0 ? "unlimited" : "custom";
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
function updateSettings() {
  isBusy.value = true;
  formErrors.clear();

  // Build form data
  const formData = new FormData();

  if (uploadFaviconFile.value) {
    formData.append("theme_favicon_file", uploadFaviconFile.value);
  } else {
    formData.append("theme_favicon", settings.value.theme_favicon);
  }
  if (uploadFaviconDarkFile.value) {
    formData.append("theme_favicon_dark_file", uploadFaviconDarkFile.value);
  } else {
    formData.append("theme_favicon_dark", settings.value.theme_favicon_dark);
  }

  if (uploadLogoFile.value) {
    formData.append("theme_logo_file", uploadLogoFile.value);
  } else {
    formData.append("theme_logo", settings.value.theme_logo);
  }

  if (uploadLogoDarkFile.value) {
    formData.append("theme_logo_dark_file", uploadLogoDarkFile.value);
  } else {
    formData.append("theme_logo_dark", settings.value.theme_logo_dark);
  }

  if (uploadBBBLogoFile.value) {
    formData.append("bbb_logo_file", uploadBBBLogoFile.value);
  } else if (bbbLogoDeleted.value) {
    formData.append("bbb_logo", "");
  } else if (settings.value.bbb_logo !== null) {
    formData.append("bbb_logo", settings.value.bbb_logo);
  }

  if (bbbStyle.value !== null) {
    formData.append("bbb_style", bbbStyle.value);
  } else if (bbbStyleDeleted.value) {
    formData.append("bbb_style", "");
  }

  if (defaultPresentation.value !== null) {
    formData.append("bbb_default_presentation", defaultPresentation.value);
  } else if (defaultPresentationDeleted.value) {
    formData.append("bbb_default_presentation", "");
  }

  const exclude = [
    "theme_logo",
    "theme_logo_dark",
    "theme_favicon",
    "theme_favicon_dark",
    "bbb_logo",
    "bbb_style",
    "bbb_default_presentation",
  ];
  Object.keys(settings.value).forEach((key) => {
    if (exclude.includes(key)) {
      return;
    }
    let val = settings.value[key];

    // Since the FormData always strings boolean and empty values must be
    // changed so that they can be handled correctly by the backend.
    if (typeof val === "boolean") {
      val = val ? 1 : 0;
    } else if (val == null) {
      val = "";
    }

    formData.append(key, val);
  });

  formData.append("_method", "PUT");

  api
    .call("settings", {
      method: "post",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then((response) => {
      settingsStore.getSettings();
      uploadLogoFile.value = null;
      uploadLogoDarkFile.value = null;
      uploadFaviconFile.value = null;
      uploadFaviconDarkFile.value = null;
      defaultPresentation.value = null;
      defaultPresentationDeleted.value = false;
      uploadBBBLogoFile.value = null;
      bbbStyle.value = null;
      bbbStyleDeleted.value = false;
      bbbLogoDeleted.value = false;

      // update form input
      settings.value = response.data.data;
      roomLimitMode.value =
        settings.value.room_limit === -1 ? "unlimited" : "custom";
      toastLifetimeMode.value =
        settings.value.general_toast_lifetime === 0 ? "unlimited" : "custom";
    })
    .catch((error) => {
      if (
        error.response &&
        error.response.status === env.HTTP_UNPROCESSABLE_ENTITY
      ) {
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
function roomLimitModeChanged(value) {
  switch (value) {
    case "unlimited":
      settings.value.room_limit = -1;
      break;
    case "custom":
      settings.value.room_limit = 0;
      break;
  }
}

/**
 * Sets the toastLifetime on the model depending on the selected radio button.
 *
 * @param value Value of the radio button that was selected.
 */
function toastLifetimeModeChanged(value) {
  switch (value) {
    case "unlimited":
      settings.value.general_toast_lifetime = 0;
      break;
    case "custom":
      settings.value.general_toast_lifetime = 5;
      break;
  }
}

/**
 * Options for time period selects (room token expiration, room auto delete, etc.)
 */
const timePeriods = computed(() => {
  return [
    { value: 7, text: t("admin.settings.one_week") },
    { value: 14, text: t("admin.settings.two_weeks") },
    { value: 30, text: t("admin.settings.one_month") },
    { value: 90, text: t("admin.settings.three_month") },
    { value: 180, text: t("admin.settings.six_month") },
    { value: 365, text: t("admin.settings.one_year") },
    { value: 730, text: t("admin.settings.two_years") },
    { value: -1, text: t("app.unlimited") },
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

    return (
      period.value <= meta.value.recording_max_retention_period &&
      period.value !== -1
    );
  });
});

/**
 * Options for the room auto deletion deadline select.
 */
const roomDeleteDeadlineOptions = computed(() => {
  return timePeriods.value.filter(
    (period) => period.value <= 30 && period.value !== -1,
  );
});

watch(
  () => settings.value.theme_rounded,
  (rounded) => {
    updateTheme(settings.value.theme_primary_color, rounded);
  },
);

watch(
  () => settings.value.theme_primary_color,
  (color) => {
    updateTheme(color, settings.value.theme_rounded);
  },
);

onMounted(() => {
  getSettings();
});
</script>

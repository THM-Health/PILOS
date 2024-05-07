<template>
  <div>
    <h2>
      {{ $t('settings.application.title') }}
    </h2>
    <Divider/>
      <form
        @submit.prevent="updateSettings"
      >
        <OverlayComponent :show="isBusy || modelLoadingError" :no-center="true">
          <template #overlay>
            <div class="flex justify-content-center mt-4">
              <LoadingRetryButton :error="modelLoadingError" @click="getSettings" />
            </div>
          </template>

        <h4 class="text-xl">{{ $t('settings.application.application') }}</h4>

        <div class="grid">
          <label for="application-name" class="col-12 md:col-4 md:mb-0">{{$t('settings.application.name.title')}}</label>
          <div class="col-12 md:col-8 flex flex-column gap-1">
            <InputText
              id="application-name"
              v-model="settings.name"
              type="text"
              required
              :invalid="formErrors.fieldInvalid('name')"
              :disabled="disabled"
              aria-describedby="application-name-help"
            />
            <small id="application-name-help">{{ $t('settings.application.name.description') }}</small>
            <p class="p-error" v-html="formErrors.fieldError('name')"></p>
          </div>
        </div>

        <div class="grid">
          <label for="help-url" class="col-12 md:col-4 md:mb-0">{{$t('settings.application.help_url.title')}}</label>
          <div class="col-12 md:col-8 flex flex-column gap-1">
            <InputText
              id="help-url"
              v-model="settings.help_url"
              type="text"
              :invalid="formErrors.fieldInvalid('help_url')"
              :disabled="disabled"
              aria-describedby="help-url-help"
            />
            <small id="help-url-help">{{ $t('settings.application.help_url.description') }}</small>
            <p class="p-error" v-html="formErrors.fieldError('help_url')"></p>
          </div>
        </div>

        <div class="grid">
          <label for="legal-notice-url" class="col-12 md:col-4 md:mb-0">{{$t('settings.application.legal_notice_url.title')}}</label>
          <div class="col-12 md:col-8 flex flex-column gap-1">
            <InputText
              id="legal-notice-url"
              v-model="settings.legal_notice_url"
              type="text"
              :invalid="formErrors.fieldInvalid('legal_notice_url')"
              :disabled="disabled"
              aria-describedby="legal-notice-url-help"
            />
            <small id="legal-notice-url-help">{{ $t('settings.application.legal_notice_url.description') }}</small>
            <p class="p-error" v-html="formErrors.fieldError('legal_notice_url')"></p>
          </div>
        </div>

        <div class="grid">
          <label for="privacy-policy-url" class="col-12 md:col-4 md:mb-0">{{$t('settings.application.privacy_policy_url.title')}}</label>
          <div class="col-12 md:col-8 flex flex-column gap-1">
            <InputText
              id="privacy-policy-url"
              v-model="settings.privacy_policy_url"
              type="text"
              :invalid="formErrors.fieldInvalid('privacy_policy_url')"
              :disabled="disabled"
              aria-describedby="privacy-policy-url-help"
            />
            <small id="privacy-policy-url-help">{{ $t('settings.application.privacy_policy_url.description') }}</small>
            <p class="p-error" v-html="formErrors.fieldError('privacy_policy_url')"></p>
          </div>
        </div>

        <fieldset class="grid">
          <legend id="favicon-label" class="col-12 md:col-4 md:mb-0">{{$t('settings.application.favicon.title')}}</legend>
          <div class="col-12 md:col-8">
            <SettingsImageSelector
              v-model:image-url="settings.favicon"
              v-model:image="uploadFaviconFile"
              :disabled="disabled"
              :readonly="viewOnly"
              :max-file-size="500000"
              preview-width="32"
              :preview-alt="$t('settings.application.favicon.alt')"
              :allowed-extensions="['ico']"
              inputId="favicon"
              :url-invalid="formErrors.fieldInvalid('favicon')"
              :file-invalid="formErrors.fieldInvalid('favicon_file')"
              :url-error="formErrors.fieldError('favicon')"
              :file-error="formErrors.fieldError('favicon_file')"
            />
          </div>
        </fieldset>

        <fieldset class="grid">
          <legend id="logo-label" class="col-12 md:col-4 md:mb-0">{{$t('settings.application.logo.title')}}</legend>
          <div class="col-12 md:col-8">
            <SettingsImageSelector
              v-model:image-url="settings.logo"
              v-model:image="uploadLogoFile"
              :disabled="disabled"
              :readonly="viewOnly"
              :max-file-size="500000"
              preview-width="150"
              :preview-alt="$t('settings.application.logo.alt')"
              :allowed-extensions="['jpg', 'jpeg', 'png', 'gif', 'svg']"
              inputId="logo"
              :url-invalid="formErrors.fieldInvalid('logo')"
              :file-invalid="formErrors.fieldInvalid('logo_file')"
              :url-error="formErrors.fieldError('logo')"
              :file-error="formErrors.fieldError('logo_file')"
            />
          </div>
        </fieldset>

        <div class="grid">
          <label for="pagination-page-size" class="col-12 md:col-4 md:mb-0">{{$t('settings.application.pagination_page_size.title')}}</label>
          <div class="col-12 md:col-8 flex flex-column gap-1">
            <InputText
              id="pagination-page-size"
              v-model.number="settings.pagination_page_size"
              required
              min="1"
              max="100"
              type="number"
              :invalid="formErrors.fieldInvalid('pagination_page_size')"
              :disabled="disabled"
              aria-describedby="pagination-page-size-help"
            />
            <small id="pagination-page-size-help">{{ $t('settings.application.pagination_page_size.description') }}</small>
            <p class="p-error" v-html="formErrors.fieldError('pagination_page_size')"></p>
          </div>
        </div>

        <div class="grid">
          <label for="room-pagination-page-size" class="col-12 md:col-4 md:mb-0">{{$t('settings.application.room_pagination_page_size.title')}}</label>
          <div class="col-12 md:col-8 flex flex-column gap-1">
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
            <small id="room-pagination-page-size-help">{{ $t('settings.application.room_pagination_page_size.description') }}</small>
            <p class="p-error" v-html="formErrors.fieldError('room_pagination_page_size')"></p>
          </div>
        </div>

        <div class="grid">
          <label id="default-timezone-label" class="col-12 md:col-4 md:mb-0">{{$t('settings.application.default_timezone')}}</label>
          <div class="col-12 md:col-8 flex flex-column gap-1">
            <TimezoneSelect
              aria-labelledby="default-timezone-label"
              v-model="settings.default_timezone"
              required
              :invalid="formErrors.fieldInvalid('default_timezone')"
              :disabled="disabled"
              :placeholder="$t('settings.application.default_timezone')"
              @loading-error="(value) => timezonesLoadingError = value"
              @busy="(value) => timezonesLoading = value"
            />
            <p class="p-error" v-html="formErrors.fieldError('default_timezone')"></p>
          </div>
        </div>

        <Divider/>
        <h4 class="text-xl">{{ $t('settings.application.banner.title') }}</h4>

        <fieldset class="grid">
          <legend class="col-12 md:col-4 md:mb-0">{{$t('settings.application.banner.enabled')}}</legend>
          <div class="col-12 md:col-8 flex flex-column gap-1">
            <div class="flex align-items-center gap-2">
              <InputSwitch
                inputId="banner-enabled"
                v-model="settings.banner.enabled"
                binary
                :disabled="disabled"
                :invalid="formErrors.fieldInvalid('banner.enabled')"
              />
              <label for="banner-enabled">{{ $t('app.enable') }}</label>
            </div>
            <p class="p-error" v-html="formErrors.fieldError('banner.enabled')"></p>
          </div>
        </fieldset>

        <fieldset class="grid">
          <legend class="col-12 md:col-4 md:mb-0">{{$t('settings.application.banner.preview')}}</legend>
          <div class="col-12 md:col-8">
            <AppBanner
              :background="settings.banner.background"
              :color="settings.banner.color"
              :enabled="settings.banner.enabled"
              :icon="settings.banner.icon"
              :link="settings.banner.link"
              :message="settings.banner.message"
              :title="settings.banner.title"
              :link-target="settings.banner.link_target"
              :link-text="settings.banner.link_text"
              :link-style="settings.banner.link_style"
            />
          </div>
        </fieldset>

        <div class="grid">
          <label for="banner-title" class="col-12 md:col-4 md:mb-0">{{$t('settings.application.banner.banner_title')}}</label>
          <div class="col-12 md:col-8 flex flex-column gap-1">
            <InputText
              id="banner-title"
              v-model="settings.banner.title"
              type="text"
              :invalid="formErrors.fieldInvalid('banner.title')"
              :disabled="disabled"
            />
            <p class="p-error" v-html="formErrors.fieldError('banner.title')"></p>
          </div>
        </div>

        <div class="grid">
          <label for="banner-icon" class="col-12 md:col-4 md:mb-0">{{$t('settings.application.banner.icon')}}</label>
          <div class="col-12 md:col-8 flex flex-column gap-1">
            <InputText
              id="banner-icon"
              v-model="settings.banner.icon"
              type="text"
              :invalid="formErrors.fieldInvalid('banner.icon')"
              :disabled="disabled"
              aria-describedby="banner-icon-help"
            />
            <small id="banner-icon-help">{{ $t('settings.application.banner.icon_description') }}</small>
            <p class="p-error" v-html="formErrors.fieldError('banner.icon')"></p>
          </div>
        </div>

        <div class="grid">
          <label for="banner-message" class="col-12 md:col-4 md:mb-0">{{$t('settings.application.banner.message')}}</label>
          <div class="col-12 md:col-8 flex flex-column gap-1">
            <Textarea
              id="banner-message"
              v-model="settings.banner.message"
              rows="3"
              :invalid="formErrors.fieldInvalid('banner.message')"
              :disabled="disabled"
            />
            <p class="p-error" v-html="formErrors.fieldError('banner.message')"></p>
          </div>
        </div>

        <div class="grid">
          <label for="banner-link" class="col-12 md:col-4 md:mb-0">{{$t('settings.application.banner.link')}}</label>
          <div class="col-12 md:col-8 flex flex-column gap-1">
            <InputText
              id="banner-link"
              v-model="settings.banner.link"
              type="text"
              :invalid="formErrors.fieldInvalid('banner.link')"
              :disabled="disabled"
            />
            <p class="p-error" v-html="formErrors.fieldError('banner.link')"></p>
          </div>
        </div>

        <div class="grid">
          <label for="banner-link-text" class="col-12 md:col-4 md:mb-0">{{$t('settings.application.banner.link_text')}}</label>
          <div class="col-12 md:col-8 flex flex-column gap-1">
            <InputText
              id="banner-link-text"
              v-model="settings.banner.link_text"
              type="text"
              :invalid="formErrors.fieldInvalid('banner.link_text')"
              :disabled="disabled"
            />
            <p class="p-error" v-html="formErrors.fieldError('banner.link_text')"></p>
          </div>
        </div>

        <div class="grid">
          <label for="banner-link-style" class="col-12 md:col-4 md:mb-0">{{$t('settings.application.banner.link_style')}}</label>
          <div class="col-12 md:col-8 flex flex-column gap-1">
            <Dropdown
              input-id="banner-link-style"
              v-model="settings.banner.link_style"
              :options="linkBtnStyles"
              :placeholder="$t('settings.application.banner.select_link_style')"
              optionLabel="text"
              optionValue="value"
              :invalid="formErrors.fieldInvalid('banner.link_style')"
              :disabled="disabled"
            />
            <p class="p-error" v-html="formErrors.fieldError('banner.link_style')"></p>
          </div>
        </div>

        <div class="grid">
          <label for="banner-link-target" class="col-12 md:col-4 md:mb-0">{{$t('settings.application.banner.link_target')}}</label>
          <div class="col-12 md:col-8 flex flex-column gap-1">
            <Dropdown
              input-id="banner-link-target"
              v-model="settings.banner.link_target"
              :options="linkTargets"
              :placeholder="$t('settings.application.banner.select_link_target')"
              optionLabel="text"
              optionValue="value"
              :invalid="formErrors.fieldInvalid('banner.link_target')"
              :disabled="disabled"
            />
            <p class="p-error" v-html="formErrors.fieldError('banner.link_target')"></p>
          </div>
        </div>

        <div class="grid">
          <label for="banner-color" class="col-12 md:col-4 md:mb-0">{{$t('settings.application.banner.color')}}</label>
          <div class="col-12 md:col-8 flex flex-column gap-1">
            <ColorSelect
              class="my-2"
              :disabled='disabled'
              :colors="textColors"
              v-model="settings.banner.color"
            />
            <label for="banner-color">{{ $t('settings.room_types.custom_color') }}</label>
            <InputText
              id="banner-color"
              v-model="settings.banner.color"
              type="text"
              :invalid="formErrors.fieldInvalid('banner.color')"
              :disabled="disabled"
            />
            <p class="p-error" v-html="formErrors.fieldError('banner.color')"></p>
          </div>
        </div>

        <div class="grid">
          <label for="banner-background" class="col-12 md:col-4 md:mb-0">{{$t('settings.application.banner.background')}}</label>
          <div class="col-12 md:col-8 flex flex-column gap-1">
            <ColorSelect
              class="my-2"
              :disabled='disabled'
              :colors="backgroundColors"
              v-model="settings.banner.background"
            />
            <label for="banner-background">{{ $t('settings.room_types.custom_color') }}</label>
            <InputText
              id="banner-background"
              v-model="settings.banner.background"
              type="text"
              :invalid="formErrors.fieldInvalid('banner.background')"
              :disabled="disabled"
            />
            <p class="p-error" v-html="formErrors.fieldError('banner.background')"></p>
          </div>
        </div>

        <Divider/>
        <h4 class="text-xl">{{ $t('app.rooms') }}</h4>

        <fieldset class="grid">
          <legend class="col-12 md:col-4 md:mb-0">{{$t('settings.application.room_limit.title')}}</legend>
          <div class="col-12 md:col-8 flex flex-column gap-1">
            <div class="flex flex-wrap gap-3">
              <div class="flex align-items-center">
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
              <div class="flex align-items-center">
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
                <label for="room-limit-mode-custom" id="room-limit-mode-custom-label" class="ml-2">{{ $t('settings.roles.room_limit.custom') }}</label>
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
            <small id="room-limit-custom-help">{{ $t('settings.application.room_limit.description') }}</small>
            <p class="p-error" v-html="formErrors.fieldError('room_limit')"></p>
          </div>
        </fieldset>

        <div class="grid">
          <label id="room-token-expiration-label" class="col-12 md:col-4 md:mb-0">{{$t('settings.application.room_token_expiration.title')}}</label>
          <div class="col-12 md:col-8 flex flex-column gap-1">
            <Dropdown
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
            <small id="room-token-expiration-help">{{ $t('settings.application.room_token_expiration.description') }}</small>
            <p class="p-error" v-html="formErrors.fieldError('room_token_expiration')"></p>
          </div>
        </div>

        <div class="grid">
          <label id="room-auto-delete-deadline-period-label" class="col-12 md:col-4 md:mb-0">{{$t('settings.application.room_auto_delete.deadline_period.title')}}</label>
          <div class="col-12 md:col-8 flex flex-column gap-1">
            <Dropdown
              v-model="settings.room_auto_delete.deadline_period"
              :options="roomDeleteDeadlineOptions"
              optionLabel="text"
              optionValue="value"
              :invalid="formErrors.fieldInvalid('room_auto_delete.deadline_period')"
              :disabled="disabled"
              aria-labelledby="room-auto-delete-deadline-period-label"
              :pt="{
                    input: {
                       'aria-describedby':'room-auto-delete-deadline-period-help'
                    }
                  }"
            />
            <small id="room-auto-delete-deadline-period-help">{{ $t('settings.application.room_auto_delete.deadline_period.description') }}</small>
            <p class="p-error" v-html="formErrors.fieldError('room_auto_delete.deadline_period')"></p>
          </div>
        </div>

        <div class="grid">
          <label id="room-auto-delete-inactive-period-label" class="col-12 md:col-4 md:mb-0">{{$t('settings.application.room_auto_delete.inactive_period.title')}}</label>
          <div class="col-12 md:col-8 flex flex-column gap-1">
            <Dropdown
              v-model="settings.room_auto_delete.inactive_period"
              :options="timePeriods"
              optionLabel="text"
              optionValue="value"
              :invalid="formErrors.fieldInvalid('room_auto_delete.inactive_period')"
              :disabled="disabled"
              aria-labelledby="room-auto-delete-inactive-period-label"
              :pt="{
                    input: {
                       'aria-describedby':'room-auto-delete-inactive-period-help'
                    }
                  }"
            />
            <small id="room-auto-delete-inactive-period-help">{{ $t('settings.application.room_auto_delete.inactive_period.description') }}</small>
            <p class="p-error" v-html="formErrors.fieldError('room_auto_delete.inactive_period')"></p>
          </div>
        </div>

        <div class="grid">
          <label id="room-auto-delete-never-used-period-label" class="col-12 md:col-4 md:mb-0">{{$t('settings.application.room_auto_delete.never_used_period.title')}}</label>
          <div class="col-12 md:col-8 flex flex-column gap-1">
            <Dropdown
              v-model="settings.room_auto_delete.never_used_period"
              :options="timePeriods"
              optionLabel="text"
              optionValue="value"
              :invalid="formErrors.fieldInvalid('room_auto_delete.never_used_period')"
              :disabled="disabled"
              aria-labelledby="room-auto-delete-never-used-period-label"
              :pt="{
                    input: {
                       'aria-describedby':'room-auto-delete-never-used-period-help'
                    }
                  }"
            />
            <small id="room-auto-delete-never-used-period-help">{{ $t('settings.application.room_auto_delete.never_used_period.description') }}</small>
            <p class="p-error" v-html="formErrors.fieldError('room_auto_delete.never_used_period')"></p>
          </div>
        </div>

        <Divider/>
        <h4 class="text-xl">{{ $t('app.users') }}</h4>

        <fieldset class="grid">
          <legend class="col-12 md:col-4 md:mb-0">{{$t('settings.application.password_change_allowed')}}</legend>
          <div class="col-12 md:col-8 flex flex-column gap-1">
            <div class="flex align-items-center gap-2">
              <InputSwitch
                inputId="password-change-allowed"
                v-model="settings.password_change_allowed"
                binary
                :disabled="disabled"
                :invalid="formErrors.fieldInvalid('password_change_allowed')"
              />
              <label for="password-change-allowed">{{ $t('app.enable') }}</label>
            </div>
            <p class="p-error" v-html="formErrors.fieldError('password_change_allowed')"></p>
          </div>
        </fieldset>

        <Divider/>
        <h4 class="text-xl">{{ $t('settings.application.attendance_and_statistics_title') }}</h4>

        <fieldset class="grid">
          <legend class="col-12 md:col-4 md:mb-0">{{$t('settings.application.statistics.servers.enabled_title')}}</legend>
          <div class="col-12 md:col-8 flex flex-column gap-1">
            <div class="flex align-items-center gap-2">
              <InputSwitch
                inputId="statistics-servers-enabled"
                v-model="settings.statistics.servers.enabled"
                binary
                :disabled="disabled"
                :invalid="formErrors.fieldInvalid('statistics.servers.enabled')"
              />
              <label for="statistics-servers-enabled">{{ $t('app.enable') }}</label>
            </div>
            <p class="p-error" v-html="formErrors.fieldError('statistics.servers.enabled')"></p>
          </div>
        </fieldset>

        <div class="grid">
          <label id="statistics-servers-retention-period-label" class="col-12 md:col-4 md:mb-0">{{$t('settings.application.statistics.servers.retention_period_title')}}</label>
          <div class="col-12 md:col-8 flex flex-column gap-1">
            <Dropdown
              v-model="settings.statistics.servers.retention_period"
              :options="timePeriods"
              optionLabel="text"
              optionValue="value"
              :invalid="formErrors.fieldInvalid('statistics.servers.retention_period')"
              :disabled="disabled"
              aria-labelledby="statistics-servers-retention-period-label"
            />
            <p class="p-error" v-html="formErrors.fieldError('statistics.servers.retention_period')"></p>
          </div>
        </div>

        <fieldset class="grid">
          <legend class="col-12 md:col-4 md:mb-0">{{$t('settings.application.statistics.meetings.enabled_title')}}</legend>
          <div class="col-12 md:col-8 flex flex-column gap-1">
            <div class="flex align-items-center gap-2">
              <InputSwitch
                inputId="statistics-meetings-enabled"
                v-model="settings.statistics.meetings.enabled"
                binary
                :disabled="disabled"
                :invalid="formErrors.fieldInvalid('statistics.meetings.enabled')"
              />
              <label for="statistics-meetings-enabled">{{ $t('app.enable') }}</label>
            </div>
            <p class="p-error" v-html="formErrors.fieldError('statistics.meetings.enabled')"></p>
          </div>
        </fieldset>

        <div class="grid">
          <label id="statistics-meetings-retention-period-label" class="col-12 md:col-4 md:mb-0">{{$t('settings.application.statistics.meetings.retention_period_title')}}</label>
          <div class="col-12 md:col-8 flex flex-column gap-1">
            <Dropdown
              v-model="settings.statistics.meetings.retention_period"
              :options="timePeriods"
              optionLabel="text"
              optionValue="value"
              :invalid="formErrors.fieldInvalid('statistics.meetings.retention_period')"
              :disabled="disabled"
              aria-labelledby="statistics-meetings-retention-period-label"
            />
            <p class="p-error" v-html="formErrors.fieldError('statistics.meetings.retention_period')"></p>
          </div>
        </div>

        <div class="grid">
          <label id="attendance-retention-period-label" class="col-12 md:col-4 md:mb-0">{{$t('settings.application.attendance.retention_period_title')}}</label>
          <div class="col-12 md:col-8 flex flex-column gap-1">
            <Dropdown
              v-model="settings.attendance.retention_period"
              :options="timePeriods"
              optionLabel="text"
              optionValue="value"
              :invalid="formErrors.fieldInvalid('attendance.retention_period')"
              :disabled="disabled"
              aria-labelledby="attendance-retention-period-label"
            />
            <p class="p-error" v-html="formErrors.fieldError('attendance.retention_period')"></p>
          </div>
        </div>

        <div class="grid">
          <label id="recording-retention-period-label" class="col-12 md:col-4 md:mb-0">{{$t('settings.application.recording.retention_period_title')}}</label>
          <div class="col-12 md:col-8 flex flex-column gap-1">
            <Dropdown
              v-model="settings.recording.retention_period"
              :options="recordingRetentionPeriods"
              optionLabel="text"
              optionValue="value"
              :invalid="formErrors.fieldInvalid('recording.retention_period')"
              :disabled="disabled"
              aria-labelledby="recording-retention-period-label"
            />
            <p class="p-error" v-html="formErrors.fieldError('recording.retention_period')"></p>
          </div>
        </div>

        <Divider/>
        <h4 class="text-xl">{{ $t('settings.application.bbb.title') }}</h4>

        <fieldset class="grid">
          <legend id="bbb-logo-label" class="col-12 md:col-4 md:mb-0">{{$t('settings.application.logo.title')}}</legend>
          <div class="col-12 md:col-8">
            <SettingsImageSelector
              v-model:image-url="settings.bbb.logo"
              v-model:image="uploadBBBLogoFile"
              v-model:image-deleted="bbbLogoDeleted"
              :disabled="disabled"
              :readonly="viewOnly"
              :max-file-size="500000"
              preview-width="150"
              show-delete
              :preview-alt="$t('settings.application.bbb.logo.alt')"
              :allowed-extensions="['jpg', 'jpeg', 'png', 'gif', 'svg']"
              inputId="bbb-logo"
              :url-invalid="formErrors.fieldInvalid('bbb.logo')"
              :file-invalid="formErrors.fieldInvalid('bbb.logo_file')"
              :url-error="formErrors.fieldError('bbb.logo')"
              :file-error="formErrors.fieldError('bbb.logo_file')"
            />
          </div>
        </fieldset>

        <fieldset class="grid">
          <legend id="bbb-style-label" class="col-12 md:col-4 md:mb-0">{{$t('settings.application.bbb.style.title')}}</legend>
          <div class="col-12 md:col-8">
            <SettingsFileSelector
              v-model:file-url="settings.bbb.style"
              v-model:file="bbbStyle"
              v-model:file-deleted="bbbStyleDeleted"
              :disabled="disabled"
              :readonly="viewOnly"
              :max-file-size="500000"
              show-delete
              :allowed-extensions="['css']"
              :file-invalid="formErrors.fieldInvalid('bbb.style')"
              :file-error="formErrors.fieldError('bbb.style')"
            />
          </div>
        </fieldset>

        <fieldset class="grid">
          <legend id="default-presentation-label" class="col-12 md:col-4 md:mb-0">{{$t('settings.application.default_presentation')}}</legend>
          <div class="col-12 md:col-8">
            <SettingsFileSelector
              v-model:file-url="settings.bbb.default_presentation"
              v-model:file="defaultPresentation"
              v-model:file-deleted="defaultPresentationDeleted"
              :disabled="disabled"
              :readonly="viewOnly"
              :max-file-size="settings.bbb.max_filesize*1000"
              show-delete
              :allowed-extensions="String(settings.bbb.file_mimes).split(',')"
              :file-invalid="formErrors.fieldInvalid('bbb.default_presentation')"
              :file-error="formErrors.fieldError('bbb.default_presentation')"
            />
          </div>
        </fieldset>
        </OverlayComponent>
        <div v-if="!viewOnly">
        <Divider/>
          <div class="flex justify-content-end">
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
import env from '@/env';
import { useSettingsStore } from '@/stores/settings';
import { computed, onMounted, ref } from 'vue';
import { useApi } from '../../composables/useApi.js';
import { useFormErrors } from '../../composables/useFormErrors.js';
import { useUserPermissions } from '../../composables/useUserPermission.js';
import { useI18n } from 'vue-i18n';

const roomLimitMode = ref('custom');

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

const settings = ref({
  banner: {},
  link_btn_styles: [],
  link_targets: [],
  bbb: {
    style: undefined,
    default_presentation: undefined
  },
  room_token_expiration: undefined,
  statistics: {
    servers: {},
    meetings: {}
  },
  attendance: {},
  recording: {},
  room_auto_delete: {}
});

const textColors = ref(env.BANNER_TEXT_COLORS);
const backgroundColors = ref(env.BANNER_BACKGROUND_COLORS);
const timezonesLoading = ref(false);
const timezonesLoadingError = ref(false);

const settingsStore = useSettingsStore();
const api = useApi();
const formErrors = useFormErrors();
const userPermissions = useUserPermissions();
const { t } = useI18n();

/**
 * Input fields are disabled
 */
const disabled = computed(() => {
  return viewOnly.value || isBusy.value || modelLoadingError.value;
});

const viewOnly = computed(() => {
  return !userPermissions.can('update', 'ConfigPolicy');
});

/**
 * Handle get settings data
 */
function getSettings () {
  modelLoadingError.value = false;
  isBusy.value = true;
  api.call('settings/all')
    .then(response => {
      settings.value = response.data.data;
      roomLimitMode.value = (settings.value.room_limit === -1 ? 'unlimited' : 'custom');
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
    formData.append('favicon_file', uploadFaviconFile.value);
  } else {
    formData.append('favicon', settings.value.favicon);
  }

  if (uploadLogoFile.value) {
    formData.append('logo_file', uploadLogoFile.value);
  } else {
    formData.append('logo', settings.value.logo);
  }

  if (uploadBBBLogoFile.value) {
    formData.append('bbb[logo_file]', uploadBBBLogoFile.value);
  } else if (!bbbLogoDeleted.value && settings.value.bbb.logo != null) {
    formData.append('bbb[logo]', settings.value.bbb.logo);
  }

  if (bbbStyle.value !== null) {
    formData.append('bbb[style]', bbbStyle.value);
  } else if (bbbStyleDeleted.value) {
    formData.append('bbb[style]', '');
  }

  if (defaultPresentation.value !== null) {
    formData.append('bbb[default_presentation]', defaultPresentation.value);
  } else if (defaultPresentationDeleted.value) {
    formData.append('bbb[default_presentation]', '');
  }

  formData.append('name', settings.value.name);
  formData.append('room_limit', settings.value.room_limit);
  formData.append('room_token_expiration', settings.value.room_token_expiration);
  formData.append('pagination_page_size', settings.value.pagination_page_size);
  formData.append('room_pagination_page_size', settings.value.room_pagination_page_size);
  formData.append('password_change_allowed', settings.value.password_change_allowed ? 1 : 0);
  formData.append('default_timezone', settings.value.default_timezone);
  formData.append('help_url', settings.value.help_url || '');
  formData.append('legal_notice_url', settings.value.legal_notice_url || '');
  formData.append('privacy_policy_url', settings.value.privacy_policy_url || '');

  formData.append('statistics[servers][enabled]', settings.value.statistics.servers.enabled ? 1 : 0);
  formData.append('statistics[servers][retention_period]', settings.value.statistics.servers.retention_period);
  formData.append('statistics[meetings][enabled]', settings.value.statistics.meetings.enabled ? 1 : 0);
  formData.append('statistics[meetings][retention_period]', settings.value.statistics.meetings.retention_period);
  formData.append('attendance[retention_period]', settings.value.attendance.retention_period);

  formData.append('recording[retention_period]', settings.value.recording.retention_period);
  formData.append('room_auto_delete[deadline_period]', settings.value.room_auto_delete.deadline_period);
  formData.append('room_auto_delete[inactive_period]', settings.value.room_auto_delete.inactive_period);
  formData.append('room_auto_delete[never_used_period]', settings.value.room_auto_delete.never_used_period);

  Object.keys(settings.value.banner).forEach(key => {
    let val = settings.value.banner[key];

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
      roomLimitMode.value = (settings.value.room_limit === -1 ? 'unlimited' : 'custom');
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
  return (settings.value.link_btn_styles || []).map((style) => {
    return { value: style, text: t(`app.button_styles.${style}`) };
  });
});

const linkTargets = computed(() => {
  return (settings.value.link_targets || []).map((target) => {
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
      settings.value.room_limit = -1;
      break;
    case 'custom':
      settings.value.room_limit = 0;
      break;
  }
}

/**
 * Options for time period selects (room token expiration, room auto delete, etc.)
 */
const timePeriods = computed(() => {
  return [
    { value: 7, text: t('settings.application.one_week') },
    { value: 14, text: t('settings.application.two_weeks') },
    { value: 30, text: t('settings.application.one_month') },
    { value: 90, text: t('settings.application.three_month') },
    { value: 180, text: t('settings.application.six_month') },
    { value: 365, text: t('settings.application.one_year') },
    { value: 730, text: t('settings.application.two_years') },
    { value: -1, text: t('app.unlimited') }
  ];
});

/**
 * Options for the recording retention period select.
 */
const recordingRetentionPeriods = computed(() => {
  return timePeriods.value.filter((period) => {
    if (settings.value.recording.max_retention_period === -1) {
      return true;
    }

    return period.value <= settings.value.recording.max_retention_period && period.value !== -1;
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

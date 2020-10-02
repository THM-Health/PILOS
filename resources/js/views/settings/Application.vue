<template>
  <div>
    <b-container fluid>
      <h3>
        {{ $t('settings.application.title') }}
      </h3>
      <hr>

      <!--Brand Image Settings-->
      <b-form-group
        :label="$t('settings.application.brandImage.title')"
        label-for="application-brand-image-input"
        :description="$t('settings.application.brandImage.description')"
        class="mt-3 mb-3"
      >
        <b-input-group>
          <b-form-input id="application-brand-image-input"></b-form-input>
          <b-input-group-append>
            <b-button id="application-brand-image-button" variant="success">
              {{ $t('settings.application.save') }}
            </b-button>
          </b-input-group-append>
        </b-input-group>
      </b-form-group>

      <!--Theme Color Settings-->
      <b-form-group
        class="mb-3"
        :label="$t('settings.application.themeColor.title')"
        label-for="application-theme-color-row"
        :description="$t('settings.application.themeColor.description')"
      >
        <b-row id="application-theme-color-row">
          <b-col>
            <b-form-group
              :label="$t('settings.application.themeColor.regularTitle')"
              label-for="application-theme-color-regular-input"
            >
              <b-input-group>
                <b-form-input id="application-theme-color-regular-input" type="color"></b-form-input>
                <b-input-group-append>
                  <b-button id="application-theme-color-regular-button"
                            variant="success"
                            v-b-tooltip.hover="$t('settings.application.save')"
                  >
                    <span><i class="fas fa-save"></i></span>
                  </b-button>
                </b-input-group-append>
              </b-input-group>
            </b-form-group>
          </b-col>
          <b-col>
            <b-form-group
              :label="$t('settings.application.themeColor.lightenTitle')"
              label-for="application-theme-color-lighten-input"
            >
              <b-input-group>
                <b-form-input id="application-theme-color-lighten-input" type="color"></b-form-input>
                <b-input-group-append>
                  <b-button id="application-theme-color-lighten-button"
                            variant="success"
                            v-b-tooltip.hover="$t('settings.application.save')"
                  >
                    <span><i class="fas fa-save"></i></span>
                  </b-button>
                </b-input-group-append>
              </b-input-group>
            </b-form-group>
          </b-col>
          <b-col>
            <b-form-group
              :label="$t('settings.application.themeColor.darkenTitle')"
              label-for="application-theme-color-darken-input"
            >
              <b-input-group>
                <b-form-input id="application-theme-color-darken-input" type="color"></b-form-input>
                <b-input-group-append>
                  <b-button id="application-theme-color-darken-button"
                            variant="success"
                            v-b-tooltip.hover="$t('settings.application.save')">
                    <span><i class="fas fa-save"></i></span>
                  </b-button>
                </b-input-group-append>
              </b-input-group>
            </b-form-group>
          </b-col>
        </b-row>
      </b-form-group>

      <!--Registration Method Settings-->
      <b-form-group
        :label="$t('settings.application.registrationMethod.title')"
        label-for="application-registration-method-dropdown"
        :description="$t('settings.application.registrationMethod.description')"
      >
        <b-dropdown
          id="application-registration-method-dropdown"
          :text="$t('settings.application.registrationMethod.title')"
          block
          split
          variant="success"
          class="mt-2 mb-2"
          menu-class="w-100"
        >
          <b-dropdown-item>{{ $t('settings.application.registrationMethod.open') }}</b-dropdown-item>
          <b-dropdown-item>{{ $t('settings.application.registrationMethod.invitation') }}</b-dropdown-item>
        </b-dropdown>
      </b-form-group>

      <!--Room Authentication Settings-->
      <b-form-group
        :label="$t('settings.application.roomAuthentication.title')"
        label-for="application-room-authentication-dropdown"
        :description="$t('settings.application.roomAuthentication.description')"
      >
        <b-dropdown
          id="application-room-authentication-dropdown"
          :text="$t('settings.application.roomAuthentication.title')"
          block
          split
          variant="success"
          class="mt-2 mb-2"
          menu-class="w-100"
        >
          <b-dropdown-item>{{ $t('settings.application.roomAuthentication.enabled') }}</b-dropdown-item>
          <b-dropdown-item>{{ $t('settings.application.roomAuthentication.disabled') }}</b-dropdown-item>
        </b-dropdown>
      </b-form-group>

      <!--Room Share Settings-->
      <b-form-group
        :label="$t('settings.application.roomShare.title')"
        label-for="application-room-share-dropdown"
        :description="$t('settings.application.roomShare.description')"
      >
        <b-dropdown
          id="application-room-share-dropdown"
          :text="$t('settings.application.roomShare.title')"
          block
          split
          variant="success"
          class="mt-2 mb-2"
          menu-class="w-100"
        >
          <b-dropdown-item>{{ $t('settings.application.roomShare.enabled') }}</b-dropdown-item>
          <b-dropdown-item>{{ $t('settings.application.roomShare.disabled') }}</b-dropdown-item>
        </b-dropdown>
      </b-form-group>

      <!--Recording Visibility Settings-->
      <b-form-group
        :label="$t('settings.application.recordingVisibility.title')"
        label-for="application-recording-visibility-dropdown"
        :description="$t('settings.application.recordingVisibility.description')"
      >
        <b-dropdown
          id="application-recording-visibility-dropdown"
          :text="$t('settings.application.recordingVisibility.title')"
          block
          split
          variant="success"
          class="mt-2 mb-2"
          menu-class="w-100"
        >
          <b-dropdown-item>{{ $t('settings.application.recordingVisibility.public') }}</b-dropdown-item>
          <b-dropdown-item>{{ $t('settings.application.recordingVisibility.unlisted') }}</b-dropdown-item>
        </b-dropdown>
      </b-form-group>

      <!--Rooms per user settings-->
      <b-form-group
        :label="$t('settings.application.roomsPerUser.title')"
        label-for="application-recording-visibility-dropdown"
        :description="$t('settings.application.roomsPerUser.description')"
      >
      <b-button-group>
        <b-button>{{$t('settings.application.roomsPerUser.option.one')}}</b-button>
        <b-button>{{$t('settings.application.roomsPerUser.option.five')}}</b-button>
        <b-button>{{$t('settings.application.roomsPerUser.option.ten')}}</b-button>
        <b-button>{{$t('settings.application.roomsPerUser.option.unlimited')}}</b-button>
      </b-button-group>
      </b-form-group>

    </b-container>
  </div>
</template>

<script>
</script>

<style scoped>

</style>

<template>
  <div class="p-3">
    <b-overlay :show="isBusy || loadingError">
      <template #overlay>
        <div class="text-center">
          <b-spinner v-if="isBusy" ></b-spinner>
          <b-button
            v-else
            @click="loadUser()"
          >
            <i class="fa-solid fa-sync"></i> {{ $t('app.reload') }}
          </b-button>
        </div>
      </template>
      <b-tabs v-if="!isBusy && user" fill nav-wrapper-class="mb-3">
      <b-tab lazy>
        <template #title>
          <i class="fa-solid fa-user"></i> {{ $t('settings.users.base_data') }}
        </template>
        <profile-component
          :user="user"
          :view-only="viewOnly"
          @updateUser="updateUser"
          @staleError="handleStaleError"
          @notFoundError="handleNotFoundError"
        ></profile-component>
      </b-tab>
      <b-tab lazy>
        <template #title>
          <i class="fa-solid fa-envelope"></i> {{ $t('app.email') }}
        </template>
        <email-settings-component
          :user="user"
          :view-only="viewOnly"
          @updateUser="updateUser"
          @notFoundError="handleNotFoundError"
        ></email-settings-component>
      </b-tab>
      <b-tab lazy>
        <template #title>
          <i class="fa-solid fa-user-shield"></i> {{ $t('app.security') }}
        </template>
        <authentication-settings-component
          :user="user"
          :view-only="viewOnly"
          @updateUser="updateUser"
          @staleError="handleStaleError"
          @notFoundError="handleNotFoundError"
        ></authentication-settings-component>
      </b-tab>
      <b-tab lazy>
        <template #title>
          <i class="fa-solid fa-user-gear"></i> {{ $t('settings.users.other_settings') }}
        </template>
        <other-settings-component
          :user="user"
          :view-only="viewOnly"
          @updateUser="updateUser"
          @staleError="handleStaleError"
          @notFoundError="handleNotFoundError"
        ></other-settings-component>
      </b-tab>
    </b-tabs>
    </b-overlay>
    <b-modal
      :static='modalStatic'
      :busy='isBusy'
      ok-variant='secondary'
      @ok='refreshUser'
      :ok-only="true"
      :hide-header-close='true'
      :no-close-on-backdrop='true'
      :no-close-on-esc='true'
      ref='stale-user-modal'
      :hide-header='true'>
      <template v-slot:default>
        <h5>{{ staleError.message }}</h5>
      </template>
      <template v-slot:modal-ok>
        <b-spinner small v-if="isBusy"></b-spinner>  {{ $t('app.reload') }}
      </template>
    </b-modal>
  </div>
</template>

<script>
import FieldErrors from '../../mixins/FieldErrors';
import 'cropperjs/dist/cropper.css';
import AuthenticationSettingsComponent from './AuthenticationSettingsComponent.vue';
import OtherSettingsComponent from './OtherSettingsComponent.vue';
import EmailSettingsComponent from './EmailSettingsComponent.vue';
import ProfileComponent from './ProfileComponent.vue';
import Base from '../../api/base';
import env from '../../env';

export default {
  mixins: [FieldErrors],
  components: {
    ProfileComponent,
    EmailSettingsComponent,
    OtherSettingsComponent,
    AuthenticationSettingsComponent
  },
  data () {
    return {
      user: null,
      isBusy: false,
      loadingError: false,
      staleError: {}
    };
  },
  props: {
    id: {
      type: [String, Number],
      required: true
    },
    viewOnly: {
      type: Boolean,
      default: false
    },
    modalStatic: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    handleNotFoundError (error) {
      this.$router.push({ name: 'settings.users' });
      Base.error(error, this.$root, error.message);
    },

    handleStaleError (error) {
      this.staleError = error;
      this.$refs['stale-user-modal'].show();
    },

    updateUser (user) {
      this.user = user;
      this.$emit('updateUser', this.user);
    },

    /**
     * Refreshes the current model with the new passed from the stale error response.
     */
    refreshUser () {
      this.user = this.staleError.new_model;
      this.user.roles.forEach(role => {
        role.$isDisabled = role.automatic;
      });
      this.$emit('updateUser', this.staleError.new_model);
      this.staleError = {};
      this.$refs['stale-user-modal'].hide();
    },

    /**
     * Load user from the API.
     */
    loadUser () {
      this.isBusy = true;

      Base.call('users/' + this.id).then(response => {
        this.loadingError = false;
        this.user = response.data.data;
        this.user.roles.forEach(role => {
          role.$isDisabled = role.automatic;
        });
        this.$emit('updateUser', this.user);
      }).catch(error => {
        if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
          this.$router.push({ name: 'settings.users' });
        }

        this.loadingError = true;
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        this.isBusy = false;
      });
    }
  },
  mounted () {
    this.loadUser();
  }
};

</script>

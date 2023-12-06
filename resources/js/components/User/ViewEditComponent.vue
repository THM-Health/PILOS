<template>
  <div class="p-3">
    <b-overlay :show="isBusy || loadingError">
      <template #overlay>
        <div class="text-center">
          <b-spinner v-if="isBusy" />
          <b-button
            v-else
            @click="loadUser()"
          >
            <i class="fa-solid fa-sync" /> {{ $t('app.reload') }}
          </b-button>
        </div>
      </template>
      <b-tabs
        v-if="!isBusy && user"
        fill
        nav-wrapper-class="mb-3"
      >
        <b-tab lazy>
          <template #title>
            <i class="fa-solid fa-user" /> {{ $t('settings.users.base_data') }}
          </template>
          <profile-component
            :user="user"
            :view-only="viewOnly"
            @update-user="updateUser"
            @stale-error="handleStaleError"
            @not-found-error="handleNotFoundError"
          />
        </b-tab>
        <b-tab lazy>
          <template #title>
            <i class="fa-solid fa-envelope" /> {{ $t('app.email') }}
          </template>
          <email-settings-component
            :user="user"
            :view-only="viewOnly"
            @update-user="updateUser"
            @not-found-error="handleNotFoundError"
          />
        </b-tab>
        <b-tab lazy>
          <template #title>
            <i class="fa-solid fa-user-shield" /> {{ $t('app.security') }}
          </template>
          <authentication-settings-component
            :user="user"
            :view-only="viewOnly"
            @update-user="updateUser"
            @stale-error="handleStaleError"
            @not-found-error="handleNotFoundError"
          />
        </b-tab>
        <b-tab lazy>
          <template #title>
            <i class="fa-solid fa-user-gear" /> {{ $t('settings.users.other_settings') }}
          </template>
          <other-settings-component
            :user="user"
            :view-only="viewOnly"
            @update-user="updateUser"
            @stale-error="handleStaleError"
            @not-found-error="handleNotFoundError"
          />
        </b-tab>
      </b-tabs>
    </b-overlay>
    <b-modal
      ref="stale-user-modal"
      :static="modalStatic"
      :busy="isBusy"
      ok-variant="secondary"
      :ok-only="true"
      :hide-header-close="true"
      :no-close-on-backdrop="true"
      :no-close-on-esc="true"
      :hide-header="true"
      @ok="refreshUser"
    >
      <template #default>
        <h5>{{ staleError.message }}</h5>
      </template>
      <template #modal-ok>
        <b-spinner
          v-if="isBusy"
          small
        />  {{ $t('app.reload') }}
      </template>
    </b-modal>
  </div>
</template>

<script>
import FieldErrors from '@/mixins/FieldErrors';
import 'cropperjs/dist/cropper.css';
import AuthenticationSettingsComponent from './AuthenticationSettingsComponent.vue';
import OtherSettingsComponent from './OtherSettingsComponent.vue';
import EmailSettingsComponent from './EmailSettingsComponent.vue';
import ProfileComponent from './ProfileComponent.vue';
import Base from '@/api/base';
import env from '@/env';

export default {
  components: {
    ProfileComponent,
    EmailSettingsComponent,
    OtherSettingsComponent,
    AuthenticationSettingsComponent
  },
  mixins: [FieldErrors],
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
  data () {
    return {
      user: null,
      isBusy: false,
      loadingError: false,
      staleError: {}
    };
  },
  mounted () {
    this.loadUser();
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
      this.$emit('update-user', this.user);
    },

    /**
     * Refreshes the current model with the new passed from the stale error response.
     */
    refreshUser () {
      this.user = this.staleError.new_model;
      this.user.roles.forEach(role => {
        role.$isDisabled = role.automatic;
      });
      this.$emit('update-user', this.staleError.new_model);
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
        this.$emit('update-user', this.user);
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
  }
};

</script>

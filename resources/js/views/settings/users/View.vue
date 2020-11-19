<template>
  <component
    v-bind:is="config.type === 'profile' ? 'b-container' : 'div'"
    v-bind:class="{ 'mt-3': config.type === 'profile', 'mb-5': config.type === 'profile' }"
  >
    <component
      v-bind:is="config.type === 'profile' ? 'b-card' : 'div'"
      v-bind:class="{ 'p-3': config.type === 'profile', border: config.type === 'profile', 'bg-white': config.type === 'profile' }">
      <h3>
        {{ config.id === 'new' ? $t('settings.users.new') : (
          config.type === 'profile' ? $t('app.profile') :
            $t(`settings.users.${config.type}`, { firstname: model.firstname, lastname: model.lastname })
        ) }}
      </h3>
      <hr>

      <b-form @submit='saveUser'>
        <b-container :fluid='true'>
          <b-form-group
            label-cols-sm='3'
            :label="$t('settings.users.firstname')"
            label-for='firstname'
            :state='fieldState("firstname")'
          >
            <b-form-input
              id='firstname'
              type='text'
              v-model='model.firstname'
              :state='fieldState("firstname")'
              :disabled="isBusy || config.type === 'view' || model.authenticator !== 'users'"
            ></b-form-input>
            <template slot='invalid-feedback'><div v-html="fieldError('firstname')"></div></template>
          </b-form-group>
          <b-form-group
            label-cols-sm='3'
            :label="$t('settings.users.lastname')"
            label-for='lastname'
            :state='fieldState("lastname")'
          >
            <b-form-input
              id='lastname'
              type='text'
              v-model='model.lastname'
              :state='fieldState("lastname")'
              :disabled="isBusy || config.type === 'view' || model.authenticator !== 'users'"
            ></b-form-input>
            <template slot='invalid-feedback'><div v-html="fieldError('lastname')"></div></template>
          </b-form-group>
          <b-form-group
            label-cols-sm='3'
            :label="$t('settings.users.username')"
            label-for='username'
            :state='fieldState("username")'
          >
            <b-form-input
              id='username'
              type='text'
              v-model='model.username'
              :state='fieldState("username")'
              :disabled="isBusy || config.type === 'view' || model.authenticator !== 'users'"
            ></b-form-input>
            <template slot='invalid-feedback'><div v-html="fieldError('username')"></div></template>
          </b-form-group>
          <b-form-group
            label-cols-sm='3'
            :label="$t('settings.users.email')"
            label-for='email'
            :state='fieldState("email")'
          >
            <b-form-input
              id='email'
              type='email'
              v-model='model.email'
              :state='fieldState("email")'
              :disabled="isBusy || config.type === 'view' || model.authenticator !== 'users'"
            ></b-form-input>
            <template slot='invalid-feedback'><div v-html="fieldError('email')"></div></template>
          </b-form-group>
          <b-form-group
            label-cols-sm='3'
            :label="$t('settings.users.user_locale')"
            label-for='user_locale'
            :state='fieldState("user_locale")'
          >
            <b-form-select
              :options='locales'
              id='user_locale'
              v-model='model.user_locale'
              :state='fieldState("user_locale")'
              :disabled="isBusy || config.type === 'view'"
            >
              <template v-slot:first>
                <b-form-select-option :value="null" disabled>{{ $t('settings.users.select_locale') }}</b-form-select-option>
              </template>
            </b-form-select>
            <template slot='invalid-feedback'><div v-html="fieldError('user_locale')"></div></template>
          </b-form-group>
          <b-form-group
            label-cols-sm='3'
            :label="$t('settings.users.roles')"
            label-for='roles'
            :state='fieldState("roles", true)'
          >
            <multiselect
              v-model='model.roles'
              track-by='id'
              open-direction='bottom'
              :multiple='true'
              :searchable='false'
              :internal-search='false'
              :clear-on-select='false'
              :close-on-select='false'
              :show-no-results='false'
              :showLabels='false'
              :options='roles'
              :disabled="isBusy || config.type === 'view' || !canEditRoles"
              id='roles'
              :loading='rolesLoading'
              :allowEmpty='false'
              :class="{ 'is-invalid': fieldState('roles', true) }">
              <template slot='noOptions'>{{ $t('settings.roles.nodata') }}</template>
              <template slot='option' slot-scope="props">{{ $te(`app.roles.${props.option.name}`) ? $t(`app.roles.${props.option.name}`) : props.option.name }}</template>
              <template slot='tag' slot-scope='{ option, remove }'>
                <h5 class='d-inline mr-1 mb-1'>
                  <b-badge variant='primary'>
                    {{ $te(`app.roles.${option.name}`) ? $t(`app.roles.${option.name}`) : option.name }}
                    <span @click='remove(option)'><b-icon-x :aria-label="$t('settings.users.removeRole')"></b-icon-x></span>
                  </b-badge>
                </h5>
              </template>
              <template slot='afterList'>
                <b-button
                  :disabled='rolesLoading || currentPage === 1'
                  variant='outline-secondary'
                  @click='loadRoles(Math.max(1, currentPage - 1))'>
                  <i class='fas fa-arrow-left'></i> {{ $t('app.previousPage') }}
                </b-button>
                <b-button
                  :disabled='rolesLoading || !hasNextPage'
                  variant='outline-secondary'
                  @click='loadRoles(currentPage + 1)'>
                  <i class='fas fa-arrow-right'></i> {{ $t('app.nextPage') }}
                </b-button>
              </template>
            </multiselect>
            <template slot='invalid-feedback'><div v-html="fieldError('roles', true)"></div></template>
          </b-form-group>
          <b-form-group
            label-cols-sm='3'
            :label="$t('settings.users.password')"
            label-for='password'
            :state='fieldState("password")'
            v-if="model.authenticator === 'users' && config.type !== 'view'"
          >
            <b-form-input
              id='password'
              type='password'
              v-model='model.password'
              :state='fieldState("password")'
              :disabled="isBusy"
            ></b-form-input>
            <template slot='invalid-feedback'><div v-html="fieldError('password')"></div></template>
          </b-form-group>
          <b-form-group
            label-cols-sm='3'
            :label="$t('settings.users.password_confirmation')"
            label-for='password_confirmation'
            :state='fieldState("password_confirmation")'
            v-if="model.authenticator === 'users' && config.type !== 'view'"
          >
            <b-form-input
              id='password_confirmation'
              type='password'
              v-model='model.password_confirmation'
              :state='fieldState("password_confirmation")'
              :disabled="isBusy"
            ></b-form-input>
            <template slot='invalid-feedback'><div v-html="fieldError('password_confirmation')"></div></template>
          </b-form-group>
          <hr>
          <b-row class='my-1 float-right'>
            <b-col sm='12'>
              <b-button
                :disabled='isBusy'
                variant='secondary'
                @click="$router.push({ name: 'settings.users' })"
                v-if="config.type !== 'profile'">
                <i class='fas fa-arrow-left'></i> {{ $t('app.back') }}
              </b-button>
              <b-button
                :disabled='isBusy'
                variant='success'
                type='submit'
                class='ml-1'
                v-if="config.type !== 'view'">
                <i class='fas fa-save'></i> {{ $t('app.save') }}
              </b-button>
            </b-col>
          </b-row>
        </b-container>
      </b-form>

      <b-modal
        :static='modalStatic'
        :busy='isBusy'
        ok-variant='danger'
        cancel-variant='dark'
        @ok='forceOverwrite'
        @cancel='refreshUser'
        :hide-header-close='true'
        :no-close-on-backdrop='true'
        :no-close-on-esc='true'
        ref='stale-user-modal'
        :hide-header='true'>
        <template v-slot:default>
          <h5>{{ staleError.message }}</h5>
        </template>
        <template v-slot:modal-ok>
          <b-spinner small v-if="isBusy"></b-spinner>  {{ $t('app.overwrite') }}
        </template>
        <template v-slot:modal-cancel>
          <b-spinner small v-if="isBusy"></b-spinner>  {{ $t('app.reload') }}
        </template>
      </b-modal>
    </component>
  </component>
</template>

<script>
import FieldErrors from '../../../mixins/FieldErrors';
import Base from '../../../api/base';
import LocaleMap from '../../../lang/LocaleMap';
import Multiselect from 'vue-multiselect';
import EventBus from '../../../services/EventBus';
import PermissionService from '../../../services/PermissionService';
import env from '../../../env';
import { loadLanguageAsync } from '../../../i18n';
import _ from 'lodash';

export default {
  mixins: [FieldErrors],
  components: { Multiselect },

  computed: {
    /**
     * The available locales that the user can select from.
     */
    locales () {
      const availableLocales = this.availableLocales;

      return Object.keys(LocaleMap)
        .filter(key => availableLocales.includes(key))
        .map(key => {
          return {
            value: key,
            text: LocaleMap[key]
          };
        });
    }
  },

  props: {
    config: {
      type: Object,
      required: true,
      default: function () {
        return {};
      },
      validator ({ id, type }) {
        if (['string', 'number'].indexOf(typeof id) === -1) {
          return false;
        }
        if (typeof type !== 'string' || ['view', 'edit', 'profile'].indexOf(type) === -1) {
          return false;
        }
        return !(id === 'new' && type !== 'edit');
      }
    },

    modalStatic: {
      type: Boolean,
      default: false
    },

    availableLocales: {
      type: Array,
      default: function () {
        return process.env.MIX_AVAILABLE_LOCALES.split(',');
      }
    }
  },

  data () {
    return {
      isBusy: false,
      model: {
        firstname: null,
        lastname: null,
        username: null,
        email: null,
        password: null,
        password_confirmation: null,
        user_locale: null,
        roles: []
      },
      errors: {},
      rolesLoading: false,
      roles: [],
      currentPage: 1,
      hasNextPage: false,
      modelLoadPromise: Promise.resolve(),
      canEditRoles: false,
      staleError: {}
    };
  },

  /**
   * Removes the event listener to enable or disable the edition of roles when
   * the permissions of the current user gets changed.
   */
  beforeDestroy () {
    EventBus.$off('currentUserChangedEvent', this.toggleRolesEditable);
  },

  /**
   * Loads the user, part of roles that can be selected and enables an event listener
   * to enable or disable the edition of roles when the permissions of the current
   * user gets changed.
   */
  mounted () {
    EventBus.$on('currentUserChangedEvent', this.toggleRolesEditable);

    if (this.config.type !== 'profile') {
      this.loadRoles();
    }

    if (this.config.id !== 'new') {
      this.modelLoadPromise = Base.call(`users/${this.config.id}`).then(response => {
        this.model = response.data.data;
        this.model.roles.forEach(role => {
          role.$isDisabled = role.automatic;
        });
        this.toggleRolesEditable();
      }).catch(error => {
        if (PermissionService.currentUser && this.config.id === PermissionService.currentUser.id && error.response && error.response.status === env.HTTP_NOT_FOUND) {
          this.$store.dispatch('session/logout').then(() => {
            this.$router.push({ name: 'home' });
          });
        } else {
          Base.error(error, this.$root, error.message);
        }
      }).finally(() => {
        this.isBusy = false;
      });
    } else {
      this.model.authenticator = 'users';
      this.canEditRoles = true;
    }
  },

  methods: {
    /**
     * Loads the roles for the passed page, that can be selected through the multiselect.
     *
     * @param [page=1] The page to load the roles for.
     */
    loadRoles (page = 1) {
      this.rolesLoading = true;

      const config = {
        params: {
          page
        }
      };

      Base.call('roles', config).then(response => {
        this.roles = response.data.data;
        this.currentPage = page;
        this.hasNextPage = page < response.data.meta.last_page;
        return this.modelLoadPromise;
      }).then(() => {
        this.roles.forEach(role => {
          role.$isDisabled = !!this.model.roles.find(selectedRole => selectedRole.id === role.id && selectedRole.automatic);
        });
      }).catch(error => {
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        this.rolesLoading = false;
      });
    },

    /**
     * Saves the changes of the user to the database by making a api call.
     *
     * @param evt
     */
    saveUser (evt) {
      if (evt) {
        evt.preventDefault();
      }

      this.isBusy = true;

      const config = {
        method: this.config.id === 'new' ? 'post' : 'put',
        data: _.cloneDeep(this.model)
      };
      config.data.roles = config.data.roles.map(role => role.id);

      Base.call(this.config.id === 'new' ? 'users' : `users/${this.config.id}`, config).then(response => {
        const localeChanged = this.$store.state.session.currentLocale !== config.data.user_locale;

        // if the updated user is the current user, then renew also the currentUser by calling getCurrentUser of the store
        if (PermissionService.currentUser && this.config.id === PermissionService.currentUser.id) {
          return this.$store.dispatch('session/getCurrentUser').then(() => {
            if (localeChanged) {
              return loadLanguageAsync(config.data.user_locale).then(() => {
                this.$store.commit('session/setCurrentLocale', config.data.user_locale);
                return response;
              });
            }

            return Promise.resolve(response);
          });
        }

        return Promise.resolve(response);
      }).then(response => {
        // don't change page on save on profile page
        if (this.config.type !== 'profile') {
          this.$router.push({ name: 'settings.users' });
        } else {
          this.model = response.data.data;
          this.roles.forEach(role => {
            role.$isDisabled = !!this.model.roles.find(selectedRole => selectedRole.id === role.id && selectedRole.automatic);
          });
          this.model.roles.forEach(role => {
            role.$isDisabled = role.automatic;
          });
        }
      }).catch(error => {
        // If the user wasn't found and it is the current user log him out!
        if (PermissionService.currentUser && this.config.id === PermissionService.currentUser.id && error.response && error.response.status === env.HTTP_NOT_FOUND) {
          this.$store.dispatch('session/logout').then(() => {
            this.$router.push({ name: 'home' });
          });
        } else if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          this.errors = error.response.data.errors;
        } else if (error.response && error.response.status === env.HTTP_STALE_MODEL) {
          // handle stale errors
          this.staleError = error.response.data;
          this.$refs['stale-user-modal'].show();
        } else {
          Base.error(error, this.$root, error.message);
        }
      }).finally(() => {
        this.isBusy = false;
      });
    },

    /**
     * Enable or disable the edition of roles depending on the permissions of the current user.
     */
    toggleRolesEditable () {
      if (this.model.id && this.model.model_name) {
        this.canEditRoles = PermissionService.can('editUserRole', this.model);
      }
    },

    /**
     * Force a overwrite of the user in the database by setting the `updated_at` field to the new one.
     */
    forceOverwrite () {
      this.model.updated_at = this.staleError.new_model.updated_at;
      this.staleError = {};
      this.$refs['stale-user-modal'].hide();
      this.saveUser();
    },

    /**
     * Refreshes the current model with the new passed from the stale error response.
     */
    refreshUser () {
      this.model = this.staleError.new_model;
      this.roles.forEach(role => {
        role.$isDisabled = !!this.model.roles.find(selectedRole => selectedRole.id === role.id && selectedRole.automatic);
      });
      this.model.roles.forEach(role => {
        role.$isDisabled = role.automatic;
      });
      this.staleError = {};
      this.$refs['stale-user-modal'].hide();
    }
  }
};

</script>

<style scoped>

</style>

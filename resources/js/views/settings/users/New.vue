<template>
  <div>
    <h3>
      {{ $t('settings.users.new') }}
    </h3>
    <hr>

    <b-overlay :show="isBusy">
      <template #overlay>
        <div class="text-center">
          <b-spinner></b-spinner>
        </div>
      </template>

      <b-container :fluid='true'>
        <b-form-group
          label-cols-lg="12"
          :label="$t('settings.users.base_data')"
          label-size="lg"
          label-class="font-weight-bold pt-0"
          class="mb-0"
        >
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
              :disabled="isBusy"
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
              :disabled="isBusy"
            ></b-form-input>
            <template slot='invalid-feedback'><div v-html="fieldError('lastname')"></div></template>
          </b-form-group>
          <b-form-group
            label-cols-sm='3'
            :label="$t('settings.users.email.email')"
            label-for='email'
            :state='fieldState("email")'
          >
            <b-form-input
              id='email'
              type='email'
              v-model='model.email'
              :state='fieldState("email")'
              :disabled="isBusy"
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
              :disabled="isBusy"
            >
              <template v-slot:first>
                <b-form-select-option :value="null" disabled>{{ $t('settings.users.authentication.roles_and_perm.select_locale') }}</b-form-select-option>
              </template>
            </b-form-select>
            <template slot='invalid-feedback'><div v-html="fieldError('user_locale')"></div></template>
          </b-form-group>
          <b-form-group
            label-cols-sm='3'
            :label="$t('settings.users.timezone')"
            label-for='timezone'
            :state='fieldState("timezone")'
          >
            <b-input-group>
              <b-form-select
                :options="timezones"
                id='timezone'
                v-model='model.timezone'
                :state='fieldState("timezone")'
                :disabled="isBusy || timezonesLoading || timezonesLoadingError"
              >
                <template v-slot:first>
                  <b-form-select-option :value="null" disabled>{{ $t('settings.users.timezone') }}</b-form-select-option>
                </template>
              </b-form-select>
              <template slot='invalid-feedback'><div v-html="fieldError('timezone')"></div></template>

              <b-input-group-append>
                <b-button
                  v-if="timezonesLoadingError"
                  @click="loadTimezones()"
                  variant="outline-secondary"
                ><i class="fa-solid fa-sync"></i></b-button>
              </b-input-group-append>
            </b-input-group>
          </b-form-group>
          <b-form-group
            label-cols-sm='3'
            :label="$t('settings.users.authentication.roles_and_perm.roles')"
            label-for='roles'
            :state='fieldState("roles", true)'
          >
            <b-input-group>
              <multiselect
                :placeholder="$t('settings.users.authentication.roles_and_perm.select_roles')"
                ref="roles-multiselect"
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
                :disabled="isBusy || rolesLoadingError"
                id='roles'
                :loading='rolesLoading'
                :allowEmpty='false'
                :class="{ 'is-invalid': fieldState('roles', true), 'multiselect-form-control': true }">
                <template slot='noOptions'>{{ $t('settings.roles.nodata') }}</template>
                <template slot='option' slot-scope="props">{{ $te(`app.roles.${props.option.name}`) ? $t(`app.roles.${props.option.name}`) : props.option.name }}</template>
                <template slot='tag' slot-scope='{ option, remove }'>
                  <h5 class='d-inline mr-1 mb-1'>
                    <b-badge variant='secondary'>
                      {{ $te(`app.roles.${option.name}`) ? $t(`app.roles.${option.name}`) : option.name }}
                      <span @click='remove(option)'><i class="fa-solid fa-xmark" :aria-label="$t('settings.users.removeRole')"></i></span>
                    </b-badge>
                  </h5>
                </template>
                <template slot='afterList'>
                  <b-button
                    :disabled='rolesLoading || currentPage === 1'
                    variant='outline-secondary'
                    @click='loadRoles(Math.max(1, currentPage - 1))'>
                    <i class='fa-solid fa-arrow-left'></i> {{ $t('app.previousPage') }}
                  </b-button>
                  <b-button
                    :disabled='rolesLoading || !hasNextPage'
                    variant='outline-secondary'
                    @click='loadRoles(currentPage + 1)'>
                    <i class='fa-solid fa-arrow-right'></i> {{ $t('app.nextPage') }}
                  </b-button>
                </template>
              </multiselect>
              <b-input-group-append>
                <b-button
                  ref="reloadRolesButton"
                  v-if="rolesLoadingError"
                  @click="loadRoles(currentPage)"
                  variant="outline-secondary"
                ><i class="fa-solid fa-sync"></i></b-button>
              </b-input-group-append>
            </b-input-group>
            <template slot='invalid-feedback'><div v-html="fieldError('roles', true)"></div></template>
          </b-form-group>
        </b-form-group>
        <hr>
        <b-form-group
          label-cols-lg="12"
          :label="$t('settings.users.password')"
          label-size="lg"
          label-class="font-weight-bold pt-0"
          class="mb-0"
        >
          <b-form-group
            label-cols-sm='3'
            :label="$t('settings.users.generate_password')"
            label-for='generate_password'
            :state="fieldState('generate_password')"
            :description="$t('settings.users.generate_password_description')"
            class="align-items-center d-flex"
          >
            <b-form-checkbox
              id='generate_password'
              v-model='generate_password'
              :state="fieldState('generate_password')"
              :disabled="isBusy"
              switch
            ></b-form-checkbox>
            <template slot='invalid-feedback'><div v-html="fieldError('generate_password')"></div></template>
          </b-form-group>
          <b-form-group
            v-if="!generate_password"
            label-cols-sm='3'
            :label="$t('settings.users.new_password')"
            label-for='new_password'
            :state='fieldState("password")'
          >
            <b-form-input
              id='new_password'
              type='password'
              v-model='model.new_password'
              :state='fieldState("new_password")'
              :disabled="isBusy"
            ></b-form-input>
            <template slot='invalid-feedback'><div v-html="fieldError('new_password')"></div></template>
          </b-form-group>
          <b-form-group
            v-if="!generate_password"
            label-cols-sm='3'
            :label="$t('settings.users.new_password_confirmation')"
            label-for='new_password_confirmation'
            :state='fieldState("password_confirmation")'
          >
            <b-form-input
              id='new_password_confirmation'
              type='password'
              v-model='model.new_password_confirmation'
              :state='fieldState("new_password_confirmation")'
              :disabled="isBusy"
            ></b-form-input>
            <template slot='invalid-feedback'><div v-html="fieldError('new_password_confirmation')"></div></template>
          </b-form-group>
        </b-form-group>
        <b-button
          :disabled='isBusy || rolesLoadingError || timezonesLoadingError'
          variant='success'
          type='submit'
          @click="save"
          >
          <i class='fa-solid fa-save'></i> {{ $t('app.save') }}
        </b-button>
      </b-container>
      </b-overlay>
  </div>
</template>

<script>
import FieldErrors from '../../../mixins/FieldErrors';
import Base from '../../../api/base';
import LocaleMap from '../../../lang/LocaleMap';
import Multiselect from 'vue-multiselect';
import EventBus from '../../../services/EventBus';
import env from '../../../env';
import 'cropperjs/dist/cropper.css';

export default {
  mixins: [FieldErrors],
  components: { Multiselect },

  computed: {
    /**
     * The available locales that the user can select from.
     */
    locales () {
      const availableLocales = process.env.MIX_AVAILABLE_LOCALES.split(',');

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
  data () {
    return {
      isBusy: false,
      model: {
        firstname: null,
        lastname: null,
        username: null,
        email: null,
        new_password: null,
        new_password_confirmation: null,
        user_locale: null,
        timezone: null,
        roles: []
      },
      generate_password: false,
      errors: {},
      rolesLoading: false,
      roles: [],
      currentPage: 1,
      hasNextPage: false,
      modelLoadPromise: Promise.resolve(),
      rolesLoadingError: false,
      timezonesLoading: false,
      timezonesLoadingError: false,
      timezones: []
    };
  },

  /**
   * Loads the user, part of roles that can be selected and enables an event listener
   * to enable or disable the edition of roles and attributes when the permissions
   * of the current user gets changed.
   */
  mounted () {
    EventBus.$on('currentUserChangedEvent', this.togglePermissionFlags);
    this.loadTimezones();

    this.loadRoles();

    this.model.user_locale = process.env.MIX_DEFAULT_LOCALE;
    this.model.timezone = this.$store.getters['session/settings']('default_timezone');
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
        this.rolesLoadingError = false;
        this.roles = response.data.data;
        this.currentPage = page;
        this.hasNextPage = page < response.data.meta.last_page;
        return this.modelLoadPromise;
      }).then(() => {
        this.roles.forEach(role => {
          role.$isDisabled = !!this.model.roles.find(selectedRole => selectedRole.id === role.id && selectedRole.automatic);
        });
      }).catch(error => {
        this.$refs['roles-multiselect'].deactivate();
        this.rolesLoadingError = true;
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        this.rolesLoading = false;
      });
    },

    /**
     * Loads the possible selectable timezones.
     */
    loadTimezones () {
      this.timezonesLoading = true;
      this.timezonesLoadingError = false;

      Base.call('getTimezones').then(response => {
        this.timezones = response.data.timezones;
      }).catch(error => {
        this.timezonesLoadingError = true;
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        this.timezonesLoading = false;
      });
    },

    /**
     * Saves the changes of the user to the database by making a api call.
     *
     */
    save () {
      this.isBusy = true;

      const formData = {
        firstname: this.model.firstname,
        lastname: this.model.lastname,
        username: this.model.username,
        email: this.model.email,
        user_locale: this.model.user_locale,
        timezone: this.model.timezone,
        roles: this.model.roles.map(role => role.id),
        generate_password: this.generate_password
      };

      if (!this.generate_password && this.model.new_password != null) {
        formData.new_password = this.model.new_password;
        formData.new_password_confirmation = this.model.new_password_confirmation;
      }

      Base.call('users', {
        method: 'POST',
        data: formData
      }).then(response => {
        this.errors = {};
        this.$router.push({ name: 'settings.users.view', params: { id: response.data.data.id } });
      }).catch(error => {
        if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          this.errors = error.response.data.errors;
        } else {
          Base.error(error, this.$root, error.message);
        }
      }).finally(() => {
        this.isBusy = false;
      });
    }
  }
};

</script>

<style scoped>

</style>

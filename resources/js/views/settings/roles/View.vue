<template>
  <div>
    <h3>
      {{ id === 'new' ? $t('settings.roles.new') : (
        viewOnly ? $t('settings.roles.view', { name: $te(`app.roles.${model.name}`) ? $t(`app.roles.${model.name}`) : model.name })
          : $t('settings.roles.edit', { name: $te(`app.roles.${model.name}`) ? $t(`app.roles.${model.name}`) : model.name })
      ) }}
    </h3>
    <hr>

    <b-form @submit='saveRole'>
      <b-container fluid>
        <b-form-group
          label-cols-sm='3'
          :label="$t('settings.roles.name')"
          label-for='name'
          :state='fieldState("name")'
        >
          <b-form-input id='name' type='text' v-model='model.name' :state='fieldState("name")' :disabled='isBusy || viewOnly'></b-form-input>
          <template slot='invalid-feedback'><div v-html="fieldError('name')"></div></template>
        </b-form-group>
        <b-form-group
          label-cols-sm='3'
          :label="$t('settings.roles.roomLimit.label')"
          label-for='room-limit'
          :state='fieldState("room_limit")'
        >
          <b-form-input
            id='room-limit'
            type='number'
            :state='fieldState("room_limit")'
            v-model='model.room_limit'
            min='0'
            :disabled='isBusy || viewOnly'
            v-if="roomLimitMode === 'custom'">
          </b-form-input>
          <b-form-group>
            <b-form-radio-group
              v-model='roomLimitMode'
              :options='roomLimitModeOptions'
              :disabled='isBusy || viewOnly'
              :state='fieldState("room_limit")'
              @change="roomLimitModeChanged"
            ></b-form-radio-group>
          </b-form-group>
          <template slot='invalid-feedback'><div v-html="fieldError('room_limit')"></div></template>
        </b-form-group>
        <b-form-group
          :label="$t('settings.roles.permissions')"
          label-size='lg'
          label-class='font-weight-bold pt-0'
          :state="Object.keys(errors).some(error => error === 'permissions' || error.startsWith('permissions.')) ? false : null"
        >
          <b-overlay :show='permissionsLoading'>
            <div class='row' v-if='!permissionsLoading && Object.keys(permissions).length > 0'>
              <b-form-group
                class='col-lg-4 col-sm-12'
                v-for="key in Object.keys(permissions)"
                :key='key'
              >
                <template v-slot:label>
                  <b>{{ $t(`app.permissions.${key}.title`) }}</b>
                </template>

                <b-form-checkbox-group
                  v-model='model.permissions'
                  :options='permissions[key]'
                  stacked
                  text-field='translatedName'
                  value-field='id'
                  :disabled='isBusy || viewOnly'
                  :state="Object.keys(errors).some(error => error === 'permissions' || error.startsWith('permissions.')) ? false : null"
                ></b-form-checkbox-group>
              </b-form-group>
            </div>
            <div class="ml-3" v-if="!permissionsLoading && Object.keys(permissions).length === 0">
              {{ $t('settings.roles.noOptions') }}
            </div>
          </b-overlay>

          <template slot="invalid-feedback">
            <ul>
              <li v-for="(error, index) in Object.keys(errors).filter(key => key.startsWith('permissions')).map(key => errors[key]).flat()" :key='index'>
                {{ error }}
              </li>
            </ul>
          </template>
        </b-form-group>
        <hr>
        <b-row class='my-1 float-right'>
          <b-col sm='12'>
            <b-button
              :disabled='isBusy || permissionsLoading'
              variant='secondary'
              @click="$router.push({ name: 'settings.roles' })">
              <i class='fas fa-arrow-left'></i> {{ $t('app.back') }}
            </b-button>
            <b-button
              :disabled='isBusy || permissionsLoading'
              variant='success'
              type='submit'
              class='ml-1'
              v-if='!viewOnly'>
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
      @cancel='refreshRole'
      :hide-header-close='true'
      :no-close-on-backdrop='true'
      :no-close-on-esc='true'
      ref='stale-role-modal'
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
  </div>
</template>

<script>
import Base from '../../../api/base';
import FieldErrors from '../../../mixins/FieldErrors';
import { mapGetters } from 'vuex';
import env from '../../../env';

export default {
  mixins: [FieldErrors],

  props: {
    id: {
      type: [String, Number],
      required: true
    },

    viewOnly: {
      type: Boolean,
      required: true
    },

    modalStatic: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    ...mapGetters({
      settings: 'session/settings'
    }),

    /**
     * Options for the room limit mode radio button group.
     */
    roomLimitModeOptions () {
      return [
        {
          text: this.$t('settings.roles.roomLimit.default', {
            value: this.settings('room_limit') === -1
              ? this.$t('settings.roles.roomLimit.unlimited').toLowerCase() : this.settings('room_limit')
          }),
          value: 'default'
        },
        { text: this.$t('settings.roles.roomLimit.unlimited'), value: 'unlimited' },
        { text: this.$t('settings.roles.roomLimit.custom'), value: 'custom' }
      ];
    }
  },

  data () {
    return {
      isBusy: false,
      model: {
        name: null,
        room_limit: null,
        permissions: []
      },
      permissions: {},
      permissionsLoading: false,
      errors: {},
      staleError: {},
      roomLimitMode: 'default'
    };
  },

  /**
   * Loads the role from the backend and also a part of permissions that can be selected.
   */
  mounted () {
    this.loadPermissions();

    if (this.id !== 'new') {
      this.isBusy = true;

      Base.call(`roles/${this.id}`).then(response => {
        this.model = response.data.data;
        this.model.permissions = this.model.permissions.map(permission => permission.id);
        this.roomLimitMode = this.model.room_limit === null ? 'default' : (this.model.room_limit === -1 ? 'unlimited' : 'custom');
      }).catch(response => {
        Base.error(response, this.$root, response.message);
      }).finally(() => {
        this.isBusy = false;
      });
    }
  },

  methods: {
    /**
     * Loads the permissions that can be selected through checkboxes.
     */
    loadPermissions () {
      this.permissionsLoading = true;

      Base.call('permissions').then(response => {
        this.permissions = {};
        response.data.data.forEach(permission => {
          const group = permission.name.split('.')[0];

          if (!this.permissions[group]) {
            this.permissions[group] = [];
          }

          permission.translatedName = this.$t(`app.permissions.${permission.name}`);
          this.permissions[group].push(permission);
        });
      }).catch(error => {
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        this.permissionsLoading = false;
      });
    },

    /**
     * Saves the changes of the role to the database by making a api call.
     *
     * @param evt
     */
    saveRole (evt) {
      if (evt) {
        evt.preventDefault();
      }

      this.isBusy = true;

      const config = {
        method: this.id === 'new' ? 'post' : 'put',
        data: {
          name: this.model.name,
          room_limit: this.model.room_limit || null,
          permissions: this.model.permissions,
          updated_at: this.model.updated_at
        }
      };

      Base.call(this.id === 'new' ? 'roles' : `roles/${this.id}`, config).then(() => {
        this.$router.back();
      }).catch(error => {
        if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          this.errors = error.response.data.errors;
        } else if (error.response && error.response.status === env.HTTP_STALE_MODEL) {
          this.staleError = error.response.data;
          this.$refs['stale-role-modal'].show();
        } else {
          Base.error(error, this.$root, error.message);
        }
      }).finally(() => {
        this.isBusy = false;
      });
    },

    /**
     * Force a overwrite of the role in the database by setting the `updated_at` field to the new one.
     */
    forceOverwrite () {
      this.model.updated_at = this.staleError.new_model.updated_at;
      this.staleError = {};
      this.$refs['stale-role-modal'].hide();
      this.saveRole();
    },

    /**
     * Refreshes the current model with the new passed from the stale error response.
     */
    refreshRole () {
      this.model = this.staleError.new_model;
      this.model.permissions = this.model.permissions.map(permission => permission.id);
      this.staleError = {};
      this.$refs['stale-role-modal'].hide();
    },

    /**
     * Sets the room_limit on the model depending on the selected radio button.
     *
     * @param value Value of the radio button that was selected.
     */
    roomLimitModeChanged (value) {
      switch (value) {
        case 'default':
          this.model.room_limit = null;
          break;
        case 'unlimited':
          this.model.room_limit = -1;
          break;
        case 'custom':
          this.model.room_limit = 0;
          break;
      }
    }
  }
};
</script>

<style scoped>

</style>

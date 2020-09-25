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
        <b-row class='my-1'>
          <b-col sm='3'>
            <label for='name'>{{ $t('settings.roles.name') }}</label>
          </b-col>
          <b-col sm='9'>
            <b-form-input :state='fieldState("name")' id='name' type='text' v-model='model.name' :disabled='isBusy || viewOnly'></b-form-input>
            <b-form-invalid-feedback>
              {{ fieldError('name') }}
            </b-form-invalid-feedback>
          </b-col>
        </b-row>
        <b-row class='my-1'>
          <b-col sm='3'>
            <label for='room-limit'>{{ $t('settings.roles.roomLimit') }}</label>
          </b-col>
          <b-col sm='9'>
            <b-form-input :state='fieldState("room_limit")' id='room-limit' type='number' v-model='model.room_limit' min='-1' :disabled='isBusy || viewOnly'></b-form-input>
            <b-form-invalid-feedback>
              {{ fieldError('room_limit') }}
            </b-form-invalid-feedback>
          </b-col>
        </b-row>
        <b-row class='my-1'>
          <b-col sm='3'>
            <label for='permissions'>{{ $t('settings.roles.permissions') }}</label>
          </b-col>
          <b-col sm='9'>
            <multiselect v-model='model.permissions'
                         track-by='id'
                         open-direction='bottom'
                         :multiple='true'
                         :searchable='false'
                         :internal-search='false'
                         :clear-on-select='false'
                         :close-on-select='true'
                         :show-no-results='false'
                         :showLabels='false'
                         :options='permissions'
                         :custom-label='permissionsLabel'
                         :disabled='isBusy || viewOnly'
                         id='permissions'
                         :loading='permissionsLoading'
                         :class="{ 'is-invalid' : Object.keys(errors).some(key => key === 'permissions' || key.startsWith('permissions.')) }">

              <template slot='noOptions'>{{ $t('settings.roles.noOptions') }}</template>
              <template slot='option' slot-scope="props">{{ $t(`app.permissions.${props.option.name}`) }}</template>
              <template slot='singleLabel' slot-scope="props">{{ $t(`app.permissions.${props.option.name}`) }}</template>
              <template slot='afterList'>
                <li class='text-center mt-1'>
                  <b-button
                    :disabled='permissionsLoading || currentPage === 1'
                    variant='outline-secondary'
                    @click='loadPermissions(Math.max(1, currentPage - 1))'>
                    <i class='fas fa-arrow-left'></i> {{ $t('app.previousPage') }}
                  </b-button>
                  <b-button
                    :disabled='permissionsLoading || !hasNextPage'
                    variant='outline-secondary'
                    @click='loadPermissions(currentPage + 1)'>
                    <i class='fas fa-arrow-right'></i> {{ $t('app.nextPage') }}
                  </b-button>
                </li>
              </template>
            </multiselect>
            <b-form-invalid-feedback>
              <ul>
                <li v-for="(error, index) in Object.keys(errors).filter(key => key.startsWith('permissions')).map(key => errors[key]).flat()" :key='index'>
                  {{ error }}
                </li>
              </ul>
            </b-form-invalid-feedback>
          </b-col>
        </b-row>
        <hr>
        <b-row class='my-1 float-right'>
          <b-col sm='12'>
            <b-button
              :disabled='isBusy || permissionsLoading'
              variant='secondary'
              @click='back'>
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
import Multiselect from 'vue-multiselect';
import FieldErrors from '../../../mixins/FieldErrors';

export default {
  mixins: [FieldErrors],
  components: { Multiselect },

  props: {
    id: {
      type: [String, Number],
      required: true
    },

    viewOnly: {
      type: Boolean,
      required: true
    }
  },

  data () {
    return {
      isBusy: false,
      model: {},
      permissions: [],
      permissionsLoading: false,
      hasNextPage: false,
      currentPage: 0,
      errors: {},
      staleError: {}
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
      }).catch(response => {
        Base.error(response, this.$root, response.message);
      }).finally(() => {
        this.isBusy = false;
      });
    }
  },

  methods: {
    /**
     * Loads partially the permissions that can be selected through the multiselect.
     */
    loadPermissions (page = 1) {
      this.permissionsLoading = true;

      const config = {
        params: {
          page: page
        }
      };

      Base.call('permissions', config).then(response => {
        this.permissions = response.data.data;
        this.currentPage = page;
        this.hasNextPage = page < response.data.meta.last_page;
      }).catch(error => {
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        this.permissionsLoading = false;
      });
    },

    /**
     * Goes back to the role overview page.
     */
    back () {
      this.$router.push({ name: 'settings.roles' });
    },

    /**
     * Returns the translated permission.
     *
     * @param name
     * @return {string}
     */
    permissionsLabel ({ name }) {
      return this.$t(`app.permissions.${name}`);
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
          permissions: this.model.permissions.map(permission => permission.id),
          updated_at: this.model.updated_at
        }
      };

      Base.call(this.id === 'new' ? 'roles' : `roles/${this.id}`, config).then(() => {
        this.$router.back();
      }).catch(error => {
        if (error.response && error.response.status === 422) {
          this.errors = error.response.data.errors;
        } else if (error.response && error.response.status === 466) {
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
      this.staleError = {};
      this.$refs['stale-role-modal'].hide();
    }
  }
};
</script>

<style scoped>

</style>

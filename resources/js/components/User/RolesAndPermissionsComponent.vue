<template>
  <div>
    <b-form @submit="save">
      <b-form-group
        label-cols-sm="3"
        :label="$t('app.roles')"
        label-for="roles"
        :state="fieldState('roles', true)"
      >
        <role-select
          id="roles"
          v-model="model.roles"
          :invalid="fieldState('roles', true) === false"
          :disabled="isBusy || viewOnly || !canEditRoles"
          :disabled-roles="disabledRoles"
          @loading-error="(value) => rolesLoadingError = value"
          @busy="(value) => rolesLoading = value"
        />
        <template #invalid-feedback>
          <div v-html="fieldError('roles', true)" />
        </template>
      </b-form-group>

      <b-button
        v-if="!viewOnly && canEditRoles"
        :disabled="isBusy || rolesLoadingError || rolesLoading"
        variant="success"
        type="submit"
      >
        <i class="fa-solid fa-save" /> {{ $t('app.save') }}
      </b-button>
    </b-form>
  </div>
</template>

<script>
import FieldErrors from '@/mixins/FieldErrors';
import PermissionService from '@/services/PermissionService';
import Base from '@/api/base';
import env from '@/env';
import _ from 'lodash';
import RoleSelect from '@/components/Inputs/RoleSelect.vue';

export default {
  name: 'RolesAndPermissionsComponent',
  components: { RoleSelect },
  mixins: [FieldErrors],
  props: {
    viewOnly: {
      type: Boolean,
      default: false
    },
    user: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      isBusy: false,
      model: {},
      errors: {},

      canEditRoles: false,
      staleError: {},
      rolesLoadingError: false,
      rolesLoading: false
    };
  },
  computed: {
    disabledRoles () {
      if (!this.model.roles) {
        return [];
      }
      return this.model.roles.filter(role => role.automatic).map(role => role.id);
    }
  },

  watch: {
    /**
     * When the user changes, the model is updated and the roles are reloaded.
     */
    user: {
      handler (user) {
        this.model = _.cloneDeep(user);
      },
      deep: true
    }
  },
  mounted () {
    this.model = _.cloneDeep(this.user);
    this.canEditRoles = PermissionService.can('editUserRole', this.model);
  },

  methods: {

    /**
     * Saves the changes of the user to the database by making a api call.
     *
     */
    save (evt) {
      if (evt) {
        evt.preventDefault();
      }
      this.isBusy = true;
      this.errors = {};

      Base.call('users/' + this.model.id, {
        method: 'put',
        data: {
          roles: this.model.roles.map(role => role.id),
          updated_at: this.model.updated_at
        }
      }).then(response => {
        this.$emit('update-user', response.data.data);
      }).catch(error => {
        if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
          this.$emit('not-found-error', error);
        } else if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          this.errors = error.response.data.errors;
        } else if (error.response && error.response.status === env.HTTP_STALE_MODEL) {
          // Stale error
          this.$emit('stale-error', error.response.data);
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

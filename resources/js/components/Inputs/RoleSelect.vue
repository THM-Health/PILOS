<template>
  <b-input-group>
    <multiselect
      :placeholder="$t('settings.roles.select_roles')"
      ref="roles-multiselect"
      :value="selectedRoles"
      @input="input"
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
      :disabled="disabled || loading || loadingError"
      :id="id"
      :loading='loading'
      :allowEmpty='false'
      :class="{ 'is-invalid': invalid, 'multiselect-form-control': true }">
      <template slot='noOptions'>{{ $t('settings.roles.nodata') }}</template>
      <template slot='option' slot-scope="props">{{ $te(`app.role_lables.${props.option.name}`) ? $t(`app.role_lables.${props.option.name}`) : props.option.name }}</template>
      <template slot='tag' slot-scope='{ option, remove }'>
        <h5 class='d-inline mr-1 mb-1'>
          <b-badge variant='secondary' >
            {{ $te(`app.role_lables.${option.name}`) ? $t(`app.role_lables.${option.name}`) : option.name }}
            <span @click='remove(option)' v-if="!option.$isDisabled"><i class="fa-solid fa-xmark" :aria-label="$t('settings.users.remove_role')"></i></span>
          </b-badge>
        </h5>
      </template>
      <template slot='afterList'>
        <b-button
          :disabled='loading || currentPage === 1'
          variant='outline-secondary'
          @click='loadRoles(Math.max(1, currentPage - 1))'>
          <i class='fa-solid fa-arrow-left'></i> {{ $t('app.previous_page') }}
        </b-button>
        <b-button
          :disabled='loading || !hasNextPage'
          variant='outline-secondary'
          @click='loadRoles(currentPage + 1)'>
          <i class='fa-solid fa-arrow-right'></i> {{ $t('app.next_page') }}
        </b-button>
      </template>
    </multiselect>
    <b-input-group-append v-if="loadingError">
      <b-button
        :disabled='loading'
        ref="reloadRolesButton"
        @click="loadRoles(currentPage)"
        variant="outline-secondary"
      ><i class="fa-solid fa-sync"></i></b-button>
    </b-input-group-append>
  </b-input-group>
</template>

<script>
import { Multiselect } from 'vue-multiselect';
import Base from '../../api/base';

export default {
  name: 'RoleSelect',
  components: { Multiselect },
  props: {
    value: {
      type: Array
    },
    invalid: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    disabledRoles: {
      type: Array,
      default: () => []
    },
    id: {
      type: String,
      default: 'roles'
    }
  },
  watch: {
    value: {
      handler (value) {
        this.selectedRoles = value;
        this.disableRoles(this.selectedRoles);
      },
      deep: true
    },

    disabledRoles: {
      handler () {
        this.disableRoles(this.selectedRoles);
        this.disableRoles(this.roles);
      },
      deep: true
    },

    // detect changes of the model loading error
    loadingError: function () {
      this.$emit('loadingError', this.loadingError);
    },

    // detect busy status while data fetching and notify parent
    loading: function () {
      this.$emit('busy', this.loading);
    },

    disabled: function (disabled) {
      if (!disabled) {
        this.loadRoles();
      }
    }
  },
  data: function () {
    return {
      selectedRoles: [],
      roles: [],
      loading: false,
      loadingError: false,
      currentPage: 1,
      hasNextPage: false
    };
  },
  mounted () {
    if (!this.disabled) {
      this.loadRoles();
    }
    this.selectedRoles = this.value;
    this.disableRoles(this.selectedRoles);
  },
  methods: {

    disableRoles: function (roles) {
      if (roles) {
        roles.forEach(role => {
          role.$isDisabled = this.disabledRoles.some(disabledRole => disabledRole === role.id);
        });
      }
    },

    /**
     * Loads the roles for the passed page, that can be selected through the multiselect.
     *
     * @param [page=1] The page to load the roles for.
     */
    loadRoles (page = 1) {
      this.loading = true;

      const config = {
        params: {
          page
        }
      };

      Base.call('roles', config).then(response => {
        this.loadingError = false;
        this.currentPage = page;
        this.hasNextPage = page < response.data.meta.last_page;

        const roles = response.data.data;
        this.disableRoles(roles);
        this.roles = roles;
      }).catch(error => {
        // close open multiselect
        this.$refs['roles-multiselect'].deactivate();
        this.loadingError = true;
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        this.loading = false;
      });
    },

    /**
     * Emits the input event.
     */
    input (value) {
      this.$emit('input', value);
    }
  }
};
</script>

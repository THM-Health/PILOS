<template>
  <InputGroup>
    <multiselect
      :id="id"
      ref="roles-multiselect"
      :placeholder="$t('settings.roles.select_roles')"
      :model-value="selectedRoles"
      @update:modelValue="input"
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
      :loading="loading"
      :allow-empty="false"
      :class="{ 'is-invalid': invalid, 'multiselect-form-control': true }"
    >
      <template #noOptions>
        {{ $t('settings.roles.nodata') }}
      </template>
      <template v-slot:option="{ option }">
        {{ $te(`app.role_lables.${option.name}`) ? $t(`app.role_lables.${option.name}`) : option.name }}
      </template>
      <template v-slot:tag="{ option, remove }" >
          <Tag variant="secondary" class="flex-auto flex-row gap-2 mr-1 mb-1">
            {{ $te(`app.role_lables.${option.name}`) ? $t(`app.role_lables.${option.name}`) : option.name }}
            <Button
              v-if="!option.$isDisabled && selectedRoles.length>1"
              size="small"
              @click="remove(option)"
              icon="fa-solid fa-xmark"
              :aria-label="$t('settings.users.remove_role')"
              text
              rounded
              class="text-white p-0 h-1rem w-1rem"
            />
          </Tag>
      </template>
      <template #afterList>
        <Button
          :disabled="loading || currentPage === 1"
          variant="outline-secondary"
          @click="loadRoles(Math.max(1, currentPage - 1))"
          icon="fa-solid fa-arrow-left"
          :label="$t('app.previous_page')"
        />
        <Button
          :disabled="loading || !hasNextPage"
          variant="outline-secondary"
          @click="loadRoles(currentPage + 1)"
          icon="fa-solid fa-arrow-right"
          :label="$t('app.next_page')"
        />
      </template>
    </multiselect>
      <Button
        v-if="loadingError"
        ref="reloadRolesButton"
        :disabled="loading"
        variant="outline-secondary"
        @click="loadRoles(currentPage)"
        icon="fa-solid fa-sync"
      />
  </InputGroup>
</template>

<script>
import { Multiselect } from 'vue-multiselect';
import Base from '@/api/base';

export default {
  name: 'RoleSelect',
  components: { Multiselect },
  props: {
    modelValue: {
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
  watch: {
    modelValue: {
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
  mounted () {
    if (!this.disabled) {
      this.loadRoles();
    }
    this.selectedRoles = this.modelValue;
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
      console.log(value);
      this.$emit('update:modelValue', value);
    }
  }
};
</script>

<template>
  <div>
    <h3>
      {{ id === 'new' ? $t('settings.room_types.new') : (
        viewOnly ? $t('settings.room_types.view', { name: model.description })
        : $t('settings.room_types.edit', { name: model.description })
      ) }}
    </h3>
    <hr>
    <b-overlay :show="isBusy || modelLoadingError">
      <template #overlay>
        <div class="text-center">
          <b-spinner v-if="isBusy" />
          <b-button
            v-else
            ref="reloadRoomType"
            @click="loadRoomType()"
          >
            <i class="fa-solid fa-sync" /> {{ $t('app.reload') }}
          </b-button>
        </div>
      </template>
      <b-form @submit="saveRoomType">
        <b-container fluid>
          <b-form-group
            label-cols-sm="4"
            :label="$t('app.description')"
            label-for="description"
            :state="fieldState('description')"
          >
            <b-form-input
              id="description"
              v-model="model.description"
              type="text"
              :state="fieldState('description')"
              :disabled="isBusy || modelLoadingError || viewOnly"
            />
            <template slot="invalid-feedback">
              <div v-html="fieldError('description')" />
            </template>
          </b-form-group>

          <b-form-group
            label-cols-sm="4"
            :label="$t('settings.room_types.color')"
            label-for="color"
            :state="fieldState('color')"
          >
            <v-swatches
              v-model="model.color"
              class="my-2"
              :disabled="isBusy || modelLoadingError || viewOnly"
              :swatches="swatches"
              inline
            />
            <b-form-text>{{ $t('settings.room_types.custom_color') }}</b-form-text>
            <b-form-input
              id="color"
              v-model="model.color"
              type="text"
              :state="fieldState('color')"
              :disabled="isBusy || modelLoadingError || viewOnly"
            />

            <template slot="invalid-feedback">
              <div v-html="fieldError('color')" />
            </template>
          </b-form-group>

          <b-form-group
            label-cols-sm="4"
            :label="$t('settings.room_types.preview')"
          >
            <b-badge
              class="flex-shrink-1 text-break"
              style="white-space: normal"
              :style="{ 'background-color': model.color}"
            >
              {{ model.description }}
            </b-badge>
          </b-form-group>

          <b-form-group
            label-cols-sm="4"
            :label="$t('settings.room_types.allow_listing')"
            :description="$t('settings.room_types.allow_listing_description')"
            label-for="allow_listing"
            :state="fieldState('allow_listing')"
          >
            <b-form-checkbox
              id="allow_listing"
              v-model="model.allow_listing"
              switch
              :state="fieldState('allow_listing')"
              :disabled="isBusy || modelLoadingError || viewOnly"
            />
            <template slot="invalid-feedback">
              <div v-html="fieldError('allow_listing')" />
            </template>
          </b-form-group>

          <b-form-group
            label-cols-sm="4"
            :label="$t('app.server_pool')"
            label-for="server_pool"
            :state="fieldState('server_pool')"
            :description="$t('settings.room_types.server_pool_description')"
          >
            <b-input-group>
              <multiselect
                id="server_pool"
                ref="server-pool-multiselect"
                v-model="model.server_pool"
                :placeholder="$t('settings.room_types.select_server_pool')"
                track-by="id"
                label="name"
                open-direction="bottom"
                :multiple="false"
                :searchable="false"
                :internal-search="false"
                :clear-on-select="false"
                :close-on-select="false"
                :show-no-results="false"
                :show-labels="false"
                :options="serverPools"
                :disabled="isBusy || modelLoadingError || serverPoolsLoadingError || viewOnly"
                :loading="serverPoolsLoading"
                :allow-empty="false"
                :class="{ 'is-invalid': fieldState('server_pool'), 'multiselect-form-control': true }"
              >
                <template slot="noOptions">
                  {{ $t('settings.server_pools.no_data') }}
                </template>
                <template slot="afterList">
                  <b-button
                    :disabled="serverPoolsLoading || currentPage === 1"
                    variant="outline-secondary"
                    @click="loadServerPools(Math.max(1, currentPage - 1))"
                  >
                    <i class="fa-solid fa-arrow-left" /> {{ $t('app.previous_page') }}
                  </b-button>
                  <b-button
                    :disabled="serverPoolsLoading || !hasNextPage"
                    variant="outline-secondary"
                    @click="loadServerPools(currentPage + 1)"
                  >
                    <i class="fa-solid fa-arrow-right" /> {{ $t('app.next_page') }}
                  </b-button>
                </template>
              </multiselect>
              <b-input-group-append>
                <b-button
                  v-if="serverPoolsLoadingError"
                  variant="outline-secondary"
                  @click="loadServerPools(currentPage)"
                >
                  <i class="fa-solid fa-sync" />
                </b-button>
              </b-input-group-append>
            </b-input-group>
            <template slot="invalid-feedback">
              <div v-html="fieldError('server_pool')" />
            </template>
          </b-form-group>

          <b-form-group
            label-cols-sm="4"
            :label="$t('settings.room_types.restrict')"
            :description="$t('settings.room_types.restrict_description')"
            label-for="restrict"
            :state="fieldState('restrict')"
          >
            <b-form-checkbox
              id="restrict"
              v-model="model.restrict"
              switch
              :state="fieldState('restrict')"
              :disabled="isBusy || modelLoadingError || viewOnly"
            />
            <template slot="invalid-feedback">
              <div v-html="fieldError('restrict')" />
            </template>
          </b-form-group>
          <b-form-group
            v-if="model.restrict"
            label-cols-sm="4"
            :label="$t('app.roles')"
            label-for="roles"
            :state="fieldState('roles', true)"
          >
            <b-input-group>
              <multiselect
                id="roles"
                ref="roles-multiselect"
                v-model="model.roles"
                :placeholder="$t('settings.room_types.select_roles')"
                track-by="id"
                open-direction="bottom"
                :multiple="true"
                :searchable="false"
                :internal-search="false"
                :clear-on-select="false"
                :close-on-select="false"
                :show-no-results="false"
                :show-labels="false"
                :options="roles"
                :disabled="isBusy || modelLoadingError || viewOnly || rolesLoadingError"
                :loading="rolesLoading"
                :allow-empty="!!model.restrict"
                :class="{ 'is-invalid': fieldState('roles', true), 'multiselect-form-control': true }"
              >
                <template slot="noOptions">
                  {{ $t('settings.roles.nodata') }}
                </template>
                <template
                  slot="option"
                  slot-scope="props"
                >
                  {{ $te(`app.role_lables.${props.option.name}`) ? $t(`app.role_lables.${props.option.name}`) : props.option.name }}
                </template>
                <template
                  slot="tag"
                  slot-scope="{ option, remove }"
                >
                  <h5 class="d-inline mr-1 mb-1">
                    <b-badge variant="secondary">
                      {{ $te(`app.role_lables.${option.name}`) ? $t(`app.role_lables.${option.name}`) : option.name }}
                      <span @click="remove(option)"><i
                        class="fa-solid fa-xmark"
                        :aria-label="$t('settings.users.remove_role')"
                      /></span>
                    </b-badge>
                  </h5>
                </template>
                <template slot="afterList">
                  <b-button
                    :disabled="rolesLoading || currentRolePage === 1"
                    variant="outline-secondary"
                    @click="loadRoles(Math.max(1, currentRolePage - 1))"
                  >
                    <i class="fa-solid fa-arrow-left" /> {{ $t('app.previous_page') }}
                  </b-button>
                  <b-button
                    :disabled="rolesLoading || !hasNextRolePage"
                    variant="outline-secondary"
                    @click="loadRoles(currentRolePage + 1)"
                  >
                    <i class="fa-solid fa-arrow-right" /> {{ $t('app.next_page') }}
                  </b-button>
                </template>
              </multiselect>
              <b-input-group-append>
                <b-button
                  v-if="rolesLoadingError"
                  ref="reloadRolesButton"
                  variant="outline-secondary"
                  @click="loadRoles(currentRolePage)"
                >
                  <i class="fa-solid fa-sync" />
                </b-button>
              </b-input-group-append>
            </b-input-group>
            <template slot="invalid-feedback">
              <div v-html="fieldError('roles', true)" />
            </template>
          </b-form-group>

          <hr>
          <b-row class="my-1 float-right">
            <b-col sm="12">
              <b-button
                :disabled="isBusy"
                variant="secondary"
                @click="$router.push({ name: 'settings.room_types' })"
              >
                <i class="fa-solid fa-arrow-left" /> {{ $t('app.back') }}
              </b-button>
              <b-button
                v-if="!viewOnly"
                :disabled="isBusy || modelLoadingError || serverPoolsLoadingError || serverPoolsLoading || rolesLoading || rolesLoadingError"
                variant="success"
                type="submit"
                class="ml-1"
              >
                <i class="fa-solid fa-save" /> {{ $t('app.save') }}
              </b-button>
            </b-col>
          </b-row>
        </b-container>
      </b-form>
    </b-overlay>
    <b-modal
      ref="stale-roomType-modal"
      :static="modalStatic"
      :busy="isBusy"
      ok-variant="danger"
      cancel-variant="secondary"
      :hide-header-close="true"
      :no-close-on-backdrop="true"
      :no-close-on-esc="true"
      :hide-header="true"
      @ok="forceOverwrite"
      @cancel="refreshRoomType"
    >
      <template #default>
        <h5>{{ staleError.message }}</h5>
      </template>
      <template #modal-ok>
        <b-spinner
          v-if="isBusy"
          small
        />  {{ $t('app.overwrite') }}
      </template>
      <template #modal-cancel>
        <b-spinner
          v-if="isBusy"
          small
        />  {{ $t('app.reload') }}
      </template>
    </b-modal>
  </div>
</template>

<script>
import Base from '@/api/base';
import FieldErrors from '@/mixins/FieldErrors';
import env from '@/env';
import VSwatches from 'vue-swatches';
import 'vue-swatches/dist/vue-swatches.css';
import { Multiselect } from 'vue-multiselect';
import _ from 'lodash';

export default {
  components: {
    VSwatches,
    Multiselect
  },
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

  data () {
    return {
      isBusy: false,
      modelLoadingError: false,
      errors: {},
      staleError: {},
      model: {
        description: null,
        color: env.ROOM_TYPE_COLORS[0],
        server_pool: null,
        allow_listing: false,
        restrict: false,
        roles: []
      },
      roles: [],
      rolesLoading: false,
      rolesLoadingError: false,
      currentRolePage: 1,
      hasNextRolePage: false,
      swatches: env.ROOM_TYPE_COLORS,

      serverPoolsLoading: false,
      serverPools: [],
      currentPage: 1,
      hasNextPage: false,
      serverPoolsLoadingError: false
    };
  },

  /**
   * Loads the role from the backend and also a part of permissions that can be selected.
   */
  mounted () {
    this.loadRoomType();
    this.loadRoles();
    this.loadServerPools();
  },

  methods: {

    /**
     * Load the room type from the server api
     *
     */
    loadRoomType () {
      if (this.id !== 'new') {
        this.isBusy = true;

        Base.call(`roomTypes/${this.id}`).then(response => {
          this.model = response.data.data;
          this.modelLoadingError = false;
        }).catch(error => {
          if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
            this.$router.push({ name: 'settings.room_types' });
          } else {
            this.modelLoadingError = true;
          }
          Base.error(error, this.$root, error.message);
        }).finally(() => {
          this.isBusy = false;
        });
      }
    },

    /**
     * Loads the roles for the passed page, that can be selected through the multiselect.
     *
     * @param [page=1] The page to load the roles for.
     */
    loadServerPools (page = 1) {
      this.serverPoolsLoading = true;

      const config = {
        params: {
          page
        }
      };

      Base.call('serverPools', config).then(response => {
        this.serverPoolsLoadingError = false;
        this.serverPools = response.data.data;
        this.currentPage = page;
        this.hasNextPage = page < response.data.meta.last_page;
      }).catch(error => {
        this.$refs['server-pool-multiselect'].deactivate();
        this.serverPoolsLoadingError = true;
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        this.serverPoolsLoading = false;
      });
    },

    /**
     * Saves the changes of the room type to the database by making a api call.
     *
     * @param evt
     */
    saveRoomType (evt) {
      if (evt) {
        evt.preventDefault();
      }
      this.isBusy = true;

      const config = {
        method: this.id === 'new' ? 'post' : 'put',
        data: _.cloneDeep(this.model)
      };

      config.data.server_pool = config.data.server_pool ? config.data.server_pool.id : null;
      config.data.roles = config.data.roles.map(role => role.id);

      Base.call(this.id === 'new' ? 'roomTypes' : `roomTypes/${this.id}`, config).then(() => {
        this.errors = {};
        this.$router.push({ name: 'settings.room_types' });
      }).catch(error => {
        if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          this.errors = error.response.data.errors;
        } else if (error.response && error.response.status === env.HTTP_STALE_MODEL) {
          // handle stale errors
          this.staleError = error.response.data;
          this.$refs['stale-roomType-modal'].show();
        } else if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
          Base.error(error, this.$root, error.message);
          this.$router.push({ name: 'settings.room_types' });
        } else {
          Base.error(error, this.$root, error.message);
        }
      }).finally(() => {
        this.isBusy = false;
      });
    },

    /**
     * Force a overwrite of the user in the database by setting the `updated_at` field to the new one.
     */
    forceOverwrite () {
      this.model.updated_at = this.staleError.new_model.updated_at;
      this.staleError = {};
      this.$refs['stale-roomType-modal'].hide();
      this.saveRoomType();
    },

    /**
     * Refreshes the current model with the new passed from the stale error response.
     */
    refreshRoomType () {
      this.model = this.staleError.new_model;
      this.staleError = {};
      this.$refs['stale-roomType-modal'].hide();
    },

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
        this.currentRolePage = page;
        this.hasNextRolePage = page < response.data.meta.last_page;
      }).catch(error => {
        this.$refs['roles-multiselect'].deactivate();
        this.rolesLoadingError = true;
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        this.rolesLoading = false;
      });
    }
  }
};
</script>

<style scoped>

</style>

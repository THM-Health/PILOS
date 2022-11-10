<template>
  <div>
    <h3>
      {{ id === 'new' ? $t('settings.roomTypes.new') : (
        viewOnly ? $t('settings.roomTypes.view', { name: model.description })
          : $t('settings.roomTypes.edit', { name: model.description })
      ) }}
    </h3>
    <hr>
    <b-overlay :show="isBusy || modelLoadingError">
      <template #overlay>
        <div class="text-center">
          <b-spinner v-if="isBusy" ></b-spinner>
          <b-button
            ref="reloadRoomType"
            v-else
            @click="loadRoomType()"
          >
            <i class="fa-solid fa-sync"></i> {{ $t('app.reload') }}
          </b-button>
        </div>
      </template>
      <b-form @submit='saveRoomType'>
        <b-container fluid>
          <b-form-group
            label-cols-sm='4'
            :label="$t('app.description')"
            label-for='description'
            :state='fieldState("description")'
          >
            <b-form-input id='description' type='text' v-model='model.description' :state='fieldState("description")' :disabled='isBusy || modelLoadingError || viewOnly'></b-form-input>
            <template slot='invalid-feedback'><div v-html="fieldError('description')"></div></template>
          </b-form-group>
          <b-form-group
            label-cols-sm='4'
            :label="$t('settings.roomTypes.short')"
            label-for='short'
            :state='fieldState("short")'
          >
            <b-form-input maxlength="2" id='short' type='text' v-model='model.short' :state='fieldState("short")' :disabled='isBusy || modelLoadingError || viewOnly'></b-form-input>
            <template slot='invalid-feedback'><div v-html="fieldError('short')"></div></template>
          </b-form-group>

          <b-form-group
            label-cols-sm='4'
            :label="$t('settings.roomTypes.color')"
            label-for='color'
            :state='fieldState("color")'
          >
            <v-swatches class="my-2" :disabled='isBusy || modelLoadingError || viewOnly' :swatches="swatches" v-model="model.color" inline></v-swatches>
            <b-form-text>{{ $t('settings.roomTypes.customColor') }}</b-form-text>
            <b-form-input id='color' type='text' v-model='model.color' :state='fieldState("color")' :disabled='isBusy || modelLoadingError || viewOnly'></b-form-input>

            <template slot='invalid-feedback'><div v-html="fieldError('color')"></div></template>
          </b-form-group>

          <b-form-group
            label-cols-sm='4'
            :label="$t('settings.roomTypes.preview')"
          >
            <div class="room-icon" :style="{ 'background-color': model.color}">{{ model.short }}</div>
          </b-form-group>

          <b-form-group
            label-cols-sm='4'
            :label="$t('settings.roomTypes.allowListing')"
            :description="$t('settings.roomTypes.allowListingDescription')"
            label-for='allow_listing'
            :state='fieldState("allow_listing")'
          >
            <b-form-checkbox switch id='allow_listing' v-model='model.allow_listing' :state='fieldState("allow_listing")' :disabled='isBusy || modelLoadingError || viewOnly'></b-form-checkbox>
            <template slot='invalid-feedback'><div v-html="fieldError('allow_listing')"></div></template>
          </b-form-group>

          <b-form-group
            label-cols-sm='4'
            :label="$t('app.server_pool')"
            label-for='server_pool'
            :state='fieldState("server_pool")'
            :description="$t('settings.roomTypes.serverPoolDescription')"
          >
            <b-input-group>
              <multiselect
                :placeholder="$t('settings.roomTypes.selectServerPool')"
                ref="server-pool-multiselect"
                v-model='model.server_pool'
                track-by='id'
                label='name'
                open-direction='bottom'
                :multiple='false'
                :searchable='false'
                :internal-search='false'
                :clear-on-select='false'
                :close-on-select='false'
                :show-no-results='false'
                :showLabels='false'
                :options='serverPools'
                :disabled="isBusy || modelLoadingError || serverPoolsLoadingError || viewOnly"
                id='server_pool'
                :loading='serverPoolsLoading'
                :allowEmpty='false'
                :class="{ 'is-invalid': fieldState('server_pool'), 'multiselect-form-control': true }">
                <template slot='noOptions'>{{ $t('settings.serverPools.nodata') }}</template>
                <template slot='afterList'>
                  <b-button
                    :disabled='serverPoolsLoading || currentPage === 1'
                    variant='outline-secondary'
                    @click='loadServerPools(Math.max(1, currentPage - 1))'>
                    <i class='fa-solid fa-arrow-left'></i> {{ $t('app.previousPage') }}
                  </b-button>
                  <b-button
                    :disabled='serverPoolsLoading || !hasNextPage'
                    variant='outline-secondary'
                    @click='loadServerPools(currentPage + 1)'>
                    <i class='fa-solid fa-arrow-right'></i> {{ $t('app.nextPage') }}
                  </b-button>
                </template>
              </multiselect>
              <b-input-group-append>
                <b-button
                  v-if="serverPoolsLoadingError"
                  @click="loadServerPools(currentPage)"
                  variant="outline-secondary"
                ><i class="fa-solid fa-sync"></i></b-button>
              </b-input-group-append>
            </b-input-group>
            <template slot='invalid-feedback'><div v-html="fieldError('server_pool')"></div></template>
          </b-form-group>

          <b-form-group
            label-cols-sm='4'
            :label="$t('settings.roomTypes.restrict')"
            :description="$t('settings.roomTypes.restrictDescription')"
            label-for='restrict'
            :state='fieldState("restrict")'
          >
            <b-form-checkbox switch id='restrict' v-model='model.restrict' :state='fieldState("restrict")' :disabled='isBusy || modelLoadingError || viewOnly'></b-form-checkbox>
            <template slot='invalid-feedback'><div v-html="fieldError('restrict')"></div></template>
          </b-form-group>
          <b-form-group
            label-cols-sm='4'
            :label="$t('app.roles')"
            label-for='roles'
            :state='fieldState("roles", true)'
            v-if='model.restrict'
          >
            <b-input-group>
              <multiselect
                :placeholder="$t('settings.roomTypes.selectRoles')"
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
                :disabled="isBusy || modelLoadingError || viewOnly || rolesLoadingError"
                id='roles'
                :loading='rolesLoading'
                :allowEmpty='!!model.restrict'
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
                    :disabled='rolesLoading || currentRolePage === 1'
                    variant='outline-secondary'
                    @click='loadRoles(Math.max(1, currentRolePage - 1))'>
                    <i class='fa-solid fa-arrow-left'></i> {{ $t('app.previousPage') }}
                  </b-button>
                  <b-button
                    :disabled='rolesLoading || !hasNextRolePage'
                    variant='outline-secondary'
                    @click='loadRoles(currentRolePage + 1)'>
                    <i class='fa-solid fa-arrow-right'></i> {{ $t('app.nextPage') }}
                  </b-button>
                </template>
              </multiselect>
              <b-input-group-append>
                <b-button
                  ref="reloadRolesButton"
                  v-if="rolesLoadingError"
                  @click="loadRoles(currentRolePage)"
                  variant="outline-secondary"
                ><i class="fa-solid fa-sync"></i></b-button>
              </b-input-group-append>
            </b-input-group>
            <template slot='invalid-feedback'><div v-html="fieldError('roles', true)"></div></template>
          </b-form-group>

          <hr>
          <b-row class='my-1 float-right'>
            <b-col sm='12'>
              <b-button
                :disabled='isBusy'
                variant='secondary'
                @click="$router.push({ name: 'settings.room_types' })">
                <i class='fa-solid fa-arrow-left'></i> {{ $t('app.back') }}
              </b-button>
              <b-button
                :disabled='isBusy || modelLoadingError || serverPoolsLoadingError || serverPoolsLoading || rolesLoading || rolesLoadingError'
                variant='success'
                type='submit'
                class='ml-1'
                v-if='!viewOnly'>
                <i class='fa-solid fa-save'></i> {{ $t('app.save') }}
              </b-button>
            </b-col>
          </b-row>
        </b-container>
      </b-form>
    </b-overlay>
    <b-modal
      :static='modalStatic'
      :busy='isBusy'
      ok-variant='danger'
      cancel-variant='secondary'
      @ok='forceOverwrite'
      @cancel='refreshRoomType'
      :hide-header-close='true'
      :no-close-on-backdrop='true'
      :no-close-on-esc='true'
      ref='stale-roomType-modal'
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
import VSwatches from 'vue-swatches';
import 'vue-swatches/dist/vue-swatches.css';
import Multiselect from 'vue-multiselect';
import _ from 'lodash';

export default {
  mixins: [FieldErrors],
  components: {
    VSwatches,
    Multiselect
  },
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
    })

  },

  data () {
    return {
      isBusy: false,
      modelLoadingError: false,
      errors: {},
      staleError: {},
      model: {
        description: null,
        short: null,
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

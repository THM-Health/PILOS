<template>
  <div>
    <h2>
      {{ id === 'new' ? $t('settings.room_types.new') : (
        viewOnly ? $t('settings.room_types.view', { name: model.description })
        : $t('settings.room_types.edit', { name: model.description })
      ) }}
    </h2>
    <hr>
<!--    ToDo Overlay-->
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
      <form @submit="saveRoomType">
        <div class="field grid">
          <label for="description" class="col-12 md:col-4 md:mb-0">{{$t('app.description')}}</label>
          <div class="col-12 md:col-8">
            <InputText
              class="w-full"
              id="description"
              v-model="model.description"
              type="text"
              :state="fieldState('description')"
              :disabled="isBusy || modelLoadingError || viewOnly"
            />
<!--                <template #invalid-feedback>&ndash;&gt;-->
                  <!--              <div v-html="fieldError('description')" />-->
                  <!--            </template>-->
          </div>
        </div>

        <div class="field grid">
          <label for="color" class="col-12 md:col-4 md:mb-0 align-items-start">{{ $t('settings.room_types.color') }}</label>
          <div class="col-12 md:col-8">
<!--        ToDo Color Select-->
            <color-select
              id="color"
              class="mb-2"
              :disabled='isBusy || modelLoadingError || viewOnly'
              :colors="colors"
              v-model="model.color"
            />
            <label for="color">{{ $t('settings.room_types.custom_color') }}</label>
            <InputText
              class="w-full"
              id="color"
              v-model="model.color"
              type="text"
              :state="fieldState('color')"
              :disabled="isBusy || modelLoadingError || viewOnly"
            />
          </div>
        </div>

        <div class="field grid">
          <label class="col-12 md:col-4 md:mb-0">{{$t('settings.room_types.preview')}}</label>
          <div class="col-12 md:col-8 flex align-items-center">
            <Tag
              :value="model.description"
              class="flex-shrink-1 text-break "
              style="white-space: normal"
              :style="{ 'background-color': model.color}"
            >
            </Tag>
          </div>
        </div>
        <div class="field grid">
          <label for="allow_listing" class="col-12 md:col-4 md:mb-0 align-items-start">{{$t('settings.room_types.allow_listing')}}</label>
          <div class="col-12 md:col-8">
            <div>
              <InputSwitch
                id="allow_listing"
                v-model="model.allow_listing"
                :state="fieldState('allow_listing')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                aria-describedby="allow_listing-help"
              />
<!--              <template #invalid-feedback>-->
<!--                <div v-html="fieldError('allow_listing')" />-->
<!--              </template>-->
            </div>
            <small id="allow_listing-help">{{$t('settings.room_types.allow_listing_description')}}</small>
          </div>
        </div>

        <div class="field grid">
          <label for="server_pool" class="col-12 md:col-4 md:mb-0 align-items-start">{{$t('settings.room_types.server_pool_description')}}</label>
          <div class="col-12 md:col-8">
            <InputGroup>
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
                aria-describedby="server_pool-help"
              >
                <template #noOptions>
                  {{ $t('settings.server_pools.no_data') }}
                </template>
                <template #afterList>
                  <Button
                    :disabled="serverPoolsLoading || currentPage === 1"
                    severity="secondary"
                    outlined
                    @click="loadServerPools(Math.max(1, currentPage - 1))"
                  >
                    <i class="fa-solid fa-arrow-left" /> {{ $t('app.previous_page') }}
                  </Button>
                  <Button
                    :disabled="serverPoolsLoading || !hasNextPage"
                    severity="secondary"
                    outlined
                    @click="loadServerPools(currentPage + 1)"
                  >
                    <i class="fa-solid fa-arrow-right" /> {{ $t('app.next_page') }}
                  </Button>
                </template>
              </multiselect>
              <Button
                v-if="serverPoolsLoadingError"
                severity="secondary"
                outlined
                @click="loadServerPools(currentPage)"
              >
                <i class="fa-solid fa-sync" />
              </Button>
            </InputGroup>
<!--            <template #invalid-feedback>-->
<!--              <div v-html="fieldError('server_pool')" />-->
<!--            </template>-->
            <small id="server_pool-help">{{$t('settings.room_types.allow_listing_description')}}</small>
          </div>
        </div>

        <div class="field grid">
          <label for="restrict" class="col-12 md:col-4 md:mb-0 align-items-start">{{$t('settings.room_types.restrict')}}</label>
          <div class="col-12 md:col-8">
            <div>
              <InputSwitch
                id="restrict"
                v-model="model.restrict"
                :state="fieldState('restrict')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                aria-describedby="restrict-help"
              />
            </div>
            <small id="restrict-help">{{$t('settings.room_types.restrict_description')}}</small>
            <!--            <template #invalid-feedback>-->
<!--              <div v-html="fieldError('restrict')" />-->
<!--            </template>-->
          </div>
        </div>

        <div class="field grid" v-if="model.restrict">
          <label for="roles" class="col-12 md:col-4 md:mb-0">{{$t('app.roles')}}</label>
          <div class="col-12 md:col-8">
            <InputGroup>
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
                <template #noOptions>
                  {{ $t('settings.roles.nodata') }}
                </template>
                <template v-slot:option="{ option }">
                  {{ $te(`app.role_lables.${option.name}`) ? $t(`app.role_lables.${option.name}`) : option.name }}
                </template>
                <template v-slot:tag="{ option, remove }">
                  <h5 class="inline mr-1 mb-1">
<!--                    ToDo no severity secondary (other options?)-->
                    <Tag severity="warning">
                      {{ $te(`app.role_lables.${option.name}`) ? $t(`app.role_lables.${option.name}`) : option.name }}
                      <span @click="remove(option)"><i
                        class="fa-solid fa-xmark"
                        :aria-label="$t('settings.users.remove_role')"
                      /></span>
                    </Tag>
                  </h5>
                </template>
                <template #afterList>
                  <Button
                    :disabled="rolesLoading || currentRolePage === 1"
                    severity="secondary"
                    outlined
                    @click="loadRoles(Math.max(1, currentRolePage - 1))"
                  >
                    <i class="fa-solid fa-arrow-left" /> {{ $t('app.previous_page') }}
                  </Button>
                  <Button
                    :disabled="rolesLoading || !hasNextRolePage"
                    severity="secondary"
                    outlined
                    @click="loadRoles(currentRolePage + 1)"
                  >
                    <i class="fa-solid fa-arrow-right" /> {{ $t('app.next_page') }}
                  </Button>
                </template>
              </multiselect>
                <Button
                  v-if="rolesLoadingError"
                  ref="reloadRolesButton"
                  severity="secondary"
                  outlined
                  @click="loadRoles(currentRolePage)"
                >
                  <i class="fa-solid fa-sync" />
                </Button>
            </InputGroup>
<!--              <template #invalid-feedback>-->
<!--                <div v-html="fieldError('roles', true)" />-->
<!--              </template>-->
          </div>
        </div>

          <hr>
          <div class="grid my-1" >
            <div class="col sm:col-12 flex justify-content-end">
              <Button
                :disabled="isBusy"
                severity="secondary"
                @click="$router.push({ name: 'settings.room_types' })"
              >
                <i class="fa-solid fa-arrow-left" /> {{ $t('app.back') }}
              </Button>
              <Button
                v-if="!viewOnly"
                :disabled="isBusy || modelLoadingError || serverPoolsLoadingError || serverPoolsLoading || rolesLoading || rolesLoadingError"
                severity="success"
                type="submit"
                class="ml-1"
              >
                <i class="fa-solid fa-save" /> {{ $t('app.save') }}
              </Button>
            </div>
          </div>
      </form>
    </b-overlay>

<!--    ToDo-->
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

<!--ToDo script setup, error messages-->
<script>
import Base from '@/api/base';
import FieldErrors from '@/mixins/FieldErrors';
import env from '@/env';
import { Multiselect } from 'vue-multiselect';
import _ from 'lodash';
import ColorSelect from '../../../components/Inputs/ColorSelect.vue';

export default {
  components: {
    ColorSelect,
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
      colors: env.ROOM_TYPE_COLORS,

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

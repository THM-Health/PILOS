<template>
  <div>
    <b-overlay
      :show="isBusy"
      z-index="100"
    >
      <div class="row">
        <div class="col-12">
          <b-button-group class="float-lg-right">
            <can
              method="manageSettings"
              :policy="room"
            >
              <b-button
                ref="add-member"
                variant="success"
                :disabled="isBusy"
                @click="$refs['add-edit-token-modal'].show()"
              >
                <i class="fa-solid fa-link" /> {{ $t('rooms.tokens.add') }}
              </b-button>
            </can>

            <b-button
              v-b-tooltip.hover
              v-tooltip-hide-click
              variant="secondary"
              :disabled="isBusy"
              :title="$t('app.reload')"
              @click="reload"
            >
              <i class="fa-solid fa-sync" />
            </b-button>
          </b-button-group>
        </div>
      </div>

      <div class="row pt-4">
        <div class="col-12">
          <b-table
            :current-page="currentPage"
            :per-page="getSetting('pagination_page_size')"
            :fields="tableFields"
            :items="tokens"
            hover
            stacked="md"
            show-empty
          >
            <template #empty>
              <i>{{ $t('rooms.tokens.nodata') }}</i>
            </template>

            <template #cell(expires)="data">
              <raw-text v-if="data.item.expires == null">
                -
              </raw-text>
              <span v-else>{{ $d(new Date(data.item.expires),'datetimeShort') }}</span>
            </template>

            <template #cell(last_usage)="data">
              <raw-text v-if="data.item.last_usage == null">
                -
              </raw-text>
              <span v-else>{{ $d(new Date(data.item.last_usage),'datetimeShort') }}</span>
            </template>

            <template #table-busy>
              <div class="text-center my-2">
                <b-spinner class="align-middle" />
              </div>
            </template>

            <template #cell(actions)="data">
              <b-button-group
                class="float-md-right"
              >
                <b-button
                  v-b-tooltip.hover
                  v-tooltip-hide-click
                  :disabled="isBusy"
                  variant="primary"
                  :title="$t('rooms.tokens.copy')"
                  @click="copyPersonalizedRoomLink(data.item)"
                >
                  <i class="fa-solid fa-link" />
                </b-button>
                <can
                  method="manageSettings"
                  :policy="room"
                >
                  <b-button
                    v-b-tooltip.hover
                    v-tooltip-hide-click
                    :disabled="isBusy"
                    variant="secondary"
                    :title="$t('rooms.tokens.edit')"
                    @click="showTokenEditModal(data.item)"
                  >
                    <i class="fa-solid fa-pen-square" />
                  </b-button>
                  <b-button
                    v-b-tooltip.hover
                    v-tooltip-hide-click
                    :disabled="isBusy"
                    variant="danger"
                    :title="$t('rooms.tokens.delete')"
                    @click="showTokenDeleteModal(data.item)"
                  >
                    <i class="fa-solid fa-trash" />
                  </b-button>
                </can>
              </b-button-group>
            </template>

            <template #cell(role)="data">
              <b-badge
                v-if="data.value === 1"
                variant="success"
              >
                {{ $t('rooms.roles.participant') }}
              </b-badge>
              <b-badge
                v-if="data.value === 2"
                variant="danger"
              >
                {{ $t('rooms.roles.moderator') }}
              </b-badge>
            </template>
          </b-table>

          <b-row>
            <b-col
              cols="12"
              class="my-1"
            >
              <b-pagination
                v-if="tokens.length>getSetting('pagination_page_size')"
                v-model="currentPage"
                :total-rows="tokens.length"
                :per-page="getSetting('pagination_page_size')"
              />
            </b-col>
          </b-row>
        </div>
      </div>
    </b-overlay>

    <b-modal
      ref="delete-token-modal"
      :busy="actionRunning"
      :static="modalStatic"
      ok-variant="danger"
      cancel-variant="secondary"
      :cancel-title="$t('app.no')"
      :no-close-on-esc="actionRunning"
      :no-close-on-backdrop="actionRunning"
      :hide-header-close="actionRunning"
      @cancel="resetModel"
      @close="resetModel"
      @ok="deletePersonalizedToken"
    >
      <template #modal-title>
        {{ $t('rooms.tokens.delete') }}
      </template>
      <template #modal-ok>
        <b-spinner
          v-if="actionRunning"
          small
        /> {{ $t('app.yes') }}
      </template>
      <span>
        {{ $t('rooms.tokens.confirm_delete', { firstname: model.firstname,lastname: model.lastname }) }}
      </span>
    </b-modal>

    <b-modal
      ref="add-edit-token-modal"
      :busy="actionRunning"
      :static="modalStatic"
      ok-variant="success"
      :cancel-title="$t('app.cancel')"
      :no-close-on-esc="actionRunning"
      :no-close-on-backdrop="actionRunning"
      :hide-header-close="actionRunning"
      @cancel="resetModel"
      @close="resetModel"
      @ok="savePersonalizedToken"
    >
      <template #modal-title>
        {{ $t(`rooms.tokens.${model.token == null ? 'add' : 'edit'}`) }}
      </template>
      <template #modal-ok>
        <b-spinner
          v-if="actionRunning"
          small
        />  {{ $t('app.save') }}
      </template>

      <b-form-group
        label-cols-sm="3"
        :label="$t('app.firstname')"
        label-for="firstname"
        :state="fieldState('firstname')"
        :invalid-feedback="fieldError('firstname')"
      >
        <b-form-input
          id="firstname"
          v-model="model.firstname"
          type="text"
          :state="fieldState('firstname')"
          :disabled="actionRunning"
        />
      </b-form-group>
      <b-form-group
        label-cols-sm="3"
        :label="$t('app.lastname')"
        label-for="lastname"
        :state="fieldState('lastname')"
        :invalid-feedback="fieldError('lastname')"
      >
        <b-form-input
          id="lastname"
          v-model="model.lastname"
          type="text"
          :state="fieldState('lastname')"
          :disabled="actionRunning"
        />
      </b-form-group>
      <b-form-group
        :label="$t('rooms.role')"
        :state="fieldState('role')"
        :invalid-feedback="fieldError('role')"
      >
        <b-form-radio
          v-model.number="model.role"
          :value="1"
        >
          <b-badge variant="success">
            {{ $t('rooms.roles.participant') }}
          </b-badge>
        </b-form-radio>
        <b-form-radio
          v-model.number="model.role"
          :value="2"
        >
          <b-badge variant="danger">
            {{ $t('rooms.roles.moderator') }}
          </b-badge>
        </b-form-radio>
      </b-form-group>
    </b-modal>
  </div>
</template>

<script>
import Base from '@/api/base';
import Can from '../Permissions/Can.vue';
import FieldErrors from '@/mixins/FieldErrors';
import env from '@/env';
import _ from 'lodash';
import RawText from '@/components/RawText.vue';
import { mapState } from 'pinia';
import { useSettingsStore } from '@/stores/settings';

export default {
  components: { Can, RawText },
  mixins: [FieldErrors],

  props: {
    room: Object,

    modalStatic: {
      type: Boolean,
      default: false,
      required: false
    }
  },

  data () {
    return {
      actionRunning: false,
      currentPage: 1,
      errors: {},
      isBusy: false,
      tokens: [],
      model: {
        token: null,
        firstname: null,
        lastname: null,
        role: null
      }
    };
  },

  methods: {
    /**
     * Copies the room link for the personalized token to the users clipboard.
     */
    copyPersonalizedRoomLink (token) {
      const link = this.getSetting('base_url') + this.$router.resolve({ name: 'rooms.view', params: { id: this.room.id, token: token.token } }).route.fullPath;
      navigator.clipboard.writeText(link);
      this.toastInfo(this.$t('rooms.tokens.room_link_copied', { firstname: token.firstname, lastname: token.lastname }));
    },

    /**
     * Sends a request to delete a new token.
     */
    deletePersonalizedToken (bvModalEvt) {
      bvModalEvt.preventDefault();

      this.actionRunning = true;

      Base.call(`rooms/${this.room.id}/tokens/${this.model.token}`, {
        method: 'delete'
      }).catch((error) => {
        Base.error(error, this.$root);
      }).finally(() => {
        this.resetModel();
        this.$refs['delete-token-modal'].hide();
        this.actionRunning = false;
        this.reload();
      });
    },

    /**
     * Sends a request to the server to create a new token or edit a existing.
     */
    savePersonalizedToken (bvModalEvt) {
      bvModalEvt.preventDefault();

      this.actionRunning = true;

      const config = {
        method: this.model.token == null ? 'post' : 'put',
        data: _.cloneDeep(this.model)
      };

      Base.call(`rooms/${this.room.id}/tokens${this.model.token == null ? '' : '/' + this.model.token}`, config).then(response => {
        this.resetModel();
        this.$refs['add-edit-token-modal'].hide();
        this.reload();
      }).catch(error => {
        if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          this.errors = error.response.data.errors;
        } else {
          Base.error(error, this.$root, error.message);
        }
      }).finally(() => {
        this.actionRunning = false;
      });
    },

    /**
     * Shows the token delete modal.
     */
    showTokenDeleteModal (token) {
      this.model = token;
      this.$refs['delete-token-modal'].show();
    },

    /**
     * Shows the token edit modal.
     */
    showTokenEditModal (token) {
      this.model = _.cloneDeep(token);
      this.$refs['add-edit-token-modal'].show();
    },

    /**
     * Reloads list of tokens from api.
     */
    reload () {
      this.isBusy = true;

      Base.call('rooms/' + this.room.id + '/tokens')
        .then(response => {
          this.tokens = response.data.data;
        })
        .catch((error) => {
          Base.error(error, this.$root);
        })
        .finally(() => {
          this.isBusy = false;
        });
    },

    /**
     * Resets the model that should be add or edited.
     */
    resetModel () {
      this.model = {
        token: null,
        firstname: null,
        lastname: null,
        role: null
      };

      this.errors = {};
    }
  },

  computed: {

    ...mapState(useSettingsStore, ['getSetting']),

    tableFields () {
      return [{
        key: 'firstname',
        label: this.$t('app.firstname'),
        sortable: true
      }, {
        key: 'lastname',
        label: this.$t('app.lastname'),
        sortable: true
      }, {
        key: 'role',
        label: this.$t('rooms.role'),
        sortable: true
      },
      {
        key: 'last_usage',
        label: this.$t('rooms.tokens.last_usage'),
        sortable: true
      },
      {
        key: 'expires',
        label: this.$t('rooms.tokens.expires'),
        sortable: true
      },
      {
        key: 'actions',
        label: this.$t('app.actions'),
        sortable: false
      }
      ];
    }
  },

  /**
   * Loads initially the list of personalized tokens for the room.
   */
  created () {
    this.reload();
  }
};
</script>

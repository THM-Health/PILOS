<template>
  <div>
    <b-overlay :show="isBusy" z-index="100">
      <div class="row">
        <div class="col-12">
          <b-button-group class="float-lg-right">
            <can method="manageSettings" :policy="room">
              <b-button
                variant="success"
                :disabled="isBusy"
                ref="add-member"
                @click="$refs['add-edit-token-modal'].show()"
              >
                <i class="fa-solid fa-link"></i> {{ $t('rooms.tokens.add') }}
              </b-button>
            </can>

            <b-button
              variant="secondary"
              @click="reload"
              :disabled="isBusy"
              :title="$t('app.reload')"
              v-b-tooltip.hover
              v-tooltip-hide-click
            >
              <i class="fa-solid fa-sync"></i>
            </b-button>
          </b-button-group>
        </div>
      </div>

      <div class="row pt-4">
        <div class="col-12">
          <b-table
            :current-page="currentPage"
            :per-page="settings('pagination_page_size')"
            :fields="tableFields"
            :items="tokens"
            hover
            stacked="md"
            show-empty
          >
            <template v-slot:empty>
              <i>{{ $t('rooms.tokens.nodata') }}</i>
            </template>

            <template v-slot:cell(expires)="data">
              <raw-text v-if="data.item.expires == null">-</raw-text>
              <span v-else>{{ $d(new Date(data.item.expires),'datetimeShort') }}</span>
            </template>

            <template v-slot:cell(last_usage)="data">
              <raw-text v-if="data.item.last_usage == null">-</raw-text>
              <span v-else>{{ $d(new Date(data.item.last_usage),'datetimeShort') }}</span>
            </template>

            <template v-slot:table-busy>
              <div class="text-center my-2">
                <b-spinner class="align-middle"></b-spinner>
              </div>
            </template>

            <template v-slot:cell(actions)="data">
              <b-button-group
                class="float-md-right"
              >
                <b-button
                  :disabled="isBusy"
                  variant="primary"
                  @click="copyPersonalizedRoomLink(data.item)"
                  :title="$t('rooms.tokens.copy')"
                  v-b-tooltip.hover
                  v-tooltip-hide-click
                >
                  <i class="fa-solid fa-link"></i>
                </b-button>
                <can method="manageSettings" :policy="room">
                  <b-button
                    :disabled="isBusy"
                    variant="secondary"
                    @click="showTokenEditModal(data.item)"
                    :title="$t('rooms.tokens.edit')"
                    v-b-tooltip.hover
                    v-tooltip-hide-click
                  >
                    <i class="fa-solid fa-pen-square"></i>
                  </b-button>
                  <b-button
                    :disabled="isBusy"
                    variant="danger"
                    @click="showTokenDeleteModal(data.item)"
                    :title="$t('rooms.tokens.delete')"
                    v-b-tooltip.hover
                    v-tooltip-hide-click
                  >
                    <i class="fa-solid fa-trash"></i>
                  </b-button>
                </can>
              </b-button-group>
            </template>

            <template v-slot:cell(role)="data">
              <b-badge v-if="data.value === 1" variant="success"
              >{{ $t('rooms.tokens.roles.participant') }}
              </b-badge>
              <b-badge v-if="data.value === 2" variant="danger"
              >{{ $t('rooms.tokens.roles.moderator') }}
              </b-badge>
            </template>
          </b-table>

          <b-row>
            <b-col cols="12" class="my-1">
              <b-pagination
                v-if="tokens.length>settings('pagination_page_size')"
                v-model="currentPage"
                :total-rows="tokens.length"
                :per-page="settings('pagination_page_size')"
              ></b-pagination>
            </b-col>
          </b-row>
        </div>
      </div>
    </b-overlay>

    <b-modal
      :busy="actionRunning"
      :static='modalStatic'
      ok-variant="danger"
      cancel-variant="secondary"
      :cancel-title="$t('app.no')"
      @cancel="resetModel"
      @close="resetModel"
      @ok="deletePersonalizedToken"
      ref="delete-token-modal"
      :no-close-on-esc="actionRunning"
      :no-close-on-backdrop="actionRunning"
      :hide-header-close="actionRunning"
    >
      <template v-slot:modal-title>
        {{ $t('rooms.tokens.modals.delete.title') }}
      </template>
      <template v-slot:modal-ok>
        <b-spinner small v-if="actionRunning"></b-spinner> {{ $t('app.yes') }}
      </template>
      <span>
        {{ $t('rooms.tokens.modals.delete.confirm', { firstname: model.firstname,lastname: model.lastname }) }}
      </span>
    </b-modal>

    <b-modal
      :busy="actionRunning"
      :static="modalStatic"
      ok-variant="success"
      :cancel-title="$t('app.cancel')"
      @cancel="resetModel"
      @close="resetModel"
      @ok="savePersonalizedToken"
      ref="add-edit-token-modal"
      :no-close-on-esc="actionRunning"
      :no-close-on-backdrop="actionRunning"
      :hide-header-close="actionRunning"
    >
      <template v-slot:modal-title>
        {{ $t(`rooms.tokens.${model.token == null ? 'add' : 'edit'}`) }}
      </template>
      <template v-slot:modal-ok>
        <b-spinner small v-if="actionRunning"></b-spinner>  {{ $t('app.save') }}
      </template>

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
          :disabled="actionRunning"
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
          :disabled="actionRunning"
        ></b-form-input>
        <template slot='invalid-feedback'><div v-html="fieldError('lastname')"></div></template>
      </b-form-group>
      <b-form-group
        :label="$t('rooms.tokens.role')"
        :state='fieldState("role")'
      >
        <b-form-radio
          v-model.number="model.role"
          value="1"
        >
          <b-badge variant="success">
            {{ $t('rooms.tokens.roles.participant') }}
          </b-badge>
        </b-form-radio>
        <b-form-radio
          v-model.number="model.role"
          value="2"
        >
          <b-badge variant="danger">
            {{ $t('rooms.tokens.roles.moderator') }}
          </b-badge>
        </b-form-radio>
        <template slot='invalid-feedback'><div v-html="fieldError('role')"></div></template>
      </b-form-group>
    </b-modal>
  </div>
</template>

<script>
import Base from '../../api/base';
import { mapGetters } from 'vuex';
import Can from '../Permissions/Can';
import FieldErrors from '../../mixins/FieldErrors';
import env from '../../env';
import _ from 'lodash';
import RawText from '../RawText';

export default {
  mixins: [FieldErrors],
  components: { Can, RawText },

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
      this.$clipboard(this.settings('base_url') + this.$router.resolve({ name: 'rooms.view', params: { id: this.room.id, token: token.token } }).route.fullPath);
      this.flashMessage.info(this.$t('rooms.tokens.roomLinkCopied', { firstname: token.firstname, lastname: token.lastname }));
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
    }
  },

  computed: {
    ...mapGetters({
      settings: 'session/settings'
    }),

    tableFields () {
      return [{
        key: 'firstname',
        label: this.$t('rooms.tokens.firstname'),
        sortable: true
      }, {
        key: 'lastname',
        label: this.$t('rooms.tokens.lastname'),
        sortable: true
      }, {
        key: 'role',
        label: this.$t('rooms.tokens.role'),
        sortable: true
      },
      {
        key: 'last_usage',
        label: this.$t('rooms.tokens.lastUsage'),
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

<template>
  <div>
    <b-overlay :show="isBusy" z-index="100">
      <div class="row">
        <div class="col-12">
          <b-button-group class="float-lg-right">
            <can method="manageSettings" :policy="room">
              <!--TODO <b-button
                variant="success"
                :disabled="isBusy"
                ref="add-member"
                @click="$refs['add-token-modal'].show()"
              >
                <i class="fas fa-user-plus"></i> {{ $t('rooms.tokens.add') }}
              </b-button> -->
            </can>

            <b-button
              variant="dark"
              @click="reload"
              :disabled="isBusy"
              :title="$t('app.reload')"
              v-b-tooltip.hover
            >
              <i class="fas fa-sync"></i>
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

            <template v-slot:table-busy>
              <div class="text-center my-2">
                <b-spinner class="align-middle"></b-spinner>
              </div>
            </template>

            <template v-slot:cell(actions)="data">
              <!-- TODO -->
            </template>

            <!-- render token user role -->
            <template v-slot:cell(role)="data">
              <b-badge
                class="text-white"
                v-if="data.value === 1"
                variant="success"
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

    <!-- TODO -->
  </div>
</template>
<script>
import Base from '../../api/base';
import { mapGetters, mapState } from 'vuex';
import Can from '../Permissions/Can';
import PermissionService from '../../services/PermissionService';

export default {
  components: { Can },

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
      isBusy: false,
      tokens: [],
      currentPage: 1
    };
  },

  methods: {
    /**
     * Reloads list of tokens from api.
     */
    reload: function () {
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
    }
  },

  computed: {
    ...mapGetters({
      settings: 'session/settings'
    }),

    ...mapState({
      currentUser: state => state.session.currentUser
    }),

    tableFields () {
      const fields = [{
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
      }];

      if (PermissionService.can('manageSettings', this.room)) {
        fields.push({
          key: 'actions',
          label: this.$t('rooms.tokens.actions'),
          sortable: false
        });
      }

      return fields;
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

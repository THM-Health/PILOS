<template>
  <div>
    <b-dropdown-item-button
      @click="showTransferOwnershipModal"
    >
      <div class="flex align-items-baseline">
        <i class="fa-solid fa-user-gear" />
        <span>{{ $t('rooms.modals.transfer_ownership.title') }}</span>
      </div>
    </b-dropdown-item-button>

    <!--transfer ownership modal-->
    <b-modal
      :busy="isLoadingAction"
      :cancel-title="$t('app.cancel')"
      :title="$t('rooms.modals.transfer_ownership.title')"
      id="transfer-ownership-modal"
      ref="transfer-ownership-modal"
      @ok="transferOwnership"
      :ok-disabled="!newOwner"
      ok-variant="danger"
      :no-close-on-esc="isLoadingAction"
      :no-close-on-backdrop="isLoadingAction"
      :hide-header-close="isLoadingAction"
      :static="modalStatic"
    >

      <template #modal-ok>
        <b-spinner small v-if="isLoadingAction"></b-spinner>
        {{ $t('rooms.modals.transfer_ownership.transfer') }}
      </template>

      <!--select new owner-->
      <b-form-group :label="$t('rooms.modals.transfer_ownership.new_owner')" :state="fieldState('user')">
        <multiselect
          v-model="newOwner"
          track-by="id"
          open-direction="bottom"
          :placeholder="$t('app.user_name')"
          :options="users"
          :multiple="false"
          :searchable="true"
          :loading="isLoadingSearch"
          :disabled="isLoadingAction"
          :internal-search="false"
          :clear-on-select="false"
          :preserveSearch="true"
          :close-on-select="true"
          :options-limit="300"
          :max-height="600"
          :show-no-results="true"
          :showLabels="false"
          @search-change="asyncFind"
        >
          <template #noResult>{{ $t('rooms.members.modals.add.no_result') }}</template>
          <template #noOptions>{{ $t('rooms.members.modals.add.no_options') }}</template>
          <template v-slot:option = "{ option }">{{ option.firstname }} {{ option.lastname }}<br><small>{{ option.email }}</small></template>
          <template v-slot:singleLabel="{ option }">{{ option.firstname }} {{ option.lastname }}</template>
        </multiselect>
        <b-form-text v-if="!newOwner" text-variant="danger">
          {{ $t('rooms.modals.transfer_ownership.select_user') }}
        </b-form-text>
        <template #invalid-feedback><div v-html="fieldError('user')"></div></template>
      </b-form-group>

      <!--select new role with which the current owner should be added as a member of the room -->
      <b-form-group :label="$t('rooms.modals.transfer_ownership.new_role')" :disabled="isLoadingAction" :state="fieldState('role')" class=" mt-2">
        <b-form-radio v-model.number="newRoleInRoom" :value="1">
          <b-badge variant="success">{{ $t('rooms.roles.participant') }}</b-badge>
        </b-form-radio>
        <b-form-radio v-model.number="newRoleInRoom" :value="2">
          <b-badge variant="danger">{{ $t('rooms.roles.moderator') }}</b-badge>
        </b-form-radio>
        <b-form-radio v-model.number="newRoleInRoom" :value="3">
          <b-badge variant="dark">{{ $t('rooms.roles.co_owner') }}</b-badge>
        </b-form-radio>
        <hr>
        <!--option to not add the current user as a member of the room-->
        <b-form-radio v-model.number="newRoleInRoom" :value="null">
          <b-badge variant="secondary">{{$t('rooms.modals.transfer_ownership.no_role')}}</b-badge>
          <b-form-text>{{$t('rooms.modals.transfer_ownership.warning')}}</b-form-text>
        </b-form-radio>
        <template #invalid-feedback><div v-html="fieldError('role')"></div> </template>
      </b-form-group>
    </b-modal>

  </div>
</template>

<script>
import { Multiselect } from 'vue-multiselect';
import FieldErrors from '../../mixins/FieldErrors';
import Base from '../../api/base';
import env from '../../env';
import { mapState } from 'pinia';
import { useAuthStore } from '../../stores/auth';
export default {
  name: 'TransferOwnershipDropdownButton',

  mixins: [FieldErrors],
  components: { Multiselect },
  props: {
    room: Object, // room object
    modalStatic: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      isLoadingAction: false,
      isLoadingSearch: false,
      users: [], // list of all found users
      newOwner: null,
      newRoleInRoom: 3,
      errors: []
    };
  },
  methods: {
    /**
     * transfer the room ownership to another user
     * @param bvModalEvt
     */
    transferOwnership (bvModalEvt) {
      // prevent modal from closing
      bvModalEvt.preventDefault();

      this.isLoadingAction = true;
      // reset errors
      this.errors = [];

      const data = {
        user: this.newOwner.id
      };
      if (this.newRoleInRoom) {
        data.role = this.newRoleInRoom;
      }

      // transfer room ownership to the selected user
      Base.call('rooms/' + this.room.id + '/transfer', {
        method: 'post',
        data
      }).then(response => {
        // operation successful, emit "transferred-ownership" to reload room view and close modal
        this.$emit('transferredOwnership');
        this.$bvModal.hide('transfer-ownership-modal');
      }).catch(error => {
        // transferring failed
        if (error.response) {
          // failed due to validation errors
          if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
            this.errors = error.response.data.errors;
            return;
          }
        }
        Base.error(error, this.$root);
      }).finally(() => {
        this.isLoadingAction = false;
      });
    },
    /**
     * reset and show modal to transfer the room ownership
     */
    showTransferOwnershipModal () {
      this.newOwner = null;
      this.users = [];
      this.newRoleInRoom = 3;
      this.errors = [];
      this.$bvModal.show('transfer-ownership-modal');
    },

    /**
     * Search for users in database
     * @param query
     */
    asyncFind (query) {
      this.isLoadingSearch = true;

      const config = {
        params: {
          query
        }
      };

      Base.call('users/search', config).then(response => {
        // disable user that is currently the owner of the room
        this.users = response.data.data.map(user => {
          if (this.room.owner.id === user.id) { user.$isDisabled = true; }
          return user;
        });
      }).catch((error) => {
        Base.error(error, this.$root);
      }).finally(() => {
        this.isLoadingSearch = false;
      });
    }
  },
  computed: {
    ...mapState(useAuthStore, ['currentUser'])
  },

  watch: {
    newOwner: function () {
      this.errors = {};
    }
  }

};
</script>

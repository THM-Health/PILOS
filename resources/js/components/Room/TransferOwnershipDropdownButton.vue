<template>
  <div>
    <b-dropdown-item-button
      @click="showTransferOwnershipModal"
    >
      <div class="d-flex align-items-baseline">
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
      ok-variant="success"
      :no-close-on-esc="isLoadingAction"
      :no-close-on-backdrop="isLoadingAction"
      :hide-header-close="isLoadingAction"
      :static="modalStatic"
    >

      <template v-slot:modal-ok>
        <b-spinner small v-if="isLoadingAction"></b-spinner>
        {{ $t('rooms.modals.transfer_ownership.transfer') }}
      </template>

      <!--select new owner-->
      <b-form-group :label="$t('rooms.modals.transfer_ownership.new_owner')" :state="newOwnerValid">
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
          <template slot="noResult">{{ $t('rooms.members.modals.add.no_result') }}</template>
          <template slot="noOptions">{{ $t('rooms.members.modals.add.no_options') }}</template>
          <template slot="option" slot-scope="props">{{ props.option.firstname }} {{ props.option.lastname }}<br><small>{{ props.option.email }}</small></template>
          <template slot="singleLabel" slot-scope="props">{{ props.option.firstname }} {{ props.option.lastname }}</template>
        </multiselect>
        <template slot='invalid-feedback'><div v-html="userValidationError"></div></template>
      </b-form-group>

      <!--select if the owner wants/should stay in the room-->
      <b-form-checkbox  :disabled="isLoadingAction" switch v-model="stayInRoom">
        <span v-if="room.owner.id === currentUser.id">{{$t('rooms.modals.transfer_ownership.stay_in_room_current')}}</span>
        <span v-else>{{$t('rooms.modals.transfer_ownership.stay_in_room')}}</span>
      </b-form-checkbox>

      <!--select new role in the room for the current owner -->
      <b-form-group :label="$t('rooms.modals.transfer_ownership.new_role')" v-if="stayInRoom" :disabled="isLoadingAction" :state="newRoleInRoomValid" class=" mt-2">
        <b-form-radio v-model.number="newRoleInRoom" name="addmember-role-radios" value="1">
          <b-badge variant="success">{{ $t('rooms.roles.participant') }}</b-badge>
        </b-form-radio>
        <b-form-radio v-model.number="newRoleInRoom" name="addmember-role-radios" value="2">
          <b-badge variant="danger">{{ $t('rooms.roles.moderator') }}</b-badge>
        </b-form-radio>
        <b-form-radio v-model.number="newRoleInRoom" name="addmember-role-radios" value="3">
          <b-badge variant="dark">{{ $t('rooms.roles.co_owner') }}</b-badge>
        </b-form-radio>
        <template slot='invalid-feedback'><div v-html="fieldError('role')"></div> </template>
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
      stayInRoom: true,
      newRoleInRoom: 3,
      errors: []
    };
  },
  methods: {
    /**
     * transfer thr room ownership to another user
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
      if (this.stayInRoom) {
        data.role = this.newRoleInRoom;
      }

      // transfer room ownership to the selected user
      Base.call('rooms/' + this.room.id + '/transfer', {
        method: 'post',
        data
      }).then(response => {
        // operation successful, emit "transferredOwnership" to reload room view and close modal
        this.$emit('transferred-ownership');
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
      this.stayInRoom = true;
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
    ...mapState(useAuthStore, ['currentUser']),

    // check if new owner input field is valid
    newOwnerValid () {
      if (this.newOwner == null || this.newOwner.id == null || this.fieldState('user') === false) { return false; }
      return null;
    },
    // check if new role input field is valid
    newRoleInRoomValid () {
      if ((this.stayInRoom && this.newRoleInRoom == null) || this.fieldState('role') === false) { return false; }
      return null;
    },
    // return error message for user, local or server-side
    userValidationError: function () {
      return this.fieldState('user') === false ? this.fieldError('user') : this.$t('rooms.modals.transfer_ownership.select_user');
    }
  },

  watch: {
    newOwner: function () {
      this.errors = {};
    }
  }

};
</script>

<style scoped>

</style>

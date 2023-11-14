<template>
  <div>
    <b-button
      variant="warning"
      v-b-tooltip.hover
      v-tooltip-hide-click
      :title="$t('rooms.modals.transfer_ownership.title')"
      @click="showTransferOwnershipModal"
    >
      <i class="fa-solid fa-user-gear"></i>
    </b-button>

    <!--transfer ownership modal-->
    <b-modal
      :busy="isLoadingAction"
      :cancel-title="$t('app.cancel')"
      :title="$t('rooms.modals.transfer_ownership.title')"
      id="transfer-ownership-modal"
      @ok="transferOwnership"
      :ok-disabled="!newOwner"
      ok-variant="success"
      :no-close-on-esc="isLoadingAction"
      :no-close-on-backdrop="isLoadingAction"
      :hide-header-close="isLoadingAction"
    >

      <template v-slot:modal-ok>
        <b-spinner small v-if="isLoadingAction"></b-spinner>  Transfer
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
      <b-form-checkbox v-if="room.owner.id === currentUser.id" switch v-model="stayInRoom"> {{$t('rooms.modals.transfer_ownership.stay_in_room_current')}}</b-form-checkbox>
      <b-form-checkbox v-else switch v-model="stayInRoom"> {{$t('rooms.modals.transfer_ownership.stay_in_room')}}</b-form-checkbox>

      <!--select new role in the room for the current owner -->
      <b-form-group :label="$t('rooms.modals.transfer_ownership.new_role')" v-if="stayInRoom" :state="newRoleInRoomValid" class=" mt-2">
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
  name: 'TransferOwnershipComponent',

  mixins: [FieldErrors],
  components: { Multiselect },
  props: {
    room: Object // room object
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
     * show modal to transfer the room ownership
     */
    showTransferOwnershipModal () {
      this.newOwner = null;
      this.users = [];
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
  }

};
</script>

<style scoped>

</style>

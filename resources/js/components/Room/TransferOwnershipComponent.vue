<template>
  <div>
    <b-button
      variant="warning"
      v-b-tooltip.hover
      v-tooltip-hide-click
      title="Transfer ownership"
      @click="showTransferOwnershipModal"
    >
      <i class="fa-solid fa-user-gear"></i>
    </b-button>

    <b-modal
      :busy="isLoadingAction"
      :cancel-title="$t('app.cancel')"
      title="Transfer room ownership"
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
      <b-form-group label="Neuer Besitzer" :state="newOwnerValid">
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

      <b-form-checkbox switch v-model="stayInRoom"> Im Raum Mitglied bleiben</b-form-checkbox>

      <b-form-group label="Neue Rolle im Raum" v-if="stayInRoom" :state="newRoleInRoomValid" class=" mt-2">
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
import FieldErrors from "../../mixins/FieldErrors";
import Base from "../../api/base";
export default {
  mixins: [FieldErrors],
  components:{Multiselect},
  props: {
    room: Object //room object
  },
  data(){
    return{
      isLoadingAction: false,
      isLoadingSearch:false,
      users:[], //list of all found users
      newOwner: null,
      stayInRoom: true,
      newRoleInRoom: 3
    };
  },
  methods:{
    transferOwnership(){
      this.isLoadingAction = true;
      const data = {
        user: this.newOwner.id
      };
      if(this.stayInRoom){
        data.role =this.newRoleInRoom;
      }

      Base.call('rooms/' + this.room.id + '/transfer', {
        method: 'post',
        data
      }).then(response =>{
        // operation successful, close modal and reload list
        this.$bvModal.hide('add-member-modal');
      })
    },
    /**
     * show modal to transfer the room ownership
     */
    showTransferOwnershipModal(){
      this.newOwner = null;
      this.users=[];
      this.$bvModal.show('transfer-ownership-modal')
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
        // disable users that are already members of this room or the room owner
        this.users = response.data.data.map(user => {
          if (this.room.owner.id === user.id) { user.$isDisabled = true; }
          return user;
        });
      }).catch((error) => {
        Base.error(error, this.$root);
      }).finally(() => {
        this.isLoadingSearch = false;
      });
    },

  },
  computed:{
    newOwnerValid (){
      if (this.newOwner == null || this.newOwner.id == null || this.fieldState('user') === false) { return false; }
      return null;
    },
    newRoleInRoomValid(){
      if ((this.stayInRoom && this.newRoleInRoom == null) || this.fieldState('role') === false) { return false; }
      return null;
    },
    // return error message for user, local or server-side
    userValidationError: function () {
      return this.fieldState('user') === false ? this.fieldError('user') : this.$t('rooms.members.modals.add.select_user');
    }
  }

}
</script>

<style scoped>

</style>

<template>
  <div>
    <b-overlay :show="isBusy" z-index="100">
    <div class="row">
      <div class="col-12">

        <b-button-group class="float-lg-right">
          <can method="manageSettings" :policy="room">
          <!-- Add existing user from database -->
          <b-button
            variant="success"
            :disabled="isBusy"
            ref="add-member"
            @click="showAddMemberModal"
          >
            <i class="fa-solid fa-user-plus"></i> {{ $t('rooms.members.addUser') }}
          </b-button>
          </can>

          <!-- Reload members list -->
          <b-button
            variant="dark"
            @click="reload"
            :disabled="isBusy"
            :title="$t('app.reload')"
            v-b-tooltip.hover
          >
            <i class="fa-solid fa-sync"></i>
          </b-button>
        </b-button-group>
      </div>
    </div>
    <div class="row pt-4">
      <div class="col-12">
        <!-- table with all room members -->
        <b-table
          :current-page="currentPage"
          :per-page="settings('pagination_page_size')"
          :fields="tableFields"
          :items="members"
          hover
          ref="membersTable"
          stacked="lg"
          show-empty
          selectable
          :no-select-on-click="true"
          @row-selected="onRowsSelected"
        >
          <!-- message on no members -->
          <template v-slot:empty>
            <i>{{ $t('rooms.members.nodata') }}</i>
          </template>

          <template #head(selected) v-if="currentUser">
            <b-form-checkbox :checked="selectedMembers.length == members.length && members.length > 0" @change="onAllRowsSelected" />
          </template>

          <!-- checkbox to select the current row -->
          <template #cell(selected)="{ item, rowSelected, selectRow, unselectRow }">
            <b-form-checkbox v-if="currentUser && currentUser.id !== item.id" :checked="rowSelected" @change="rowSelected ? unselectRow() : selectRow() "/>
          </template>

          <!-- action buttons -->
          <template v-slot:cell(actions)="data">
            <b-button-group class="float-md-right" v-if="currentUser && currentUser.id !== data.item.id" >
              <!-- edit membership role -->
              <b-button
                :disabled="isBusy"
                variant="dark"
                @click="showEditMemberModal(data.item)"
                v-b-tooltip.hover
                :title="$t('rooms.members.editUser')"
              >
                <i class="fa-solid fa-user-edit"></i>
              </b-button>
              <!-- remove member -->
              <b-button
                :disabled="isBusy"
                variant="danger"
                @click="showRemoveMemberModal(data.item)"
                v-b-tooltip.hover
                :title="$t('rooms.members.deleteUser')"
              >
                <i class="fa-solid fa-trash"></i>
              </b-button>
            </b-button-group>
          </template>

          <!-- render user profile image -->
          <template v-slot:cell(image)="data">
            <img :src="data.value ? data.value : '/images/default_profile.png'" class="profileImage" />
          </template>

          <!-- render user role -->
          <template v-slot:cell(role)="data">
            <b-badge v-if="data.value === 0" variant="primary">{{ $t('rooms.members.roles.guest') }}</b-badge>
            <b-badge class="text-white" v-if="data.value === 1" variant="success"
            >{{ $t('rooms.members.roles.participant') }}
            </b-badge>
            <b-badge v-if="data.value === 2" variant="danger"
            >{{ $t('rooms.members.roles.moderator') }}
            </b-badge>
            <b-badge v-if="data.value === 3" variant="dark"
            >{{ $t('rooms.members.roles.co_owner') }}
            </b-badge>
          </template>

        </b-table>
        <b-row>
          <b-col cols="12" class="my-1">
            <b-pagination
              v-if="members.length>settings('pagination_page_size')"
              v-model="currentPage"
              :total-rows="members.length"
              :per-page="settings('pagination_page_size')"
            ></b-pagination>
          </b-col>
        </b-row>
        <!-- selected rows action buttons -->
        <b-button-group class="float-md-right" v-if="selectedMembers.length > 0 && members.length > 0">
            <!-- multiple edit membership role -->
            <b-button
              :disabled="isBusy"
              variant="dark"
              @click="showEditMultipleMemberModal(selectedMembers)"
              v-b-tooltip.hover
              :title="$t('rooms.members.multipleEditUser',{numberOfSelectedUsers: selectedMembers.length})"
            >
              <i class="fas fa-users-cog"></i>
            </b-button>
            <!-- multiple remove member -->
            <b-button
              :disabled="isBusy"
              variant="danger"
              @click="showRemoveMultipleMemberModal(selectedMembers,{numberOfSelectedUsers: selectedMembers.length})"
              v-b-tooltip.hover
              :title="$t('rooms.members.multipleDeleteUser',{numberOfSelectedUsers: selectedMembers.length})"
            >
              <i class="fas fa-users-slash"></i>
            </b-button>
          </b-button-group>
      </div>
    </div>

    </b-overlay>

    <!-- Modals -->

    <!-- edit user role modal -->
    <b-modal
      :static='modalStatic'
      :busy="isLoadingAction"
      ok-variant="success"
      :cancel-title="$t('rooms.members.modals.edit.cancel')"
      @ok="saveEditMember"
      ref="edit-member-modal"
      :no-close-on-esc="isLoadingAction"
      :no-close-on-backdrop="isLoadingAction"
      :hide-header-close="isLoadingAction"
    >
      <template v-slot:modal-title>
        <span v-if="editMember">
        {{ $t('rooms.members.modals.edit.title',{firstname: editMember.firstname,lastname: editMember.lastname}) }}
          </span>
      </template>
      <template v-slot:modal-ok>
        <b-spinner small v-if="isLoadingAction"></b-spinner>  {{ $t('rooms.members.modals.edit.save') }}
      </template>
      <div v-if="editMember">
        <b-form-group :label="$t('rooms.members.modals.edit.role')" v-if="editMember">
          <b-form-radio v-model.number="editMember.role" name="some-radios" value="1">
            <b-badge class="text-white" variant="success">{{ $t('rooms.members.roles.participant') }}</b-badge>
          </b-form-radio>
          <b-form-radio v-model.number="editMember.role" name="some-radios" value="2">
            <b-badge variant="danger">{{ $t('rooms.members.roles.moderator') }}</b-badge>
          </b-form-radio>
          <b-form-radio v-model.number="editMember.role" name="some-radios" value="3">
            <b-badge variant="dark">{{ $t('rooms.members.roles.co_owner') }}</b-badge>
          </b-form-radio>
        </b-form-group>
      </div>
    </b-modal>

    <!-- edit multiple users role modal -->
    <b-modal
      :static='modalStatic'
      :busy="isLoadingAction"
      ok-variant="success"
      :cancel-title="$t('rooms.members.modals.edit.cancel')"
      @ok="saveEditMultipleMembers"
      ref="edit-multiple-members-modal"
      :no-close-on-esc="isLoadingAction"
      :no-close-on-backdrop="isLoadingAction"
      :hide-header-close="isLoadingAction"
    >
      <template v-slot:modal-title>
        <span v-if="editMember">
        {{ $t('rooms.members.modals.edit.titleMultiple', {numberOfSelectedUsers: selectedMembers.length}) }}
          </span>
      </template>
      <template v-slot:modal-ok>
        <b-spinner small v-if="isLoadingAction"></b-spinner>  {{ $t('rooms.members.modals.edit.save') }}
      </template>
      <div v-if="editMember">
        <b-form-group :state="fieldState('role')" :label="$t('rooms.members.modals.edit.role')" v-if="editMember">
          <b-form-radio :state="fieldState('role')" v-model.number="massEditRole" name="some-radios" value="1">
            <b-badge class="text-white" variant="success">{{ $t('rooms.members.roles.participant') }}</b-badge>
          </b-form-radio>
          <b-form-radio :state="fieldState('role')" v-model.number="massEditRole" name="some-radios" value="2">
            <b-badge variant="danger">{{ $t('rooms.members.roles.moderator') }}</b-badge>
          </b-form-radio>
          <b-form-radio :state="fieldState('role')" v-model.number="massEditRole" name="some-radios" value="3">
            <b-badge variant="dark">{{ $t('rooms.members.roles.co_owner') }}</b-badge>
          </b-form-radio>

          <template slot='invalid-feedback'><div v-html="fieldError('role')"></div></template>

        </b-form-group>

        <b-form-invalid-feedback :force-show="true"><div v-html="fieldError('users',true)"></div></b-form-invalid-feedback>

      </div>
    </b-modal>

    <!-- remove user modal -->
    <b-modal
      :busy="isLoadingAction"
      :static='modalStatic'
      ok-variant="danger"
      cancel-variant="dark"
      :cancel-title="$t('app.no')"
      @ok="confirmRemoveMember"
      ref="remove-member-modal"
      :no-close-on-esc="isLoadingAction"
      :no-close-on-backdrop="isLoadingAction"
      :hide-header-close="isLoadingAction"
    >
      <template v-slot:modal-title>
        {{ $t('rooms.members.modals.delete.title') }}
      </template>
      <template v-slot:modal-ok>
        <b-spinner small v-if="isLoadingAction"></b-spinner>  {{ $t('app.yes') }}
      </template>
      <span v-if="deleteMember">
        {{ $t('rooms.members.modals.delete.confirm',{firstname: deleteMember.firstname,lastname: deleteMember.lastname}) }}
      </span>

    </b-modal>

    <!-- remove multiple user modal -->
    <b-modal
      :busy="isLoadingAction"
      :static='modalStatic'
      ok-variant="danger"
      cancel-variant="dark"
      :cancel-title="$t('app.no')"
      @ok="confirmRemoveMultipleMember"
      ref="remove-multiple-members-modal"
      :no-close-on-esc="isLoadingAction"
      :no-close-on-backdrop="isLoadingAction"
      :hide-header-close="isLoadingAction"
    >
      <template v-slot:modal-title>
        {{ $t('rooms.members.modals.delete.titleMultiple', {numberOfSelectedUsers: selectedMembers.length}) }}
      </template>
      <template v-slot:modal-ok>
        <b-spinner small v-if="isLoadingAction"></b-spinner>  {{ $t('app.yes') }}
      </template>
      <span>
        {{ $t('rooms.members.modals.delete.confirmMultiple', {numberOfSelectedUsers: selectedMembers.length}) }}
      </span>

      <b-form-invalid-feedback :force-show="true"><div v-html="fieldError('users',true)"></div></b-form-invalid-feedback>

    </b-modal>

    <!-- add new user modal -->
    <b-modal
      :busy="isLoadingAction"
      :static='modalStatic'
      ok-variant="success"
      :cancel-title="$t('rooms.members.modals.add.cancel')"
      @ok="saveNewMember"
      ref="add-member-modal"
      :no-close-on-esc="isLoadingAction"
      :no-close-on-backdrop="isLoadingAction"
      :hide-header-close="isLoadingAction"
    >
      <template v-slot:modal-title>
        {{ $t('rooms.members.modals.add.title') }}
      </template>
      <template v-slot:modal-ok>
        <b-spinner small v-if="isLoadingAction"></b-spinner>  {{ $t('rooms.members.modals.add.add') }}
      </template>
      <!-- show server validation errors -->
      <b-alert v-if="createError" show variant="danger">{{ createError }}</b-alert>
      <!-- select user -->
      <b-form-group :label="$t('rooms.members.modals.add.user')" :state="newMemberValid">
        <multiselect v-model="newMember"
                     label="lastname"
                     track-by="id"
                     :placeholder="$t('rooms.members.modals.add.name')"
                     open-direction="bottom"
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
                     @search-change="asyncFind">
          <template slot="noResult">{{ $t('rooms.members.modals.add.noResult') }}</template>
          <template slot="noOptions">{{ $t('rooms.members.modals.add.noOptions') }}</template>
          <template slot="option" slot-scope="props">{{ props.option.firstname }} {{ props.option.lastname }}<br><small>{{ props.option.email }}</small></template>
          <template slot="singleLabel" slot-scope="props">{{ props.option.firstname }} {{ props.option.lastname }}</template>
        </multiselect>
        <template slot='invalid-feedback'><div v-html="userValidationError"></div></template>
      </b-form-group>
      <!-- select role -->
      <b-form-group :label="$t('rooms.members.modals.add.role')" v-if="newMember" :state="newMemberRoleValid">
        <b-form-radio v-model.number="newMember.role" name="addmember-role-radios" value="1">
          <b-badge class="text-white" variant="success">{{ $t('rooms.members.roles.participant') }}</b-badge>
        </b-form-radio>
        <b-form-radio v-model.number="newMember.role" name="addmember-role-radios" value="2">
          <b-badge variant="danger">{{ $t('rooms.members.roles.moderator') }}</b-badge>
        </b-form-radio>
        <b-form-radio v-model.number="newMember.role" name="addmember-role-radios" value="3">
          <b-badge variant="dark">{{ $t('rooms.members.roles.co_owner') }}</b-badge>
        </b-form-radio>
        <template slot='invalid-feedback'><div v-html="roleValidationError"></div></template>
      </b-form-group>
    </b-modal>

  </div>
</template>
<script>
import Base from '../../api/base';
import Multiselect from 'vue-multiselect';
import _ from 'lodash';
import { mapGetters, mapState } from 'vuex';
import FieldErrors from '../../mixins/FieldErrors';
import env from '../../env';
import Can from '../Permissions/Can';
import PermissionService from '../../services/PermissionService';

export default {
  mixins: [FieldErrors],
  components: { Multiselect, Can },

  props: {
    room: Object, // room object
    modalStatic: {
      type: Boolean,
      default: false,
      required: false
    }
  },
  data () {
    return {
      isBusy: false, // table is fetching data from api
      newMember: null, // object user to be added as member
      users: [], // list of all found users
      isLoadingSearch: false, // is user search active
      isLoadingAction: false, // is user search active
      members: [], // list of all members
      createError: null, // error on adding new user as member
      editMember: null, // member to be edited
      massEditRole: null, // role that will be applied to multiple members
      deleteMember: null, // member to be deleted
      errors: {},
      currentPage: 1,
      selectedMembers: []
    };
  },
  methods: {

    /**
     * select all checkbox toggled
     * @param allSelected boolean select all rows
     */
    onAllRowsSelected (allSelected) {
      if (!allSelected) {
        // If checkbox is now unchecked, remove all selections
        this.$refs.membersTable.clearSelected();
      } else {
        // If checkbox is now checked, select all rows
        this.$refs.membersTable.selectAllRows();
      }
    },

    /**
     * Row selection changed
     * @param selectedRows selected rows
     */
    onRowsSelected (selectedRows) {
      // set selected members to all selected table columns, exclude current user (prevent self edit/delete)
      this.selectedMembers = selectedRows.filter(user => user.id !== this.currentUser.id);
    },

    /**
     * Remove given members from member list, usable for both single removal or mass removal
     */
    removeMemberItems: function (members) {
      members.forEach(member => {
        this.members.splice(this.members.findIndex(item => item.id === member), 1);
      });
    },

    /**
     * Search for users in database
     * @param query
     */
    asyncFind (query) {
      this.isLoadingSearch = true;

      Base.call('users/search?query=' + query).then(response => {
        // disable users that are already members of this room or the room owner
        const idOfMembers = this.members.map(user => user.id);
        this.users = response.data.data.map(user => {
          if (idOfMembers.includes(user.id) || this.room.owner.id === user.id) { user.$isDisabled = true; }
          return user;
        });
      }).catch((error) => {
        Base.error(error, this.$root);
      }).finally(() => {
        this.isLoadingSearch = false;
      });
    },

    /**
     * show modal to remove a member
     * @param member member object
     */
    showRemoveMemberModal: function (member) {
      this.deleteMember = member;
      this.$refs['remove-member-modal'].show();
    },

    /**
     * show modal to remove multiple members
     * @param member member object
     */
    showRemoveMultipleMemberModal: function (member) {
      this.deleteMember = member;
      this.errors = {};
      this.$refs['remove-multiple-members-modal'].show();
    },

    /**
     * Remove a member
     */
    confirmRemoveMember: function (bvModalEvt) {
      // prevent modal from closing
      bvModalEvt.preventDefault();

      this.isLoadingAction = true;

      Base.call('rooms/' + this.room.id + '/member/' + this.deleteMember.id, {
        method: 'delete'
      }).then(response => {
        // remove user entry from list
        this.removeMemberItems([this.deleteMember.id]);
      }).catch((error) => {
        if (error.response.status === env.HTTP_GONE) {
          this.removeMemberItems([this.deleteMember.id]);
        }
        Base.error(error, this.$root);
      }).finally(() => {
        this.$refs['remove-member-modal'].hide();
        this.isLoadingAction = false;
      });
    },
    /**
     * Remove multiple members
     * @param bvModalEvt
     */
    confirmRemoveMultipleMember: function (bvModalEvt) {
      // prevent modal from closing
      bvModalEvt.preventDefault();

      this.isLoadingAction = true;

      const toBeDeletedMembers = this.selectedMembers.map(user => user.id);

      Base.call('rooms/' + this.room.id + '/member', {
        method: 'delete',
        data: { users: toBeDeletedMembers }
      }).then(response => {
        // remove user entry from list
        this.removeMemberItems(toBeDeletedMembers);
        this.$refs['remove-multiple-members-modal'].hide();
      }).catch((error) => {
        // removing failed
        if (error.response) {
          // failed due to form validation errors
          if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
            this.errors = error.response.data.errors;
            return;
          }
        }
        if (error.response.status === env.HTTP_GONE) {
          this.removeMemberItems(toBeDeletedMembers);
        }
        this.$refs['remove-multiple-members-modal'].hide();
        Base.error(error, this.$root);
      }).finally(() => {
        this.isLoadingAction = false;
      });
    },

    /**
     * show modal to edit user role
     * @param user user object
     */
    showEditMemberModal: function (member) {
      // Clone object to edit properties without displaying the changes in realtime in the members list
      this.editMember = _.cloneDeep(member);
      this.$refs['edit-member-modal'].show();
    },

    /**
     * show modal to edit multiple users role
     * @param user user object
     */
    showEditMultipleMemberModal: function (selectedMembers) {
      // Clone object to edit properties without displaying the changes in realtime in the members list
      this.editMember = _.cloneDeep(selectedMembers);
      this.errors = {};
      this.massEditRole = null;
      this.$refs['edit-multiple-members-modal'].show();
    },

    /**
     * show modal to add a new user as member
     */
    showAddMemberModal: function () {
      this.newMember = null;
      this.createError = null;
      this.users = [];
      this.$refs['add-member-modal'].show();
    },

    /**
     * Edit role of given members from member list for both single or mass update
     */
    editMemberItems: function (members, role) {
      members.forEach(member => {
        this.members[this.members.findIndex(item => item.id === member)].role = role;
      });
    },

    /**
     *  save new user role
     */
    saveEditMember: function (bvModalEvt) {
      // prevent modal from closing
      bvModalEvt.preventDefault();

      this.isLoadingAction = true;
      this.errors = {};

      Base.call('rooms/' + this.room.id + '/member/' + this.editMember.id, {
        method: 'put',
        data: { role: this.editMember.role }
      }).then(response => {
        // user role was saved
        this.editMemberItems([this.editMember.id], this.editMember.role);
      }).catch((error) => {
        if (error.response.status === env.HTTP_GONE) {
          this.removeMemberItems([this.editMember]);
        }
        Base.error(error, this.$root);
      }).finally(() => {
        this.$refs['edit-member-modal'].hide();
        this.isLoadingAction = false;
      });
    },

    /**
     * save new user roles for multiple members
     * @param bvModalEvt
     */
    saveEditMultipleMembers: function (bvModalEvt) {
      // prevent modal from closing
      bvModalEvt.preventDefault();

      this.isLoadingAction = true;
      this.errors = {};

      const toBeEditedMembers = this.selectedMembers.map(user => user.id);

      Base.call('rooms/' + this.room.id + '/member', {
        method: 'put',
        data: { role: this.massEditRole, users: toBeEditedMembers }
      }).then(response => {
        // user role was saved
        this.editMemberItems(toBeEditedMembers, this.massEditRole);
        this.$refs['edit-multiple-members-modal'].hide();
      }).catch((error) => {
        // editing failed
        if (error.response) {
          // failed due to form validation errors
          if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
            this.errors = error.response.data.errors;
            return;
          }
        }
        if (error.response.status === env.HTTP_GONE) {
          toBeEditedMembers.removeMemberItems([this.editMember]);
        }
        Base.error(error, this.$root);
        this.$refs['edit-multiple-members-modal'].hide();
      }).finally(() => {
        this.isLoadingAction = false;
      });
    },

    /**
     * add a user as a room member
     * @param bvModalEvt
     */
    saveNewMember: function (bvModalEvt) {
      // prevent modal from closing
      bvModalEvt.preventDefault();

      this.isLoadingAction = true;

      // reset previous error messages
      this.createError = null;

      this.errors = {};

      // post new user as room members
      Base.call('rooms/' + this.room.id + '/member', {
        method: 'post',
        data: { user: this.newMember.id, role: this.newMember.role }
      }).then(response => {
        // operation successful, close modal and reload list
        this.$refs['add-member-modal'].hide();
        this.reload();
      }).catch((error) => {
        // adding failed
        if (error.response) {
          // failed due to form validation errors
          if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
            this.errors = error.response.data.errors;
            return;
          }
        }
        this.$refs['add-member-modal'].hide();
        Base.error(error, this.$root);
      }).finally(() => {
        this.isLoadingAction = false;
      });
    },
    /**
     * reload member list from api
     */
    reload: function () {
      // enable data loading indicator
      this.isBusy = true;
      // make request to load users
      Base.call('rooms/' + this.room.id + '/member')
        .then(response => {
          // fetching successful
          this.members = response.data.data;
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

    // check if new user input field is valid, local and server-side check
    newMemberValid: function () {
      if (this.newMember == null || this.newMember.id == null || this.fieldState('user') === false) { return false; }
      return null;
    },
    // check if new user role input field is valid, local and server-side check
    newMemberRoleValid: function () {
      if ((this.newMember != null && this.newMember.role == null) || this.fieldState('role') === false) { return false; }
      return null;
    },
    // return error message for user, local or server-side
    userValidationError: function () {
      return this.fieldState('user') === false ? this.fieldError('user') : this.$t('rooms.members.modals.add.selectUser');
    },
    // return error message for role, local or server-side
    roleValidationError: function () {
      return this.fieldState('role') === false ? this.fieldError('role') : this.$t('rooms.members.modals.add.selectRole');
    },

    // member tables headings
    tableFields () {
      const fields = [
        {
          key: 'image',
          label: this.$t('rooms.members.image'),
          sortable: false,
          thClass: 'profileImageColumn'
        },
        {
          key: 'firstname',
          label: this.$t('rooms.members.firstname'),
          sortable: true
        },
        {
          key: 'lastname',
          label: this.$t('rooms.members.lastname'),
          sortable: true
        },
        {
          key: 'email',
          label: this.$t('rooms.members.email'),
          sortable: true
        },
        {
          key: 'role',
          label: this.$t('rooms.members.role'),
          sortable: true
        }];

      if (PermissionService.can('manageSettings', this.room)) {
        fields.push({
          key: 'actions',
          label: this.$t('rooms.members.actions'),
          thClass: 'actionColumn',
          tdClass: 'actionButton'
        });
        fields.unshift({
          key: 'selected'
        });
      }

      return fields;
    }

  },
  watch: {
    'newMember.id': function () {
      this.errors = {};
    },
    'newMember.role': function () {
      this.errors = {};
    }
  },
  created () {
    // initial member fetch
    this.reload();
  }
};
</script>

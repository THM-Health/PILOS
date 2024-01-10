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
              <!-- Add existing user from database -->
              <b-button
                ref="add-member"
                variant="success"
                :disabled="isBusy"
                @click="showAddMemberModal"
              >
                <i class="fa-solid fa-user-plus" /> {{ $t('rooms.members.add_user') }}
              </b-button>

              <!-- Bulk Import -->
              <bulk-import-members-component
                ref="import-members"
                :room-id="room.id"
                @imported="reload"
              />
            </can>

            <!-- Reload members list -->
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
          <!-- table with all room members -->
          <b-table
            ref="membersTable"
            v-model="displayedMembers"
            :current-page="currentPage"
            :per-page="getSetting('pagination_page_size')"
            :fields="tableFields"
            :items="members"
            hover
            stacked="lg"
            show-empty
            selectable
            :no-select-on-click="true"
            @row-selected="onRowsSelected"
          >
            <!-- message on no members -->
            <template #empty>
              <i>{{ $t('rooms.members.nodata') }}</i>
            </template>

            <!-- checkbox in header -->
            <template #head(selected)>
              <b-form-checkbox
                v-if="selectableMembers>0"
                :checked="selectedMembers.length == selectableMembers && displayedMembers.length > 0"
                @change="onAllRowsSelected"
              />
              <span v-else />
            </template>

            <!-- checkbox to select the current row -->
            <template #cell(selected)="{ item, rowSelected, selectRow, unselectRow }">
              <b-form-checkbox
                v-if="currentUser && currentUser.id !== item.id"
                :checked="rowSelected"
                @change="rowSelected ? unselectRow() : selectRow() "
              />
            </template>

            <!-- action buttons -->
            <template #cell(actions)="data">
              <b-button-group
                v-if="currentUser && currentUser.id !== data.item.id"
                class="float-md-right"
              >
                <!-- edit membership role -->
                <b-button
                  v-b-tooltip.hover
                  v-tooltip-hide-click
                  :disabled="isBusy"
                  variant="secondary"
                  :title="$t('rooms.members.edit_user')"
                  @click="showEditMemberModal(data.item)"
                >
                  <i class="fa-solid fa-user-edit" />
                </b-button>
                <!-- remove member -->
                <b-button
                  v-b-tooltip.hover
                  v-tooltip-hide-click
                  :disabled="isBusy"
                  variant="danger"
                  :title="$t('rooms.members.remove_user')"
                  @click="showRemoveMemberModal(data.item)"
                >
                  <i class="fa-solid fa-trash" />
                </b-button>
              </b-button-group>
            </template>

            <!-- render user profile image -->
            <template #cell(image)="data">
              <img
                :src="data.value ? data.value : '/images/default_profile.png'"
                class="profile-image"
              >
            </template>

            <!-- render user role -->
            <template #cell(role)="data">
              <b-badge
                v-if="data.value === 0"
                variant="info"
              >
                {{ $t('rooms.roles.guest') }}
              </b-badge>
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
              <b-badge
                v-if="data.value === 3"
                variant="dark"
              >
                {{ $t('rooms.roles.co_owner') }}
              </b-badge>
            </template>
          </b-table>
          <b-row>
            <b-col
              cols="12"
              class="my-1"
            >
              <b-pagination
                v-model="currentPage"
                :total-rows="members.length"
                :per-page="getSetting('pagination_page_size')"
              />
            </b-col>
          </b-row>
          <!-- selected rows action buttons -->
          <b-button-group
            v-if="selectedMembers.length > 0"
            class="float-md-right"
          >
            <!-- bulk edit membership role -->
            <b-button
              ref="bulk-edit-members-button"
              v-b-tooltip.hover
              :disabled="isBusy"
              variant="dark"
              :title="$t('rooms.members.bulk_edit_user',{numberOfSelectedUsers: selectedMembers.length})"
              @click="showBulkEditMemberModal"
            >
              <i class="fas fa-users-cog" />
            </b-button>
            <!-- bulk remove member -->
            <b-button
              ref="bulk-remove-members-button"
              v-b-tooltip.hover
              :disabled="isBusy"
              variant="danger"
              :title="$t('rooms.members.bulk_remove_user',{numberOfSelectedUsers: selectedMembers.length})"
              @click="showBulkRemoveMemberModal"
            >
              <i class="fas fa-users-slash" />
            </b-button>
          </b-button-group>
        </div>
      </div>
    </b-overlay>

    <!-- Modals -->

    <!-- edit user role modal -->
    <b-modal
      ref="edit-member-modal"
      :static="modalStatic"
      :busy="isLoadingAction"
      ok-variant="success"
      :cancel-title="$t('app.cancel')"
      :no-close-on-esc="isLoadingAction"
      :no-close-on-backdrop="isLoadingAction"
      :hide-header-close="isLoadingAction"
      @ok="saveEditMember"
    >
      <template #modal-title>
        <span v-if="editMember">
          {{ $t('rooms.members.modals.edit.title',{firstname: editMember.firstname,lastname: editMember.lastname}) }}
        </span>
      </template>
      <template #modal-ok>
        <b-spinner
          v-if="isLoadingAction"
          small
        />  {{ $t('app.save') }}
      </template>
      <div v-if="editMember">
        <b-form-group
          v-if="editMember"
          :label="$t('rooms.role')"
        >
          <b-form-radio
            v-model.number="editMember.role"
            name="some-radios"
            :value="1"
          >
            <b-badge variant="success">
              {{ $t('rooms.roles.participant') }}
            </b-badge>
          </b-form-radio>
          <b-form-radio
            v-model.number="editMember.role"
            name="some-radios"
            :value="2"
          >
            <b-badge variant="danger">
              {{ $t('rooms.roles.moderator') }}
            </b-badge>
          </b-form-radio>
          <b-form-radio
            v-model.number="editMember.role"
            name="some-radios"
            :value="3"
          >
            <b-badge variant="dark">
              {{ $t('rooms.roles.co_owner') }}
            </b-badge>
          </b-form-radio>
        </b-form-group>
      </div>
    </b-modal>

    <!-- bulk edit users role modal -->
    <b-modal
      ref="bulk-edit-members-modal"
      :static="modalStatic"
      :busy="isLoadingAction"
      ok-variant="success"
      :cancel-title="$t('app.cancel')"
      :no-close-on-esc="isLoadingAction"
      :no-close-on-backdrop="isLoadingAction"
      :hide-header-close="isLoadingAction"
      @ok="saveBulkEditMembers"
    >
      <template #modal-title>
        <span>
          {{ $t('rooms.members.modals.edit.title_bulk', {numberOfSelectedUsers: selectedMembers.length}) }}
        </span>
      </template>
      <template #modal-ok>
        <b-spinner
          v-if="isLoadingAction"
          small
        />  {{ $t('app.save') }}
      </template>
      <div>
        <b-form-group
          :state="fieldState('role')"
          :label="$t('rooms.role')"
        >
          <b-form-radio
            v-model.number="bulkEditRole"
            :state="fieldState('role')"
            name="some-radios"
            :value="1"
          >
            <b-badge
              class="text-white"
              variant="success"
            >
              {{ $t('rooms.roles.participant') }}
            </b-badge>
          </b-form-radio>
          <b-form-radio
            v-model.number="bulkEditRole"
            :state="fieldState('role')"
            name="some-radios"
            :value="2"
          >
            <b-badge variant="danger">
              {{ $t('rooms.roles.moderator') }}
            </b-badge>
          </b-form-radio>
          <b-form-radio
            v-model.number="bulkEditRole"
            :state="fieldState('role')"
            name="some-radios"
            :value="3"
          >
            <b-badge variant="dark">
              {{ $t('rooms.roles.co_owner') }}
            </b-badge>
          </b-form-radio>

          <template #invalid-feedback>
            <div v-html="fieldError('role')" />
          </template>
        </b-form-group>

        <b-form-invalid-feedback :force-show="true">
          <div v-html="fieldError('users',true)" />
        </b-form-invalid-feedback>
      </div>
    </b-modal>

    <!-- remove user modal -->
    <b-modal
      ref="remove-member-modal"
      :busy="isLoadingAction"
      :static="modalStatic"
      ok-variant="danger"
      cancel-variant="secondary"
      :cancel-title="$t('app.no')"
      :no-close-on-esc="isLoadingAction"
      :no-close-on-backdrop="isLoadingAction"
      :hide-header-close="isLoadingAction"
      @ok="confirmRemoveMember"
    >
      <template #modal-title>
        {{ $t('rooms.members.modals.remove.title') }}
      </template>
      <template #modal-ok>
        <b-spinner
          v-if="isLoadingAction"
          small
        />  {{ $t('app.yes') }}
      </template>
      <span v-if="removeMember">
        {{ $t('rooms.members.modals.remove.confirm',{firstname: removeMember.firstname,lastname: removeMember.lastname}) }}
      </span>
    </b-modal>

    <!-- bulk remove user modal -->
    <b-modal
      ref="bulk-remove-members-modal"
      :busy="isLoadingAction"
      :static="modalStatic"
      ok-variant="danger"
      cancel-variant="dark"
      :cancel-title="$t('app.no')"
      :no-close-on-esc="isLoadingAction"
      :no-close-on-backdrop="isLoadingAction"
      :hide-header-close="isLoadingAction"
      @ok="confirmBulkRemoveMember"
    >
      <template #modal-title>
        {{ $t('rooms.members.modals.remove.title_bulk', {numberOfSelectedUsers: selectedMembers.length}) }}
      </template>
      <template #modal-ok>
        <b-spinner
          v-if="isLoadingAction"
          small
        />  {{ $t('app.yes') }}
      </template>
      <span>
        {{ $t('rooms.members.modals.remove.confirm_bulk', {numberOfSelectedUsers: selectedMembers.length}) }}
      </span>

      <b-form-invalid-feedback :force-show="true">
        <div v-html="fieldError('users',true)" />
      </b-form-invalid-feedback>
    </b-modal>

    <!-- add new user modal -->
    <b-modal
      ref="add-member-modal"
      :busy="isLoadingAction"
      :static="modalStatic"
      :ok-disabled="!newMember"
      ok-variant="success"
      :cancel-title="$t('app.cancel')"
      :no-close-on-esc="isLoadingAction"
      :no-close-on-backdrop="isLoadingAction"
      :hide-header-close="isLoadingAction"
      @ok="saveNewMember"
    >
      <template #modal-title>
        {{ $t('rooms.members.add_user') }}
      </template>
      <template #modal-ok>
        <b-spinner
          v-if="isLoadingAction"
          small
        />  {{ $t('rooms.members.modals.add.add') }}
      </template>
      <!-- show server validation errors -->
      <b-alert
        v-if="createError"
        show
        variant="danger"
      >
        {{ createError }}
      </b-alert>
      <!-- select user -->
      <b-form-group
        :label="$t('app.user')"
        :state="newMemberValid"
      >
        <multiselect
          v-model="newMember"
          label="lastname"
          track-by="id"
          :placeholder="$t('app.user_name')"
          open-direction="bottom"
          :options="users"
          :multiple="false"
          :searchable="true"
          :loading="isLoadingSearch"
          :internal-search="false"
          :clear-on-select="false"
          :preserve-search="true"
          :close-on-select="true"
          :options-limit="300"
          :max-height="600"
          :show-no-results="true"
          :show-labels="false"
          @search-change="asyncFind"
        >
          <template #noResult>
            {{ $t('rooms.members.modals.add.no_result') }}
          </template>
          <template #noOptions>
            {{ $t('rooms.members.modals.add.no_options') }}
          </template>
          <template v-slot:option="{ option }">
            {{ option.firstname }} {{ option.lastname }}<br><small>{{ option.email }}</small>
          </template>
          <template v-slot:singleLabel="{ option }">
            {{ option.firstname }} {{ option.lastname }}
          </template>
        </multiselect>
        <template #invalid-feedback>
          <div v-html="userValidationError" />
        </template>
      </b-form-group>
      <!-- select role -->
      <b-form-group
        v-if="newMember"
        :label="$t('rooms.role')"
        :state="newMemberRoleValid"
      >
        <b-form-radio
          v-model.number="newMember.role"
          name="addmember-role-radios"
          :value="1"
        >
          <b-badge variant="success">
            {{ $t('rooms.roles.participant') }}
          </b-badge>
        </b-form-radio>
        <b-form-radio
          v-model.number="newMember.role"
          name="addmember-role-radios"
          :value="2"
        >
          <b-badge variant="danger">
            {{ $t('rooms.roles.moderator') }}
          </b-badge>
        </b-form-radio>
        <b-form-radio
          v-model.number="newMember.role"
          name="addmember-role-radios"
          :value="3"
        >
          <b-badge variant="dark">
            {{ $t('rooms.roles.co_owner') }}
          </b-badge>
        </b-form-radio>
        <template #invalid-feedback>
          <div v-html="roleValidationError" />
        </template>
      </b-form-group>
    </b-modal>
  </div>
</template>
<script>
import Base from '@/api/base';
import { Multiselect } from 'vue-multiselect';
import _ from 'lodash';
import FieldErrors from '@/mixins/FieldErrors';
import env from '@/env';
import Can from '@/components/Permissions/Can.vue';
import PermissionService from '@/services/PermissionService';
import { mapState } from 'pinia';
import { useAuthStore } from '@/stores/auth';
import { useSettingsStore } from '@/stores/settings';
import BulkImportMembersComponent from './BulkImportMembersComponent.vue';
import EventBus from '@/services/EventBus';
import { EVENT_CURRENT_ROOM_CHANGED } from '@/constants/events';

export default {

  name: 'MembersComponent',

  components: { BulkImportMembersComponent, Multiselect, Can },
  mixins: [FieldErrors],

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
      bulkEditRole: null, // role that will be applied to multiple members
      removeMember: null, // member to be removed
      errors: {},
      currentPage: 1,
      selectedMembers: [],
      displayedMembers: []
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
      // set selected members to all selected table columns, exclude current user (prevent self edit/removed)
      this.selectedMembers = selectedRows.filter(user => user.id !== (this.currentUser ? this.currentUser.id : null));
    },

    /**
     * Remove given members from member list, usable for both single removal or bulk removal
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

      const config = {
        params: {
          query
        }
      };

      Base.call('users/search', config).then(response => {
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
      this.removeMember = member;
      this.$refs['remove-member-modal'].show();
    },

    /**
     * show modal to bulk remove members
     * @param member member object
     */
    showBulkRemoveMemberModal: function () {
      this.errors = {};
      this.$refs['bulk-remove-members-modal'].show();
    },

    /**
     * Remove a member
     */
    confirmRemoveMember: function (bvModalEvt) {
      // prevent modal from closing
      bvModalEvt.preventDefault();

      this.isLoadingAction = true;

      Base.call('rooms/' + this.room.id + '/member/' + this.removeMember.id, {
        method: 'delete'
      }).then(response => {
        // remove user entry from list
        this.removeMemberItems([this.removeMember.id]);
      }).catch((error) => {
        if (error.response.status === env.HTTP_GONE) {
          this.removeMemberItems([this.removeMember.id]);
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
    confirmBulkRemoveMember: function (bvModalEvt) {
      // prevent modal from closing
      bvModalEvt.preventDefault();

      this.isLoadingAction = true;

      const toBeRemovedMembers = this.selectedMembers.map(user => user.id);

      Base.call('rooms/' + this.room.id + '/member/bulk', {
        method: 'delete',
        data: { users: toBeRemovedMembers }
      }).then(response => {
        // remove user entry from list
        this.removeMemberItems(toBeRemovedMembers);
        this.$refs['bulk-remove-members-modal'].hide();
      }).catch((error) => {
        // removing failed
        if (error.response) {
          // failed due to form validation errors
          if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
            this.errors = error.response.data.errors;
            return;
          }
        }
        this.$refs['bulk-remove-members-modal'].hide();
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
    showBulkEditMemberModal: function () {
      // Clone object to edit properties without displaying the changes in realtime in the members list
      this.errors = {};
      this.bulkEditRole = null;
      this.$refs['bulk-edit-members-modal'].show();
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
     * Edit role of given members from member list for both single or bulk update
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
    saveBulkEditMembers: function (bvModalEvt) {
      // prevent modal from closing
      bvModalEvt.preventDefault();

      this.isLoadingAction = true;
      this.errors = {};

      const toBeEditedMembers = this.selectedMembers.map(user => user.id);

      Base.call('rooms/' + this.room.id + '/member/bulk', {
        method: 'put',
        data: { role: this.bulkEditRole, users: toBeEditedMembers }
      }).then(response => {
        // user role was saved
        this.editMemberItems(toBeEditedMembers, this.bulkEditRole);
        this.$refs['bulk-edit-members-modal'].hide();
      }).catch((error) => {
        // editing failed
        if (error.response) {
          // failed due to form validation errors
          if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
            this.errors = error.response.data.errors;
            return;
          }
        }
        Base.error(error, this.$root);
        this.$refs['bulk-edit-members-modal'].hide();
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

    ...mapState(useAuthStore, ['currentUser']),
    ...mapState(useSettingsStore, ['getSetting']),

    // amount of members that can be selected on the current page (user cannot select himself)
    selectableMembers: function () {
      return this.displayedMembers.filter(member => member.id !== (this.currentUser ? this.currentUser.id : null)).length;
    },

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
      return this.fieldState('user') === false ? this.fieldError('user') : this.$t('rooms.members.modals.add.select_user');
    },
    // return error message for role, local or server-side
    roleValidationError: function () {
      return this.fieldState('role') === false ? this.fieldError('role') : this.$t('rooms.members.modals.add.select_role');
    },

    // member tables headings
    tableFields () {
      const fields = [
        {
          key: 'image',
          label: this.$t('rooms.members.image'),
          sortable: false,
          thClass: 'profile-image-column'
        },
        {
          key: 'firstname',
          label: this.$t('app.firstname'),
          sortable: true
        },
        {
          key: 'lastname',
          label: this.$t('app.lastname'),
          sortable: true
        },
        {
          key: 'email',
          label: this.$t('app.email'),
          sortable: true
        },
        {
          key: 'role',
          label: this.$t('rooms.role'),
          sortable: true
        }];

      if (PermissionService.can('manageSettings', this.room)) {
        fields.push({
          key: 'actions',
          label: this.$t('app.actions'),
          thClass: 'action-column',
          tdClass: 'action-button'
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

  /**
   * Sets the event listener for current room change to reload the member list.
   *
   * @method mounted
   * @return undefined
   */
  mounted () {
    EventBus.on(EVENT_CURRENT_ROOM_CHANGED, this.reload);
    this.reload();
  },

  /**
   * Removes the listener for current room change
   *
   * @method beforeDestroy
   * @return undefined
   */
  beforeUnmount () {
    EventBus.off(EVENT_CURRENT_ROOM_CHANGED, this.reload);
  }
};
</script>

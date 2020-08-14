<template>
  <div>
    <div class="row">
      <div class="col-12">

        <b-button-group class="float-lg-right">
          <!-- Add existing user from database -->
          <b-button
            variant="dark"
            @click="showAddUserModal"
          >
            <i class="fas fa-user-plus"></i> {{ $t('rooms.members.addUser') }}
          </b-button>
          <!-- Add new guest user TODO

          <b-button
            variant="dark"
          >
            <i class="fas fa-paper-plane"></i> {{ $t('rooms.members.inviteGuest') }}
          </b-button>
          -->

          <!-- Reload members list -->
          <b-button
            variant="dark"
            @click="reload"
          >
            <i class="fas fa-sync"></i>
          </b-button>
        </b-button-group>
      </div>
    </div>
    <div class="row pt-4">
      <div class="col-12">
        <!-- table with all room members -->
        <b-table
          :fields="tablefields"
          :items="members"
          hover
          :busy="isBusy"
          stacked="md"
          show-empty
        >
          <!-- message on no members -->
          <template v-slot:empty>
            <i>{{ $t('rooms.members.nodata') }}</i>
          </template>

          <!-- table data fetching spinner -->
          <template v-slot:table-busy>
            <div class="text-center my-2">
              <b-spinner class="align-middle"></b-spinner>
            </div>
          </template>

          <!-- action buttons -->
          <template v-slot:cell(actions)="data">
            <b-button-group class="float-md-right">
              <!-- edit membership role -->
              <b-button
                variant="dark"
                @click="showEditUserModal(data.item,data.index)"
              >
                <i class="fas fa-user-edit"></i>
              </b-button>
              <!-- remove member -->
              <b-button
                variant="danger"
                @click="deleteUser(data.item,data.index)"
              >
                <i class="fas fa-trash"></i>
              </b-button>
            </b-button-group>
          </template>

          <!-- render user role -->
          <template v-slot:cell(role)="data">
            <b-badge v-if="data.value === 0" variant="primary">{{ $t('rooms.members.roles.guest') }}</b-badge>
            <b-badge
              class="text-white"
              v-if="data.value === 1"
              variant="success"
            >{{ $t('rooms.members.roles.participant') }}
            </b-badge>
            <b-badge v-if="data.value === 2" variant="danger"
            >{{ $t('rooms.members.roles.moderator') }}
            </b-badge>
          </template>
        </b-table>
      </div>
    </div>

    <!-- Modals -->

    <!-- edit user role modal -->
    <b-modal
      :ok-title="$t('rooms.members.modals.edit.save')"
      ok-variant="success"
      :cancel-title="$t('rooms.members.modals.edit.cancel')"
      @ok="saveEditUser"
      ref="edit-user-modal" >
      <template v-slot:modal-title>
        {{ $t('rooms.members.modals.edit.title',{firstname: editUser.firstname,lastname: editUser.lastname}) }}
      </template>
      <b-form-group :label="$t('rooms.members.modals.edit.role')" v-if="editUser">
        <b-form-radio v-model.number="editUser.role" name="some-radios" value="1">
          <b-badge class="text-white" variant="success">{{ $t('rooms.members.roles.participant') }}</b-badge>
        </b-form-radio>
        <b-form-radio v-model.number="editUser.role" name="some-radios" value="2">
          <b-badge variant="danger">{{ $t('rooms.members.roles.moderator') }}</b-badge>
        </b-form-radio>
      </b-form-group>
    </b-modal>

    <!-- add new user modal -->
    <b-modal
      :ok-title="$t('rooms.members.modals.add.add')"
      ok-variant="success"
      :cancel-title="$t('rooms.members.modals.add.cancel')"
      @ok="saveNewUser"
      ref="add-user-modal" >
      <template v-slot:modal-title>
        {{ $t('rooms.members.modals.add.title') }}
      </template>
      <!-- show server validation errors -->
      <b-alert v-if="createError" show variant="danger">{{ createError }}</b-alert>
      <!-- select user -->
      <b-form-group :label="$t('rooms.members.modals.add.user')" :invalid-feedback="$t('rooms.members.modals.add.selectuser')" :state="newuservalid">
        <multiselect v-model="newUser.data"
                     label="lastname"
                     track-by="id"
                     :placeholder="$t('rooms.members.modals.add.name')"
                     open-direction="bottom"
                     :options="users"
                     :multiple="false"
                     :searchable="true"
                     :loading="isLoading"
                     :internal-search="false"
                     :clear-on-select="false"
                     :close-on-select="true"
                     :options-limit="300"
                     :max-height="600"
                     :show-no-results="true"
                     :noOptions="$t('rooms.members.modals.add.noentries')"
                     @search-change="asyncFind">
          <template slot="option" slot-scope="props">{{ props.option.firstname }} {{ props.option.lastname }}</template>
          <template slot="singleLabel" slot-scope="props">{{ props.option.firstname }} {{ props.option.lastname }}</template>
        </multiselect>
      </b-form-group>
      <!-- select role -->
      <b-form-group :label="$t('rooms.members.modals.add.role')" v-if="newUser.data" :invalid-feedback="$t('rooms.members.modals.add.selectrole')" :state="newuserrolevalid">
        <b-form-radio v-model.number="newUser.data.role" name="adduser-role-radios" value="1">
          <b-badge class="text-white" variant="success">{{ $t('rooms.members.roles.participant') }}</b-badge>
        </b-form-radio>
        <b-form-radio v-model.number="newUser.data.role" name="adduser-role-radios" value="2">
          <b-badge variant="danger">{{ $t('rooms.members.roles.moderator') }}</b-badge>
        </b-form-radio>
      </b-form-group>
    </b-modal>

  </div>
</template>
<script>
import Base from '../../api/base';
import Multiselect from 'vue-multiselect';

export default {
  components: { Multiselect },
  props: {
    room: Object // room object
  },
  data () {
    return {
      isBusy: false, // table is fetching data from api
      newUser: { data: null, feedback: { user: null, role: null } }, // object user to be added
      users: [], // list of all found users
      isLoading: false, // is user search active
      members: [], // list of all members
      createError: null, // error on adding new user as member
      editUser: null // user to be edited
    };
  },
  methods: {
    /**
     * Search for users in database
     * @param query
     */
    asyncFind (query) {
      this.isLoading = true;

      Base.call('users/search?query=' + query, {
      }).then(response => {
        // query executed
        this.users = response.data.data;
        this.isLoading = false;
      }).catch((error) => {
        // search failed
        // TODO error handling
        if (error.response) {
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        } else if (error.request) {
          console.log(error.request);
        }
      });
    },

    /**
     * Remove a member
     * @param user user object
     * @param index index in the table
     */
    deleteUser: function (user, index) {
      this.$bvModal.msgBoxConfirm(this.$t('rooms.members.modals.delete.confirm', { firstname: user.firstname, lastname: user.lastname }), {
        title: this.$t('rooms.members.modals.delete.title'),
        okVariant: 'danger',
        okTitle: this.$t('rooms.members.modals.delete.yes'),
        cancelTitle: this.$t('rooms.members.modals.delete.no'),
        footerClass: 'p-2',
        centered: true
      })
        .then(function (value) {
          // Check if delete was confirmed
          if (value === true) {
            // Remove user from room
            Base.call('rooms/' + this.room.id + '/member/' + user.id, {
              method: 'delete'
            }).then(response => {
              // remove user entry from list and reload user table
              this.members.splice(index, 1);
              this.reload();
            }).catch((error) => {
              // removal failed
              // TODO error handling
              if (error.response) {
                console.log(error.response.data);
                console.log(error.response.status);
                console.log(error.response.headers);
              } else if (error.request) {
                console.log(error.request);
              }
            });
          }
        }.bind(this))
        .catch(err => {
          console.log(err);
        });
    },
    /**
     * show modal to edit user role
     * @param user user object
     * @param index index in the table
     */
    showEditUserModal: function (user, index) {
      this.editUser = JSON.parse(JSON.stringify(user));
      this.editUser.index = index;
      this.$refs['edit-user-modal'].show();
    },

    /**
     * show modal to add a new user as member
     */
    showAddUserModal: function () {
      this.newUser = { data: null, feedback: { user: null, role: null } };
      this.createError = null;
      this.$refs['add-user-modal'].show();
    },

    /**
     * save new user role
     */
    saveEditUser: function () {
      Base.call('rooms/' + this.room.id + '/member/' + this.editUser.id, {
        method: 'put',
        data: { role: this.editUser.role }
      }).then(response => {
        // user role was saved
        this.members[this.editUser.index].role = this.editUser.role;
        this.reload();
      }).catch((error) => {
        // saving failed
        // TODO error handling
        if (error.response) {
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        } else if (error.request) {
          console.log(error.request);
        }
      });
    },
    /**
     * add a user as a room member
     * @param bvModalEvt
     */
    saveNewUser: function (bvModalEvt) {
      // prevent modal from closing
      bvModalEvt.preventDefault();
      // reset previous error messages
      this.createError = null;
      // Check if no html/js form errors are present
      if (this.newuservalid === false || this.newuserrolevalid === false) {
        return;
      }
      // post new user as room members
      Base.call('rooms/' + this.room.id + '/member', {
        method: 'post',
        data: { user: this.newUser.data.id, role: this.newUser.data.role }
      }).then(response => {
        // operation successfull, close modal and reload list
        this.$refs['add-user-modal'].hide();
        this.reload();
      }).catch((error) => {
        // adding failed
        if (error.response) {
          // failed due to form validation errors
          if (error.response.status === 422) {
            // error on user field, display error
            if (error.response.data.errors.user) {
              this.createError = error.response.data.errors.user.join('<br>');
            }
          }
          // TODO more error handling
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        } else if (error.request) {
          console.log(error.request);
        }
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
          // fetching successfull
          this.members = response.data.data;
          this.isBusy = false;
        })
        .catch((error) => {
          // fetch of user lis failed
          this.isBusy = false;
          // TODO error handling
          if (error.response) {
            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers);
          } else if (error.request) {
            console.log(error.request);
          }
        });
    }
  },
  computed: {
    // check if new user input field is valid
    newuservalid: function () {
      if (this.newUser.data == null || this.newUser.data.id == null) { return false; }
      return null;
    },
    // check if new user role input field is valid
    newuserrolevalid: function () {
      if (this.newUser.data != null && this.newUser.data.role == null) { return false; }
      return null;
    },
    // member tables headings
    tablefields () {
      return [
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
        },
        {
          key: 'actions',
          label: this.$t('rooms.members.actions')
        }
      ];
    }

  },
  watch: {
    // watch for changes on the members amount, emit event to parent to display changes
    'member.length': function () {
      this.$emit('membersChanged', this.members.length);
    }
  },
  created () {
    // initial member fetch
    this.reload();
  }
};
</script>

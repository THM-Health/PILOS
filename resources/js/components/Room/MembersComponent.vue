<template>
  <div>
    <div class="row">
      <div class="col-12">

        <b-button-group class="float-lg-right">
          <b-button variant="dark" @click="showAddUserModal"
          ><i class="fas fa-user-plus"></i> {{ $t('rooms.members.addUser') }}
          </b-button>
          <b-button variant="dark"
          ><i class="fas fa-paper-plane"></i> {{ $t('rooms.members.inviteGuest') }}
          </b-button>
          <b-button variant="dark" @click="reload"
          ><i class="fas fa-sync"></i>
          </b-button>
        </b-button-group>
      </div>
    </div>
    <div class="row pt-4">
      <div class="col-12">
        <b-table
          :fields="userfields"
          :items="member"
          hover
          :busy="isBusy"
          stacked="md"
          show-empty
        >
          <template v-slot:empty="scope">
            <i>{{ $t('rooms.members.nodata') }}</i>
          </template>

          <template v-slot:table-busy>
            <div class="text-center my-2">
              <b-spinner class="align-middle"></b-spinner>
            </div>
          </template>
          <template v-slot:cell(actions)="data">
            <b-button-group class="float-md-right">
              <b-button variant="dark" @click="showEditUserModal(data.item,data.index)"
              ><i class="fas fa-user-edit"></i
              ></b-button>
              <b-button variant="danger" @click="deleteUser(data.item,data.index)"><i class="fas fa-trash"></i></b-button>
            </b-button-group>
          </template>
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

    <b-modal
      :ok-title="$t('rooms.members.modals.add.add')"
      ok-variant="success"
      :cancel-title="$t('rooms.members.modals.add.cancel')"
      @ok="saveNewUser"
      ref="add-user-modal" >
      <template v-slot:modal-title>
        {{ $t('rooms.members.modals.add.title') }}
      </template>

      <b-alert v-if="createError" show variant="danger">{{ createError }}</b-alert>
      <b-form-group :label="$t('rooms.members.modals.add.user')" :invalid-feedback="$t('rooms.members.modals.add.selectuser')" :state="newuservalid">
        <multiselect v-model="newUser.data"
                     label="lastname"
                     track-by="id"
                     :placeholder="$t('rooms.members.modals.add.name')"
                     open-direction="bottom"
                     :options="countries"
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
          <template slot="clear" slot-scope="props">
            <div class="multiselect__clear" v-if="selectedCountries.length" @mousedown.prevent.stop="clearAll(props.search)"></div>
          </template><span slot="noResult">{{ $t('rooms.members.modals.add.nouserfound') }}</span>
        </multiselect>
      </b-form-group>

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
    room: Object
  },
  data () {
    return {
      isBusy: false,
      newUser: { data: null, feedback: { user: null, role: null } },
      selectedCountries: [],
      countries: [],
      isLoading: false,
      member: [],
      createError: null,
      editUser: null
    };
  },
  methods: {
    limitText (count) {
      return `and ${count} other countries`;
    },
    asyncFind (query) {
      this.isLoading = true;

      Base.call('users/search?query=' + query, {
      }).then(response => {
        this.countries = response.data.data;
        this.isLoading = false;
      }).catch((error) => {
        if (error.response) {
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        } else if (error.request) {
          console.log(error.request);
        }
      });
    },
    clearAll () {
      this.selectedCountries = [];
    },

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
          if (value === true) {
            // Remove user from room
            Base.call('rooms/' + this.room.id + '/member/' + user.id, {
              method: 'delete'
            }).then(response => {
              this.member.splice(index, 1);
              this.reload();
            }).catch((error) => {
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
    showEditUserModal: function (user, index) {
      this.editUser = JSON.parse(JSON.stringify(user));
      this.editUser.index = index;
      this.$refs['edit-user-modal'].show();
    },
    showAddUserModal: function () {
      this.newUser = { data: null, feedback: { user: null, role: null } };
      this.createError = null;
      this.$refs['add-user-modal'].show();
    },
    saveEditUser: function () {
      Base.call('rooms/' + this.room.id + '/member/' + this.editUser.id, {
        method: 'put',
        data: { role: this.editUser.role }
      }).then(response => {
        this.member[this.editUser.index].role = this.editUser.role;
        this.reload();
      }).catch((error) => {
        if (error.response) {
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        } else if (error.request) {
          console.log(error.request);
        }
      });
    },
    saveNewUser: function (bvModalEvt) {
      bvModalEvt.preventDefault();
      this.createError = null;
      if (this.newuservalid === false || this.newuserrolevalid === false) {
        return;
      }

      Base.call('rooms/' + this.room.id + '/member', {
        method: 'post',
        data: { user: this.newUser.data.id, role: this.newUser.data.role }
      }).then(response => {
        this.$refs['add-user-modal'].hide();
        this.reload();
      }).catch((error) => {
        if (error.response) {
          if (error.response.status === 422) {
            if (error.response.data.errors.user) {
              this.createError = error.response.data.errors.user.join('<br>');
            }
          }
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        } else if (error.request) {
          console.log(error.request);
        }
      });
    },
    reload: function () {
      this.isBusy = true;
      var url = 'rooms/' + this.room.id + '/member';
      Base.call(url).then(response => {
        this.member = response.data.data;
        this.isBusy = false;
      }).catch((error) => {
        this.isBusy = false;
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
    newuservalid: function () {
      if (this.newUser.data == null || this.newUser.data.id == null) { return false; }
      return null;
    },
    newuserrolevalid: function () {
      if (this.newUser.data != null && this.newUser.data.role == null) { return false; }
      return null;
    },

    userfields () {
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
    'member.length': function () {
      this.$emit('membersChanged', this.member.length);
    }
  },

  created () {
    this.reload();
  }
};
</script>

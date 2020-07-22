<template>
  <div>
    <div class="row">
      <div class="col-12">
        <b-button-group class="float-lg-right">
          <b-button variant="dark" @click="showAddUserModal"
          ><i class="fas fa-user-plus"></i> Nutzer hinzufügen
          </b-button>
          <b-button variant="dark"
          ><i class="fas fa-paper-plane"></i> Gast einladen
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
          stacked="md"
        >
          <template v-slot:cell(actions)="data">
            <b-button-group class="float-md-right">
              <b-button variant="dark" @click="showEditUserModal(data.item,data.index)"
              ><i class="fas fa-user-edit"></i
              ></b-button>
              <b-button variant="danger" @click="deleteUser(data.item,data.index)"><i class="fas fa-trash"></i></b-button>
            </b-button-group>
          </template>
          <template v-slot:cell(role)="data">
            <b-badge v-if="data.value === 0" variant="primary">Gast</b-badge>
            <b-badge
              class="text-white"
              v-if="data.value === 1"
              variant="success"
            >Teilnehmer
            </b-badge>
            <b-badge v-if="data.value === 2" variant="danger"
            >Moderator
            </b-badge>
          </template>
        </b-table>
      </div>
    </div>

    <!-- Modals -->

    <b-modal
      ok-title="Speichern"
      ok-variant="success"
      cancel-title="Abbrechen"
      @ok="saveEditUser"
      ref="edit-user-modal" >
      <template v-slot:modal-title>
        {{ editUser.firstname }} {{ editUser.lastname}} bearbeiten
      </template>
      <b-form-group label="Rolle" v-if="editUser">
        <b-form-radio v-model.number="editUser.role" name="some-radios" value="1">
          <b-badge class="text-white" variant="success">Teilnehmer</b-badge>
        </b-form-radio>
        <b-form-radio v-model.number="editUser.role" name="some-radios" value="2">
          <b-badge variant="danger">Moderator</b-badge>
        </b-form-radio>
      </b-form-group>
    </b-modal>

    <b-modal
      ok-title="Hinzufügen"
      ok-variant="success"
      cancel-title="Abbrechen"
      @ok="saveNewUser"
      ref="add-user-modal" >
      <template v-slot:modal-title>
        Nutzer hinzufügen
      </template>

      <b-form-group label="Benutzer" invalid-feedback="Bitte einen Nutzer auswählen" :state="newuservalid">
        <multiselect v-model="newUser.data"
                     label="lastname"
                     track-by="id"
                     placeholder="Name"
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
                     noOptions="Keine Einträge"
                     @search-change="asyncFind">
          <template slot="option" slot-scope="props">{{ props.option.firstname }} {{ props.option.lastname }}</template>
          <template slot="singleLabel" slot-scope="props">{{ props.option.firstname }} {{ props.option.lastname }}</template>
          <template slot="clear" slot-scope="props">
            <div class="multiselect__clear" v-if="selectedCountries.length" @mousedown.prevent.stop="clearAll(props.search)"></div>
          </template><span slot="noResult">Oops! Es wurden keine Nutzer für diese Abfrage gefunden.</span>
        </multiselect>
      </b-form-group>

      <b-form-group label="Rolle" v-if="newUser.data" invalid-feedback="Bitte eine Rolle auswählen" :state="newuserrolevalid">
        <b-form-radio v-model.number="newUser.data.role" name="adduser-role-radios" value="1">
          <b-badge class="text-white" variant="success">Teilnehmer</b-badge>
        </b-form-radio>
        <b-form-radio v-model.number="newUser.data.role" name="adduser-role-radios" value="2">
          <b-badge variant="danger">Moderator</b-badge>
        </b-form-radio>
      </b-form-group>
    </b-modal>

  </div>
</template>
<script>
  import Base from "../../api/base";
  import Multiselect from 'vue-multiselect'

  export default {
    components: { Multiselect },
    props: {
      room: Object,
    },
    data() {
      return {
        newUser:  {data: null,feedback: {user: null,role:null}},
        selectedCountries: [],
        countries: [],
        isLoading: false,
        member: [],
        boxTwo: '',
        userfields: [
          {
            key: "firstname",
            label: "Vorname",
            sortable: true,
          },
          {
            key: "lastname",
            label: "Nachname",
            sortable: true,
          },

          {
            key: "email",
            label: "Email",
            sortable: true,
          },
          {
            key: "role",
            label: "Rolle",
            sortable: true,
          },
          {
            key: "actions",
            label: "Aktion",
          },
        ],
        editUser: null,
      }
    },
    methods: {
      limitText (count) {
        return `and ${count} other countries`
      },
      asyncFind (query) {
        this.isLoading = true

        Base.call('users/search?query='+query, {
        }).then(response => {
          this.countries = response.data.data
          this.isLoading = false
        }).catch((error) => {
          if (error.response) {
            console.log(error.response.data)
            console.log(error.response.status)
            console.log(error.response.headers)
          } else if (error.request) {
            console.log(error.request)
          }
        })
      },
      clearAll () {
        this.selectedCountries = []
      },

      deleteUser: function (user,index) {
        this.boxTwo = ''
        var that = this;
        this.$bvModal.msgBoxConfirm('Wollen Sie \''+user.firstname+' '+user.lastname+'\' wirklich aus dem Raum entfernen?', {
          title: 'Teilnehmer aus dem Raum entfernen',
          okVariant: 'danger',
          okTitle: 'Ja',
          cancelTitle: 'Nein',
          footerClass: 'p-2',
          centered: true
        })
        .then(function(value){
          if(value === true) {
            // Remove user from room
            Base.call('rooms/' + this.room.id + '/member/'+user.id, {
              method: 'delete'
            }).then(response => {
              this.member.splice(index,1);
            }).catch((error) => {
              if (error.response) {
                console.log(error.response.data)
                console.log(error.response.status)
                console.log(error.response.headers)
              } else if (error.request) {
                console.log(error.request)
              }
            })
          }
        }.bind(this))
        .catch(err => {
          console.log(err);
        })
      },
      showEditUserModal: function (user,index) {
        this.editUser = JSON.parse(JSON.stringify(user));
        this.editUser.index = index;
        this.$refs['edit-user-modal'].show();
      },
      showAddUserModal: function(){
        this.newUser = {data: null,feedback: {user: null,role:null}};
        this.$refs['add-user-modal'].show();
      },
      saveEditUser: function(){

        Base.call('rooms/' + this.room.id + '/member/'+this.editUser.id, {
          method: 'put',
          data: {role: this.editUser.role}
        }).then(response => {
          this.member[this.editUser.index].role = this.editUser.role;
        }).catch((error) => {
          if (error.response) {
            console.log(error.response.data)
            console.log(error.response.status)
            console.log(error.response.headers)
          } else if (error.request) {
            console.log(error.request)
          }
        })

      },
      saveNewUser: function(bvModalEvt){
        bvModalEvt.preventDefault();
        if(this.newuservalid === false || this.newuserrolevalid === false) {
          return;
        }

        Base.call('rooms/' + this.room.id + '/member', {
          method: 'post',
          data: {id: this.newUser.data.id,role: this.newUser.data.role}
        }).then(response => {
          this.$refs['add-user-modal'].hide();
        }).catch((error) => {
          if (error.response) {
            console.log(error.response.data)
            console.log(error.response.status)
            console.log(error.response.headers)
          } else if (error.request) {
            console.log(error.request)
          }
          return;
        });




      },
      reload: function () {
        var url = 'rooms/' + this.room.id+"/member"
        Base.call(url).then(response => {
          this.member = response.data.data
        }).catch((error) => {
          if (error.response) {
            console.log(error.response.data)
            console.log(error.response.status)
            console.log(error.response.headers)
          } else if (error.request) {

            console.log(error.request)
          }
        });
      }
    },
    computed: {
      newuservalid: function () {
        if(this.newUser.data == null || this.newUser.data.id == null)
          return false;
        return null;
      },
      newuserrolevalid: function () {
        if(this.newUser.data != null && this.newUser.data.role == null)
          return false;
        return null;
      }
    },
    watch: {
      'member.length': function () {
        this.$emit('userChanged',this.member.length)
      },
    },

    created() {
      this.reload();
      setInterval(this.reload, 3000)
    },
  }
</script>

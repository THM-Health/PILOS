<template>
  <div>
    <div class="row">
      <div class="col-12">
        <b-button-group class="float-lg-right">
          <b-button variant="dark"
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

  </div>
</template>
<script>
  import Base from "../../api/base";

  export default {
    props: {
      room: Object,
    },
    data() {
      return {
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
    watch: {
      'member.length': function () {
        this.$emit('userChanged',this.member.length)
      }
    },

    created() {
      this.reload();
      setInterval(this.reload, 3000)
    },
  }
</script>

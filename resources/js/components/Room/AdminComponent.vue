<template>
  <div>

    <div class="row">
      <div class="col-12">
        <b-card no-body>
      <b-tabs content-class="p-3" fill  active-nav-item-class="bg-success text-white">
        <b-tab  active>
          <template v-slot:title>
            <i class="fas fa-users"></i> Mitglieder <span class="badge badge-pill badge-dark">{{ room.users.length }}</span>
          </template>
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
                :items="this.room.users"
                hover
                stacked="md"
              >
                <template v-slot:cell(actions)="data">
                  <b-button-group class="float-md-right">
                    <b-button variant="dark"
                    ><i class="fas fa-user-edit"></i
                    ></b-button>
                    <b-button variant="danger"><i class="fas fa-trash"></i></b-button>
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
        </b-tab>
        <b-tab>
          <template v-slot:title>
            <i class="fas fa-folder-open"></i> Dateien
          </template>
          <b-form-file
            placeholder="Wähle eine Datei aus, oder ziehe sie hier hin..."
            v-bind:multiple="true"
          ></b-form-file>

          <b-table :fields="filefields" :items="files" hover>
            <template v-slot:cell(actions)="data">
              <b-button-group class="float-right">
                <b-button variant="danger"
                ><i class="fas fa-trash"></i
                ></b-button>
              </b-button-group>
            </template>
            <template v-slot:cell(visible)="data">
              <b-form-checkbox
                size="lg"
                switch
                v-model="data.value"
              ></b-form-checkbox>
            </template>
            <template v-slot:cell(active)="data">
              <b-form-checkbox
                size="lg"
                switch
                v-model="data.value"
              ></b-form-checkbox>
            </template>
          </b-table>
        </b-tab>
        <b-tab>
          <template v-slot:title>
            <i class="fas fa-chart-line"></i> Statistiken
          </template>

        </b-tab>
        <b-tab>
          <template v-slot:title>
            <i class="fas fa-cog"></i> Einstellungen
          </template>
          <settings-component :room="room"></settings-component>
        </b-tab>
      </b-tabs>
        </b-card>
      </div>
    </div>
  </div>
</template>

<script>
  import SettingsComponent from './SettingsComponent'
  import Base from "../../api/base";

export default {

  components: {
    SettingsComponent
  },
  props: {
    room: Object,
  },
  data() {
    return {
      roomtypes: [
        { value: "a", text: "Vorlesung" },
        { value: "b", text: "Meeting" },
        { value: "d", text: "Prüfung" },
        { value: "d", text: "Übung" },
      ],
      welcomeMessageLimit: 500,
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

      filefields: [
        {
          key: "filename",
          label: "Dateiname",
          sortable: true,
        },
        {
          key: "created_at",
          label: "Hochgeladen am",
          sortable: true,
        },
        {
          key: "visible",
          label: "Sichtbar",
          sortable: true,
        },
        {
          key: "active",
          label: "In Meeting nutzen",
          sortable: true,
        },
        {
          key: "actions",
          label: "Aktion",
        },
      ],
      files: [
        {
          id: 1,
          filename: "Laravel-Intro.pdf",
          created_at: "2020-06-10 09:55",
          visible: false,
          active: false,
        },
      ],
    };
  },



};
</script>
<style scoped></style>

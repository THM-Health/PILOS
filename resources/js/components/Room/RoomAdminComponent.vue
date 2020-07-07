<template>
  <div>

    <div class="row pt-7 pt-sm-9">
      <div class="col-lg-8 col-sm-12">

        <h4>Zugang für Teilnehmer</h4>
        <div class="jumbotron p-4">
          <b-button variant="light" class="float-right"><i class="fas fa-copy"></i></b-button>
          <strong>Mit PILOS teilnehmen</strong><br>
          Link: {{ roomUrl }}<br>
          <span v-if="accessCode">Zugangscode: {{ accessCode }}</span>

        </div>
      </div>
      <div class="offset-lg-1 col-lg-3 col-sm-12 mt-5">
        <b-button-group class="btn-group-vertical-block btn-block" vertical>
          <b-button v-b-toggle.collapse-settings variant="dark"><i class="fas fa-cog"></i> Einstellungen</b-button>
          <b-button v-b-toggle.collapse-statistics variant="dark"><i class="fas fa-chart-line"></i> Statistik</b-button>
          <b-button v-b-toggle.collapse-files variant="dark"><i class="fas fa-folder-open"></i> Dateien</b-button>
        </b-button-group>
      </div>
    </div>
    <div class="row">
      <div class="col-lg-12 col-sm-12">
        <b-collapse id="collapse-settings" class="pt-4">
          <b-card
            header="Einstellungen"
            header-text-variant="white"
            header-tag="header"
            header-bg-variant="dark"
          >
            <b-card-text>
              <form>
                <div class="row">
                  <div class="col-lg-3 col-sm-12 ">
                    <h5>Allgemein</h5>
                    <div class="form-group">
                      <label for="inputPassword4">Typ</label>
                      <div class="input-group mb-3">
                        <b-form-select :options="roomtypes"></b-form-select>
                      </div>
                    </div>

                    <div class="form-group">
                      <label for="settings-roomname">Raumname</label>
                      <div class="input-group mb-3">
                        <input type="text" class="form-control" placeholder="" id="settings-roomname" v-model="room.name">
                      </div>
                    </div>
                    <div class="form-group">
                      <label for="settings-welcome">Begrüßungsnachricht (max. 500 Zeichen)</label>
                      <div class="input-group mb-3">
                      <textarea type="text" class="form-control" placeholder="" id="settings-welcome" v-model="room.settings.welcome"></textarea>
                      </div>
                    </div>
                    <div class="form-group">
                      <label for="settings-maxParticipants">Max. Anzahl Teilnehmer</label>
                      <div class="input-group mb-3">
                        <input type="number" min="1" class="form-control" placeholder="unbegrenzt" id="settings-maxParticipants" v-model.number="room.settings.maxParticipants" >
                        <div class="input-group-append">
                          <button class="btn btn-outline-secondary" type="button" @click="room.settings.maxParticipants=null"><i
                            class="fas fa-trash"></i></button>
                        </div>
                      </div>
                    </div>
                    <div class="form-group">
                      <label for="settings-duration">Dauer</label>
                      <div class="input-group mb-3">
                        <input type="number" min="1" class="form-control" placeholder="unbegrenzt"
                               aria-label="Example text with button addon" id="settings-duration" v-model.number="room.settings.duration" >
                        <div class="input-group-append">
                          <span class="input-group-text" id="basic-addon1">min</span>
                        </div>
                        <div class="input-group-append">
                          <button class="btn btn-outline-secondary" type="button" @click="room.settings.duration=null"><i
                            class="fas fa-trash"></i></button>
                        </div>
                      </div>
                    </div>

                  </div>
                  <div class="col-lg-3 col-sm-12 ">
                    <h5>Sicherheit</h5>
                    <div class="form-group">
                      <label for="inputPassword4">Zugangscode</label>
                      <b-input-group>
                        <b-input-group-prepend>
                          <b-button variant="outline-secondary"  v-on:click="genAccessCode"><i class="fas fa-dice"></i></b-button>
                        </b-input-group-prepend>

                        <b-form-input type="number" readonly  placeholder="ungeschützt" v-model.number="room.accessCode"></b-form-input>

                        <b-input-group-append>
                          <b-button variant="outline-secondary" @click="room.accessCode=null"><i
                            class="fas fa-trash"></i></b-button>
                        </b-input-group-append>
                      </b-input-group>

                      <div class="input-group mb-3">
                        <br>
                        <small class="text-muted">
                          Zugangsbeschränkung für den Beitritt und die Mitgliedschaft in einem Raum.
                        </small>
                      </div>
                    </div>

                    <div class="form-group">
                      <label for="inputPassword4">Sicheitsstufe</label>
                      <div class="custom-control custom-radio">
                        <input type="radio" id="customRadio1" name="customRadio" class="custom-control-input">
                        <label class="custom-control-label" for="customRadio1">Öffentlich<br><small class="text-muted">Jeder
                          mit dem Link kann beitreten</small></label>
                      </div>
                      <div class="custom-control custom-radio">
                        <input type="radio" id="customRadio2" name="customRadio" class="custom-control-input">
                        <label class="custom-control-label" for="customRadio2">Intern<br><small class="text-muted">Alle
                          Nutzer</small></label>
                      </div>
                      <div class="custom-control custom-radio">
                        <input type="radio" id="customRadio3" name="customRadio" class="custom-control-input">
                        <label class="custom-control-label" for="customRadio3">Geschlossen<br><small class="text-muted">Nur
                          Teilnehmer</small></label>
                      </div>
                    </div>
                  </div>
                  <div class="col-lg-3 col-sm-12 ">
                    <h5>Berechtigungen</h5>
                    <div class="form-group">
                      <div class="custom-control custom-switch">
                        <input type="checkbox" class="custom-control-input" id="customSwitch1">
                        <label class="custom-control-label" for="customSwitch1">Neue Mitglieder akzeptieren</label>
                      </div>
                      <div class="custom-control custom-switch">
                        <input type="checkbox" class="custom-control-input" id="customSwitch1">
                        <label class="custom-control-label" for="customSwitch1">Jeder Teilnehmer kann das Meeting starten</label>
                      </div>
                      <hr>
                      <label for="inputPassword4">Standardrolle</label>
                      <div class="custom-control custom-radio">
                        <input type="radio" id="customRadio1" name="customRadio" class="custom-control-input">
                        <label class="custom-control-label" for="customRadio1">Gast<br><small class="text-muted">Moderator muss Beitritt erlauben</small></label>
                      </div>
                      <div class="custom-control custom-radio">
                        <input type="radio" id="customRadio2" name="customRadio" class="custom-control-input">
                        <label class="custom-control-label" for="customRadio2">Teilnehmer</label>
                      </div>
                      <div class="custom-control custom-radio">
                        <input type="radio" id="customRadio3" name="customRadio" class="custom-control-input">
                        <label class="custom-control-label" for="customRadio3">Moderator</label>
                      </div>
                    </div>

                  </div>
                  <div class="col-lg-3 col-sm-12 ">
                    <h5>Einschränkungen</h5>
                    <div class="form-group">
                      <div class="custom-control custom-switch">
                        <input type="checkbox" class="custom-control-input" id="customSwitch1">
                        <label class="custom-control-label" for="customSwitch1">Kamera deaktivieren</label>
                      </div>
                      <div class="custom-control custom-switch">
                        <input type="checkbox" class="custom-control-input" id="customSwitch1">
                        <label class="custom-control-label" for="customSwitch1">Nur Moderatoren sehen Webcams</label>
                      </div>
                      <div class="custom-control custom-switch">
                        <input type="checkbox" class="custom-control-input" id="customSwitch1">
                        <label class="custom-control-label" for="customSwitch1">Mikrofon deaktivieren</label>
                      </div>
                      <div class="custom-control custom-switch">
                        <input type="checkbox" class="custom-control-input" id="customSwitch1">
                        <label class="custom-control-label" for="customSwitch1">Öffentlichen Chat deaktivieren</label>
                      </div>
                      <div class="custom-control custom-switch">
                        <input type="checkbox" class="custom-control-input" id="customSwitch1">
                        <label class="custom-control-label" for="customSwitch1">Privaten Chat deaktivieren</label>
                      </div>
                      <div class="custom-control custom-switch">
                        <input type="checkbox" class="custom-control-input" id="customSwitch1">
                        <label class="custom-control-label" for="customSwitch1">Geteile Notizen bearbeiten</label>
                      </div>
                    </div>

                  </div>
                </div>
              </form>
            </b-card-text>
          </b-card>
        </b-collapse>
        <b-collapse id="collapse-statistics" class="pt-4">
          <b-card
            header="Statistik"
            header-text-variant="white"
            header-tag="header"
            header-bg-variant="dark"
          >
            <b-card-text>
            </b-card-text>
          </b-card>
        </b-collapse>
        <b-collapse id="collapse-files" class="pt-4">
          <b-card
            header="Dateien"
            header-text-variant="white"
            header-tag="header"
            header-bg-variant="dark"
          >
            <b-card-text>

              <b-form-file
                placeholder="Wähle eine Datei aus, oder ziehe sie hier hin..."
                v-bind:multiple="true"
              ></b-form-file>

              <b-table hover :items="files" :fields="filefields">
                <template v-slot:cell(actions)="data">
                  <b-button-group class="float-right">
                    <b-button variant="danger"><i class="fas fa-trash"></i></b-button>
                  </b-button-group>
                </template>
                <template v-slot:cell(visible)="data">
                  <b-form-checkbox switch v-model="data.value" size="lg"></b-form-checkbox>
                </template>
                <template v-slot:cell(active)="data">
                  <b-form-checkbox switch v-model="data.value" size="lg"></b-form-checkbox>
                </template>
              </b-table>

            </b-card-text>
          </b-card>
        </b-collapse>

      </div>

      <div class="col-lg-8 col-sm-12">

      </div>
    </div>
    <hr>
    <div class="row pt-4">
      <div class="col-lg-6 col-sm-12">
        <h4>Mitglieder <span class="badge badge-pill badge-dark">126</span></h4>
      </div>

      <div class="col-lg-6 col-sm-12">
        <b-button-group class="float-lg-right">

          <b-button variant="dark"><i class="fas fa-user-plus"></i> Nutzer hinzufügen</b-button>
          <b-button variant="dark"><i class="fas fa-paper-plane"></i> Gast einladen</b-button>
        </b-button-group>
      </div>

    </div>
    <div class="row pt-4">

      <div class="col-lg-12 col-sm-12">
        <b-table stacked ="md" hover :items="this.room.users" :fields="userfields">
          <template  v-slot:cell(actions)="data">
            <b-button-group class="float-md-right">
              <b-button variant="dark"><i class="fas fa-user-edit"></i></b-button>
              <b-button variant="danger"><i class="fas fa-trash"></i></b-button>
            </b-button-group>
          </template>
          <template v-slot:cell(role)="data">
            <b-badge v-if="data.value===0" variant="primary">Gast</b-badge>
            <b-badge v-if="data.value===1" variant="success" class="text-white">Teilnehmer</b-badge>
            <b-badge v-if="data.value===2" variant="danger">Moderator</b-badge>
          </template>
        </b-table>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  props: {
    room: Object,
    roomtypes: [
      { value: 'a', text: 'Vorlesung' },
      { value: 'b', text: 'Meeting' },
      { value: 'd', text: 'Prüfung' },
      { value: 'd', text: 'Übung' }
    ]
  },
  data () {
    return {
      userfields: [
        {
          key: 'firstname',
          label: 'Vorname',
          sortable: true
        },
        {
          key: 'lastname',
          label: 'Nachname',
          sortable: true
        },

        {
          key: 'email',
          label: 'Email',
          sortable: true
        },
        {
          key: 'role',
          label: 'Rolle',
          sortable: true
        },
        {
          key: 'actions',
          label: 'Aktion'
        }

      ],

      filefields: [
        {
          key: 'filename',
          label: 'Dateiname',
          sortable: true
        },
        {
          key: 'created_at',
          label: 'Hochgeladen am',
          sortable: true
        },
        {
          key: 'visible',
          label: 'Sichtbar',
          sortable: true
        },
        {
          key: 'active',
          label: 'In Meeting nutzen',
          sortable: true
        },
        {
          key: 'actions',
          label: 'Aktion'
        }

      ],
      files: [
        { id: 1, filename: 'Laravel-Intro.pdf', created_at: '2020-06-10 09:55', visible: false, active: false }

      ]
    }
  },
  methods: {
    genAccessCode: function (event) {
      console.log('HI')
      this.room.accessCode = Math.floor(Math.random() * (999999999 - 111111112)) + 111111111
    }
  },
  computed: {

    roomUrl: function () {
      return window.location.origin + this.$router.resolve({ name: 'rooms.join', params: { id: this.room.publicID } }).href
    },
    accessCode: function () {
      if (this.room.accessCode) {
        return String(this.room.accessCode).match(/.{1,3}/g).join('-')
      } else {}
    }
  }
}
</script>
<style scoped>

</style>

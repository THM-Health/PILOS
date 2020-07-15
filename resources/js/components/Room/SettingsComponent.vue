<template>
  <div>

          <form>
            <div class="row">
              <div class="col-lg-12 mb-3" >
                <b-button @click="save()" variant="success"><b-spinner v-if="saving" small></b-spinner><b-icon-check2-circle v-else></b-icon-check2-circle> Einstellungen speichern</b-button>
              </div>

              <!-- General settings tab -->
              <div class="col-lg-3 col-sm-12">
                <h5>Allgemein</h5>
                <div class="form-group">
                  <label for="inputPassword4">Typ</label>
                  <div class="input-group mb-3">
                    <b-form-select v-model.number="settings.roomType" :options="roomTypeSelect"></b-form-select>
                  </div>
                </div>
                <!-- Room name -->
                <b-form-group label="Raumname">
                  <b-input-group>
                    <b-form-input  v-model="settings.name"></b-form-input>
                  </b-input-group>
                </b-form-group>
                <!-- Welcome message -->
                <b-form-group label="Begrüßungsnachricht">
                  <b-input-group>
                    <b-form-textarea
                      :state="welcomeMessageValidLength"
                      placeholder="-- keine -- "
                      rows="3"
                      v-model="settings.welcome"
                    ></b-form-textarea>
                  </b-input-group>
                  <small class="text-muted">
                    Anzahl Zeichen:
                    {{ charactersLeftWelcomeMessage }}</small>
                </b-form-group>

                <!-- Max duration -->
                <b-form-group label="Max. Dauer">
                  <b-input-group>
                    <b-form-input
                      min="1"
                      placeholder="-- keine --"
                      type="number"
                      v-model.number="settings.duration"
                    ></b-form-input>
                    <b-input-group-append>
                      <b-input-group-text>min.</b-input-group-text>
                      <b-button
                        @click="settings.duration = null"
                        variant="outline-secondary"
                      ><i class="fas fa-trash"></i
                      ></b-button>
                    </b-input-group-append>
                  </b-input-group>
                </b-form-group>
              </div>
              <!-- Security settings tab -->
              <div class="col-lg-3 col-sm-12">
                <h5>Sicherheit</h5>
                <!-- Access code -->
                <b-form-group label="Zugangscode">
                  <b-input-group>
                    <b-input-group-prepend>
                      <b-button
                        v-on:click="genAccessCode"
                        variant="outline-secondary"
                      ><i class="fas fa-dice"></i
                      ></b-button>
                    </b-input-group-prepend>
                    <b-form-input
                      id="settings-accessCode"
                      placeholder="ungeschützt"
                      readonly
                      type="number"
                      v-model.number="settings.accessCode"
                    ></b-form-input>
                    <b-input-group-append>
                      <b-button
                        @click="settings.accessCode = null"
                        variant="outline-secondary"
                      ><i class="fas fa-trash"></i
                      ></b-button>
                    </b-input-group-append>
                  </b-input-group>
                  <small class="text-muted">
                    Zugangsbeschränkung für den Beitritt und die
                    Mitgliedschaft in einem Raum.
                  </small>
                </b-form-group>
                <b-form-group>
                  <b-form-checkbox v-model="settings.allowSubscription" switch>
                    Neue Mitglieder akzeptieren
                  </b-form-checkbox>
                </b-form-group>
                <b-form-group label="Sicheitsstufe">
                  <b-form-radio
                    name="setting-securityLevel"
                    v-model.number="settings.securityLevel"
                    value="0"
                  >Öffentlich<br /><small class="text-muted"
                  >Jeder mit dem Link kann beitreten</small
                  ></b-form-radio
                  >
                  <b-form-radio
                    name="setting-securityLevel"
                    v-model.number="settings.securityLevel"
                    value="1"
                  >Intern<br /><small class="text-muted"
                  >Alle angemeldeten Nutzer</small
                  ></b-form-radio
                  >
                  <b-form-radio
                    name="setting-securityLevel"
                    v-model.number="settings.securityLevel"
                    value="2"
                  >Privat<br /><small class="text-muted"
                  >Nur Mitglieder</small
                  ></b-form-radio
                  >
                </b-form-group>
              </div>
              <div class="col-lg-3 col-sm-12">
                <h5>Teilnehmer</h5>
                  <!-- Max amount of participants -->
                  <b-form-group label="Max. Anzahl">
                    <b-input-group>
                      <b-form-input
                        min="1"
                        placeholder="-- keine --"
                        type="number"
                        v-model.number="settings.maxParticipants"
                      ></b-form-input>
                      <b-input-group-append>
                        <b-button
                          @click="settings.maxParticipants = null"
                          variant="outline-secondary"
                        ><i class="fas fa-trash"></i
                        ></b-button>
                      </b-input-group-append>
                    </b-input-group>
                  </b-form-group>
                  <b-form-group>
                    <template v-slot:label>
                      Standardrolle<br><small>(für angemeldete Nutzer)</small>
                    </template>
                    <b-form-radio
                      name="setting-defaultRole"
                      v-model.number="settings.defaultRole"
                      value="1">
                      Teilnehmer
                    </b-form-radio>
                    <b-form-radio
                      name="setting-defaultRole"
                      v-model.number="settings.defaultRole"
                      value="2">
                      Moderator
                    </b-form-radio>
                  </b-form-group>
                <b-form-group label="Warteraum">
                  <b-form-radio
                    name="setting-lobby"
                    v-model.number="settings.lobby"
                    value="0">
                    Deaktiviert
                  </b-form-radio>
                  <b-form-radio
                    name="setting-lobby"
                    v-model.number="settings.lobby"
                    value="1">
                    Aktiviert
                  </b-form-radio>
                  <b-form-radio
                    name="setting-lobby"
                    v-model.number="settings.lobby"
                    value="2">
                    Nur für Gäste aktiviert
                  </b-form-radio>
                </b-form-group>
              </div>
              <div class="col-lg-3 col-sm-12">
                <h5>Berechtigungen</h5>
                <b-form-checkbox v-model="settings.everyoneCanStart" switch>
                  Jeder Teilnehmer kann das Meeting starten
                </b-form-checkbox>
                <b-form-checkbox v-model="settings.muteOnStart" switch>
                  Mikrofon bei Beitritt stummschalten
                </b-form-checkbox>
                <hr>
                <h5>Einschränkungen</h5>
                <b-form-group>
                  <b-form-checkbox v-model="settings.lockSettingsLockOnJoin" switch>
                    Einschränkungen aktivieren
                  </b-form-checkbox>
                  <b-form-checkbox v-model="settings.lockSettingsDisableCam" switch>
                    Kamera deaktivieren
                  </b-form-checkbox>
                  <b-form-checkbox v-model="settings.webcamsOnlyForModerator" switch>
                    Nur Moderatoren sehen Kamera
                  </b-form-checkbox>
                  <b-form-checkbox v-model="settings.lockSettingsDisableMic" switch>
                    Mikrofon deaktivieren
                  </b-form-checkbox>
                  <b-form-checkbox v-model="settings.lockSettingsDisablePublicChat" switch>
                    Öffentlichen Chat deaktivieren
                  </b-form-checkbox>
                  <b-form-checkbox v-model="settings.lockSettingsDisablePrivateChat" switch>
                    Privaten Chat deaktivieren
                  </b-form-checkbox>
                  <b-form-checkbox v-model="settings.lockSettingsDisableNote" switch>
                    Geteile Notizen bearbeiten
                  </b-form-checkbox>
                  <b-form-checkbox v-model="settings.lockSettingsHideUserList" switch>
                    Teilnehmerliste verbergen
                  </b-form-checkbox>
                </b-form-group>
              </div>
            </div>
          </form>

  </div>
</template>


<script>
  import Base from "../../api/base";

  export default {
    props: {
      room: Object,
      roomtypes: [
        { value: "a", text: "Vorlesung" },
        { value: "b", text: "Meeting" },
        { value: "d", text: "Prüfung" },
        { value: "d", text: "Übung" },
      ],
    },
    data() {
      return {
        settings: Object,
        saving : false,
        welcomeMessageLimit: 500,
      };
    },
    methods: {
      genAccessCode: function (event) {
        this.settings.accessCode =
          Math.floor(Math.random() * (999999999 - 111111112)) + 111111111;
      },
      save() {
        this.saving = true;
        console.log(this.settings);

        Base.call('rooms/' + this.room.id + '/settings', {
          method: 'put',
          data: this.settings
        }).then(response => {
          this.settings = response.data.data;
          this.saving = false;
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
    },
    computed: {

      roomTypeSelect(){
        if(this.settings.roomTypes) {
          return this.settings.roomTypes.map(roomtype => {
            var entry = {};
            entry['value'] = roomtype.id;
            entry['text'] = roomtype.description;
            return entry;
          });
        }

      },

      charactersLeftWelcomeMessage() {
        var char = this.settings.welcome
          ? this.settings.welcome.length
          : 0;
        return char + " / " + this.welcomeMessageLimit;
      },
      welcomeMessageValidLength() {
        return this.settings.welcome
          ? this.settings.welcome.length <= this.welcomeMessageLimit
            ? null
            : false
          : null;
      },

    },
    created() {
      var url = 'rooms/' + this.room.id+"/settings"
      Base.call(url).then(response => {
        this.settings = response.data.data
      }).catch((error) => {
        if (error.response) {
          if (error.response.status === 401 && error.response.data.message == 'invalid_code') {
            this.accessCodeValid = false
            this.accessCode = null
            this.reload()
          }

          if (error.response.status === 403) {
            this.room = null
            this.accessCode = null
          }

          console.log(error.response.data)
          console.log(error.response.status)
          console.log(error.response.headers)
        } else if (error.request) {
          /*
             * The request was made but no response was received, `error.request`
             * is an instance of XMLHttpRequest in the browser and an instance
             * of http.ClientRequest in Node.js
             */
          console.log(error.request)
        }
      });
    },

  };
</script>
<style scoped></style>

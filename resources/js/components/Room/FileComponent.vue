<template>
  <div>
    <b-form-file
      placeholder="Wähle eine Datei aus, oder ziehe sie hier hin..."
      v-on:change="uploadFile($event)"
      v-model="fileUpload"
      v-bind:multiple="false"
    ></b-form-file>

    <b-table :fields="filefields" v-if="files" :items="files.files" hover>
      <template v-slot:cell(actions)="data">
        <b-button-group class="float-right">
          <b-button variant="danger"
          ><i class="fas fa-trash"></i
          ></b-button>
          <b-button variant="dark"
          ><i class="fas fa-eye"></i
          ></b-button>
        </b-button-group>
      </template>
      <template v-slot:cell(download)="data">
        <b-form-checkbox
          size="lg"
          switch
          v-model="data.item.download"
        ></b-form-checkbox>
      </template>
      <template v-slot:cell(useinmeeting)="data">
        <b-form-checkbox
          size="lg"
          switch
          v-model="data.item.useinmeeting"
        ></b-form-checkbox>
      </template>
      <template v-slot:cell(default)="data">
        <b-form-radio
          size="lg"
          name="default"
          :value="data.item.id"
          v-model="files.default"
        ></b-form-radio>
      </template>
    </b-table>

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
        fileUpload: null,
        file: null,
        filefields: [
          {
            key: "filename",
            label: "Dateiname",
            sortable: true,
          },
          {
            key: "uploaded",
            label: "Hochgeladen am",
            sortable: true,
          },
          {
            key: "download",
            label: "Herunterladen",
            sortable: true,
          },
          {
            key: "useinmeeting",
            label: "In Meeting nutzen",
            sortable: true,
          },
          {
            key: "default",
            label: "Standard",
            sortable: true,
          },
          {
            key: "actions",
            label: "Aktion",
          },
        ],
        files: [],
      }
    },
    methods: {
      uploadFile: function(event){
        let formData = new FormData();
        formData.append('file', event.target.files[0]);
        Base.call('rooms/' + this.room.id + '/files', {
          method: 'post',
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          data: formData
        }).then(() => {
          this.fileUpload = null;
          this.reload();
        }).catch((error) => {
          if (error.response) {
            console.log(error.response.data)
            console.log(error.response.status)
            console.log(error.response.headers)
          } else if (error.request) {
            console.log(error.request)
          }
        });

      },
      reload: function () {
        var url = 'rooms/' + this.room.id+"/files"
        Base.call(url).then(response => {
          this.files = response.data.data
        }).catch((error) => {
          if (error.response) {
            console.log(error.response.data)
            console.log(error.response.status)
            console.log(error.response.headers)
          } else if (error.request) {

            console.log(error.request)
          }
        });
      },

    },
    created() {
      this.reload();
    },
  }
</script>

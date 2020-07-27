<template>
  <div>
    <div class="row mb-3">
      <div class="col-8">
        <!-- Upload new file -->
        <b-form-file
          :placeholder="$t('rooms.files.selectordrag')"
          v-on:change="uploadFile($event)"
          v-model="fileUpload"
          v-bind:multiple="false"
        >
        </b-form-file>
      </div>
      <div class="col-4">
        <!-- Reload file list -->
        <b-button class="float-right" variant="dark" @click="reload">
            <i class="fas fa-sync"></i>
          </b-button>
      </div>
    </div>

    <!-- Display files -->
    <b-table
      :fields="filefields"
      v-if="files"
      :busy="isBusy"
      :items="files.files"
      hover
      show-empty
    >
      <!-- Show message on empty file list -->
      <template v-slot:empty="scope">
        <i>{{ $t('rooms.files.nodata') }}</i>
      </template>

      <!-- Show spinner while table is loading -->
      <template v-slot:table-busy>
        <div class="text-center my-2">
          <b-spinner class="align-middle"></b-spinner>
        </div>
      </template>

      <!-- Render action column -->
      <template v-slot:cell(actions)="data">
        <b-button-group class="float-right">
          <!-- Delete file -->
          <b-button
            variant="danger"
            @click="deleteFile(data.item,data.index)"
          >
            <i class="fas fa-trash"></i>
          </b-button>
          <!-- View file -->
          <b-button
            variant="dark"
            :href="data.item.url"
            target="_blank"
          >
            <i class="fas fa-eye"></i>
          </b-button>
        </b-button-group>
      </template>

      <!-- Checkbox if file should be downloadable by all room participants -->
      <template v-slot:cell(download)="data">
        <b-form-checkbox
          size="lg"
          switch
          @change="changeSettings(data.item,'download',$event)"
          v-model="data.item.download"
        ></b-form-checkbox>
      </template>

      <!--
      Checkbox if file should be send to the api on the next meeting start,
      setting can't be changed manually if the file is the default presentation
      -->
      <template v-slot:cell(useinmeeting)="data">
        <b-form-checkbox
          size="lg"
          switch
          @change="changeSettings(data.item,'useinmeeting',$event)"
          :disabled="files.default === data.item.id"
          v-model="data.item.useinmeeting"
        ></b-form-checkbox>
      </template>

      <!-- Checkbox if the file should be default/first in the next api call to start a meeting -->
      <template v-slot:cell(default)="data">
        <b-form-radio
          size="lg"
          name="default"
          :value="data.item.id"
          @change="changeDefault"
          v-model="files.default"
        ></b-form-radio>
      </template>
    </b-table>
  </div>
</template>
<script>
import Base from '../../api/base';

export default {
  props: {
    room: Object
  },
  data () {
    return {
      // file list fetching from api
      isBusy: false,
      // file upload model
      fileUpload: null,
      // file list from api
      files: []
    };
  },
  methods: {
    /**
     * Delete file
     * @param file file object
     * @param index index in the table
     */
    deleteFile: function (file, index) {
      // show delete confirmation modal
      this.$bvModal.msgBoxConfirm(this.$t('rooms.files.modals.delete.confirm', { filename: file.filename }), {
        title: this.$t('rooms.files.modals.delete.title'),
        okVariant: 'danger',
        okTitle: this.$t('rooms.files.modals.delete.yes'),
        cancelTitle: this.$t('rooms.files.modals.delete.no'),
        footerClass: 'p-2',
        centered: true
      })
        .then(function (value) {
          // Delete confirmed
          if (value === true) {
            // Remove file from room with api call
            Base.call('rooms/' + this.room.id + '/files/' + file.id, {
              method: 'delete'
            }).then(response => {
              // delete successfull, remove file from table and reload data from api
              // (fallback and display files that have been uploaded in the meantime)
              this.files.files.splice(index, 1);
              this.reload();
            }).catch((error) => {
              // TODO Error handling
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
     * Handle file upload event on file select or drag'n'drop
     * @param event
     */
    uploadFile: function (event) {
      // Build form data
      const formData = new FormData();
      formData.append('file', event.target.files[0]);

      // Send new file to api
      Base.call('rooms/' + this.room.id + '/files', {
        method: 'post',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        data: formData
      }).then(() => {
        // File upload complete, reload file list
        this.fileUpload = null;
        this.reload();
      }).catch((error) => {
        // File upload failed
        // TODO Error handling
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
     * Reload file list
     */
    reload: function () {
      // Change table to busy state
      this.isBusy = true;
      // Fetch file list
      Base.call('rooms/' + this.room.id + '/files')
        .then(response => {
          // Fetch successful
          this.files = response.data.data;
          this.isBusy = false;
        })
        .catch((error) => {
          // Fetch failed
          this.isBusy = false;
          // TODO Error handling
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
     * Handle change of the default presentation
     * @param checked id of the new default presentation
     */
    changeDefault: function (checked) {
      // Find the new default presentation file
      var file = this.files.files.find(file => file.id === checked);
      // Set useinmeetings parameter true, as the default presentation
      // can only be the default if it is also used in the next meeting
      file.useinmeeting = true;
      // Update room files settings with the new default presentation
      Base.call('rooms/' + this.room.id + '/files', {
        method: 'put',
        data: { defaultFile: file.id }
      }).then(() => {
      }).catch((error) => {
        // Change failed
        // TODO Error handling
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
     * Change a setting for a files
     * @param file effected file
     * @param setting setting name
     * @param value new value
     */
    changeSettings: function (file, setting, value) {
      // Update value for the setting and the effected file
      Base.call('rooms/' + this.room.id + '/files/' + file.id, {
        method: 'put',
        data: { [setting]: value }
      }).then(() => {
      }).catch((error) => {
        // Change failed
        // TODO Error handling
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
    // file table lables for columns
    filefields () {
      return [
        {
          key: 'filename',
          label: this.$t('rooms.files.filename'),
          sortable: true
        },
        {
          key: 'uploaded',
          label: this.$t('rooms.files.uploadedAt'),
          sortable: true
        },
        {
          key: 'download',
          label: this.$t('rooms.files.downloadable'),
          sortable: true
        },
        {
          key: 'useinmeeting',
          label: this.$t('rooms.files.useInNextMeeting'),
          sortable: true
        },
        {
          key: 'default',
          label: this.$t('rooms.files.default'),
          sortable: true
        },
        {
          key: 'actions',
          label: this.$t('rooms.files.actions')
        }
      ];
    }

  },
  created () {
    this.reload();
  }
};
</script>

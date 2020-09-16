<template>
  <div>
    <b-overlay :show="isBusy" >
    <h4>{{ $t('rooms.files.title') }}</h4>

    <b-alert show >
      <strong>Nutzungsbedingungen</strong><br>
      Dateien, welche hier zum Download angeboten werden, sind ausschließlich für das persönliche Studium. Die Dateien, oder Inhalte aus diesen, dürfen nicht geteilt oder weiterverbreitet werden.
      <hr>
      <b-form-checkbox
        v-model="downloadAgreement"
        value="accepted"
        unchecked-value="not_accepted"
      >
        Ich akzeptiere die Nutzungsbedingungen
      </b-form-checkbox>
    </b-alert>


    <!-- Table with all files -->
    <b-table :fields="filefields" :items="files" hover>
      <!-- Render action column-->
      <template v-slot:cell(actions)="data">
        <!-- Download file button -->
        <b-button
          class="float-right"
          variant="dark"
          :disabled="downloadAgreement==='not_accepted'"
          @click="downloadFile(data.item,data.index)"
          target="_blank"
        >
          <i class="fas fa-eye"></i>
        </b-button>
      </template>
    </b-table>
    </b-overlay>
  </div>
</template>
<script>

import Base from "../../api/base";

export default {

  data () {
    return {
      // file list fetching from api
      isBusy: false,
      loadingDownload: null,
      // file list from api
      files: [],
    };
  },


  props: {
    roomId: String,
    accessCode: String,
  },

  computed: {
    /**
     * Filestable heading
     */
    filefields() {
      return [
        {
          key: 'filename',
          label: this.$t('rooms.files.filename'),
          sortable: true
        },
        {
          key: 'actions',
          label: this.$t('rooms.files.actions')
        }
      ];
    },
  },

  created () {
    this.reload();
  },

  methods: {

    /**
     * Reload file list
     */
    reload: function () {
      // Change table to busy state
      this.isBusy = true;
      // Fetch file list
      Base.call('rooms/' + this.roomId + '/files')
        .then(response => {
          // Fetch successful
          this.files = response.data.data;
        }).catch((error) => {
        Base.error(error, this.$root);
      }).finally(() => {
        this.isBusy = false;
      });
    },

    /**
     * Request file download url
     * @param file file object
     * @param index integer index in filelist
     * @return string url
     */
    downloadFile: function (file, index) {
      this.loadingDownload = true;
      // Update value for the setting and the effected file
      const config = this.accessCode == null ? {} : { headers: { 'Access-Code': this.accessCode } };
      Base.call('rooms/' + this.roomId + '/files/' + file.id, config)
        .then(response => {
          if (response.data.url !== undefined) {
            window.open(response.data.url, '_blank');
          }
        }).catch((error) => {
        if (error.response) {
          // Access code invalid
          if (error.response.status === 401 && error.response.data.message === 'invalid_code') {
            this.$emit('invalidCode');
            return;
          }

          // Forbidden, require access code
          if (error.response.status === 403 && error.response.data.message === 'require_code') {
            this.$emit('invalidCode');
            return;
          }

          // Forbidden, not allowed to download this file
          if (error.response.status === 403) {
            // Show error message
            this.flashMessage.error(this.$t('rooms.flash.fileForbidden'));
            // Remove file from list
            this.files.splice(index, 1);
            return;
          }

          // File gone
          if (error.response.status === 404) {
            // Show error message
            this.flashMessage.error(this.$t('rooms.flash.fileGone'));
            // Remove file from list
            this.files.splice(index, 1);
            return;
          }
        }
        Base.error(error, this.$root);
      }).finally(() => {
        // Disable loading indicator
        this.loadingDownload = false;
      });
    },


  }

}

</script>

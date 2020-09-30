<template>
  <div>
    <b-overlay :show="isBusy" >
      <h4 v-if="showTitle">{{ $t('rooms.files.title') }}</h4>

      <b-alert show v-if="requireAgreement" >
        <strong>{{ $t('rooms.files.termsOfUse.title')}}</strong><br>
        {{ $t('rooms.files.termsOfUse.content')}}
        <hr>
        <b-form-checkbox
          v-model="downloadAgreement"
          value="accepted"
          unchecked-value="not_accepted"
        >
          {{ $t('rooms.files.termsOfUse.accept')}}
        </b-form-checkbox>
      </b-alert>

    <div class="row mb-3">
      <div class="col-10">

        <can method="manageFiles" :policy="{ modelName: 'Room', isOwner: isOwner }">

          <!-- Upload new file -->
          <b-form-file
            :disabled="isBusy"
            :state="fieldState('file')"
            :placeholder="$t('rooms.files.selectordrag')"
            v-on:change="uploadFile($event)"
            v-model="fileUpload"
            v-bind:multiple="false"
          >
          </b-form-file>

          <b-form-invalid-feedback>
            {{ fieldError('file') }}
          </b-form-invalid-feedback>

          <b-form-text>{{ $t('rooms.files.formats',{formats: files.file_mimes}) }}<br>{{ $t('rooms.files.size',{size: files.file_size}) }}</b-form-text>

        </can>
      </div>
      <div class="col-2">
        <!-- Reload file list -->
        <b-button
          v-if="!hideReload"
          class="float-right"
          variant="dark"
          :disabled="isBusy"
          @click="reload"
          :title="$t('app.reload')"
          v-b-tooltip.hover
        >
          <i class="fas fa-sync"></i>
        </b-button>
      </div>
    </div>
      <!-- Display files -->
      <b-table
        :current-page="currentPage"
        :per-page="settings('pagination_page_size')"
        :fields="filefields"
        sort-by="uploaded"
        :sort-desc="true"
        v-if="files.files"
        :items="files.files"
        hover
        stacked="md"
        show-empty
      >
        <!-- Show message on empty file list -->
        <template v-slot:empty>
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
          <b-button-group class="float-md-right">
            <can method="manageFiles" :policy="{ modelName: 'Room', isOwner: isOwner }">
              <!-- Delete file -->
              <b-button
                variant="danger"
                :disabled="loadingDownload===data.id"
                @click="deleteFile(data.item)"
              >
                <i class="fas fa-trash"></i>
              </b-button>
            </can>
            <!-- View file -->
            <b-button
              variant="dark"
              @click="downloadFile(data.item)"
              :disabled="disableDownload"
              target="_blank"
            >
              <b-spinner small v-if="loadingDownload===data.item.id"></b-spinner> <i v-else class="fas fa-eye"></i>
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
            v-model="data.item.useinmeeting"
          ></b-form-checkbox>
        </template>

        <!-- Checkbox if the file should be default/first in the next api call to start a meeting -->
        <template v-slot:cell(default)="data">
          <b-form-radio
            size="lg"
            name="default"
            :value="data.item.id"
            :disabled="data.item.useinmeeting !== true"
            @change="changeSettings(data.item,'default',$event)"
            v-model="files.default"
          ></b-form-radio>
        </template>

      </b-table>
      <b-row v-if="files.files">
        <b-col cols="12" class="my-1">
          <b-pagination
            v-if="files.files.length>settings('pagination_page_size')"
            v-model="currentPage"
            :total-rows="files.files.length"
            :per-page="settings('pagination_page_size')"
          ></b-pagination>
        </b-col>
      </b-row>
    </b-overlay>
  </div>
</template>
<script>
import Base from '../../api/base';
import Can from '../Permissions/Can';
import PermissionService from '../../services/PermissionService';
import { mapGetters } from 'vuex';

export default {

  components: {
    Can
  },
  props: {
    roomId: String,
    isOwner: Boolean,
    accessCode: {
      type: String,
      required: false
    },
    showTitle: {
      type: Boolean,
      default: false,
      required: false
    },
    hideReload: {
      type: Boolean,
      default: false,
      required: false
    },
    requireAgreement: {
      type: Boolean,
      default: false,
      required: false
    },
    emitErrors: {
      type: Boolean,
      default: false,
      required: false
    }
  },
  data () {
    return {
      // file list fetching from api
      isBusy: false,
      loadingDownload: null,
      // file upload model
      fileUpload: null,
      // file list from api
      files: [],
      errors: {},
      downloadAgreement: false,
      currentPage: 1
    };
  },
  methods: {

    fieldState (field) {
      return this.errors[field] === undefined ? null : false;
    },
    fieldError (field) {
      if (this.fieldState(field) !== false) { return ''; }
      return this.errors[field].join('<br>');
    },

    /**
     * Remove given file from the list
     */
    removeFile: function (file) {
      this.files.files.splice(this.files.files.findIndex(item => item.id === file.id), 1);
    },

    /**
     * Request file download url
     * @param file file object
     * @return string url
     */
    downloadFile: function (file) {
      this.loadingDownload = file.id;
      // Update value for the setting and the effected file
      Base.call('rooms/' + this.roomId + '/files/' + file.id)
        .then(response => {
          if (response.data.url !== undefined) {
            window.open(response.data.url, '_blank');
          }
        }).catch((error) => {
          if (error.response) {
            // Access code invalid
            if (error.response.status === 401 && error.response.data.message === 'invalid_code') {
              return this.$emit('error', error);
            }

            // Forbidden, require access code
            if (error.response.status === 403 && error.response.data.message === 'require_code') {
              return this.$emit('error', error);
            }

            // Forbidden, not allowed to download this file
            if (error.response.status === 403) {
              // Show error message
              this.flashMessage.error(this.$t('rooms.flash.fileForbidden'));
              this.removeFile(file);
              return;
            }

            // File gone
            if (error.response.status === 404) {
              // Show error message
              this.flashMessage.error(this.$t('rooms.flash.fileGone'));
              // Remove file from list
              this.removeFile(file);
              return;
            }
          }
          Base.error(error, this.$root);
        }).finally(() => {
          this.loadingDownload = null;
        });
    },

    /**
     * Delete file
     * @param file file object
     */
    deleteFile: function (file) {
      // show delete confirmation modal
      this.$bvModal.msgBoxConfirm(this.$t('rooms.files.modals.delete.confirm', { filename: file.filename }), {
        title: this.$t('rooms.files.modals.delete.title'),
        okVariant: 'danger',
        okTitle: this.$t('app.yes'),
        cancelTitle: this.$t('app.no'),
        footerClass: 'p-2',
        centered: true
      })
        .then(function (value) {
          // Delete confirmed
          if (value === true) {
            // Change table to busy state
            this.isBusy = true;
            // Remove file from room with api call
            Base.call('rooms/' + this.roomId + '/files/' + file.id, {
              method: 'delete'
            }).then(response => {
              // Fetch successful
              this.files = response.data.data;
            }).catch((error) => {
              if (error.response.status === 404) {
                // Show error message
                this.flashMessage.error(this.$t('rooms.flash.fileGone'));
                // Remove file from list
                this.removeFile(file);
                return;
              }
              Base.error(error, this.$root);
            }).finally(() => {
              this.isBusy = false;
            });
          }
        }.bind(this));
    },
    /**
     * Handle file upload event on file select or drag'n'drop
     * @param event
     */
    uploadFile: function (event) {
      // Change table to busy state
      this.isBusy = true;
      // Reset errors
      this.errors = {};

      // Build form data
      const formData = new FormData();
      formData.append('file', event.target.files[0]);

      // Send new file to api
      Base.call('rooms/' + this.roomId + '/files', {
        method: 'post',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        data: formData
      }).then(response => {
        // Fetch successful
        this.files = response.data.data;
      }).catch((error) => {
        if (error.response) {
          if (error.response.status === 413) {
            this.errors = { file: [this.$t('rooms.files.validation.tooLarge')] };
            return;
          }
          if (error.response.status === 422) {
            this.errors = error.response.data.errors;
            return;
          }
        }
        Base.error(error, this.$root);
      }).finally(() => {
        // Clear file field and busy status
        this.isBusy = false;
        this.fileUpload = null;
      });
    },
    /**
     * Reload file list
     */
    reload: function () {
      // Change table to busy state
      this.isBusy = true;
      // Fetch file list

      const config = this.accessCode == null ? {} : { headers: { 'Access-Code': this.accessCode } };

      Base.call('rooms/' + this.roomId + '/files', config)
        .then(response => {
          // Fetch successful
          this.files = response.data.data;
        }).catch((error) => {
          if (this.emitErrors) { this.$emit('error', error); } else { Base.error(error, this.$root); }
        }).finally(() => {
          this.isBusy = false;
        });
    },
    /**
     * Change a setting for a file
     * @param file effected file
     * @param setting setting name
     * @param value new value
     */
    changeSettings: function (file, setting, value) {
      // Change table to busy state
      this.isBusy = true;

      if (setting === 'default') {
        value = true;
      }

      // Update value for the setting and the effected file
      Base.call('rooms/' + this.roomId + '/files/' + file.id, {
        method: 'put',
        data: { [setting]: value }
      }).then(response => {
        // Fetch successful
        this.files = response.data.data;
      }).catch((error) => {
        if (error.response.status === 404) {
          // Show error message
          this.flashMessage.error(this.$t('rooms.flash.fileGone'));
          // Remove file from list
          this.removeFile(file);
          return;
        }
        Base.error(error, this.$root);
      }).finally(() => {
        this.isBusy = false;
      });
    }
  },
  computed: {

    ...mapGetters({
      settings: 'session/settings'
    }),

    // compute if the download buttons should be disabled
    disableDownload () {
      return this.loadingDownload !== null || (this.requireAgreement && this.downloadAgreement !== 'accepted');
    },

    // file table labels for columns
    filefields () {
      if (PermissionService.cannot('manageFiles', { modelName: 'Room', isOwner: this.isOwner })) {
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
            key: 'actions',
            label: this.$t('rooms.files.actions')
          }
        ];
      }

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

<style>
  .custom-file-label {
    overflow: hidden;
  }
</style>

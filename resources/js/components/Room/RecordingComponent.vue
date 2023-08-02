<template>
  <div>
    <b-overlay :show="isBusy" >
      <h4 v-if="showTitle">{{ $t('rooms.recordings.title') }}</h4>
      <div class="row mb-3">
      <div class="col-12">
        <!-- Reload recordings list -->
        <b-button
          v-if="!hideReload"
          class="float-right"
          variant="secondary"
          :disabled="isBusy"
          @click="reload"
          :title="$t('app.reload')"
          v-b-tooltip.hover
        >
          <i class="fa-solid fa-sync"></i>
        </b-button>
      </div>
    </div>
      <!-- Display recordings -->
      <b-table
        :current-page="currentPage"
        :per-page="getSetting('pagination_page_size')"
        :fields="recordingFields"
        sort-by="start"
        :sort-desc="true"
        v-if="recordings"
        :items="recordings"
        hover
        stacked="lg"
        show-empty
      >
        <!-- Show message on empty file list -->
        <template v-slot:empty>
          <i>{{ $t('rooms.recordings.nodata') }}</i>
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
            <can method="manageSettings" :policy="room">
              <!-- edit recording -->
              <b-button
                variant="secondary"
                :disabled="loadingDownload===data.item.id"
                @click="showEditRecordingModal(data.item)"
                :title="$t('rooms.recordings.editRecording')"
                v-b-tooltip.hover
                v-tooltip-hide-click
              >
                <i class="fa-solid fa-pen-to-square"></i>
              </b-button>

              <!-- Delete recording -->
              <b-button
                variant="danger"
                :disabled="loadingDownload===data.item.id"
                @click="showDeleteRecordingModal(data.item)"
                :title="$t('rooms.recordings.deleteRecording')"
                v-b-tooltip.hover
                v-tooltip-hide-click
              >
                <i class="fa-solid fa-trash"></i>
              </b-button>

            </can>
          </b-button-group>
        </template>

        <template v-slot:cell(formats)="data">
          <b-button-group>
            <!-- View file -->
            <b-button
              v-for="format in data.item.formats" :key="format.id"
              :variant="format.disabled ? 'outline-secondary' :'secondary'"
              @click="downloadFormat(format.id)"
              :disabled="disableDownload"
              target="_blank"
              :title="$t('rooms.recordings.formatTypes.'+format.format)"
              v-b-tooltip.hover
              v-tooltip-hide-click
            >
              <b-spinner small v-if="loadingDownload===format.id"></b-spinner>
              <div v-else>
                <i v-if="format.format === 'podcast'" class="fa-solid fa-volume-high"></i>
                <i v-if="format.format === 'screenshare'" class="fa-solid fa-display"></i>
                <i v-if="format.format === 'presentation'" class="fa-solid fa-person-chalkboard"></i>
                <i v-if="format.format === 'notes'" class="fa-solid fa-file-lines"></i>
              </div>
            </b-button>
          </b-button-group>
        </template>

        <template v-slot:cell(start)="data">
         {{ $d(new Date(data.item.start), 'datetimeLong') }}
        </template>

        <template v-slot:cell(end)="data">
          {{ $d(new Date(data.item.end), 'datetimeLong') }}
        </template>

        <!-- render user role -->
        <template v-slot:cell(access)="data">
          <b-badge v-if="data.value === 0" variant="info">{{ $t('rooms.recordings.accessTypes.everyone') }}</b-badge>
          <b-badge v-if="data.value === 1" variant="success" >{{ $t('rooms.recordings.accessTypes.participant') }}</b-badge>
          <b-badge v-if="data.value === 2" variant="danger">{{ $t('rooms.recordings.accessTypes.moderator') }}</b-badge>
          <b-badge v-if="data.value === 3" variant="dark">{{ $t('rooms.recordings.accessTypes.owner') }}</b-badge>
        </template>

      </b-table>
      <b-row v-if="recordings">
        <b-col cols="12" class="my-1">
          <b-pagination
            v-if="recordings.length>getSetting('pagination_page_size')"
            v-model="currentPage"
            :total-rows="recordings.length"
            :per-page="getSetting('pagination_page_size')"
          ></b-pagination>
        </b-col>
      </b-row>
    </b-overlay>

    <!-- remove recording modal -->
    <b-modal
      :busy="isLoadingAction"
      :static='modalStatic'
      ok-variant="danger"
      cancel-variant="secondary"
      :cancel-title="$t('app.no')"
      @ok="confirmDeleteRecording"
      ref="delete-recording-modal"
      :no-close-on-esc="isLoadingAction"
      :no-close-on-backdrop="isLoadingAction"
      :hide-header-close="isLoadingAction"
    >
      <template v-slot:modal-title>
        {{ $t('rooms.recordings.modals.delete.title') }}
      </template>
      <template v-slot:modal-ok>
        <b-spinner small v-if="isLoadingAction"></b-spinner>  {{ $t('app.yes') }}
      </template>
      <span v-if="deleteRecording">
        {{ $t('rooms.recordings.modals.delete.confirm', { filename: deleteRecording.filename }) }}
      </span>
    </b-modal>

    <!-- edit recording modal -->
    <b-modal
      :static='modalStatic'
      :busy="isLoadingAction"
      ok-variant="success"
      :cancel-title="$t('rooms.recordings.modals.edit.cancel')"
      @ok="saveEditRecording"
      ref="edit-recording-modal"
      :no-close-on-esc="isLoadingAction"
      :no-close-on-backdrop="isLoadingAction"
      :hide-header-close="isLoadingAction"
    >
      <template v-slot:modal-title>
        <h5 v-if="editRecording">{{ $t('rooms.recordings.modals.edit.title') }}
        <br><small>{{ $d(new Date(editRecording.start),'datetimeShort') }} <raw-text>-</raw-text> {{ $d(new Date(editRecording.end),'datetimeShort') }}</small>
        </h5>
      </template>
      <template v-slot:modal-ok>
        <b-spinner small v-if="isLoadingAction"></b-spinner>  {{ $t('rooms.recordings.modals.edit.save') }}
      </template>
      <div v-if="editRecording">
        <b-form-group
          :label="$t('rooms.recordings.description')"
          label-for='description'
          :state='fieldState("description")'
        >
          <b-form-input
            id='description'
            type='text'
            v-model='editRecording.description'
            :state='fieldState("description")'
            :disabled="isLoadingAction"
          ></b-form-input>
          <template slot='invalid-feedback'><div v-html="fieldError('description')"></div></template>
        </b-form-group>

        <b-form-group :label="$t('rooms.recordings.availableFormats')">

          <b-form-checkbox
            v-for="format in editRecording.formats"
            v-model="format.disabled"
            :key="format.id"
            :value="false"
            switch
            :unchecked-value="true"
          >
            {{ $t('rooms.recordings.formatTypes.'+format.format)}}
          </b-form-checkbox>
        </b-form-group>

        <b-form-group :label="$t('rooms.recordings.access')">
          <b-form-radio v-model.number="editRecording.access" name="access" value="0">
            <b-badge variant="info">{{ $t('rooms.recordings.accessTypes.everyone') }}</b-badge>
          </b-form-radio>
          <b-form-radio v-model.number="editRecording.access" name="access" value="1">
            <b-badge variant="success">{{ $t('rooms.recordings.accessTypes.participant') }}</b-badge>
          </b-form-radio>
          <b-form-radio v-model.number="editRecording.access" name="access" value="2">
            <b-badge variant="danger">{{ $t('rooms.recordings.accessTypes.moderator') }}</b-badge>
          </b-form-radio>
          <b-form-radio v-model.number="editRecording.access" name="access" value="3">
            <b-badge variant="dark">{{ $t('rooms.recordings.accessTypes.owner') }}</b-badge>
          </b-form-radio>
        </b-form-group>
      </div>
    </b-modal>

  </div>
</template>
<script>
import Base from '../../api/base';
import Can from '../Permissions/Can.vue';
import PermissionService from '../../services/PermissionService';
import FieldErrors from '../../mixins/FieldErrors';
import env from './../../env.js';
import _ from 'lodash';
import RawText from '../RawText.vue';
import { mapState } from 'pinia';
import { useSettingsStore } from '../../stores/settings';

export default {

  components: {
    Can, RawText
  },
  mixins: [FieldErrors],
  props: {
    room: Object,

    accessCode: {
      type: String,
      required: false
    },
    token: {
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
    emitErrors: {
      type: Boolean,
      default: false,
      required: false
    },
    modalStatic: {
      type: Boolean,
      default: false,
      required: false
    }
  },
  data () {
    return {
      // file list fetching from api
      isBusy: false,
      deleteRecording: null, // recording to be deleted
      isLoadingAction: false, // data is processed
      loadingDownload: null,
      // file list from api
      recordings: [],
      editRecording: null, // recording to be edited
      errors: {},
      currentPage: 1
    };
  },
  methods: {
    /**
     * show modal to edit recording
     * @param recording recording object
     */
    showEditRecordingModal: function (recording) {
      // Clone object to edit properties without displaying the changes in realtime in the members list
      this.editRecording = _.cloneDeep(recording);
      this.$refs['edit-recording-modal'].show();
    },

    /**
     * save recording changes
     */
    saveEditRecording: function (bvModalEvt) {
      // prevent modal from closing
      bvModalEvt.preventDefault();

      this.isLoadingAction = true;

      Base.call('rooms/' + this.room.id + '/recordings/' + this.editRecording.id, {
        method: 'put',
        data: { description: this.editRecording.description, access: this.editRecording.access, formats: this.editRecording.formats }
      }).then(response => {
        // recording changes saved
        this.reload();
      }).catch((error) => {
        if (error.response.status === env.HTTP_GONE) {
          this.removeRecording(this.editRecording);
        }
        Base.error(error, this.$root);
      }).finally(() => {
        this.$refs['edit-recording-modal'].hide();
        this.isLoadingAction = false;
      });
    },

    /**
     * Remove given file from the list
     */
    removeRecording: function (recording) {
      this.recordings.splice(this.recordings.findIndex(item => item.id === recording.id), 1);
    },

    /**
     * Request a recording format download url
     * @param formatId id of the recording format
     * @return string url
     */
    downloadFormat: function (formatId) {
      this.loadingDownload = formatId;
      // Update value for the setting and the effected file
      const config = {};

      if (this.token) {
        config.headers = { Token: this.token };
      } else if (this.accessCode != null) {
        config.headers = { 'Access-Code': this.accessCode };
      }

      const url = 'rooms/' + this.room.id + '/recordings/' + formatId;

      // Load data
      Base.call(url, config)
        .then(response => {
          if (response.data.url !== undefined) {
            window.open(response.data.url, '_blank');
          }
        }).catch((error) => {
          if (error.response) {
            // Access code invalid
            if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_code') {
              return this.$emit('error', error);
            }

            // Room token is invalid
            if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_token') {
              return this.$emit('error', error);
            }

            // Forbidden, require access code
            if (error.response.status === env.HTTP_FORBIDDEN && error.response.data.message === 'require_code') {
              return this.$emit('error', error);
            }

            // Forbidden, not allowed to download this file
            if (error.response.status === env.HTTP_FORBIDDEN) {
              // Show error message
              this.flashMessage.error(this.$t('rooms.flash.fileForbidden'));
              // this.removeRecording(formatId);
              return;
            }

            // File gone
            if (error.response.status === env.HTTP_NOT_FOUND) {
              // Show error message
              this.flashMessage.error(this.$t('rooms.flash.fileGone'));
              // Remove file from list
              // this.removeRecording(file);
              return;
            }
          }
          Base.error(error, this.$root);
        }).finally(() => {
          this.loadingDownload = null;
        });
    },

    /**
     * show modal to remove a recording
     * @param recording recording to be deleted
     */
    showDeleteRecordingModal: function (recording) {
      this.deleteRecording = recording;
      this.$refs['delete-recording-modal'].show();
    },

    /**
     * Delete file
     */
    confirmDeleteRecording: function (bvModalEvt) {
      // prevent modal from closing
      bvModalEvt.preventDefault();
      this.isLoadingAction = true;
      // Remove recording from room with api call
      Base.call('rooms/' + this.room.id + '/recordings/' + this.deleteRecording.id, {
        method: 'delete'
      }).then(response => {
        // Fetch successful
        this.recordings = response.data.data;
      }).catch((error) => {
        if (error.response.status === env.HTTP_NOT_FOUND) {
          // Show error message
          this.flashMessage.error(this.$t('rooms.flash.recordingGone'));
          // Remove recording from list
          this.removeRecording(this.deleteRecording);
          return;
        }
        Base.error(error, this.$root);
      }).finally(() => {
        this.$refs['delete-recording-modal'].hide();
        this.isLoadingAction = false;
      });
    },

    /**
     * Reload recording list
     */
    reload: function () {
      // Change table to busy state
      this.isBusy = true;
      // Fetch file list
      const config = {};

      if (this.token) {
        config.headers = { Token: this.token };
      } else if (this.accessCode != null) {
        config.headers = { 'Access-Code': this.accessCode };
      }

      Base.call('rooms/' + this.room.id + '/recordings', config)
        .then(response => {
          // Fetch successful
          this.recordings = response.data.data;
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
      Base.call('rooms/' + this.room.id + '/recordings/' + file.id, {
        method: 'put',
        data: { [setting]: value }
      }).then(response => {
        // Fetch successful
        this.files = response.data.data;
      }).catch((error) => {
        if (error.response.status === env.HTTP_NOT_FOUND) {
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

    ...mapState(useSettingsStore, ['getSetting']),

    // compute if the download buttons should be disabled
    disableDownload () {
      return this.loadingDownload !== null;
    },

    // file table labels for columns
    recordingFields () {
      if (PermissionService.cannot('manageSettings', this.room)) {
        return [
          {
            key: 'start',
            label: this.$t('rooms.recordings.start'),
            sortable: true
          },
          {
            key: 'end',
            label: this.$t('rooms.recordings.end'),
            sortable: true
          },
          {
            key: 'description',
            label: this.$t('rooms.recordings.description'),
            sortable: false
          },
          {
            key: 'formats',
            label: this.$t('rooms.recordings.formats'),
            sortable: false
          }
        ];
      }

      return [
        {
          key: 'start',
          label: this.$t('rooms.recordings.start'),
          sortable: true
        },
        {
          key: 'end',
          label: this.$t('rooms.recordings.end'),
          sortable: true
        },
        {
          key: 'description',
          label: this.$t('rooms.recordings.description'),
          sortable: false
        },
        {
          key: 'formats',
          label: this.$t('rooms.recordings.formats'),
          sortable: false
        },
        {
          key: 'access',
          label: this.$t('rooms.recordings.access'),
          sortable: false
        },
        {
          key: 'actions',
          label: this.$t('rooms.recordings.actions')
        }
      ];
    }

  },
  created () {
    this.reload();
  }
};
</script>

<template>
  <div>
    <can method="manageSettings" :policy="room">
      <div class="row mb-3">
      <div class="col-12">
        <b-button-group class="float-lg-right">
          <b-button
            variant="secondary"
            v-if="!editorOpen"
            :disabled="isBusy"
            ref="edit"
            @click="edit"
          >
            <i class="fa-solid fa-pen-square"></i> {{ $t('rooms.description.edit') }}
          </b-button>
          <b-button
            variant="success"
            v-if="editorOpen"
            :disabled="isBusy"
            ref="save-edit"
            @click="save"
          >
            <i class="fa-solid fa-save"></i> {{ $t('rooms.description.save') }}
          </b-button>
          <b-button
            variant="dark"
            v-if="editorOpen"
            :disabled="isBusy"
            ref="cancel-edit"
            @click="cancel"
          >
            <i class="fa-solid fa-times"></i> {{ $t('rooms.description.cancel') }}
          </b-button>
        </b-button-group>
      </div>
    </div>
    </can>
    <b-overlay :show="isBusy" >
      <template #overlay>
        <b-spinner></b-spinner>
      </template>
      <div
        v-if="!editorOpen"
      >
        <room-description-html-component v-if="room.description !== null" :html="sanitizedHtml"></room-description-html-component>
        <div v-else>
          <i>{{ $t('rooms.description.missing') }}</i>
        </div>
      </div>

      <div v-else>
        <tip-tap-editor
          v-bind:class="{'is-invalid': fieldState('description') === false}"
          :disabled="isBusy"
          v-model="newContent">
        </tip-tap-editor>
        <b-form-invalid-feedback :state="fieldState('description')" v-html="fieldError('description')"></b-form-invalid-feedback>
    </div>

  </b-overlay>
  </div>
</template>

<script>
import TipTapEditor from '../TipTap/TipTapEditor.vue';
import Can from '../Permissions/Can.vue';
import Base from '../../api/base';
import env from '../../env';
import createDOMPurify from 'dompurify';
import RoomDescriptionHtmlComponent from './RoomDescriptionHtmlComponent.vue';
import FieldErrors from '../../mixins/FieldErrors';

export default {
  name: 'RoomDescriptionComponent',
  mixins: [FieldErrors],
  props: {
    room: Object
  },
  components: {
    TipTapEditor,
    Can,
    RoomDescriptionHtmlComponent
  },

  data () {
    return {
      editorOpen: false,
      newContent: '',
      isBusy: false,
      domPurify: null
    };
  },
  computed: {
    sanitizedHtml () {
      return this.domPurify.sanitize(this.room.description, { USE_PROFILES: { html: true } });
    }
  },
  created () {
    // Create a new DOMPurify instance
    this.domPurify = createDOMPurify();

    // Add a hook to move all links hrefs to data-href and add data-target to safeLink
    // this will be used to open a modal before opening the link
    this.domPurify.addHook('afterSanitizeAttributes', function (node) {
      // set non-HTML/MathML links to xlink:show=new
      if (node.hasAttribute('href')) {
        node.setAttribute('data-href', node.getAttribute('href'));
        node.setAttribute('data-target', 'safeLink');
        node.setAttribute('href', '');
      }
    });
  },

  methods: {

    /**
     * Open the editor
     */
    edit () {
      this.editorOpen = true;
      this.newContent = this.room.description;
    },

    /**
     * Save the new description and close the editor
     */
    save () {
      // Set saving indicator
      this.isBusy = true;

      const data = {
        description: this.newContent
      };

      // Send new settings to the server
      Base.call('rooms/' + this.room.id + '/description', {
        method: 'put',
        data
      }).then(() => {
        // Description successfully saved
        // inform parent component about changed description
        this.$emit('settingsChanged');
        this.errors = {};
        this.editorOpen = false;
      }).catch((error) => {
        // Description couldn't be saved
        if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          this.errors = error.response.data.errors;
          return;
        }
        Base.error(error, this.$root);
      }).finally(() => {
        // Disable saving indicator
        this.isBusy = false;
      });
    },

    /**
     * Cancel editing / close the editor
     */
    cancel () {
      this.editorOpen = false;
    }
  }
};
</script>

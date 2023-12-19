<template>
        <b-button
          variant="outline-dark"
          :title="$t('rooms.description.tooltips.link')"
          v-b-tooltip.hover
          v-tooltip-hide-click
          @click="openModal"
          :pressed="editor.isActive('link')"
        >
            <i class="fa-solid fa-link"></i>
        </b-button>
        <b-modal
        :static='modalStatic'
        id="link-modal"
        :title="newLink ? $t('rooms.description.modals.link.new') : $t('rooms.description.modals.link.edit')"
        >

        <b-form-group
          :label="$t('rooms.description.modals.link.url')"
          :invalid-feedback="$t('rooms.description.modals.link.invalid_url')"
          :state="urlState"
        >
          <b-form-input
            v-model="link"
            trim
            type="text"
            :state="urlState"
          ></b-form-input>
      </b-form-group>

      <template #modal-footer="{ cancel }">
            <div class="w-100 d-flex justify-content-between">
              <div>
                <b-button variant="danger" class="mr-2" @click="deleteLink" v-if="!newLink" >{{ $t('app.delete') }}</b-button>
              </div>
              <div>
                <b-button variant="secondary" @click="cancel">{{ $t('app.cancel') }}</b-button>
                <b-button variant="success" class="ml-2" @click="save" :disabled="urlState !== true">{{ $t('app.save') }}</b-button>
              </div>
          </div>
          </template>
        </b-modal>
</template>
<script>

export default {

  data () {
    return {
      link: null,
      newLink: true
    };
  },
  props: {
    editor: Object,
    modalStatic: {
      type: Boolean,
      default: false,
      required: false
    }
  },
  computed: {
    /**
     * Check if the link url is valid
     */
    urlState () {
      // Only return state if link is not empty
      if (this.link === null || this.link === '') {
        return null;
      }
      // regex checks if url starts with http://, https:// or mailto:
      const regex = /^(https|http|mailto):\/\//;
      return regex.exec(this.link) !== null;
    }
  },
  methods: {
    /**
     * Open modal to edit or create a link
     */
    openModal () {
      if (this.editor.isActive('link')) {
        this.link = this.editor.getAttributes('link').href;
        this.newLink = false;
      } else {
        this.link = null;
        this.newLink = true;
      }
      this.$bvModal.show('link-modal');
    },

    /**
     * Delete link and close modal
     */
    deleteLink () {
      this.editor.chain().focus().unsetLink().run();
      this.$bvModal.hide('link-modal');
    },

    /**
     * Save changes to the link and close modal
     */
    save () {
      this.editor.chain().focus().setLink({ href: this.link }).run();
      this.$bvModal.hide('link-modal');
    }
  }
};
</script>

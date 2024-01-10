<template>
  <b-button
    v-b-tooltip.hover
    v-tooltip-hide-click
    variant="outline-dark"
    :title="$t('rooms.description.tooltips.image')"
    :pressed="editor.isActive('image')"
    @click="openModal"
  >
    <i class="fa-solid fa-image" />
  </b-button>
  <b-modal
    id="image-modal"
    :static="modalStatic"
    :title="newImage ? $t('rooms.description.modals.image.new') : $t('rooms.description.modals.image.edit')"
  >
    <b-form-group
      :label="$t('rooms.description.modals.image.src')"
      label-for="src"
      :invalid-feedback="$t('rooms.description.modals.image.invalid_src')"
      :state="srcState"
    >
      <b-form-input
        id="src"
        v-model="src"
        type="text"
        :state="srcState"
        trim
      />
    </b-form-group>

    <b-form-group
      :label="$t('rooms.description.modals.image.width')"
      label-for="width"
      :description="$t('rooms.description.modals.image.width_description')"
    >
      <b-form-input
        id="width"
        v-model="width"
        type="text"
      />
    </b-form-group>

    <b-form-group
      :label="$t('rooms.description.modals.image.alt')"
      label-for="alt"
    >
      <b-form-input
        id="alt"
        v-model="alt"
        type="text"
      />
    </b-form-group>

    <template #modal-footer="{ cancel }">
      <div class="w-100 d-flex justify-content-between">
        <div>
          <b-button
            v-if="!newImage"
            variant="danger"
            class="mr-2"
            @click="deleteImage"
          >
            {{ $t('app.delete') }}
          </b-button>
        </div>
        <div>
          <b-button
            variant="secondary"
            @click="cancel"
          >
            {{ $t('app.cancel') }}
          </b-button>
          <b-button
            variant="success"
            class="ml-2"
            :disabled="srcState !== true"
            @click="save"
          >
            {{ $t('app.save') }}
          </b-button>
        </div>
      </div>
    </template>
  </b-modal>
</template>
<script>

export default {
  props: {
    editor: Object,
    modalStatic: {
      type: Boolean,
      default: false,
      required: false
    }
  },
  data () {
    return {
      src: null,
      width: null,
      alt: null,
      newImage: true
    };
  },
  computed: {
    srcState () {
      if (this.src === null || this.src === '') {
        return null;
      }
      const regex = /^(https|http):\/\//;
      return regex.exec(this.src) !== null;
    }
  },
  methods: {

    /**
     * Delete the image and close modal
     */
    deleteImage () {
      this.editor.commands.deleteSelection();
      this.$bvModal.hide('image-modal');
    },

    /**
     * Open modal and fill fields with current image attributes if image is selected
     */
    openModal () {
      if (this.editor.isActive('image')) {
        this.src = this.editor.getAttributes('image').src;
        this.width = this.editor.getAttributes('image').width;
        this.alt = this.editor.getAttributes('image').alt;
        this.newImage = false;
      } else {
        this.src = null;
        this.width = null;
        this.alt = null;
        this.newImage = true;
      }
      this.$bvModal.show('image-modal');
    },

    /**
     * Save changes to the image and close modal
     */
    save () {
      this.editor.chain().insertContent({
        type: 'image',
        attrs: {
          src: this.src,
          width: this.width,
          alt: this.alt
        }
      }).run();
      this.$bvModal.hide('image-modal');
    }
  }
};
</script>

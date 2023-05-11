<template>
    <div v-frag>
        <b-button variant="outline-dark" @click="openModal" :pressed="editor.isActive('image')">
            <i class="fa-solid fa-image"></i>
        </b-button>
        <b-modal
        id="image-modal"
        title="BootstrapVue"
        :cancel-title="$t('app.cancel')"
        cancel-variant="dark"
        :ok-title="$t('app.save')"
        ok-variant="success"
        @ok="save"
        >

          <b-form-group
            label="URL"
            label-for="url"
          >
            <b-form-input
              id="url"
              v-model="src"
              type="text"
            />
          </b-form-group>

          <b-form-group
            label="Width"
            label-for="width"
            description="Width in px or %"
          >
            <b-form-input
              id="width"
              v-model="width"
              type="text"
            />
          </b-form-group>

          <b-form-group
            label="Alternative text"
            label-for="alt"
          >
            <b-form-input
              id="alt"
              v-model="alt"
              type="text"
            />
          </b-form-group>

          <b-button variant="danger" @click="src = null">{{ $t('app.delete') }}</b-button>
    
        </b-modal>
    </div>
</template>
<script>

import frag from 'vue-frag';
export default {
  directives: {
    frag
  },
  data () {
    return {
      src: null,
      width: null,
      alt: null
    };
  },
  props: [
    'editor'
  ],
  methods: {
    openModal () {
      if (this.editor.isActive('image')) {
        this.src = this.editor.getAttributes('image').src;
        this.width = this.editor.getAttributes('image').width;
        this.alt = this.editor.getAttributes('image').alt;
      } else {
        this.src = null;
        this.width = null;
        this.alt = null;
      }
      this.$bvModal.show('image-modal');
    },
    save () {
      if (this.src === null) {
        this.editor.commands.deleteNode('image');
      } else {
        this.editor.chain().insertContent({
        type: 'image',
        attrs: {
          src: this.src,
          width: this.width,
          alt: this.alt
        }
      }).run();
      }
      this.$bvModal.hide('image-modal');
    }
  }
};
</script>

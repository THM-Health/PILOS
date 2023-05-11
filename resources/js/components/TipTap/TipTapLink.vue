<template>
    <div v-frag>
        <b-button variant="outline-dark" @click="openModal" :pressed="editor.isActive('link')">
            <i class="fa-solid fa-link"></i>
        </b-button>
        <b-modal
        id="link-modal"
        title="BootstrapVue"
        :cancel-title="$t('app.cancel')"
        cancel-variant="dark"
        :ok-title="$t('app.save')"
        ok-variant="success"
        @ok="save"
        >
            <b-input-group class="mt-3">
                <b-form-input v-model="link" trim></b-form-input>
                <template #append v-if="link">
                    <b-button variant="danger" @click="link = null">{{ $t('app.delete') }}</b-button>
                </template>
            </b-input-group>
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
      link: null
    };
  },
  props: [
    'editor'
  ],
  methods: {
    openModal () {
      if (this.editor.isActive('link')) {
        this.link = this.editor.getAttributes('link').href;
      } else {
        this.link = null;
      }
      this.$bvModal.show('link-modal');
    },
    save () {
      if (this.link === null) {
        this.editor.chain().focus().unsetLink().run();
      } else {
        this.editor.chain().focus().setLink({ href: this.link }).run();
      }
      this.$bvModal.hide('link-modal');
    }
  }
};
</script>

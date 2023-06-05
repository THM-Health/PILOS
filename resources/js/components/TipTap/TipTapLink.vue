<template>
    <div v-frag>
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
        id="link-modal"
        :title="newLink ? $t('rooms.description.modals.link.new') : $t('rooms.description.modals.link.edit')"
        :cancel-title="$t('app.cancel')"
        cancel-variant="dark"
        :ok-title="$t('app.save')"
        ok-variant="success"
        @ok="save"
        :ok-disabled="urlState !== true"
        >

        <b-form-group
          :label="$t('rooms.description.modals.link.url')"
        >
          <b-form-input
            v-model="link"
            trim
            type="text"
            :state="urlState"
          ></b-form-input>
          <b-form-invalid-feedback id="input-live-feedback">
            {{ $t('rooms.description.modals.link.invalid_url') }}
          </b-form-invalid-feedback>
      </b-form-group>
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
      link: null,
      newLink: true
    };
  },
  props: [
    'editor'
  ],
  computed: {
    urlState () {
      if (this.link === null || this.link === '') {
        return null;
      }
      const regex = /^(https|http|mailto):\/\//;
      return regex.exec(this.link) !== null;
    }
  },
  methods: {
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

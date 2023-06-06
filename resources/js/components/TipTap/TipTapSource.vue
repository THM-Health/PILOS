<template>
    <div v-frag>
        <b-button
        variant="outline-dark"
        @click="openModal"
        :title="$t('rooms.description.tooltips.source_code')"
          v-b-tooltip.hover
          v-tooltip-hide-click

        >
            <i class="fa-solid fa-code"></i>
        </b-button>
        <b-modal
        id="code-modal"
        :title="$t('rooms.description.modals.source_code.title')"
        :cancel-title="$t('app.cancel')"
        cancel-variant="dark"
        :ok-title="$t('app.save')"
        ok-variant="success"
        @ok="save"
        >
          <b-form-textarea v-model="source"></b-form-textarea>
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
      source: null
    };
  },
  props: [
    'editor'
  ],
  methods: {
    openModal () {
      this.source = this.editor.getHTML();
      this.$bvModal.show('code-modal');
    },
    save () {
      this.editor.commands.setContent(this.source, true);
      this.$bvModal.hide('code-modal');
    }
  }
};
</script>

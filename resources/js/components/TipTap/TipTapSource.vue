<template>
  <div v-frag>
    <b-button
      v-b-tooltip.hover
      v-tooltip-hide-click
      variant="outline-dark"
      :title="$t('rooms.description.tooltips.source_code')"
      @click="openModal"
    >
      <i class="fa-solid fa-code" />
    </b-button>
    <b-modal
      id="code-modal"
      :static="modalStatic"
      size="xl"
      :title="$t('rooms.description.modals.source_code.title')"
      :cancel-title="$t('app.cancel')"
      cancel-variant="dark"
      :ok-title="$t('app.save')"
      ok-variant="success"
      @ok="save"
    >
      <b-form-textarea
        v-model="source"
        rows="5"
      />
    </b-modal>
  </div>
</template>
<script>

import frag from 'vue-frag';
export default {
  directives: {
    frag
  },
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
      source: null
    };
  },
  methods: {
    /**
     * Open modal with current source code
     */
    openModal () {
      this.source = this.editor.getHTML();
      this.$bvModal.show('code-modal');
    },

    /**
     * Apply changes to the editor
     */
    save () {
      this.editor.commands.setContent(this.source, true);
      this.$bvModal.hide('code-modal');
    }
  }
};
</script>

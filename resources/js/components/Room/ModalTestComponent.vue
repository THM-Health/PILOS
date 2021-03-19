<template>
  <div>
    <b-modal
      ref="test"
      id="test-modal"
      :static='true'
      @change="change"
      @cancel="cancel"
      @close="close"
      @hidden="hidden"
      @hide="hide"
      @ok="ok"
      @show="show"
      @shown="shown"
    >
    </b-modal>

  </div>
</template>
<script>
export default {
  methods: {
    showModal: function () {
      console.log('open modal');
      this.$refs['test'].show();
    },

    hideModal: function () {
      console.log('hide modal');
      this.$refs['test'].hide();
    },

    change: function () {
      console.log('change');
    },
    cancel: function () {
      console.log('cancel');
    },
    close: function () {
      console.log('close');
    },
    hidden: function () {
      console.log('hidden');
    },
    hide: function () {
      console.log('hide');
    },
    ok: function () {
      console.log('ok');
    },
    show: function () {
      console.log('show');
    },
    shown: function () {
      console.log('shown');
    }
  }
};
</script>

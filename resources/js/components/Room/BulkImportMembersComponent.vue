<template>
  <div v-frag>
    <!-- Add existing user from database -->
    <b-button
      variant="success"
      ref="add-member"
      @click="showModal"
    >
      <i class="fa-solid fa-user-plus"></i> {{ $t('rooms.members.bulk_add_user') }}
    </b-button>

    <!-- add new user modal -->
    <b-modal
      hide-footer
      ref="bulk-import-modal"
      id="bulk-import-modal"
    >
      <template v-slot:modal-title>
        {{ $t('rooms.members.bulk_add_user') }}
      </template>

      <div v-if="step == 0">
        <h3>{{$t('rooms.members.modals.add.description_bulk')}}</h3>
        <i>{{$t('rooms.members.modals.add.information_bulk')}}</i>

        <b-form-textarea
          v-model="rawList"
          :placeholder="$t('rooms.members.modals.add.textarea.description_bulk')"
          rows = "8"
        ></b-form-textarea>

        <b-button @click="step=1" variant="success">{{$t('app.next')}}</b-button>
      </div>
      <div v-if="step == 1">
        <h3>{{$t('rooms.members.modals.add.preview_bulk')}}</h3>
        <b-list-group class="preview">
          <b-list-group-item
            v-for="user in users"
          >{{ user }}</b-list-group-item>
        </b-list-group>
        <b-button @click="step=0" variant="dark">{{$t('app.back')}}</b-button>
        <b-button @click="importUsers" variant="success">{{$t('rooms.members.modals.add.add')}}</b-button>
      </div>

    </b-modal>
  </div>
</template>

<script>

import _ from 'lodash';
import frag from "vue-frag";
import Base from "../../api/base";
export default {
  name: "BulkImportMembersComponent",

  props: {
    roomId: {
      type: String,
      required: true
    }
  },

  directives: {
    frag
  },

  data() {
    return {
      step: 0,
      rawList: '',
    }
  },
  computed: {
    users() {
      return _.uniq(this.rawList.split(/\r?\n/));
    },
  },
  methods: {
    showModal() {
      this.step = 0;
      this.rawList = '';
      this.$bvModal.show('bulk-import-modal');
    },
    importUsers() {

      Base.call('rooms/' + this.roomId + '/member', {
        method: 'post',
        data: { users: this.users }
      }).then(response => {

      });

    }
  }
}
</script>

<style scoped>

.preview {
  max-height: 200px;
  overflow-y: scroll;
}
</style>

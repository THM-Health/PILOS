<template>
    <div>
      <h3>
        {{ viewOnly ? $t('settings.users.view', { firstname: user.firstname, lastname: user.lastname }) : $t('settings.users.edit', { firstname: user.firstname, lastname: user.lastname }) }}
      </h3>
      <hr>

      <view-edit-component :id="id" :modal-static="false" :view-only="viewOnly" @updateUser="updateUser"></view-edit-component>
  </div>
</template>

<script>
import ViewEditComponent from '../../../components/User/ViewEditComponent';

export default {
  components: {
    ViewEditComponent
  },
  data () {
    return {
      user: {
        firstname: null,
        lastname: null
      }
    };
  },
  methods: {
    updateUser (user) {
      this.user = user;
    }
  },
  props: {
    id: {
      type: Number,
      required: true
    },
    viewOnly: {
      type: Boolean,
      required: true
    }
  }
};

</script>

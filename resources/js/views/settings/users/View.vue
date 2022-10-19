<template>
    <div>
      <h3>
        {{ viewOnly ? $t('settings.users.view', { firstname: firstname, lastname: lastname }) : $t('settings.users.edit', { firstname: firstname, lastname: lastname }) }}
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
      user: null
    };
  },
  computed: {
    firstname: function () {
      return this.user?.firstname;
    },
    lastname: function () {
      return this.user?.lastname;
    }
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

<template>
  <div>
    <h3>
      {{ viewOnly ? $t('settings.users.view', { firstname: firstname, lastname: lastname }) : $t('settings.users.edit', { firstname: firstname, lastname: lastname }) }}
    </h3>
    <hr>

    <view-edit-component
      :id="id"
      :modal-static="false"
      :view-only="viewOnly"
      @update-user="updateUser"
    />
  </div>
</template>

<script>
import ViewEditComponent from '@/components/User/ViewEditComponent.vue';

export default {
  components: {
    ViewEditComponent
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
  },
  data () {
    return {
      user: null
    };
  },
  computed: {
    firstname: function () {
      return this.user ? this.user.firstname : '';
    },
    lastname: function () {
      return this.user ? this.user.lastname : '';
    }
  },
  methods: {
    updateUser (user) {
      this.user = user;
    }
  }
};
</script>

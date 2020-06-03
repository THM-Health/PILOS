<template>
  <div>
    <h5>{{title}}</h5>
    <b-form @submit.prevent="submit">
      <b-form-group :label="usernameLabel" label-for="username">
        <b-form-input
          id="username"
          v-model="username"
          type="text"
          required
          :placeholder="usernameLabel"
          :state="errors !== null && errors.username && errors.username.length > 0 ? false: null"
        ></b-form-input>

        <b-form-invalid-feedback v-if="errors !== null && errors.username.length > 0">
          <template v-for="error in errors.username">
            {{ error }}
          </template>
        </b-form-invalid-feedback>
      </b-form-group>

      <b-form-group :label="passwordLabel" label-for="password">
        <b-form-input
          id="password"
          v-model="password"
          type="password"
          required
          :placeholder="passwordLabel"
          :state="errors !== null && errors.password && errors.password.length > 0 ? false: null"
        ></b-form-input>

        <b-form-invalid-feedback v-if="errors !== null && errors.password && errors.password.length > 0">
          <template v-for="error in errors.password">
            {{ error }}
          </template>
        </b-form-invalid-feedback>
      </b-form-group>

      <b-button type="submit" variant="success" :disabled="loading">
        <b-spinner v-if="loading" small></b-spinner>
        {{submitLabel}}
      </b-button>
    </b-form>
  </div>
</template>

<script>
export default {
  props: [
    'errors',
    'id',
    'loading',
    'passwordLabel',
    'submitLabel',
    'title',
    'usernameLabel',
  ],
  data() {
    return {
      username: '',
      password: ''
    }
  },
  methods: {
    submit() {
      this.$emit('submit', {
        id: this.id,
        data: {
          username: this.username,
          password: this.password
        }
      });
    }
  }
}
</script>

<style scoped>

</style>

<template>
  <div>
    <h5>{{title}}</h5>
    <b-form @submit.prevent="submit">
      <b-form-group :label="emailLabel" label-for="email">
        <b-form-input
          id="email"
          v-model="email"
          type="email"
          required
          :placeholder="emailLabel"
          :state="errors !== null && errors.email && errors.email.length > 0 ? false: null"
        ></b-form-input>

        <b-form-invalid-feedback v-if="errors !== null && errors.email.length > 0">
          <template v-for="error in errors.email">
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

      <b-button type="submit" variant="success" :disabled="loading" block >
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
    'emailLabel'
  ],
  data () {
    return {
      email: '',
      password: ''
    }
  },
  methods: {
    submit () {
      this.$emit('submit', {
        id: this.id,
        data: {
          email: this.email,
          password: this.password
        }
      })
    }
  }
}
</script>

<style scoped>

</style>

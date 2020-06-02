<template>
    <div class="container">
        <!-- login form -->
        <div class="row mt-4">
            <div class="col-6 offset-3">
                <form action="#" @submit.prevent="handleLogin">
                    <h3>Sign in for secrets</h3>
                    <div class="form-row">
                        <input type="text" name="username" class="form-control" v-model="username" placeholder="Username">
                    </div>
                    <div class="form-row">
                        <input type="password" name="password" class="form-control" v-model="password" placeholder="Password">
                    </div>
                    <div class="form-row">
                        <button type="submit" class="btn btn-primary">Sign In</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script>
export default {
  data () {
    return {
      username: null,
      password: null
    }
  },
  methods: {
    handleLogin () {
      // send axios request to the login route
      // TODO implement
      // axios.get('/sanctum/csrf-cookie').then(response => {
      //   axios.post('api/v1/auth/login', this.formData).then(response => {
      //     console.log('User signed in!')
      //   }).catch(error => console.log(error)) // credentials didn't match
      // })
    }
  }
}
</script>

<style scoped>

</style>

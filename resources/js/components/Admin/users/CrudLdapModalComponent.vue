<template>
  <div>
    <!-- CRUD LDAP form modal -->
    <b-modal
      :id="modalId"
      :title="modalTitle"
      :static="true"
      header-class="modal-title"
      header-text-variant="success"
      centered
      hide-footer
      @shown="shownModal"
      @hidden="resetModal"
    >
      <b-container fluid>
        <b-form @submit.stop.prevent="onSubmit()">
          <div id="ldap-delete" v-if="modalType === 'delete'">
            <p>{{ $t('settings.users.modal.deleteContent') }}</p>
          </div>
          <div id="ldap-create-update" v-if="modalType === 'update'">
            <b-form-group id="crud-ldap-mail"
                          label-for="crud-ldap-input-mail">
              <b-input-group>
                <b-input-group-prepend v-b-tooltip.hover :title="$t('settings.users.fields.mail')">
                  <b-input-group-text class="bg-success text-white">
                    <b-icon icon="envelope"></b-icon>
                  </b-input-group-text>
                </b-input-group-prepend>
                <b-form-input id="crud-ldap-input-mail"
                              v-model="mail"
                              :placeholder="$t('settings.users.fields.mail')"
                              required
                              :disabled="isBusy"
                              :state="errors !== null && errors.mail && errors.mail.length > 0 ? false: null">
                </b-form-input>
              </b-input-group>
              <b-form-invalid-feedback
                :state="errors !== null && errors.mail && errors.mail.length > 0 ? false: null">
                <template v-for="error in errors.mail">
                  {{ error }}
                </template>
              </b-form-invalid-feedback>
            </b-form-group>
            <b-form-group id="crud-ldap-givenname"
                          label-for="crud-ldap-input-givenname">
              <b-input-group>
                <b-input-group-prepend v-b-tooltip.hover :title="$t('settings.users.fields.givenname')">
                  <b-input-group-text class="bg-success text-white">
                    <b-icon icon="person-circle"></b-icon>
                  </b-input-group-text>
                </b-input-group-prepend>
                <b-form-input id="crud-ldap-input-givenname"
                              v-model="givenname"
                              :placeholder="$t('settings.users.fields.givenname')"
                              required
                              :disabled="isBusy"
                              :state="errors !== null && errors.givenname && errors.givenname.length > 0 ? false: null">
                </b-form-input>
              </b-input-group>
              <b-form-invalid-feedback
                :state="errors !== null && errors.givenname && errors.givenname.length > 0 ? false: null">
                <template v-for="error in errors.givenname">
                  {{ error }}
                </template>
              </b-form-invalid-feedback>
            </b-form-group>
            <b-form-group id="crud-ldap-cn"
                          label-for="crud-ldap-input-cn">
              <b-input-group>
                <b-input-group-prepend v-b-tooltip.hover :title="$t('settings.users.fields.cn')">
                  <b-input-group-text class="bg-success text-white">
                    <b-icon icon="tag"></b-icon>
                  </b-input-group-text>
                </b-input-group-prepend>
                <b-form-input id="crud-ldap-input-cn"
                              v-model="cn"
                              :placeholder="$t('settings.users.fields.cn')"
                              required
                              :disabled="isBusy"
                              :state="errors !== null && errors.cn && errors.cn.length > 0 ? false: null">
                </b-form-input>
              </b-input-group>
              <b-form-invalid-feedback
                :state="errors !== null && errors.cn && errors.cn.length > 0 ? false: null">
                <template v-for="error in errors.cn">
                  {{ error }}
                </template>
              </b-form-invalid-feedback>
            </b-form-group>
            <b-form-group id="crud-ldap-sn"
                          label-for="crud-ldap-input-sn">
              <b-input-group>
                <b-input-group-prepend v-b-tooltip.hover :title="$t('settings.users.fields.sn')">
                  <b-input-group-text class="bg-success text-white">
                    <b-icon icon="tag-fill"></b-icon>
                  </b-input-group-text>
                </b-input-group-prepend>
                <b-form-input id="crud-ldap-input-sn"
                              v-model="sn"
                              :placeholder="$t('settings.users.fields.sn')"
                              required
                              :disabled="isBusy"
                              :state="errors !== null && errors.sn && errors.sn.length > 0 ? false: null">
                </b-form-input>
              </b-input-group>
              <b-form-invalid-feedback
                :state="errors !== null && errors.sn && errors.sn.length > 0 ? false: null">
                <template v-for="error in errors.sn">
                  {{ error }}
                </template>
              </b-form-invalid-feedback>
            </b-form-group>
          </div>

          <b-button
            id="crud-ldap-submit"
            class="mt-3"
            block
            type="submit"
            variant="success"
            :disabled="isBusy">
            {{ $t('settings.users.modal.submit') }}
          </b-button>

        </b-form>
      </b-container>
    </b-modal>
  </div>
</template>

<script>
import Base from '../../../api/base';

export default {
  data () {
    return {
      ldap: null,
      mail: null,
      cn: null,
      givenname: null,
      sn: null,
      isBusy: false,
      errors: []
    };
  },
  props: {
    uid: String,
    modalId: String,
    modalType: { type: String, validator: (val) => ['update', 'delete'].includes(val) }
  },
  methods: {
    onSubmit () {
      (this.modalType === 'update') ? this.updateLdap(this.uid)
        : this.deleteLdap(this.uid);
    },
    getUserLdapData (uid) {
      this.isBusy = true;

      Base.call('ldap/' + uid)
        .then((response) => {
          this.ldap = response.data;
          this.mail = this.ldap.mail[0];
          this.cn = this.ldap.cn[0];
          this.sn = this.ldap.sn[0];
          this.givenname = this.ldap.givenname[0];
        })
        .catch((error) => {
          this.ldap = null;
          this.flashMessage.error(this.$t('settings.users.getLdapFailed'));
          this.$bvModal.hide(this.modalId);
          throw error();
        })
        .finally(() => {
          this.$root.$emit('crud-ldap');
          this.isBusy = false;
        });
    },
    updateLdap (uid) {
      this.isBusy = true;

      Base.call('ldap/' + uid, {
        headers: {
          'content-type': 'application/json'
        },
        method: 'put',
        data: {
          givenname: this.givenname,
          sn: this.sn,
          mail: this.mail,
          cn: this.cn
        }
      }).then(response => {
        this.flashMessage.success(this.$t('settings.users.editLdapSuccess'));

        this.$bvModal.hide(this.modalId);

        this.errors = [];
      }).catch(error => {
        this.errors = error.response.data.errors;

        this.flashMessage.error(this.$t('settings.users.editLdapFailed'));

        throw error;
      }).finally(() => {
        this.$emit('crud-ldap');
        this.isBusy = false;
      });
    },
    deleteLdap (uid) {
      this.isBusy = true;

      Base.call('ldap/' + uid, {
        method: 'delete'
      }).then(response => {
        this.flashMessage.success(this.$t('settings.users.deleteLdapSuccess'));

        this.$bvModal.hide(this.modalId);

        this.errors = [];
      }).catch(error => {
        this.errors = error.response.data.errors;

        this.flashMessage.error(this.$t('settings.users.deleteLdapFailed'));

        throw error;
      }).finally(() => {
        this.$emit('crud-ldap');
        this.$emit('crud-ldap-delete');
        this.isBusy = false;
      });
    },
    resetModal () {
      this.ldap = null;
      this.mail = null;
      this.sn = null;
      this.cn = null;
      this.givenname = null;

      this.errors = [];
    },
    shownModal () {
      this.getUserLdapData(this.uid);
    }
  },
  computed: {
    modalTitle () {
      return (this.modalType === 'update') ? this.$t('settings.users.modal.updateLdap')
        : this.$t('settings.users.modal.deleteLdap');
    }
  }
};
</script>

<style scoped>
</style>

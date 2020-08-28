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
      @hidden="resetModal()"
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
            variant="success">
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
      errors: []
    };
  },
  props: {
    mail: String,
    cn: String,
    givenname: String,
    sn: String,
    guid: String,
    modalId: String,
    modalType: { type: String, validator: (val) => ['update', 'delete'].includes(val) }
  },
  methods: {
    onSubmit () {
      (this.modalType === 'update') ? this.updateLdap(this.guid)
        : this.deleteLdap(this.guid);
    },
    updateLdap (guid) {
      Base.call('ldap/' + guid, {
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
      });
    },
    deleteLdap (guid) {
      Base.call('ldap/' + guid, {
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
      });
    },
    resetModal () {
      this.mail = null;
      this.sn = null;
      this.cn = null;
      this.guid = null;
      this.givenname = null;

      this.errors = [];
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

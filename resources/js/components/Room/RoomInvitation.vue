<template>
  <div class="jumbotron p-4" >

    <div class="d-flex justify-content-between align-items-start">
      <h5 class="flex-shrink-1 text-break">{{ $t('rooms.access_for_participants') }}</h5>
      <b-button
          class="float-right flex-shrink-0"
          :aria-label="$t('rooms.copy_access_for_participants')"
          @click="copyInvitationText"
          v-b-tooltip.hover
          v-tooltip-hide-click
          :title="$t('rooms.copy_access_for_participants')"
          variant="light"
      >
        <i class="fa-solid fa-copy"></i>
      </b-button>

    </div>

    <b-input-group >
      <template #prepend>
        <b-input-group-text class="border-0 pl-0"><i class="fa-solid fa-link" :title="$t('rooms.invitation.link')" v-b-tooltip.hover ></i></b-input-group-text>
      </template>
      <b-form-input id="invitationLink" @focus="$event.target.select()" :aria-label="$t('rooms.invitation.link')" plaintext :value="roomUrl"></b-form-input>
    </b-input-group>
    <b-input-group v-if="accessCode">
      <template #prepend>
        <b-input-group-text class="border-0 pl-0"><i class="fa-solid fa-key" :title="$t('rooms.invitation.code')" v-b-tooltip.hover></i><label class="sr-only" for="invitationAccessCode">{{$t('rooms.invitation.link')}}</label></b-input-group-text>
      </template>
      <b-form-input id="invitationAccessCode" @focus="$event.target.select()" :aria-label="$t('rooms.invitation.code')" plaintext :value="formattedAccessCode"></b-form-input>
    </b-input-group>
  </div>
</template>
<script>
import { mapState } from 'pinia';
import { useSettingsStore } from '../../stores/settings';

export default {
  props: {
    name: {
      type: String,
      required: true
    },
    id: {
      type: String,
      required: true
    },
    accessCode: {
      type: Number,
      required: false
    }
  },
  methods: {
    copyInvitationText () {
      let message = this.$t('rooms.invitation.room', { roomname: this.name, platform: this.getSetting('name') }) + '\n';
      message += this.$t('rooms.invitation.link') + ': ' + this.roomUrl;
      // If room has access code, include access code in the message
      if (this.accessCode) {
        message += '\n' + this.$t('rooms.invitation.code') + ': ' + this.formattedAccessCode;
      }
      navigator.clipboard.writeText(message);
    }
  },
  computed: {
    ...mapState(useSettingsStore, ['getSetting']),

    roomUrl: function () {
      return this.getSetting('base_url') + this.$router.resolve({
        name: 'rooms.view',
        params: { id: this.id }
      }).route.fullPath;
    },

    formattedAccessCode: function () {
      return String(this.accessCode).match(/.{1,3}/g).join('-');
    }
  }
};
</script>

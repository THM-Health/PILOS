<template>
  <div class="jumbotron p-4">
    <div class="d-flex justify-content-between align-items-start">
      <h5 class="flex-shrink-1 text-break">
        {{ $t('rooms.access_for_participants') }}
      </h5>
      <b-button
        v-b-tooltip.hover
        v-tooltip-hide-click
        class="float-right flex-shrink-0"
        :aria-label="$t('rooms.copy_access_for_participants')"
        :title="$t('rooms.copy_access_for_participants')"
        variant="light"
        @click="copyInvitationText"
      >
        <i class="fa-solid fa-copy" />
      </b-button>
    </div>

    <b-input-group>
      <template #prepend>
        <b-input-group-text class="border-0 pl-0">
          <i
            v-b-tooltip.hover
            class="fa-solid fa-link"
            :title="$t('rooms.invitation.link')"
          />
        </b-input-group-text>
      </template>
      <b-form-input
        id="invitationLink"
        :aria-label="$t('rooms.invitation.link')"
        plaintext
        :value="roomUrl"
        @focus="$event.target.select()"
      />
    </b-input-group>
    <b-input-group v-if="room.access_code">
      <template #prepend>
        <b-input-group-text class="border-0 pl-0">
          <i
            v-b-tooltip.hover
            class="fa-solid fa-key"
            :title="$t('rooms.invitation.code')"
          /><label
            class="sr-only"
            for="invitationAccessCode"
          >{{ $t('rooms.invitation.link') }}</label>
        </b-input-group-text>
      </template>
      <b-form-input
        id="invitationAccessCode"
        :aria-label="$t('rooms.invitation.code')"
        plaintext
        :value="formattedAccessCode"
        @focus="$event.target.select()"
      />
    </b-input-group>
  </div>
</template>
<script>
import { mapState } from 'pinia';
import { useSettingsStore } from '@/stores/settings';

export default {
  props: {
    room: {
      type: Object,
      required: true
    }
  },
  methods: {
    copyInvitationText () {
      let message = this.$t('rooms.invitation.room', { roomname: this.room.name, platform: this.getSetting('name') }) + '\n';
      message += this.$t('rooms.invitation.link') + ': ' + this.roomUrl;
      // If room has access code, include access code in the message
      if (this.room.access_code) {
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
        params: { id: this.room.id }
      }).href;
    },

    formattedAccessCode: function () {
      return String(this.room.access_code).match(/.{1,3}/g).join('-');
    }
  }
};
</script>

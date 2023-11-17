<template>
  <div v-frag>
    <!-- If membership is enabled, allow user to become member -->
    <can
      method="becomeMember"
      :policy="room"
    >
      <b-dropdown-item-button
        id="join-membership-button"
        :disabled="loading || disabled"
        @click="joinMembership"
      >
        <div class="d-flex align-items-baseline">
          <i class="fa-solid fa-user" />
          <span>{{ $t('rooms.become_member') }}</span>
        </div>
      </b-dropdown-item-button>
    </can>
    <!-- If user is member, allow user to end the membership -->
    <b-dropdown-item-button
      v-if="room.is_member"
      v-b-modal.leave-membership-modal
      :disabled="loading || disabled"
    >
      <div class="d-flex align-items-baseline">
        <i class="fa-solid fa-user" />
        <span>{{ $t('rooms.end_membership.button') }}</span>
      </div>
    </b-dropdown-item-button>

    <b-modal
      v-if="room.is_member"
      id="leave-membership-modal"
      ref="leave-membership-modal"
      :static="modalStatic"
      :title="$t('rooms.end_membership.title')"
      ok-variant="danger"
      cancel-variant="secondary"
      :ok-title="$t('rooms.end_membership.yes')"
      :cancel-title="$t('rooms.end_membership.no')"
      @ok="leaveMembership"
    >
      {{ $t('rooms.end_membership.message') }}
    </b-modal>
  </div>
</template>
<script>
import Base from '@/api/base';
import frag from 'vue-frag';
import Can from '@/components/Permissions/Can.vue';
import env from '@/env';

export default {
  name: 'RoomMembershipDropdownButton',
  components: {
    Can
  },
  directives: {
    frag
  },
  props: {
    room: {
      type: Object,
      required: true
    },
    accessCode: {
      type: Number,
      required: false
    },
    disabled: {
      type: Boolean,
      default: false,
      required: false
    },
    modalStatic: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      loading: false // Loading indicator
    };
  },
  methods: {
    /**
     * Become a room member
     * @param event
     */
    joinMembership: function (event) {
      // Enable loading indicator
      this.loading = true;

      // Join room as member, send access code if needed
      const config = this.accessCode == null ? { method: 'post' } : { method: 'post', headers: { 'Access-Code': this.accessCode } };
      Base.call('rooms/' + this.room.id + '/membership', config)
        .then(() => {
          this.$emit('added');
        })
        .catch((error) => {
          // Access code invalid
          if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_code') {
            return this.$emit('invalid-code');
          }

          // Membership is disabled
          if (error.response.status === env.HTTP_FORBIDDEN) {
            this.$emit('membership-disabled');
          }

          Base.error(error, this.$root);
        }).finally(() => {
          this.loading = false;
        });
    },
    /**
     * Leave room membership
     * @param event
     */
    leaveMembership: function (event) {
      // Enable loading indicator
      this.loading = true;
      Base.call('rooms/' + this.room.id + '/membership', {
        method: 'delete'
      }).then(() => {
        this.$emit('removed');
      }).catch((error) => {
        Base.error(error, this.$root);
      }).finally(() => {
        this.loading = false;
      });
    }
  }
};
</script>
<style scoped>

</style>

import { useAuthStore } from "../stores/auth.js";
import { computed } from "vue";

export function useActionColumn(actionConstraints = []) {
  const authStore = useAuthStore();
  const visibleActions = computed(() => {
    return actionConstraints.filter((actionConstraint) => {
      if (actionConstraint.permissions) {
        if (!authStore.currentUser) return false;

        for (const permission of actionConstraint.permissions) {
          if (!authStore.currentUser.permissions.includes(permission)) {
            return false;
          }
        }
      }
      return true;
    }).length;
  });

  return computed(() => {
    const visible = visibleActions.value > 0;
    const classes = "action-column action-column-" + visibleActions.value;

    return {
      visible,
      classes,
    };
  });
}

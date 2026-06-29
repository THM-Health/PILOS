<script setup>
import { isMobile } from "../composables/useMenu.js";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

function scrollAndMoveFocus(target) {
  const element = document.getElementById(target);
  if (element) {
    element.scrollIntoView({ behavior: "auto" });
    element.focus();
  }
}

const links = computed(() => {
  const links = [];
  links.push({
    id: "main",
    label: t("app.aria.main"),
  });
  links.push({
    id: "mainmenu",
    label: t("app.aria.main_menu"),
  });

  if (!isMobile.value) {
    links.push({
      id: "usermenu",
      label: t("app.aria.user_menu"),
    });
  }

  links.push({
    id: "footer",
    label: t("app.aria.footer"),
  });

  return links;
});
</script>

<template>
  <nav :aria-label="t('app.aria.skip_links')">
    <ul
      class="border-rounded absolute -top-1 left-[50%] z-50 flex translate-x-[-50%] -translate-y-full transform flex-col gap-2 border bg-surface-0 p-4 px-4 py-2 transition focus-within:top-0 focus-within:translate-y-0 dark:bg-surface-950"
    >
      <li v-for="link in links" :key="link.id">
        <Button
          severity="secondary"
          text
          fluid
          role="link"
          :label="link.label"
          @click="scrollAndMoveFocus(link.id)"
        />
      </li>
    </ul>
  </nav>
</template>

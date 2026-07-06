// SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { setPrimeToastService } from "../composables/useToast";
import ToastService from "primevue/toastservice";

export default {
  install: (app) => {
    app.use(ToastService);
    const primeToastService = app.config.globalProperties.$toast;
    setPrimeToastService(primeToastService);
  },
};

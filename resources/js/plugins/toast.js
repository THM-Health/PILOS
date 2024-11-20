import { setPrimeToastService } from "../composables/useToast";
import ToastService from "primevue/toastservice";

export default {
  install: (app) => {
    app.use(ToastService);
    const primeToastService = app.config.globalProperties.$toast;
    setPrimeToastService(primeToastService);
  },
};

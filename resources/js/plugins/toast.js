import { setPrimeToastService } from '../composables/useToast';
import ToastService from 'primevue/toastservice';

export default {
  install: (app, options) => {
    app.use(ToastService);
    const primeToastService = app.config.globalProperties.$toast;
    setPrimeToastService(primeToastService);
  }
};

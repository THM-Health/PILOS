const toastService = {
  primeToastService: null,

  setPrimeToastService (primeToastService) {
    this.primeToastService = primeToastService;
  },

  toastMessage (severity, message, title = null) {
    this.primeToastService.add({ severity, summary: title, detail: message, life: 5000 });
  }
};

export function setPrimeToastService (primeToastService) {
  toastService.setPrimeToastService(primeToastService);
}

export function useToast () {
  return {
    error (message, title = null) {
      toastService.toastMessage('error', message, title);
    },

    info (message, title = null) {
      toastService.toastMessage('info', message, title);
    },

    warning (message, title = null) {
      toastService.toastMessage('warn', message, title);
    },

    success (message, title = null) {
      toastService.toastMessage('success', message, title);
    }
  };
}

const toastService = {
  primeToastService: null,

  setPrimeToastService (primeToastService) {
    this.primeToastService = primeToastService;
  },

  toastMessage (severity, summary, detail = null) {
    this.primeToastService.add({ severity, summary, detail, life: 5000 });
  }
};

export function setPrimeToastService (primeToastService) {
  toastService.setPrimeToastService(primeToastService);
}

export function useToast () {
  return {
    error (summary, detail = null) {
      toastService.toastMessage('error', summary, detail);
    },

    info (summary, detail = null) {
      toastService.toastMessage('info', summary, detail);
    },

    warning (summary, detail = null) {
      toastService.toastMessage('warn', summary, detail);
    },

    success (summary, detail = null) {
      toastService.toastMessage('success', summary, detail);
    }
  };
}

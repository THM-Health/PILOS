const toastService = {
  primeToastService: null,
  toastLifetime: 0,

  setPrimeToastService (primeToastService) {
    this.primeToastService = primeToastService;
  },

  setToastLifetime (lifetime) {
    this.toastLifetime = lifetime;
  },

  toastMessage (severity, summary, detail = null) {
    this.primeToastService.add({ severity, summary, detail, life: this.toastLifetime * 1000 });
  }
};

export function setPrimeToastService (primeToastService) {
  toastService.setPrimeToastService(primeToastService);
}

export function setToastLifetime (lifetime) {
  toastService.setToastLifetime(lifetime);
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

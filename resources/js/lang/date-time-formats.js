const dateTimeFormats = {
  de: {
    short: { year: 'numeric', month: 'short', day: '2-digit' },
    long: { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }
  },
  en: {
    short: { year: 'numeric', month: 'short', day: '2-digit' },
    long: { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }
  }
};

export default dateTimeFormats;

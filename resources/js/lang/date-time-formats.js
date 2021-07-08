const dateTimeFormats = {
  de: {
    dateShort: { year: 'numeric', month: '2-digit' },
    dateLong: { year: 'numeric', month: 'short', day: '2-digit' },
    time: { hour: '2-digit', minute: '2-digit' },
    datetimeShort: { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' },
    datetimeLong: { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }
  },
  en: {
    dateShort: { year: 'numeric', month: '2-digit', day: '2-digit' },
    dateLong: { year: 'numeric', month: 'short', day: '2-digit' },
    time: { hour: '2-digit', minute: '2-digit', hour12: false },
    datetimeShort: { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false },
    datetimeLong: { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }
  }
};

export default dateTimeFormats;

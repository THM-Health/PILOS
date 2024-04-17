export function usePaginatorDefaults () {
  return {
    getTemplate () {
      return {
        '640px': 'FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink',
        default: 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink'
      };
    },
    getCurrentPageReportTemplate () {
      return '({currentPage} / {totalPages})';
    }
  };
}

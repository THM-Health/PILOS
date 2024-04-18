import { nextTick, ref } from 'vue';

class Paginator {
  meta = ref({
    current_page: 1,
    from: 0,
    last_page: 0,
    per_page: 0,
    to: 0,
    total: 0,
    total_no_filter: 0
  });

  async updateMeta (meta) {
    this.meta.value.from = meta.from;
    await nextTick();
    this.meta.value = meta;
  }

  getTotalRecords () {
    return this.meta.value.total;
  }

  getRows () {
    return this.meta.value.per_page;
  }

  getFirst () {
    return this.meta.value.from - 1;
  }

  getCurrentPage () {
    return this.meta.value.current_page;
  }

  getTotalRecordsNoFilter () {
    return this.meta.value.total_no_filter;
  }

  getMetaProperty (property) {
    return this.meta.value[property];
  }

  getTemplate () {
    return {
      '640px': 'FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink',
      default: 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink'
    };
  }

  getCurrentPageReportTemplate () {
    return '({currentPage} / {totalPages})';
  }
}

export function usePaginator () {
  return new Paginator();
}

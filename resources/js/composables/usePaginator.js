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

  /**
   * Update the metadata based on the server response
   * @param meta server response pagination metadata
   * @return {Promise<void>}
   */
  async updateMeta (meta) {
    this.meta.value.from = meta.from;
    await nextTick();
    this.meta.value = meta;
  }

  /**
   * Get amount of records
   * Can be smaller than the total amount, due to applied filters
   * @return {number}
   */
  getTotalRecords () {
    return this.meta.value.total;
  }

  /**
   * Request has no data, regardless of a filter
   * @return {boolean}
   */
  isEmptyUnfiltered () {
    return this.meta.value.total_no_filter === 0;
  }

  /**
   * Current page is out of range of available pages
   * @return {boolean}
   */
  isOutOfRange () {
    return this.meta.value.current_page > this.meta.value.last_page;
  }

  /**
   * Last possible page
   * @return {number}
   */
  getLastPage () {
    return this.meta.value.last_page;
  }

  /**
   * Get amount of data present on this page
   * @return {number}
   */
  getRows () {
    return this.meta.value.per_page;
  }

  /**
   * Get index of the first item on the current page, counting from zero
   * @return {number}
   */
  getFirst () {
    return Math.max(this.meta.value.from - 1, 0);
  }

  /**
   * Get current page
   * @return {number}
   */
  getCurrentPage () {
    return this.meta.value.current_page;
  }

  /**
   * Get value of any meta property
   * @param property
   * @return {number}
   */
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

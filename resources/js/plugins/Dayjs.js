import Vue from 'vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

Object.defineProperties(Vue.prototype, {
  $date: {
    get () {
      return dayjs;
    }
  }
});

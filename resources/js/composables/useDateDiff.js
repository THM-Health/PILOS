import i18n from '../i18n';

export function useDateDiff () {
  const { t } = i18n.global;

  return {
    format (start, end) {
      const seconds = Math.floor((end - start) / 1000);
      let minutes = Math.floor(seconds / 60);
      let hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      hours = hours - (days * 24);
      minutes = minutes - (days * 24 * 60) - (hours * 60);

      const output = [];
      if (days > 0) {
        output.push(`${days} ${t(days === 1 ? 'app.time_formats.day' : 'app.time_formats.days')}`);
      }
      if (hours > 0) {
        output.push(`${hours} ${t(hours === 1 ? 'app.time_formats.hour' : 'app.time_formats.hours')}`);
      }

      if (output.length === 0 && minutes === 0) {
        output.push(`${seconds} ${t(seconds === 1 ? 'app.time_formats.second' : 'app.time_formats.seconds')}`);
      } else {
        output.push(`${minutes} ${t(minutes === 1 ? 'app.time_formats.minute' : 'app.time_formats.minutes')}`);
      }

      return output.join(', ');
    }
  };
}

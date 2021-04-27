import { Line, mixins } from 'vue-chartjs';
const { reactiveProp } = mixins;

export default {
  extends: Line,
  mixins: [reactiveProp],
  props: ['chartData'],

  data () {
    return {
      options: {
        responsive: true,
        title: {
          text: 'Chart.js Time Scale'
        },
        scales: {
          xAxes: [{
            type: 'time',
            time: {
              unit: 'minute',
              displayFormats: {
                minute: 'HH:mm'
              }
            },
            display: true,
            scaleLabel: {
              display: true,
              labelString: 'Uhrzeit'
            },
            ticks: {
              major: {
                fontStyle: 'bold',
                fontColor: '#FF0000'
              }
            }
          }],
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Anzahl'
            }
          }]
        }
      }
    };
  },

  mounted () {
    // this.chartData is created in the mixin.
    // If you want to pass options please create a local options object
    this.renderChart(this.chartData, this.options);
  }
};

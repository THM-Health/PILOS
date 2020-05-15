@extends('layouts.app')

@section('content')

    <div class="container mt-6">
        <h1>{{$meeting->room->name}}</h1>
        <h5>von {{$meeting->start->format('d.m.Y H:i')}} bis {{optional($meeting->end)->format('d.m.Y H:i') ?? "jetzt"}}</h5>
        <hr>
        <h3>Überblick</h3>
            <form>
                <div class="form-row">
                    <div class="form-group col-md-4">
                        <label for="user">Max. Teilnehmer</label>
                        <input type="text" readonly class="form-control-plaintext" id="user" value="{{$stats->max('participantCount')}}">
                    </div>
                    <div class="form-group col-md-4">
                        <label for="voice">Max. Mikrofon</label>
                        <input type="text" readonly class="form-control-plaintext" id="voice" value="{{$stats->max('voiceParticipantCount')}}">
                    </div>
                    <div class="form-group col-md-4">
                        <label for="video">Max. Webcam</label>
                        <input type="text" readonly class="form-control-plaintext" id="video" value="{{$stats->max('videoCount')}}">
                    </div>
                </div>
            </form>
        <hr>
        <h3>Zeitlicher Verlauf</h3>
        <canvas id="myChart" width="400" height="200"></canvas>
    </div>


@endsection
@push('scripts')
    <script>
        var ctx = document.getElementById('myChart');
        var color = Chart.helpers.color;
        var myChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Teilnehmer',
                    backgroundColor: '#9C132E',
                    borderColor: '#9C132E',
                    fill: false,
                    cubicInterpolationMode: 'monotone',
                    data: [
                        @foreach($stats as $stat)
                        {
                        x: "{{$stat->created_at}}",
                        y: {{$stat->participantCount}}
                    },
                        @endforeach
                    ],
                },
                    {
                        label: 'Mikrofon',
                        backgroundColor: '#00B8E4',
                        borderColor: '#00B8E4',
                        fill: false,
                        cubicInterpolationMode: 'monotone',
                        data: [
                                @foreach($stats as $stat)
                            {
                                x: "{{$stat->created_at}}",
                                y: {{$stat->voiceParticipantCount}}
                            },
                            @endforeach
                        ],
                    },
                    {
                        label: 'Webcam',
                        backgroundColor: '#F4AA00',
                        borderColor: '#F4AA00',
                        fill: false,
                        cubicInterpolationMode: 'monotone',
                        data: [
                                @foreach($stats as $stat)
                            {
                                x: "{{$stat->created_at}}",
                                y: {{$stat->videoCount}}
                            },
                            @endforeach
                        ],
                    }
                ]
            },
            options: {
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
                },
            }
        });
    </script>
@endpush
@push('styles')

@endpush

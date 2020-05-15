@extends('layouts.app')

@section('content')
<div class="background">
    <div class="container">

        <h1>Currently running rooms</h1>

        <table class="table">
            <thead>
            <tr>
                <th scope="col">Server</th>
                <th scope="col">Room description</th>
                <th scope="col">Teacher name</th>
                <th scope="col">Teacher email</th>
                <th scope="col">User</th>
                <th scope="col">Audio</th>
                <th scope="col">Video</th>
                <th scope="col">Action</th>
            </tr>
            </thead>
            <tbody>
            @foreach($servers as $server)
                @if($server->status==0)
                    @continue
                @endif

                @foreach($server->getMeetings() as $meeting)
                    <tr>
                        <th scope="row">{{$server->description}}</th>
                        <td>{{$meeting['meetingName']}}</td>
                        <td>{{$meeting['metadata']['owner-name']??"---"}}</td>
                        <td>{{$meeting['metadata']['owner-email']??"---"}}</td>
                        <td>{{$meeting['participantCount']}}</td>
                        <td>{{$meeting['voiceParticipantCount']}}</td>
                        <td>{{$meeting['videoCount']}}</td>
                        <td></td>
                    </tr>
                @endforeach
                @endforeach
            </tbody>
        </table>

    </div>
</div>



@endsection

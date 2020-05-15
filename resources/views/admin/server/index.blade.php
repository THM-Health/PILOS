@extends('layouts.app')

@section('content')
<div class="background">
    <div class="container">

        <h1>BigBlueButton Server</h1>

        <table class="table">
            <thead>
            <tr>
                <th scope="col">#</th>
                <th scope="col">Description</th>
                <th scope="col">Status</th>
                <th scope="col">Rooms</th>
                <th scope="col">User</th>
                <th scope="col">Audio</th>
                <th scope="col">Video</th>
                <th scope="col">Action</th>
            </tr>
            </thead>
            <tbody>
            @foreach($servers as $server)
            <tr>
                <th scope="row">{{$server->id}}</th>
                <td>{{$server->description}}</td>
                <td>{{$server->status==1?($server->stats['online']?"Online":"Offline"):"Inaktiv"}}</td>
                <td>{{$server->stats['rooms']}}</td>
                <td>{{$server->stats['users']}}</td>
                <td>{{$server->stats['audio']}}</td>
                <td>{{$server->stats['video']}}</td>
                <td></td>
            </tr>
                @endforeach
            </tbody>
        </table>

    </div>
</div>



@endsection

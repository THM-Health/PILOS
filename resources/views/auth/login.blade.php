@extends('layouts.app')

@section('content')

    <div class="container">
        <div class="row pt-7">
            <div class="col col-lg-6 offset-lg-3">
                <div class="card">
                    <div class="card-header background">
                        <h4 class="mt-2">In Ihr Konto einloggen</h4>
                    </div>
                    <div class="card-body background">
                        <form action="{{ route('login') }}" method="post">

                            @csrf

                            <div class="input-group mb-3">
                                <div class="input-group-prepend">
                                    <span class="input-group-text">
                                        <i class="fas fa-user"></i>
                                    </span>
                                </div>
                                <input class="form-control @error('username') is-invalid @enderror"
                                       placeholder="Teilnehmername" value="" type="text" name="username" id="username"
                                       required autocomplete="username" autofocus/>
                                @error('username')
                                <span class="invalid-feedback" role="alert">
                                        <strong>{{ $message }}</strong>
                                    </span>
                                @enderror
                            </div>

                            <div class="input-group mb-3">
                                <div class="input-group-prepend">
                                    <span class="input-group-text">
                                        <i class="fas fa-key"></i>
                                    </span>
                                </div>
                                <input value="" class="form-control @error('password') is-invalid @enderror"
                                       placeholder="Passwort" type="password" name="password" id="password" required
                                       autocomplete="current-password"/>
                                @error('password')
                                <span class="invalid-feedback" role="alert">
                                        <strong>{{ $message }}</strong>
                                    </span>
                                @enderror

                            </div>
                            <div>
                                <button type="submit" class="btn btn-primary btn-block signin-button">
                                    {{ __('Login') }}
                                </button>


                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection

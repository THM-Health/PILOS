@extends('layouts.app')

@section('content')
    <div class="container mt-6">
        @cannot('viewAll', App\Meeting::class)
            <h1>{{__('meeting.all_my_meetings')}}</h1>
        @else
            <h1>{{__('meeting.all_meetings')}}</h1>
        @endcannot
        {!! $html->table(['class' => 'table table-responsive'], true) !!}
    </div>
@endsection
@push('scripts')
    <script src="//cdn.datatables.net/1.10.12/js/jquery.dataTables.min.js"></script>
    <script src="https://cdn.datatables.net/1.10.12/js/dataTables.bootstrap4.min.js"></script>

    {!! $html->scripts() !!}
@endpush
@push('styles')
    <link rel="stylesheet" href="https://cdn.datatables.net/1.10.12/css/dataTables.bootstrap4.min.css">
@endpush

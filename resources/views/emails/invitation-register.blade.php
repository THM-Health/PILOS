<div>

    <p>Hi {{$invitation->email}},</p>

    <p>You are invited to access PILOS!</p>

    <a href="{{env('APP_URL') . '/register/invitation?invitation_token=' . $invitation->invitation_token }}">Click here</a> to register!

</div>

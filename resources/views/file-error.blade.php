<!DOCTYPE html>
<html>
<head>
    <title>Test</title>
</head>
<body>
<script>
    // ToDo improve when no opener present
    if(window.opener){
        window.opener.postMessage(
            {
                type: @json($type),
            },
            "*"
        );
        window.opener.focus();
        window.close();
    }
</script>
</body>
</html>

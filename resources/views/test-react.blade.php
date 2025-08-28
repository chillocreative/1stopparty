<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>React Test</title>
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body>
    <h1>Basic HTML Test</h1>
    <p>If you see this, HTML is working</p>
    <div id="test-app">React should load here</div>
    
    <script>
        console.log('Test page loaded');
        console.log('Vite assets should be loading...');
        setTimeout(() => {
            console.log('Checking if React loaded...');
            const testElement = document.getElementById('test-app');
            if (testElement && testElement.innerHTML.trim() !== 'React should load here') {
                console.log('React loaded successfully');
            } else {
                console.log('React failed to load');
            }
        }, 2000);
    </script>
</body>
</html>
$port = 8000
$server = New-Object System.Net.HttpListener
$server.Prefixes.Add("http://localhost:$port/")
$server.Start()
Write-Host "Server started on http://localhost:$port"

$rootDir = $PSScriptRoot

while ($server.IsListening) {
    $context = $server.GetContext()
    $request = $context.Request
    $response = $context.Response

    $localPath = $request.Url.LocalPath
    if ($localPath -eq "/") { $localPath = "/index.html" }

    $filePath = Join-Path $rootDir $localPath.TrimStart('/')

    if (Test-Path $filePath -PathType Leaf) {
        $fileContent = [System.IO.File]::ReadAllBytes($filePath)
        $response.ContentLength64 = $fileContent.Length

        # Set content type
        if ($filePath -like "*.html") { $response.ContentType = "text/html" }
        elseif ($filePath -like "*.css") { $response.ContentType = "text/css" }
        elseif ($filePath -like "*.js") { $response.ContentType = "application/javascript" }
        elseif ($filePath -like "*.json") { $response.ContentType = "application/json" }
        elseif ($filePath -like "*.svg") { $response.ContentType = "image/svg+xml" }

        $response.OutputStream.Write($fileContent, 0, $fileContent.Length)
    } else {
        $response.StatusCode = 404
        $response.StatusDescription = "Not Found"
    }

    $response.OutputStream.Close()
}

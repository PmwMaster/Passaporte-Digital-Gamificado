# ==============================================================================
# SCRIPT AUTOMÁTICO: ENVIAR ENV + DEPLOY VERCEL (CLIENTE LEVE NEON SERVERLESS)
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host " Enviando variáveis do .env e fazendo Deploy na Vercel    " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Yellow

$envLines = Get-Content -Path ".env" | Where-Object {
    $_ -match "^[A-Z0-9_]+=" -and -not $_.StartsWith("#")
}

$vercelArgs = @("--prod", "--yes")

foreach ($line in $envLines) {
    $parts = $line -split "=", 2
    $key = $parts[0].Trim()
    $val = $parts[1].Trim().Trim('"')

    $vercelArgs += "-e"
    $vercelArgs += "$key=$val"
    $vercelArgs += "-b"
    $vercelArgs += "$key=$val"
}

Write-Host "-> Executando npx vercel --prod com cliente leve @neondatabase/serverless..." -ForegroundColor Green
& npx vercel @vercelArgs

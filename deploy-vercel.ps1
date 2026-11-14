# ==============================================================================
# SCRIPT AUTOMÁTICO: SINCRONIZAR BANCO NEON + ENVIAR ENV + DEPLOY VERCEL
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host " 1. Sincronizando tabelas do Prisma no Neon PostgreSQL    " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Yellow

npx prisma generate
npx prisma db push --accept-data-loss

Write-Host "`n==========================================================" -ForegroundColor Yellow
Write-Host " 2. Enviando variáveis do .env e fazendo Deploy na Vercel " -ForegroundColor Yellow
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

Write-Host "-> Executando npx vercel --prod com todas as variáveis de build e runtime..." -ForegroundColor Green
& npx vercel @vercelArgs

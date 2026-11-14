# ==============================================================================
# SCRIPT AUTOMÁTICO: CRIAR PROJETO NA VERCEL + ENVIAR TODAS AS VARIÁVEIS DO .ENV
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host " 1. Vinculando / Criando o projeto na sua conta da Vercel " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Yellow

npx vercel link --yes

Write-Host "`n==========================================================" -ForegroundColor Yellow
Write-Host " 2. Enviando todas as variáveis do arquivo .env para a Vercel " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Yellow

$envLines = Get-Content -Path ".env" | Where-Object {
    $_ -match "^[A-Z0-9_]+=" -and -not $_.StartsWith("#")
}

foreach ($line in $envLines) {
    $parts = $line -split "=", 2
    $key = $parts[0].Trim()
    $val = $parts[1].Trim().Trim('"')

    Write-Host "-> Configurando variavel $key na Vercel (production, preview, development)..." -ForegroundColor Cyan

    # Remove caso ja exista para evitar erro de duplicidade
    npx vercel env rm $key production --yes 2>$null | Out-Null
    npx vercel env rm $key preview --yes 2>$null | Out-Null
    npx vercel env rm $key development --yes 2>$null | Out-Null

    # Adiciona o valor sem quebra de linha
    $val | npx vercel env add $key production
    $val | npx vercel env add $key preview
    $val | npx vercel env add $key development
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host " 3. Fazendo o Deploy em Produção na Vercel! " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

npx vercel --prod --yes

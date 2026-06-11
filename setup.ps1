# Recipe Manager - Quick Setup Script

Write-Host "🍳 Recipe Manager - Automated Setup" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "✓ Node.js $nodeVersion found" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js not found. Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install root dependencies" -ForegroundColor Red
    exit 1
}

npm install --workspaces
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install workspace dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Dependencies installed" -ForegroundColor Green

# Setup environment file
Write-Host ""
Write-Host "Setting up environment variables..." -ForegroundColor Yellow
if (-not (Test-Path "server\.env")) {
    Copy-Item "server\.env.example" "server\.env"
    Write-Host "✓ Created server\.env file" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Edit server\.env and add your settings:" -ForegroundColor Yellow
    Write-Host "   - JWT_SECRET (change from default)" -ForegroundColor Yellow
    Write-Host "   - ANTHROPIC_API_KEY (for AI features)" -ForegroundColor Yellow
    Write-Host "   - DATABASE_URL (default is SQLite)" -ForegroundColor Yellow
} else {
    Write-Host "✓ server\.env already exists" -ForegroundColor Green
}

# Ask about database setup
Write-Host ""
Write-Host "Do you want to set up the database now? (y/n)" -ForegroundColor Yellow
$setupDb = Read-Host
if ($setupDb -eq 'y' -or $setupDb -eq 'Y') {
    Write-Host ""
    Write-Host "Generating Prisma Client..." -ForegroundColor Yellow
    npm run prisma:generate
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to generate Prisma Client" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Prisma Client generated" -ForegroundColor Green

    Write-Host ""
    Write-Host "Running database migrations..." -ForegroundColor Yellow
    npm run prisma:migrate
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to run migrations" -ForegroundColor Red
        Write-Host "  Make sure your DATABASE_URL in server\.env is correct" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✓ Database migrations completed" -ForegroundColor Green
}

# Create uploads directory
Write-Host ""
Write-Host "Creating uploads directory..." -ForegroundColor Yellow
if (-not (Test-Path "server\uploads")) {
    New-Item -ItemType Directory -Path "server\uploads" | Out-Null
    Write-Host "✓ Created uploads directory" -ForegroundColor Green
} else {
    Write-Host "✓ Uploads directory already exists" -ForegroundColor Green
}

# Success message
Write-Host ""
Write-Host "=================================" -ForegroundColor Green
Write-Host "✓ Setup completed successfully!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Edit server\.env with your configuration" -ForegroundColor White
Write-Host "2. Run 'npm run dev' to start the application" -ForegroundColor White
Write-Host "3. Open http://localhost:5173 in your browser" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see SETUP.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Would you like to start the development servers now? (y/n)" -ForegroundColor Yellow
$startServers = Read-Host
if ($startServers -eq 'y' -or $startServers -eq 'Y') {
    Write-Host ""
    Write-Host "Starting development servers..." -ForegroundColor Green
    Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
    Write-Host "Backend: http://localhost:3001" -ForegroundColor Cyan
    Write-Host ""
    npm run dev
}

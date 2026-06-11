# Recipe Manager - Common Issues & Solutions

## Installation Issues

### Problem: "npm install" fails
**Solution:**
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
Remove-Item -Recurse -Force node_modules, client\node_modules, server\node_modules, shared\node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json, client\package-lock.json, server\package-lock.json, shared\package-lock.json -ErrorAction SilentlyContinue

# Reinstall
npm install
npm install --workspaces
```

### Problem: Prisma Client not generating
**Solution:**
```powershell
cd server
npx prisma generate
cd ..
```

## Database Issues

### Problem: "Environment variable not found: DATABASE_URL"
**Solution:**
Make sure `server\.env` exists and contains:
```env
DATABASE_URL="file:./dev.db"
```

### Problem: Migration fails with "P1003: Database does not exist"
**Solution (PostgreSQL):**
```sql
-- Connect to PostgreSQL and create database
CREATE DATABASE recipedb;
```

**Solution (SQLite):**
```powershell
# SQLite creates the file automatically, just make sure the path is writable
cd server
npx prisma migrate dev --name init
```

### Problem: "The table `User` does not exist"
**Solution:**
```powershell
npm run prisma:migrate
# Enter migration name: init
```

## Runtime Issues

### Problem: "Cannot find module '@prisma/client'"
**Solution:**
```powershell
npm run prisma:generate
cd server
npm install
```

### Problem: "Port 3001 already in use"
**Solution:**
```powershell
# Find process using port
netstat -ano | findstr :3001

# Kill the process (replace <PID> with actual number)
taskkill /PID <PID> /F

# OR change port in server\.env
# PORT=3002
```

### Problem: "401 Unauthorized" errors in frontend
**Solution:**
- Log out and log in again
- Clear browser localStorage
- Check if JWT_SECRET matches between sessions

### Problem: File upload fails
**Solution:**
```powershell
# Create uploads directory
mkdir server\uploads

# Check UPLOAD_DIR in server\.env
# UPLOAD_DIR=./uploads
```

## Feature-Specific Issues

### Problem: Recipe Remix AI not working
**Solution:**
1. Get API key from https://console.anthropic.com/
2. Add to `server\.env`:
   ```env
   ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
   ```
3. Restart server

### Problem: Voice commands not working in Cook Mode
**Solution:**
- Use Chrome or Edge browser
- Click "Allow" when prompted for microphone access
- Check browser console for errors
- Try HTTPS (some browsers require it)

### Problem: Drag and drop not working in Meal Planner
**Solution:**
- Make sure you have react-dnd installed
- Clear browser cache
- Check for JavaScript errors in console

## Development Issues

### Problem: Hot reload not working
**Solution:**
```powershell
# Kill all node processes
Get-Process node | Stop-Process -Force

# Restart dev servers
npm run dev
```

### Problem: Changes not reflecting
**Solution:**
```powershell
# Clear build cache
Remove-Item -Recurse -Force client\dist, server\dist

# Rebuild
npm run build
```

### Problem: TypeScript errors
**Solution:**
```powershell
# Frontend
cd client
npm run lint

# Backend
cd server
npx tsc --noEmit
```

## Performance Issues

### Problem: App is slow
**Solutions:**
- Check database indexes (Prisma handles this)
- Limit query results with pagination
- Use React Query caching effectively
- Optimize large images before upload

### Problem: Database growing too large (SQLite)
**Solution:**
```powershell
cd server
# Backup database
Copy-Item dev.db dev.db.backup

# Vacuum database
sqlite3 dev.db "VACUUM;"
```

## Production Deployment

### Problem: Environment variables not loading
**Solution:**
- Use .env file in production server
- OR set environment variables in hosting platform
- Never commit .env to git

### Problem: Database connection pool exhausted
**Solution:**
Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add connection pool settings
  directUrl = env("DIRECT_URL")
}
```

### Problem: CORS errors in production
**Solution:**
Update `server/src/index.ts`:
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
```

## Getting Help

If none of these solutions work:

1. **Check logs:**
   ```powershell
   # Frontend: Check browser console
   # Backend: Check terminal output
   ```

2. **Verify versions:**
   ```powershell
   node --version  # Should be 18+
   npm --version
   ```

3. **Fresh install:**
   ```powershell
   # Complete clean reinstall
   Remove-Item -Recurse -Force node_modules
   npm install
   npm install --workspaces
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. **Check GitHub Issues** (if this becomes a public repo)

5. **Review SETUP.md** for detailed setup instructions

---

## Useful Commands Reference

```powershell
# Development
npm run dev                 # Start both frontend and backend
npm run dev:client         # Start frontend only
npm run dev:server         # Start backend only

# Database
npm run prisma:generate    # Generate Prisma Client
npm run prisma:migrate     # Run migrations
npm run prisma:studio      # Open database GUI

# Build
npm run build              # Build for production

# Cleanup
npm cache clean --force    # Clear npm cache
Get-Process node | Stop-Process -Force  # Kill all node processes
```

# Recipe Manager Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database OR use SQLite for development
- Anthropic API key (for Recipe Remix AI feature)

### Step 1: Install Dependencies

```powershell
# Install root dependencies
npm install

# Install all workspace dependencies
npm install --workspaces
```

### Step 2: Configure Environment Variables

Create a `.env` file in the `server` directory:

```powershell
# Copy example file
Copy-Item server\.env.example server\.env

# Edit server\.env with your settings
```

**For SQLite (easiest for development):**
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
ANTHROPIC_API_KEY="sk-ant-api03-your-key-here"
PORT=3001
NODE_ENV=development
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

**For PostgreSQL (production):**
```env
DATABASE_URL="postgresql://username:password@localhost:5432/recipedb"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
ANTHROPIC_API_KEY="sk-ant-api03-your-key-here"
PORT=3001
NODE_ENV=development
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

### Step 3: Set Up Database

```powershell
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view database
npm run prisma:studio
```

When prompted for migration name, enter: `init`

### Step 4: Start Development Servers

```powershell
# Start both frontend and backend
npm run dev
```

This will start:
- Backend API: http://localhost:3001
- Frontend: http://localhost:5173

### Step 5: Create Your Account

1. Open http://localhost:5173
2. Click "Sign up"
3. Create your account
4. Start adding recipes!

---

## 📋 Individual Commands

### Backend Only
```powershell
npm run dev:server
```

### Frontend Only
```powershell
npm run dev:client
```

### Build for Production
```powershell
npm run build
```

### Database Commands
```powershell
# Generate Prisma Client
npm run prisma:generate

# Create and apply migration
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Reset database (WARNING: deletes all data)
cd server
npx prisma migrate reset
```

---

## 🔧 Troubleshooting

### Prisma Client Not Found
```powershell
npm run prisma:generate
```

### Port Already in Use
Change the PORT in `server/.env` or kill the process:
```powershell
# Find process on port 3001
netstat -ano | findstr :3001

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### Database Connection Issues

**SQLite:**
- Make sure `DATABASE_URL="file:./dev.db"` is set
- Check file permissions in server directory

**PostgreSQL:**
- Verify PostgreSQL is running
- Check connection string format
- Ensure database exists: `CREATE DATABASE recipedb;`

### Anthropic API Not Working
- Get your API key from https://console.anthropic.com/
- Add it to `server/.env` as `ANTHROPIC_API_KEY`
- Recipe Remix feature will be disabled without it

---

## 🎨 Features Overview

### ✅ Implemented Features

1. **Recipe Management**
   - CRUD operations for recipes
   - Rich ingredient and step editor
   - Photo uploads
   - Tag system
   - Favorites

2. **Smart Ingredient Matcher**
   - Input available ingredients
   - Get recipes sorted by match percentage
   - See missing ingredients count

3. **Meal Planner**
   - Drag-and-drop weekly calendar
   - Breakfast/lunch/dinner/snack slots
   - Auto-generate grocery lists

4. **Pantry Tracker**
   - Track ingredients with quantities
   - Expiry date monitoring
   - Color-coded alerts

5. **Cook Mode**
   - Full-screen step-by-step view
   - Voice navigation (Web Speech API)
   - Per-step timers
   - Serving size adjustment

6. **Recipe Remix AI**
   - Claude AI-powered variations
   - Healthier/budget/gourmet versions
   - Side-by-side comparisons

7. **Stats Dashboard**
   - Cooking streaks
   - Most cooked recipes
   - Favorite cuisine
   - Activity heatmap
   - Achievements system

8. **Collections**
   - Organize recipes into collections
   - "Sunday Dinners", "Quick Lunches", etc.

9. **Grocery List Generator**
   - Auto-aggregates ingredients from meal plan
   - Groups by category
   - Merges duplicate ingredients

10. **Authentication**
    - JWT-based auth
    - Secure password hashing
    - Protected routes

---

## 🎯 Next Steps / Future Enhancements

- **Recipe Import from URL**: Add scraping functionality
- **PDF Export**: Implement meal plan PDF generation
- **Social Features**: Share recipes with friends
- **Mobile App**: React Native version
- **Nutrition Tracking**: Add calorie/macro calculations
- **Recipe Comments**: Add notes and ratings
- **Shopping Mode**: Mobile-friendly grocery list with checkboxes
- **Recipe Versioning**: Track recipe changes over time
- **Ingredient Substitutions AI**: Smart substitution suggestions
- **Meal Prep Mode**: Batch cooking assistance

---

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login

### Recipes
- `GET /api/recipes` - Get all recipes (with filters)
- `GET /api/recipes/:id` - Get single recipe
- `POST /api/recipes` - Create recipe (with photo upload)
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe
- `POST /api/recipes/:id/favorite` - Toggle favorite
- `POST /api/recipes/match` - Ingredient matcher
- `POST /api/recipes/:id/remix` - AI remix
- `POST /api/recipes/:id/cook` - Log cook

### Pantry
- `GET /api/pantry` - Get all pantry items
- `POST /api/pantry` - Add item
- `PUT /api/pantry/:id` - Update item
- `DELETE /api/pantry/:id` - Delete item

### Meal Plans
- `GET /api/meal-plans` - Get all meal plans
- `GET /api/meal-plans/:id` - Get single meal plan
- `POST /api/meal-plans` - Create meal plan
- `POST /api/meal-plans/:id/recipes` - Add recipe to plan
- `DELETE /api/meal-plans/:id/recipes/:recipeId` - Remove recipe
- `GET /api/meal-plans/:id/grocery-list` - Generate grocery list

### Collections
- `GET /api/collections` - Get all collections
- `POST /api/collections` - Create collection
- `POST /api/collections/:id/recipes` - Add recipe
- `DELETE /api/collections/:id/recipes/:recipeId` - Remove recipe
- `DELETE /api/collections/:id` - Delete collection

### Stats
- `GET /api/stats` - Get cooking statistics

---

## 🛠️ Technology Stack

**Frontend:**
- React 18
- TypeScript
- Tailwind CSS
- Zustand (state management)
- React Query (data fetching)
- React Router (routing)
- React DnD (drag and drop)
- date-fns (date utilities)

**Backend:**
- Node.js
- Express
- Prisma ORM
- PostgreSQL / SQLite
- JWT authentication
- Multer (file uploads)
- Anthropic Claude API

---

## 📝 License

MIT License - Feel free to use this project for learning and personal use!

---

## 💡 Tips

1. **Use SQLite for development** - Much easier to set up than PostgreSQL
2. **Get an Anthropic API key** - The Recipe Remix feature is really cool!
3. **Enable voice commands in Cook Mode** - Works best in Chrome/Edge
4. **Try the ingredient matcher** - Great for using up ingredients
5. **Build a cooking streak** - The stats dashboard gamifies cooking!

Enjoy your Recipe Manager! 🍳

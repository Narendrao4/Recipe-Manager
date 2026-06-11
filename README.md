# Recipe Manager 🍳

A modern full-stack Recipe Manager with smart features including ingredient matching, AI-powered recipe remixing, meal planning, and more.

![Recipe Manager](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue) ![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![Prisma](https://img.shields.io/badge/Prisma-5.11-lightgrey)

## ✨ Features

### Core Features
- 📝 **Recipe Management**: Save recipes with rich details, photos, tags, and more
- 🎯 **Smart Ingredient Matcher**: Find recipes based on what's in your fridge
- 📅 **Meal Planner**: Drag-and-drop weekly calendar for meal planning
- 🛒 **Grocery List Generator**: Auto-generated shopping lists from meal plans
- ⭐ **Collections**: Organize recipes into custom collections

### Unique Features
- 🎙️ **Cook Mode**: Voice-controlled, full-screen step-by-step cooking mode
- 🤖 **Recipe Remix AI**: Get healthier/budget/gourmet variations using Claude AI
- 🏪 **Pantry Tracker**: Track ingredients with expiry date monitoring
- 📊 **Cook History & Stats**: Track cooking streaks, stats, and achievements
- 🔄 **Serving Scaling**: Auto-adjust ingredient quantities

## 🚀 Quick Start

### Automated Setup (Recommended)

```powershell
# Run the setup script
.\setup.ps1
```

### Manual Setup

```powershell
# 1. Install dependencies
npm install
npm install --workspaces

# 2. Configure environment
Copy-Item server\.env.example server\.env
# Edit server\.env with your settings

# 3. Set up database
npm run prisma:generate
npm run prisma:migrate

# 4. Start development servers
npm run dev
```

**That's it!** Open http://localhost:5173 and create your account.

## 📖 Documentation

- **[SETUP.md](SETUP.md)** - Detailed setup instructions
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions

## 🛠️ Tech Stack

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS (custom theme)
- Zustand (state management)
- React Query (data fetching)
- React DnD (drag and drop)
- Web Speech API (voice commands)

**Backend:**
- Node.js + Express
- Prisma ORM
- PostgreSQL / SQLite
- JWT authentication
- Multer (file uploads)
- Anthropic Claude API

## 📁 Project Structure

```
recipe-manager/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── store/        # Zustand stores
│   │   └── lib/          # API client
│   └── public/
├── server/          # Express backend
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Auth middleware
│   │   └── index.ts      # Server entry
│   └── uploads/          # Recipe photos
├── prisma/          # Database schema
│   └── schema.prisma
└── shared/          # Shared TypeScript types
    └── src/
```

## 🎨 Design System

### Color Palette
- **Forest Green**: `#1B3A2D` - Primary
- **Warm Cream**: `#F5EDD6` - Background
- **Terracotta**: `#C4622D` - Accent

### Typography
- **Headings**: Playfair Display (serif)
- **Body**: Inter (sans-serif)

### UI Style
- Polaroid-style recipe cards with hover effects
- Smooth transitions and micro-interactions
- Dark mode support
- Fully responsive design

## 📸 Screenshots

### Dashboard
Beautiful overview with quick stats and recent recipes

### Ingredient Matcher
Find recipes based on ingredients you already have, sorted by match percentage

### Cook Mode
Immersive, voice-controlled cooking experience with timers

### Meal Planner
Drag-and-drop weekly meal planning with auto-generated grocery lists

### Stats Dashboard
Track your cooking streaks, favorite cuisines, and unlock achievements

## 🎯 Key Features Detail

### 1. Recipe Management
- Rich text editor for steps
- Multiple ingredient support with substitutions
- Photo upload
- Tagging system (vegan, gluten-free, etc.)
- Search and filter by tags, cuisine, difficulty
- Favorites system

### 2. Smart Ingredient Matcher
- Input ingredients from your pantry
- Get recipes sorted by match score (0-100%)
- See "missing only X ingredients" badges
- Perfect for reducing food waste

### 3. Meal Planner
- Drag recipes onto calendar
- 4 meal slots per day (breakfast, lunch, dinner, snack)
- Auto-generate grocery lists
- Merge duplicate ingredients with smart aggregation

### 4. Cook Mode
- **Voice Navigation**: Say "next", "back", "repeat", "start timer"
- **Step Timers**: Auto-start timers for each step
- **Serving Adjustment**: Scale ingredients on the fly
- **Full-screen Mode**: Distraction-free cooking

### 5. Recipe Remix AI
- **Powered by Claude Sonnet 4**
- Get 3 variations: Healthier, Budget, Gourmet
- Side-by-side comparison
- AI explains changes made

### 6. Pantry Tracker
- Track ingredients with quantities and units
- **Expiry Monitoring**: Color-coded alerts
- Categories: Produce, Meat, Dairy, Pantry
- Integration with ingredient matcher

### 7. Stats & Achievements
- **Cooking Streaks**: Track consecutive cooking days
- **Total Cooks**: Lifetime cooking count
- **Favorite Cuisine**: Auto-detected from cook history
- **Day Analysis**: See which days you cook most
- **Achievements**: Unlock badges for milestones

## 🔐 Security

- JWT-based authentication
- bcrypt password hashing
- Protected API routes
- Secure file uploads with validation
- Environment variable configuration

## 🚀 Deployment

### Backend (Node.js)
- Deploy to Heroku, Railway, or DigitalOcean
- Set environment variables
- Use PostgreSQL add-on
- Run migrations: `npm run prisma:migrate`

### Frontend (React)
- Deploy to Vercel, Netlify, or Cloudflare Pages
- Set `VITE_API_URL` environment variable
- Build command: `npm run build`
- Output: `client/dist`

## 📝 API Routes

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login

### Recipes
- `GET /api/recipes` - List recipes
- `POST /api/recipes` - Create recipe
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe
- `POST /api/recipes/match` - Ingredient matcher
- `POST /api/recipes/:id/remix` - AI remix
- `POST /api/recipes/:id/cook` - Log cook

### Meal Plans
- `GET /api/meal-plans` - List meal plans
- `POST /api/meal-plans` - Create meal plan
- `GET /api/meal-plans/:id/grocery-list` - Generate grocery list

### Pantry
- `GET /api/pantry` - List pantry items
- `POST /api/pantry` - Add item
- `PUT /api/pantry/:id` - Update item
- `DELETE /api/pantry/:id` - Delete item

### Stats
- `GET /api/stats` - Get cooking statistics

## 🤝 Contributing

This is a demonstration project, but feel free to:
- Fork and modify for your own use
- Report bugs or suggest features
- Submit pull requests

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- **Anthropic Claude** - AI recipe remixing
- **Tailwind CSS** - Styling framework
- **Prisma** - Database ORM
- **React Query** - Data fetching
- **Web Speech API** - Voice commands

---

Made with ❤️ and Claude AI | [Setup Guide](SETUP.md) | [Troubleshooting](TROUBLESHOOTING.md)

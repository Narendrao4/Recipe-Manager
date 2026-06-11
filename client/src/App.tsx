import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Recipes from './pages/Recipes';
import RecipeDetail from './pages/RecipeDetail';
import CreateRecipe from './pages/CreateRecipe';
import IngredientMatcher from './pages/IngredientMatcher';
import MealPlanner from './pages/MealPlanner';
import Pantry from './pages/Pantry';
import CookMode from './pages/CookMode';
import Stats from './pages/Stats';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      {/* Public landing page */}
      <Route path="/" element={!isAuthenticated ? <Landing /> : <Navigate to="/dashboard" />} />
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
        <Route index element={<Dashboard />} />
      </Route>
      
      <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
        <Route path="recipes" element={<Recipes />} />
        <Route path="recipes/new" element={<CreateRecipe />} />
        <Route path="recipes/:id" element={<RecipeDetail />} />
        <Route path="recipes/:id/edit" element={<CreateRecipe />} />
        <Route path="recipes/:id/cook" element={<CookMode />} />
        <Route path="ingredient-matcher" element={<IngredientMatcher />} />
        <Route path="meal-planner" element={<MealPlanner />} />
        <Route path="pantry" element={<Pantry />} />
        <Route path="stats" element={<Stats />} />
      </Route>
    </Routes>
  );
}

export default App;

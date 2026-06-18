import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  ChefHat,
  Flame,
  Heart,
  ImageIcon,
  Package,
  Target,
} from 'lucide-react';
import api from '../lib/api';
import RecipeApiImporter from '../components/RecipeApiImporter';

const Dashboard = () => {
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data } = await api.get('/stats');
      return data;
    },
  });

  const { data: recipes } = useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const { data } = await api.get('/recipes');
      return data;
    },
  });

  const recentRecipes = recipes?.slice(0, 3) || [];

  const handleImportedRecipe = () => {
    queryClient.invalidateQueries({ queryKey: ['recipes'] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
  };

  const quickActions = [
    {
      to: '/favorites',
      icon: Heart,
      title: 'Favorite Recipes',
      description: 'Your saved go-to meals',
    },
    {
      to: '/ingredient-matcher',
      icon: Target,
      title: 'Find by Ingredients',
      description: 'What can you make?',
    },
    {
      to: '/meal-planner',
      icon: CalendarDays,
      title: 'Plan Your Week',
      description: 'Drag & drop planner',
    },
    {
      to: '/pantry',
      icon: Package,
      title: 'Manage Pantry',
      description: 'Track ingredients',
    },
    {
      to: '/stats',
      icon: BarChart3,
      title: 'View Stats',
      description: 'Cooking insights',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-forest dark:text-cream">
            Recipe Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Search the free recipe API, import meals, and keep your collection moving.
          </p>
        </div>
        <Link to="/recipes/new" className="btn-primary text-center">
          New Recipe
        </Link>
      </div>

      <RecipeApiImporter
        title=" Search recipes To import"
        description="Search TheMealDB and import a recipe directly into My Recipes."
        onImported={handleImportedRecipe}
        importButtonLabel="Import to My Recipes"
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-forest-dark">
          <BookOpen className="mb-3 h-10 w-10 text-terracotta" />
          <div className="text-3xl font-bold text-terracotta">{recipes?.length || 0}</div>
          <div className="text-gray-600 dark:text-gray-300">Total Recipes</div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-forest-dark">
          <Flame className="mb-3 h-10 w-10 text-terracotta" />
          <div className="text-3xl font-bold text-terracotta">{stats?.cookStreak || 0}</div>
          <div className="text-gray-600 dark:text-gray-300">Day Cooking Streak</div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-forest-dark">
          <ChefHat className="mb-3 h-10 w-10 text-terracotta" />
          <div className="text-3xl font-bold text-terracotta">{stats?.totalCooks || 0}</div>
          <div className="text-gray-600 dark:text-gray-300">Total Cooks</div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-forest-dark">
        <h2 className="mb-4 font-display text-2xl font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.to}
                to={action.to}
                className="flex items-center gap-3 rounded-lg border-2 border-gray-200 p-4 transition-all hover:border-terracotta hover:bg-cream-light dark:border-gray-700 dark:hover:bg-forest-light"
              >
                <Icon className="h-8 w-8 shrink-0 text-terracotta" />
                <div>
                  <div className="font-semibold">{action.title}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">{action.description}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {recentRecipes.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold">Recent Recipes</h2>
            <Link to="/recipes" className="inline-flex items-center gap-1 font-medium text-terracotta hover:text-terracotta-dark">
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {recentRecipes.map((recipe: any) => (
              <Link
                key={recipe.id}
                to={`/recipes/${recipe.id}`}
                className="overflow-hidden rounded-xl bg-white shadow-lg transition-shadow hover:shadow-2xl dark:bg-forest-dark"
              >
                <div className="aspect-video bg-gray-200 dark:bg-forest-light">
                  {recipe.photoUrl ? (
                    <img src={recipe.photoUrl} alt={recipe.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-cream-dark dark:text-cream/70">
                      <ImageIcon className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="mb-2 font-display text-xl font-semibold">{recipe.title}</h3>
                  <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                    {recipe.description || 'No description'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {stats?.favoriteCuisine && (
        <div className="rounded-xl bg-gradient-to-r from-terracotta to-terracotta-dark p-6 text-white shadow-lg">
          <div className="text-lg">Your Favorite Cuisine</div>
          <div className="font-display text-3xl font-bold">{stats.favoriteCuisine}</div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

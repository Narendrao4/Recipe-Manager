import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

const Dashboard = () => {
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-display font-bold text-forest dark:text-cream">
          Welcome to Recipe Manager
        </h1>
        <Link to="/recipes/new" className="btn-primary">
          + New Recipe
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-forest-dark rounded-xl shadow-lg p-6">
          <div className="text-4xl mb-2">📖</div>
          <div className="text-3xl font-bold text-terracotta">{recipes?.length || 0}</div>
          <div className="text-gray-600 dark:text-gray-300">Total Recipes</div>
        </div>

        <div className="bg-white dark:bg-forest-dark rounded-xl shadow-lg p-6">
          <div className="text-4xl mb-2">🔥</div>
          <div className="text-3xl font-bold text-terracotta">{stats?.cookStreak || 0}</div>
          <div className="text-gray-600 dark:text-gray-300">Day Cooking Streak</div>
        </div>

        <div className="bg-white dark:bg-forest-dark rounded-xl shadow-lg p-6">
          <div className="text-4xl mb-2">👨‍🍳</div>
          <div className="text-3xl font-bold text-terracotta">{stats?.totalCooks || 0}</div>
          <div className="text-gray-600 dark:text-gray-300">Total Cooks</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-forest-dark rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-display font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/favorites"
            className="flex items-center space-x-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-terracotta hover:bg-cream-light dark:hover:bg-forest-light transition-all"
          >
            <div className="text-3xl">❤️</div>
            <div>
              <div className="font-semibold">Favorite Recipes</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Your saved go-to meals</div>
            </div>
          </Link>

          <Link
            to="/ingredient-matcher"
            className="flex items-center space-x-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-terracotta hover:bg-cream-light dark:hover:bg-forest-light transition-all"
          >
            <div className="text-3xl">🎯</div>
            <div>
              <div className="font-semibold">Find by Ingredients</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">What can you make?</div>
            </div>
          </Link>

          <Link
            to="/meal-planner"
            className="flex items-center space-x-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-terracotta hover:bg-cream-light dark:hover:bg-forest-light transition-all"
          >
            <div className="text-3xl">📅</div>
            <div>
              <div className="font-semibold">Plan Your Week</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Drag & drop planner</div>
            </div>
          </Link>

          <Link
            to="/pantry"
            className="flex items-center space-x-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-terracotta hover:bg-cream-light dark:hover:bg-forest-light transition-all"
          >
            <div className="text-3xl">🏪</div>
            <div>
              <div className="font-semibold">Manage Pantry</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Track ingredients</div>
            </div>
          </Link>

          <Link
            to="/stats"
            className="flex items-center space-x-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-terracotta hover:bg-cream-light dark:hover:bg-forest-light transition-all"
          >
            <div className="text-3xl">📊</div>
            <div>
              <div className="font-semibold">View Stats</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Cooking insights</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Recipes */}
      {recentRecipes.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-display font-semibold">Recent Recipes</h2>
            <Link to="/recipes" className="text-terracotta hover:text-terracotta-dark font-medium">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentRecipes.map((recipe: any) => (
              <Link
                key={recipe.id}
                to={`/recipes/${recipe.id}`}
                className="bg-white dark:bg-forest-dark rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow"
              >
                <div className="aspect-video bg-gray-200 dark:bg-gray-700">
                  {recipe.photoUrl ? (
                    <img src={recipe.photoUrl} alt={recipe.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">🍽️</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-display text-xl font-semibold mb-2">{recipe.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {recipe.description || 'No description'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Favorite Cuisine */}
      {stats?.favoriteCuisine && (
        <div className="bg-gradient-to-r from-terracotta to-terracotta-dark text-white rounded-xl shadow-lg p-6">
          <div className="text-lg mb-2">Your Favorite Cuisine</div>
          <div className="text-3xl font-display font-bold">{stats.favoriteCuisine}</div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

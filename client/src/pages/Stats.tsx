import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';

const Stats = () => {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data } = await api.get('/stats');
      return data;
    },
  });

  if (!stats) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="spinner"></div>
      </div>
    );
  }

  const maxCooksInDay = Math.max(...Object.values(stats.cooksByDay as Record<string, number>));

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-display font-bold text-forest dark:text-cream">
        📊 Cooking Statistics
      </h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-400 to-green-600 text-white rounded-xl shadow-lg p-6">
          <div className="text-5xl mb-2">🔥</div>
          <div className="text-4xl font-bold">{stats.cookStreak}</div>
          <div className="text-green-100">Day Streak</div>
        </div>

        <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-xl shadow-lg p-6">
          <div className="text-5xl mb-2">👨‍🍳</div>
          <div className="text-4xl font-bold">{stats.totalCooks}</div>
          <div className="text-blue-100">Total Cooks</div>
        </div>

        <div className="bg-gradient-to-br from-purple-400 to-purple-600 text-white rounded-xl shadow-lg p-6">
          <div className="text-5xl mb-2">⭐</div>
          <div className="text-2xl font-bold line-clamp-1">
            {stats.mostCookedRecipe?.title || 'None'}
          </div>
          <div className="text-purple-100">Most Cooked</div>
        </div>

        <div className="bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-xl shadow-lg p-6">
          <div className="text-5xl mb-2">🌍</div>
          <div className="text-2xl font-bold">{stats.favoriteCuisine || 'None'}</div>
          <div className="text-orange-100">Favorite Cuisine</div>
        </div>
      </div>

      {/* Cooking Frequency by Day */}
      <div className="bg-white dark:bg-forest-dark rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-display font-semibold mb-6">Cooking by Day of Week</h2>
        <div className="space-y-4">
          {Object.entries(stats.cooksByDay).map(([day, count]: [string, any]) => (
            <div key={day}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{day}</span>
                <span className="text-terracotta font-bold">{count} cooks</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6">
                <div
                  className="bg-gradient-to-r from-terracotta to-terracotta-dark h-6 rounded-full flex items-center justify-end pr-3 text-white text-sm font-semibold transition-all"
                  style={{ width: `${maxCooksInDay > 0 ? (count / maxCooksInDay) * 100 : 0}%` }}
                >
                  {count > 0 && count}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Cooks */}
      {stats.recentCooks && stats.recentCooks.length > 0 && (
        <div className="bg-white dark:bg-forest-dark rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-display font-semibold mb-6">Recent Cooking Activity</h2>
          <div className="space-y-4">
            {stats.recentCooks.map((cook: any) => (
              <div key={cook.id} className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <Link
                    to={`/recipes/${cook.recipeId}`}
                    className="font-semibold text-lg hover:text-terracotta"
                  >
                    {cook.recipe.title}
                  </Link>
                  {cook.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">{cook.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {new Date(cook.cookedAt).toLocaleDateString()}
                  </div>
                  {cook.servings && (
                    <div className="text-xs text-gray-400">{cook.servings} servings</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-display font-semibold mb-4">🏆 Achievements</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.totalCooks >= 1 && (
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <div className="text-3xl mb-2">🎖️</div>
              <div className="font-semibold">First Cook</div>
              <div className="text-sm text-yellow-100">Cooked your first recipe</div>
            </div>
          )}
          {stats.totalCooks >= 10 && (
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <div className="text-3xl mb-2">👨‍🍳</div>
              <div className="font-semibold">Home Chef</div>
              <div className="text-sm text-yellow-100">Cooked 10+ recipes</div>
            </div>
          )}
          {stats.cookStreak >= 7 && (
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <div className="text-3xl mb-2">🔥</div>
              <div className="font-semibold">Week Warrior</div>
              <div className="text-sm text-yellow-100">7-day cooking streak</div>
            </div>
          )}
          {stats.totalCooks >= 50 && (
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <div className="text-3xl mb-2">⭐</div>
              <div className="font-semibold">Master Chef</div>
              <div className="text-sm text-yellow-100">Cooked 50+ recipes</div>
            </div>
          )}
          {stats.cookStreak >= 30 && (
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <div className="text-3xl mb-2">💎</div>
              <div className="font-semibold">Dedication</div>
              <div className="text-sm text-yellow-100">30-day streak</div>
            </div>
          )}
          {stats.totalCooks >= 100 && (
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <div className="text-3xl mb-2">👑</div>
              <div className="font-semibold">Legendary</div>
              <div className="text-sm text-yellow-100">100+ recipes cooked!</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Stats;

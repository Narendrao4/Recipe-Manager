import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BarChart3, ChefHat, Crown, Flame, Gem, Globe2, Medal, Star, Trophy } from 'lucide-react';
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
      <div className="flex items-center justify-center py-20">
        <div className="spinner" />
      </div>
    );
  }

  const cookCounts = Object.values(stats.cooksByDay as Record<string, number>);
  const maxCooksInDay = cookCounts.length > 0 ? Math.max(...cookCounts) : 0;

  const overviewCards = [
    {
      icon: Flame,
      value: stats.cookStreak,
      label: 'Day Streak',
      className: 'from-green-400 to-green-600',
    },
    {
      icon: ChefHat,
      value: stats.totalCooks,
      label: 'Total Cooks',
      className: 'from-blue-400 to-blue-600',
    },
    {
      icon: Star,
      value: stats.mostCookedRecipe?.title || 'None',
      label: 'Most Cooked',
      className: 'from-purple-400 to-purple-600',
    },
    {
      icon: Globe2,
      value: stats.favoriteCuisine || 'None',
      label: 'Favorite Cuisine',
      className: 'from-orange-400 to-orange-600',
    },
  ];

  const achievements = [
    {
      enabled: stats.totalCooks >= 1,
      icon: Medal,
      title: 'First Cook',
      description: 'Cooked your first recipe',
    },
    {
      enabled: stats.totalCooks >= 10,
      icon: ChefHat,
      title: 'Home Chef',
      description: 'Cooked 10+ recipes',
    },
    {
      enabled: stats.cookStreak >= 7,
      icon: Flame,
      title: 'Week Warrior',
      description: '7-day cooking streak',
    },
    {
      enabled: stats.totalCooks >= 50,
      icon: Star,
      title: 'Master Chef',
      description: 'Cooked 50+ recipes',
    },
    {
      enabled: stats.cookStreak >= 30,
      icon: Gem,
      title: 'Dedication',
      description: '30-day streak',
    },
    {
      enabled: stats.totalCooks >= 100,
      icon: Crown,
      title: 'Legendary',
      description: '100+ recipes cooked',
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="flex items-center gap-3 text-4xl font-display font-bold text-forest dark:text-cream">
        <BarChart3 className="h-9 w-9 text-terracotta" />
        Cooking Statistics
      </h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {overviewCards.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.label} className={`rounded-xl bg-gradient-to-br ${card.className} p-6 text-white shadow-lg`}>
              <Icon className="mb-3 h-10 w-10" />
              <div className="line-clamp-1 text-3xl font-bold">{card.value}</div>
              <div className="text-white/80">{card.label}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-forest-dark">
        <h2 className="mb-6 font-display text-2xl font-semibold">Cooking by Day of Week</h2>
        <div className="space-y-4">
          {Object.entries(stats.cooksByDay).map(([day, count]: [string, any]) => (
            <div key={day}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">{day}</span>
                <span className="font-bold text-terracotta">{count} cooks</span>
              </div>
              <div className="h-6 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="flex h-6 items-center justify-end rounded-full bg-gradient-to-r from-terracotta to-terracotta-dark pr-3 text-sm font-semibold text-white transition-all"
                  style={{ width: `${maxCooksInDay > 0 ? (count / maxCooksInDay) * 100 : 0}%` }}
                >
                  {count > 0 && count}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {stats.recentCooks && stats.recentCooks.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-forest-dark">
          <h2 className="mb-6 font-display text-2xl font-semibold">Recent Cooking Activity</h2>
          <div className="space-y-4">
            {stats.recentCooks.map((cook: any) => (
              <div key={cook.id} className="flex items-center justify-between border-b border-gray-200 py-3 dark:border-gray-700">
                <div>
                  <Link
                    to={`/recipes/${cook.recipeId}`}
                    className="text-lg font-semibold hover:text-terracotta"
                  >
                    {cook.recipe.title}
                  </Link>
                  {cook.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">{cook.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 dark:text-gray-300">
                    {new Date(cook.cookedAt).toLocaleDateString()}
                  </div>
                  {cook.servings && (
                    <div className="text-xs text-gray-400 dark:text-gray-400">{cook.servings} servings</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 p-6 text-white shadow-lg">
        <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-semibold">
          <Trophy className="h-6 w-6" />
          Achievements
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {achievements
            .filter((achievement) => achievement.enabled)
            .map((achievement) => {
              const Icon = achievement.icon;

              return (
                <div key={achievement.title} className="rounded-lg bg-white/20 p-4 backdrop-blur">
                  <Icon className="mb-2 h-8 w-8" />
                  <div className="font-semibold">{achievement.title}</div>
                  <div className="text-sm text-yellow-100">{achievement.description}</div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default Stats;

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import RecipeCard from '../components/RecipeCard';

const Favorites = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const queryClient = useQueryClient();

  const { data: recipes, isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const { data } = await api.get('/recipes');
      return data;
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: async (recipeId: string) => {
      const { data } = await api.post(`/recipes/${recipeId}/favorite`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });

  const favoriteRecipes = useMemo(() => {
    return (recipes || [])
      .filter((recipe: any) => recipe.isFavorite)
      .filter((recipe: any) => {
        const matchesSearch =
          !searchTerm ||
          recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          recipe.description?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCuisine = !cuisineFilter || recipe.cuisine === cuisineFilter;
        const matchesDifficulty = !difficultyFilter || recipe.difficulty === difficultyFilter;

        return matchesSearch && matchesCuisine && matchesDifficulty;
      });
  }, [recipes, searchTerm, cuisineFilter, difficultyFilter]);

  const cuisines: string[] = [
    ...new Set(
      ((recipes || [])
        .filter((r: any) => r.isFavorite)
        .map((r: any) => r.cuisine)
        .filter(Boolean) as string[])
    ),
  ];

  const handleFavoriteToggle = (recipeId: string) => {
    favoriteMutation.mutate(recipeId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-display font-bold text-forest dark:text-cream">Favorite Recipes</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Your hand-picked collection for quick access.
          </p>
        </div>
        <Link to="/recipes" className="btn-secondary">
          Browse All Recipes
        </Link>
      </div>

      <div className="bg-white dark:bg-forest-dark rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Search Favorites</label>
            <input
              type="text"
              placeholder="Search favorites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Cuisine</label>
            <select
              value={cuisineFilter}
              onChange={(e) => setCuisineFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All Cuisines</option>
              {cuisines.map((cuisine: string) => (
                <option key={cuisine} value={cuisine}>
                  {cuisine}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Difficulty</label>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All Levels</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="spinner"></div>
        </div>
      ) : favoriteRecipes.length > 0 ? (
        <>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Showing {favoriteRecipes.length} favorite {favoriteRecipes.length === 1 ? 'recipe' : 'recipes'}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {favoriteRecipes.map((recipe: any) => (
              <RecipeCard key={recipe.id} recipe={recipe} onFavoriteToggle={handleFavoriteToggle} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-forest-dark rounded-xl shadow-lg">
          <div className="text-6xl mb-4">❤️</div>
          <h3 className="text-2xl font-display font-semibold mb-2">No favorites yet</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {searchTerm || cuisineFilter || difficultyFilter
              ? 'No favorites match your current filters.'
              : 'Tap the heart icon on any recipe to add it here.'}
          </p>
          <Link to="/recipes" className="btn-primary inline-block">
            Explore Recipes
          </Link>
        </div>
      )}
    </div>
  );
};

export default Favorites;
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import RecipeCard from '../components/RecipeCard';

const Recipes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const queryClient = useQueryClient();

  const { data: recipes, isLoading } = useQuery({
    queryKey: ['recipes', searchTerm, cuisineFilter, difficultyFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (cuisineFilter) params.append('cuisine', cuisineFilter);
      if (difficultyFilter) params.append('difficulty', difficultyFilter);
      
      const { data } = await api.get(`/recipes?${params}`);
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

  const handleFavoriteToggle = (recipeId: string) => {
    favoriteMutation.mutate(recipeId);
  };

  // Get unique cuisines for filter
  const cuisines = [...new Set(recipes?.map((r: any) => r.cuisine).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-display font-bold text-forest dark:text-cream">My Recipes</h1>
        <Link to="/recipes/new" className="btn-primary">
          + New Recipe
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-forest-dark rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <input
              type="text"
              placeholder="Search recipes..."
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

      {/* Recipe Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="spinner"></div>
        </div>
      ) : recipes && recipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recipes.map((recipe: any) => (
            <RecipeCard key={recipe.id} recipe={recipe} onFavoriteToggle={handleFavoriteToggle} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📖</div>
          <h3 className="text-2xl font-display font-semibold mb-2">No recipes found</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {searchTerm || cuisineFilter || difficultyFilter
              ? 'Try adjusting your filters'
              : 'Start by creating your first recipe'}
          </p>
          <Link to="/recipes/new" className="btn-primary inline-block">
            Create Recipe
          </Link>
        </div>
      )}
    </div>
  );
};

export default Recipes;

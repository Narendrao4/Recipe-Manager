import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SearchX } from 'lucide-react';
import api from '../lib/api';
import RecipeCard from '../components/RecipeCard';
import RecipeApiImporter from '../components/RecipeApiImporter';
import { useToast } from '../components/ui/toast';

const Recipes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const lastEmptyToast = useRef('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      toast({
        title: 'Favorites updated',
        description: 'Your recipe collection has been updated.',
        tone: 'success',
      });
    },
    onError: () => {
      toast({
        title: 'Favorite update failed',
        description: 'Please try again.',
        tone: 'error',
      });
    },
  });

  const handleFavoriteToggle = (recipeId: string) => {
    favoriteMutation.mutate(recipeId);
  };

  const handleImportedRecipe = () => {
    setSearchTerm('');
    setCuisineFilter('');
    setDifficultyFilter('');
    queryClient.invalidateQueries({ queryKey: ['recipes'] });
  };

  const cuisines: string[] = [
    ...new Set(((recipes || []).map((r: any) => r.cuisine).filter(Boolean) as string[])),
  ];

  const hasActiveFilters = Boolean(searchTerm.trim() || cuisineFilter || difficultyFilter);

  useEffect(() => {
    if (!isLoading && recipes && recipes.length === 0 && hasActiveFilters) {
      const signature = `${searchTerm.trim()}|${cuisineFilter}|${difficultyFilter}`;
      if (lastEmptyToast.current !== signature) {
        lastEmptyToast.current = signature;
        toast({
          title: 'No recipes found',
          description: 'Try adjusting your search or filters.',
          tone: 'info',
        });
      }
    }
  }, [cuisineFilter, difficultyFilter, hasActiveFilters, isLoading, recipes, searchTerm, toast]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-forest dark:text-cream">My Recipes</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Your saved recipes plus new imports from the free recipe API.
          </p>
        </div>
        <Link to="/recipes/new" className="btn-primary text-center">
          New Recipe
        </Link>
      </div>

      <RecipeApiImporter
        title="Import recipes into My Recipes"
        description="Search TheMealDB, import a result, and it will appear in this collection."
        onImported={handleImportedRecipe}
        importButtonLabel="Import to My Recipes"
      />

      <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-forest-dark">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium">Search</label>
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Cuisine</label>
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
            <label className="mb-2 block text-sm font-medium">Difficulty</label>
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
        <div className="flex items-center justify-center py-20">
          <div className="spinner" />
        </div>
      ) : recipes && recipes.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe: any) => (
            <RecipeCard key={recipe.id} recipe={recipe} onFavoriteToggle={handleFavoriteToggle} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-white py-20 text-center shadow-lg dark:bg-forest-dark">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-cream text-terracotta dark:bg-forest-light dark:text-cream">
            <SearchX className="h-8 w-8" />
          </div>
          <h3 className="mb-2 font-display text-2xl font-semibold">No recipes found</h3>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            {hasActiveFilters ? 'Try adjusting your filters.' : 'Start by creating your first recipe.'}
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

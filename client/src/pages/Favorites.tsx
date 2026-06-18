import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, SearchX } from 'lucide-react';
import api from '../lib/api';
import RecipeCard from '../components/RecipeCard';
import { useToast } from '../components/ui/toast';

const Favorites = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const lastEmptyToast = useRef('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      toast({
        title: 'Favorite removed',
        description: 'The recipe was removed from Favorites.',
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

  const hasActiveFilters = Boolean(searchTerm.trim() || cuisineFilter || difficultyFilter);

  useEffect(() => {
    if (!isLoading && favoriteRecipes.length === 0 && hasActiveFilters) {
      const signature = `${searchTerm.trim()}|${cuisineFilter}|${difficultyFilter}`;
      if (lastEmptyToast.current !== signature) {
        lastEmptyToast.current = signature;
        toast({
          title: 'No favorites found',
          description: 'No favorite recipes match those filters.',
          tone: 'info',
        });
      }
    }
  }, [cuisineFilter, difficultyFilter, favoriteRecipes.length, hasActiveFilters, isLoading, searchTerm, toast]);

  const handleFavoriteToggle = (recipeId: string) => {
    favoriteMutation.mutate(recipeId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-forest dark:text-cream">Favorite Recipes</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-300">
            Your hand-picked collection for quick access.
          </p>
        </div>
        <Link to="/recipes" className="btn-secondary text-center">
          Browse All Recipes
        </Link>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-forest-dark">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium">Search Favorites</label>
            <input
              type="text"
              placeholder="Search favorites..."
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
      ) : favoriteRecipes.length > 0 ? (
        <>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Showing {favoriteRecipes.length} favorite {favoriteRecipes.length === 1 ? 'recipe' : 'recipes'}
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {favoriteRecipes.map((recipe: any) => (
              <RecipeCard key={recipe.id} recipe={recipe} onFavoriteToggle={handleFavoriteToggle} />
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-xl bg-white py-20 text-center shadow-lg dark:bg-forest-dark">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-cream text-terracotta dark:bg-forest-light dark:text-cream">
            {hasActiveFilters ? <SearchX className="h-8 w-8" /> : <Heart className="h-8 w-8" />}
          </div>
          <h3 className="mb-2 font-display text-2xl font-semibold">No favorites yet</h3>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            {hasActiveFilters
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

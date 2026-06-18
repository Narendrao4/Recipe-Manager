import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Lightbulb, Search, SearchX, Sparkles, Target, X } from 'lucide-react';
import api from '../lib/api';
import RecipeCard from '../components/RecipeCard';
import { useToast } from '../components/ui/toast';

const IngredientMatcher = () => {
  const [ingredientInput, setIngredientInput] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [matchedRecipes, setMatchedRecipes] = useState<any[]>([]);
  const { toast } = useToast();

  const matchMutation = useMutation({
    mutationFn: async (ingredientList: string[]) => {
      const { data } = await api.post('/recipes/match', { ingredients: ingredientList });
      return data;
    },
    onSuccess: (data) => {
      setMatchedRecipes(data);
      if (data.length === 0) {
        toast({
          title: 'No recipes found',
          description: 'Try adding more common ingredients.',
          tone: 'info',
        });
      } else {
        toast({
          title: 'Recipes matched',
          description: `Found ${data.length} possible ${data.length === 1 ? 'recipe' : 'recipes'}.`,
          tone: 'success',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Match failed',
        description: 'Unable to match ingredients right now.',
        tone: 'error',
      });
    },
  });

  const addIngredient = () => {
    const nextIngredient = ingredientInput.trim();

    if (!nextIngredient) {
      toast({
        title: 'Ingredient needed',
        description: 'Type an ingredient before adding it.',
        tone: 'info',
      });
      return;
    }

    if (ingredients.includes(nextIngredient)) {
      toast({
        title: 'Already added',
        description: `${nextIngredient} is already in your list.`,
        tone: 'info',
      });
      return;
    }

    setIngredients([...ingredients, nextIngredient]);
    setIngredientInput('');
    toast({
      title: 'Ingredient added',
      description: `${nextIngredient} is ready for matching.`,
      tone: 'success',
    });
  };

  const removeIngredient = (ingredient: string) => {
    setIngredients(ingredients.filter((i) => i !== ingredient));
    toast({
      title: 'Ingredient removed',
      description: `${ingredient} was removed from the matcher.`,
      tone: 'success',
    });
  };

  const handleMatch = () => {
    if (ingredients.length === 0) {
      toast({
        title: 'Add ingredients first',
        description: 'The matcher needs at least one ingredient.',
        tone: 'info',
      });
      return;
    }

    matchMutation.mutate(ingredients);
  };

  const perfectMatches = matchedRecipes.filter((r) => r.matchScore === 100);
  const highMatches = matchedRecipes.filter((r) => r.matchScore >= 75 && r.matchScore < 100);
  const mediumMatches = matchedRecipes.filter((r) => r.matchScore >= 50 && r.matchScore < 75);
  const lowMatches = matchedRecipes.filter((r) => r.matchScore < 50);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 flex items-center gap-3 text-4xl font-display font-bold text-forest dark:text-cream">
          <Target className="h-9 w-9 text-terracotta" />
          Smart Ingredient Matcher
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Tell us what's in your fridge, and we'll find recipes you can make.
        </p>
      </div>

      <div className="space-y-4 rounded-xl bg-white p-6 shadow-lg dark:bg-forest-dark">
        <h2 className="font-display text-2xl font-semibold">Available Ingredients</h2>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            placeholder="Add an ingredient (e.g., chicken, tomatoes)"
            value={ingredientInput}
            onChange={(e) => setIngredientInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addIngredient()}
            className="input-field flex-1"
          />
          <button onClick={addIngredient} className="btn-outline">
            Add
          </button>
        </div>

        {ingredients.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2">
              {ingredients.map((ingredient) => (
                <span
                  key={ingredient}
                  className="flex items-center gap-2 rounded-full bg-terracotta px-4 py-2 text-white"
                >
                  {ingredient}
                  <button
                    onClick={() => removeIngredient(ingredient)}
                    className="rounded-full p-0.5 hover:bg-white/15"
                    aria-label={`Remove ${ingredient}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>

            <button
              onClick={handleMatch}
              disabled={matchMutation.isPending}
              className="btn-primary inline-flex w-full items-center justify-center gap-2"
            >
              <Search className="h-4 w-4" />
              {matchMutation.isPending ? 'Finding recipes...' : `Find Recipes (${ingredients.length} ingredients)`}
            </button>
          </>
        )}
      </div>

      {matchedRecipes.length > 0 && (
        <div>
          <h2 className="mb-4 font-display text-2xl font-semibold">
            Found {matchedRecipes.length} Recipe{matchedRecipes.length !== 1 ? 's' : ''}
          </h2>

          {perfectMatches.length > 0 && (
            <div className="mb-8">
              <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-green-600 dark:text-green-300">
                <Sparkles className="h-5 w-5" />
                Perfect Matches (100%)
              </h3>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {perfectMatches.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            </div>
          )}

          {highMatches.length > 0 && (
            <div className="mb-8">
              <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-blue-600 dark:text-blue-300">
                <Target className="h-5 w-5" />
                Almost There (75-99%)
              </h3>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {highMatches.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            </div>
          )}

          {mediumMatches.length > 0 && (
            <div className="mb-8">
              <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-yellow-600 dark:text-yellow-300">
                <Lightbulb className="h-5 w-5" />
                Worth Considering (50-74%)
              </h3>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {mediumMatches.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            </div>
          )}

          {lowMatches.length > 0 && (
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-600 dark:text-gray-300">
                <Search className="h-5 w-5" />
                Other Recipes (&lt;50%)
              </h3>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {lowMatches.slice(0, 6).map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {matchMutation.isSuccess && matchedRecipes.length === 0 && (
        <div className="rounded-xl bg-white py-20 text-center shadow-lg dark:bg-forest-dark">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-cream text-terracotta dark:bg-forest-light dark:text-cream">
            <SearchX className="h-8 w-8" />
          </div>
          <h3 className="mb-2 font-display text-2xl font-semibold">No recipes found</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Try adding more common ingredients or create a new recipe.
          </p>
        </div>
      )}
    </div>
  );
};

export default IngredientMatcher;

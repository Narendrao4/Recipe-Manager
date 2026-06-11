import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import RecipeCard from '../components/RecipeCard';

const IngredientMatcher = () => {
  const [ingredientInput, setIngredientInput] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [matchedRecipes, setMatchedRecipes] = useState<any[]>([]);

  const matchMutation = useMutation({
    mutationFn: async (ingredientList: string[]) => {
      const { data } = await api.post('/recipes/match', { ingredients: ingredientList });
      return data;
    },
    onSuccess: (data) => {
      setMatchedRecipes(data);
    },
  });

  const addIngredient = () => {
    if (ingredientInput.trim() && !ingredients.includes(ingredientInput.trim())) {
      setIngredients([...ingredients, ingredientInput.trim()]);
      setIngredientInput('');
    }
  };

  const removeIngredient = (ingredient: string) => {
    setIngredients(ingredients.filter((i) => i !== ingredient));
  };

  const handleMatch = () => {
    if (ingredients.length > 0) {
      matchMutation.mutate(ingredients);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-display font-bold text-forest dark:text-cream mb-2">
          🎯 Smart Ingredient Matcher
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Tell us what's in your fridge, and we'll find recipes you can make!
        </p>
      </div>

      {/* Ingredient Input */}
      <div className="bg-white dark:bg-forest-dark rounded-xl shadow-lg p-6 space-y-4">
        <h2 className="text-2xl font-display font-semibold">Available Ingredients</h2>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add an ingredient (e.g., chicken, tomatoes)"
            value={ingredientInput}
            onChange={(e) => setIngredientInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
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
                  className="px-4 py-2 bg-terracotta text-white rounded-full flex items-center gap-2"
                >
                  {ingredient}
                  <button onClick={() => removeIngredient(ingredient)} className="font-bold">
                    ✕
                  </button>
                </span>
              ))}
            </div>

            <button
              onClick={handleMatch}
              disabled={matchMutation.isPending}
              className="btn-primary w-full"
            >
              {matchMutation.isPending ? 'Finding recipes...' : `Find Recipes (${ingredients.length} ingredients)`}
            </button>
          </>
        )}
      </div>

      {/* Results */}
      {matchedRecipes.length > 0 && (
        <div>
          <h2 className="text-2xl font-display font-semibold mb-4">
            Found {matchedRecipes.length} Recipe{matchedRecipes.length !== 1 ? 's' : ''}
          </h2>

          {/* Perfect Matches */}
          {matchedRecipes.filter((r) => r.matchScore === 100).length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-green-600 mb-4">
                ✨ Perfect Matches (100%)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {matchedRecipes
                  .filter((r) => r.matchScore === 100)
                  .map((recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                  ))}
              </div>
            </div>
          )}

          {/* High Matches (75-99%) */}
          {matchedRecipes.filter((r) => r.matchScore >= 75 && r.matchScore < 100).length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-blue-600 mb-4">
                🎯 Almost There (75-99%)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {matchedRecipes
                  .filter((r) => r.matchScore >= 75 && r.matchScore < 100)
                  .map((recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                  ))}
              </div>
            </div>
          )}

          {/* Medium Matches (50-74%) */}
          {matchedRecipes.filter((r) => r.matchScore >= 50 && r.matchScore < 75).length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-yellow-600 mb-4">
                💡 Worth Considering (50-74%)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {matchedRecipes
                  .filter((r) => r.matchScore >= 50 && r.matchScore < 75)
                  .map((recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                  ))}
              </div>
            </div>
          )}

          {/* Low Matches */}
          {matchedRecipes.filter((r) => r.matchScore < 50).length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-gray-600 mb-4">
                🔍 Other Recipes (&lt;50%)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {matchedRecipes
                  .filter((r) => r.matchScore < 50)
                  .slice(0, 6)
                  .map((recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {matchMutation.isSuccess && matchedRecipes.length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-forest-dark rounded-xl">
          <div className="text-6xl mb-4">😕</div>
          <h3 className="text-2xl font-display font-semibold mb-2">No recipes found</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Try adding more common ingredients or create a new recipe!
          </p>
        </div>
      )}
    </div>
  );
};

export default IngredientMatcher;

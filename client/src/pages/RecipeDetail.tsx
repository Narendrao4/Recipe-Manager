import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

const RecipeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: recipe, isLoading } = useQuery({
    queryKey: ['recipe', id],
    queryFn: async () => {
      const { data } = await api.get(`/recipes/${id}`);
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/recipes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      navigate('/recipes');
    },
  });

  const cookMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/recipes/${id}/cook`, { servings: recipe?.servings });
    },
    onSuccess: () => {
      alert('Cook logged successfully! 🎉');
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const remixMutation = useMutation({
    mutationFn: async (variation: string) => {
      const { data } = await api.post(`/recipes/${id}/remix`, { variation });
      return data;
    },
    onSuccess: (data) => {
      // Show remix results in a modal or navigate to a new page
      console.log('Remix data:', data);
      alert(`Recipe remixed successfully!\n\nKey changes:\n${data.remixed.changes.join('\n')}`);
    },
  });

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this recipe?')) {
      deleteMutation.mutate();
    }
  };

  const handleRemix = (variation: 'healthier' | 'budget' | 'gourmet') => {
    if (confirm(`Generate ${variation} version of this recipe using AI?`)) {
      remixMutation.mutate(variation);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">😕</div>
        <h3 className="text-2xl font-display font-semibold">Recipe not found</h3>
      </div>
    );
  }

  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-5xl font-display font-bold text-forest dark:text-cream">
            {recipe.title}
          </h1>
          <div className="flex gap-2">
            <Link to={`/recipes/${id}/edit`} className="btn-secondary">
              Edit
            </Link>
            <button onClick={handleDelete} className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600">
              Delete
            </button>
          </div>
        </div>
        {recipe.description && (
          <p className="text-lg text-gray-600 dark:text-gray-300">{recipe.description}</p>
        )}
      </div>

      {/* Photo & Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          {recipe.photoUrl ? (
            <img
              src={recipe.photoUrl}
              alt={recipe.title}
              className="w-full aspect-video object-cover rounded-xl shadow-lg"
            />
          ) : (
            <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center text-8xl">
              🍽️
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-forest-dark rounded-xl shadow-lg p-6 space-y-3">
            <div className="flex justify-between">
              <span className="font-semibold">Difficulty:</span>
              <span className={`badge ${
                recipe.difficulty === 'Easy' ? 'badge-success' :
                recipe.difficulty === 'Medium' ? 'badge-warning' : 'badge-danger'
              }`}>
                {recipe.difficulty}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Prep Time:</span>
              <span>{recipe.prepTime} minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Cook Time:</span>
              <span>{recipe.cookTime} minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Total Time:</span>
              <span className="font-bold text-terracotta">{totalTime} minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Servings:</span>
              <span>{recipe.servings}</span>
            </div>
            {recipe.cuisine && (
              <div className="flex justify-between">
                <span className="font-semibold">Cuisine:</span>
                <span>{recipe.cuisine}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Link to={`/recipes/${id}/cook`} className="btn-primary w-full block text-center">
              🎙️ Start Cook Mode
            </Link>
            <button onClick={() => cookMutation.mutate()} className="btn-secondary w-full">
              ✅ Mark as Cooked Today
            </button>
          </div>
        </div>
      </div>

      {/* Tags */}
      {recipe.tags && recipe.tags.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {recipe.tags.map((tag: any) => (
            <span key={tag.id} className="px-4 py-2 bg-terracotta text-white rounded-full">
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Remix AI */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-display font-semibold mb-3">🤖 Recipe Remix AI</h2>
        <p className="mb-4">Get AI-powered variations of this recipe:</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleRemix('healthier')}
            disabled={remixMutation.isPending}
            className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 disabled:opacity-50"
          >
            🥗 Healthier Version
          </button>
          <button
            onClick={() => handleRemix('budget')}
            disabled={remixMutation.isPending}
            className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 disabled:opacity-50"
          >
            💰 Budget Version
          </button>
          <button
            onClick={() => handleRemix('gourmet')}
            disabled={remixMutation.isPending}
            className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 disabled:opacity-50"
          >
            ⭐ Gourmet Upgrade
          </button>
        </div>
        {remixMutation.isPending && <p className="mt-3 animate-pulse">Generating remix with Claude AI...</p>}
      </div>

      {/* Ingredients */}
      <div className="bg-white dark:bg-forest-dark rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-3xl font-display font-semibold mb-4">Ingredients</h2>
        <ul className="space-y-2">
          {recipe.ingredients?.map((ing: any) => (
            <li key={ing.id} className="flex justify-between items-start py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="font-medium">
                {ing.quantity} {ing.unit} {ing.name}
              </span>
              {ing.substitution && (
                <span className="text-sm text-gray-500 italic">
                  Sub: {ing.substitution}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Steps */}
      <div className="bg-white dark:bg-forest-dark rounded-xl shadow-lg p-6">
        <h2 className="text-3xl font-display font-semibold mb-4">Cooking Steps</h2>
        <ol className="space-y-4">
          {recipe.steps?.map((step: any) => (
            <li key={step.id} className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-terracotta text-white rounded-full flex items-center justify-center font-bold">
                {step.stepNumber}
              </div>
              <div className="flex-1">
                <p className="text-lg">{step.instruction}</p>
                {step.timerMinutes && (
                  <p className="text-sm text-terracotta font-medium mt-1">
                    ⏱️ Timer: {step.timerMinutes} minutes
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default RecipeDetail;

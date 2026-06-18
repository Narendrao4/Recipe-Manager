import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bot,
  CheckCircle2,
  Clock3,
  ImageIcon,
  Leaf,
  Mic,
  Pencil,
  SearchX,
  Star,
  Trash2,
  Utensils,
  Wallet,
} from 'lucide-react';
import api from '../lib/api';
import { useToast } from '../components/ui/toast';

const RecipeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      toast({
        title: 'Recipe deleted',
        description: 'The recipe was removed from your collection.',
        tone: 'success',
      });
      navigate('/recipes');
    },
    onError: () => {
      toast({
        title: 'Delete failed',
        description: 'Unable to delete this recipe.',
        tone: 'error',
      });
    },
  });

  const cookMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/recipes/${id}/cook`, { servings: recipe?.servings });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast({
        title: 'Cook logged',
        description: 'Your cooking stats have been updated.',
        tone: 'success',
      });
    },
    onError: () => {
      toast({
        title: 'Cook log failed',
        description: 'Unable to mark this recipe as cooked.',
        tone: 'error',
      });
    },
  });

  const remixMutation = useMutation({
    mutationFn: async (variation: string) => {
      const { data } = await api.post(`/recipes/${id}/remix`, { variation });
      return data;
    },
    onSuccess: (data) => {
      const changes = data.remixed?.changes?.slice(0, 2).join(' ');
      toast({
        title: 'Recipe remixed',
        description: changes || 'AI variation generated successfully.',
        tone: 'success',
      });
    },
    onError: () => {
      toast({
        title: 'Remix failed',
        description: 'Unable to generate that variation.',
        tone: 'error',
      });
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
      <div className="flex items-center justify-center py-20">
        <div className="spinner" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="py-20 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-cream text-terracotta dark:bg-forest-light dark:text-cream">
          <SearchX className="h-8 w-8" />
        </div>
        <h3 className="font-display text-2xl font-semibold">Recipe not found</h3>
      </div>
    );
  }

  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <h1 className="text-5xl font-display font-bold text-forest dark:text-cream">
            {recipe.title}
          </h1>
          <div className="flex gap-2">
            <Link to={`/recipes/${id}/edit`} className="btn-secondary inline-flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
            <button onClick={handleDelete} className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-6 py-3 text-white hover:bg-red-600">
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
        {recipe.description && (
          <p className="text-lg text-gray-600 dark:text-gray-300">{recipe.description}</p>
        )}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          {recipe.photoUrl ? (
            <img
              src={recipe.photoUrl}
              alt={recipe.title}
              className="aspect-video w-full rounded-xl object-cover shadow-lg"
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-gray-200 text-cream-dark shadow-lg dark:bg-forest-light dark:text-cream/70">
              <ImageIcon className="h-16 w-16" />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-3 rounded-xl bg-white p-6 shadow-lg dark:bg-forest-dark">
            <div className="flex justify-between">
              <span className="font-semibold">Difficulty:</span>
              <span
                className={`badge ${
                  recipe.difficulty === 'Easy'
                    ? 'badge-success'
                    : recipe.difficulty === 'Medium'
                      ? 'badge-warning'
                      : 'badge-danger'
                }`}
              >
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
            <Link to={`/recipes/${id}/cook`} className="btn-primary flex w-full items-center justify-center gap-2">
              <Mic className="h-4 w-4" />
              Start Cook Mode
            </Link>
            <button onClick={() => cookMutation.mutate()} className="btn-secondary flex w-full items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Mark as Cooked Today
            </button>
          </div>
        </div>
      </div>

      {recipe.tags && recipe.tags.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {recipe.tags.map((tag: any) => (
            <span key={tag.id} className="rounded-full bg-terracotta px-4 py-2 text-white">
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      <div className="mb-8 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white shadow-lg">
        <h2 className="mb-3 flex items-center gap-2 font-display text-2xl font-semibold">
          <Bot className="h-6 w-6" />
          Recipe Remix AI
        </h2>
        <p className="mb-4">Get AI-powered variations of this recipe:</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleRemix('healthier')}
            disabled={remixMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-purple-600 hover:bg-gray-100 disabled:opacity-50"
          >
            <Leaf className="h-4 w-4" />
            Healthier Version
          </button>
          <button
            onClick={() => handleRemix('budget')}
            disabled={remixMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-purple-600 hover:bg-gray-100 disabled:opacity-50"
          >
            <Wallet className="h-4 w-4" />
            Budget Version
          </button>
          <button
            onClick={() => handleRemix('gourmet')}
            disabled={remixMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-purple-600 hover:bg-gray-100 disabled:opacity-50"
          >
            <Star className="h-4 w-4" />
            Gourmet Upgrade
          </button>
        </div>
        {remixMutation.isPending && <p className="mt-3 animate-pulse">Generating remix with Claude AI...</p>}
      </div>

      <div className="mb-8 rounded-xl bg-white p-6 shadow-lg dark:bg-forest-dark">
        <h2 className="mb-4 font-display text-3xl font-semibold">Ingredients</h2>
        <ul className="space-y-2">
          {recipe.ingredients?.map((ing: any) => (
            <li key={ing.id} className="flex items-start justify-between border-b border-gray-200 py-2 dark:border-gray-700">
              <span className="font-medium">
                {ing.quantity} {ing.unit} {ing.name}
              </span>
              {ing.substitution && (
                <span className="text-sm italic text-gray-500 dark:text-gray-300">
                  Sub: {ing.substitution}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-forest-dark">
        <h2 className="mb-4 flex items-center gap-2 font-display text-3xl font-semibold">
          <Utensils className="h-7 w-7 text-terracotta" />
          Cooking Steps
        </h2>
        <ol className="space-y-4">
          {recipe.steps?.map((step: any) => (
            <li key={step.id} className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-terracotta font-bold text-white">
                {step.stepNumber}
              </div>
              <div className="flex-1">
                <p className="text-lg">{step.instruction}</p>
                {step.timerMinutes && (
                  <p className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-terracotta">
                    <Clock3 className="h-4 w-4" />
                    Timer: {step.timerMinutes} minutes
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

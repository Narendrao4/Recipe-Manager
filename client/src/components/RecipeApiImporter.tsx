import { FormEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';

export interface ExternalRecipeDraft {
  externalId: string;
  source: string;
  title: string;
  description: string;
  cuisine: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  prepTime: number;
  cookTime: number;
  servings: number;
  photoUrl?: string;
  ingredients: {
    name: string;
    quantity: number;
    unit: string;
    substitution?: string;
  }[];
  steps: {
    instruction: string;
    timerMinutes?: string | number | null;
  }[];
  tags: string[];
}

interface RecipeApiImporterProps {
  title?: string;
  description?: string;
  className?: string;
  onUseRecipe?: (recipe: ExternalRecipeDraft) => void;
  onImported?: (recipe: unknown) => void;
  showImportAction?: boolean;
  showReviewAction?: boolean;
  importButtonLabel?: string;
  reviewButtonLabel?: string;
}

const RecipeApiImporter = ({
  title = 'Find recipes from the free API',
  description,
  className = '',
  onUseRecipe,
  onImported,
  showImportAction = true,
  showReviewAction = false,
  importButtonLabel = 'Import',
  reviewButtonLabel = 'Review in form',
}: RecipeApiImporterProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeImportId, setActiveImportId] = useState('');
  const [importedIds, setImportedIds] = useState<string[]>([]);

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const { data } = await api.get('/recipes/external/themealdb/search', {
        params: { q: query },
      });
      return data as ExternalRecipeDraft[];
    },
  });

  const importMutation = useMutation({
    mutationFn: async (externalId: string) => {
      setActiveImportId(externalId);
      const { data } = await api.post('/recipes/external/themealdb/import', { externalId });
      return data;
    },
    onSuccess: (recipe, externalId) => {
      setImportedIds((current) => [...new Set([...current, externalId])]);
      onImported?.(recipe);
    },
    onSettled: () => {
      setActiveImportId('');
    },
  });

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();

    const query = searchTerm.trim();
    if (query) {
      searchMutation.mutate(query);
    }
  };

  const hasResults = Boolean(searchMutation.data && searchMutation.data.length > 0);

  return (
    <div className={`bg-white dark:bg-forest-dark rounded-xl shadow-lg p-6 space-y-5 ${className}`}>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-display font-semibold text-forest dark:text-cream">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{description}</p>
          )}
        </div>
        <div className="text-sm font-medium text-terracotta">TheMealDB</div>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-3 md:flex-row">
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="input-field flex-1"
          placeholder="Search recipe name"
        />
        <button
          type="submit"
          disabled={searchMutation.isPending || !searchTerm.trim()}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {searchMutation.isPending ? 'Searching...' : 'Search'}
        </button>
      </form>

      {searchMutation.isError && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to search the recipe API right now.
        </p>
      )}

      {importMutation.isError && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Import failed. Please try again.
        </p>
      )}

      {searchMutation.isSuccess && !hasResults && (
        <p className="rounded-lg bg-cream-light px-4 py-3 text-sm text-gray-700">
          No API recipes found for that search.
        </p>
      )}

      {hasResults && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {searchMutation.data?.map((externalRecipe) => {
            const isImporting = importMutation.isPending && activeImportId === externalRecipe.externalId;
            const isImported = importedIds.includes(externalRecipe.externalId);

            return (
              <div
                key={externalRecipe.externalId}
                className="overflow-hidden rounded-lg border border-gray-200 bg-cream-light/40 dark:border-gray-700 dark:bg-forest/30"
              >
                <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr]">
                  <div className="h-44 bg-gray-200 sm:h-full">
                    {externalRecipe.photoUrl ? (
                      <img
                        src={externalRecipe.photoUrl}
                        alt={externalRecipe.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-gray-500">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex min-h-44 flex-col justify-between gap-4 p-4">
                    <div className="space-y-2">
                      <div>
                        <h3 className="font-display text-xl font-semibold leading-snug">
                          {externalRecipe.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {[externalRecipe.cuisine, externalRecipe.category].filter(Boolean).join(' / ') || 'Recipe'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="badge bg-blue-100 text-blue-800">
                          {externalRecipe.ingredients.length} ingredients
                        </span>
                        <span className="badge bg-green-100 text-green-800">
                          {externalRecipe.steps.length} steps
                        </span>
                        <span className="badge bg-orange-100 text-orange-800">
                          {externalRecipe.cookTime + externalRecipe.prepTime} min
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      {showReviewAction && onUseRecipe && (
                        <button
                          type="button"
                          onClick={() => onUseRecipe(externalRecipe)}
                          className="btn-outline flex-1 px-4 py-2 text-sm"
                        >
                          {reviewButtonLabel}
                        </button>
                      )}
                      {showImportAction && (
                        <button
                          type="button"
                          onClick={() => importMutation.mutate(externalRecipe.externalId)}
                          disabled={isImporting || isImported}
                          className="btn-primary flex-1 px-4 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isImported ? 'Imported' : isImporting ? 'Importing...' : importButtonLabel}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecipeApiImporter;

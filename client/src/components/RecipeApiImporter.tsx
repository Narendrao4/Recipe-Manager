import { FormEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Check, Clock3, Import, Search, Sparkles, Utensils } from 'lucide-react';
import api from '../lib/api';
import Badge from './ui/badge';
import Button from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import Input from './ui/input';
import { useToast } from './ui/toast';
import { cn } from '../lib/utils';

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
  const { toast } = useToast();

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
      toast({
        title: 'Recipe imported',
        description: 'It is now available in My Recipes.',
        tone: 'success',
      });
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
    <Card className={cn('relative overflow-hidden border-forest/10 bg-cream-light/95 shadow-xl', className)}>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(196,98,45,0.16),transparent_34%),radial-gradient(circle_at_92%_8%,rgba(27,58,45,0.15),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-terracotta/50 to-transparent" />

      <CardHeader className="relative pb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-terracotta/20 bg-white/70 px-3 py-1 text-xs font-semibold text-terracotta shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Free Recipe API
            </div>
            <CardTitle className="text-3xl text-forest dark:text-cream">{title}</CardTitle>
            {description && <CardDescription className="mt-2 max-w-2xl">{description}</CardDescription>}
          </div>
          <Badge variant="secondary" className="w-fit bg-white/75">
            TheMealDB
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-5">
        <form onSubmit={handleSearch} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="bg-white/90 pl-10"
              placeholder="Search Arrabiata, chicken, curry..."
            />
          </div>
          <Button type="submit" variant="secondary" disabled={searchMutation.isPending || !searchTerm.trim()}>
            <Search className="h-4 w-4" />
            {searchMutation.isPending ? 'Searching...' : 'Search'}
          </Button>
        </form>

        {searchMutation.isError && (
          <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            Unable to search the recipe API right now.
          </p>
        )}

        {importMutation.isError && (
          <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            Import failed. Please try again.
          </p>
        )}

        {searchMutation.isSuccess && !hasResults && (
          <p className="rounded-lg border border-forest/10 bg-white/70 px-4 py-3 text-sm text-gray-700">
            No API recipes found for that search.
          </p>
        )}

        {hasResults && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {searchMutation.data?.map((externalRecipe) => {
              const isImporting = importMutation.isPending && activeImportId === externalRecipe.externalId;
              const isImported = importedIds.includes(externalRecipe.externalId);

              return (
                <div
                  key={externalRecipe.externalId}
                  className="group overflow-hidden rounded-xl border border-forest/10 bg-white/90 shadow-sm transition-all hover:-translate-y-0.5 hover:border-terracotta/35 hover:shadow-xl dark:border-cream/10 dark:bg-forest-dark/90"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr]">
                    <div className="relative h-44 overflow-hidden bg-gray-200 sm:h-full">
                      {externalRecipe.photoUrl ? (
                        <img
                          src={externalRecipe.photoUrl}
                          alt={externalRecipe.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-gray-500">
                          No image
                        </div>
                      )}
                      {isImported && (
                        <div className="absolute inset-0 flex items-center justify-center bg-forest/60 text-white">
                          <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold backdrop-blur">
                            <Check className="h-4 w-4" />
                            Imported
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex min-h-44 flex-col justify-between gap-4 p-4">
                      <div className="space-y-2">
                        <div>
                          <h3 className="font-display text-xl font-semibold leading-snug text-forest dark:text-cream">
                            {externalRecipe.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {[externalRecipe.cuisine, externalRecipe.category].filter(Boolean).join(' / ') || 'Recipe'}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="secondary">
                            <Utensils className="h-3 w-3" />
                            {externalRecipe.ingredients.length} ingredients
                          </Badge>
                          <Badge variant="success">{externalRecipe.steps.length} steps</Badge>
                          <Badge variant="warning">
                            <Clock3 className="h-3 w-3" />
                            {externalRecipe.cookTime + externalRecipe.prepTime} min
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row">
                        {showReviewAction && onUseRecipe && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onUseRecipe(externalRecipe)}
                            className="flex-1"
                          >
                            {reviewButtonLabel}
                          </Button>
                        )}
                        {showImportAction && (
                          <Button
                            type="button"
                            onClick={() => importMutation.mutate(externalRecipe.externalId)}
                            disabled={isImporting || isImported}
                            className="flex-1"
                            size="sm"
                          >
                            <Import className="h-4 w-4" />
                            {isImported ? 'Imported' : isImporting ? 'Importing...' : importButtonLabel}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecipeApiImporter;

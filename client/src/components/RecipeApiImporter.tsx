import { FormEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Check, Clock3, ExternalLink, Import, PlayCircle, Search, Sparkles, Utensils, Video } from 'lucide-react';
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

interface YouTubeRecipeVideo {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
  watchUrl: string;
  embedUrl: string;
}

interface YouTubeSearchResult {
  configured: boolean;
  videos: YouTubeRecipeVideo[];
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
  const [selectedVideo, setSelectedVideo] = useState<YouTubeRecipeVideo | null>(null);
  const { toast } = useToast();

  const youtubeSearchMutation = useMutation({
    mutationFn: async (query: string) => {
      const { data } = await api.get('/recipes/external/youtube/search', {
        params: { q: query },
      });
      return data as YouTubeSearchResult;
    },
    onSuccess: (result) => {
      const firstVideo = result.videos[0] || null;
      setSelectedVideo(firstVideo);

      if (!result.configured) {
        toast({
          title: 'YouTube search needs an API key',
          description: 'Add YOUTUBE_API_KEY to server/.env to show cooking videos.',
          tone: 'info',
        });
        return;
      }

      if (result.videos.length === 0) {
        toast({
          title: 'No YouTube videos found',
          description: 'Try a more specific recipe search.',
          tone: 'info',
        });
        return;
      }

      toast({
        title: 'Cooking videos found',
        description: 'YouTube tutorials are ready below the recipe search.',
        tone: 'success',
      });
    },
    onError: () => {
      toast({
        title: 'YouTube search failed',
        description: 'Unable to load recipe videos right now.',
        tone: 'error',
      });
    },
  });

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const { data } = await api.get('/recipes/external/themealdb/search', {
        params: { q: query },
      });
      return data as ExternalRecipeDraft[];
    },
    onSuccess: (results, query) => {
      if (results.length === 0) {
        toast({
          title: 'No recipes found',
          description: `No API recipes matched "${query}". Searching YouTube instead.`,
          tone: 'info',
        });
        youtubeSearchMutation.mutate(query);
      } else {
        setSelectedVideo(null);
        youtubeSearchMutation.reset();
      }
    },
    onError: () => {
      toast({
        title: 'Search failed',
        description: 'Unable to search the recipe API right now.',
        tone: 'error',
      });
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
    onError: () => {
      toast({
        title: 'Import failed',
        description: 'Please try importing this recipe again.',
        tone: 'error',
      });
    },
    onSettled: () => {
      setActiveImportId('');
    },
  });

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();

    const query = searchTerm.trim();
    if (!query) {
      toast({
        title: 'Search needs a term',
        description: 'Enter a recipe name or ingredient first.',
        tone: 'info',
      });
      return;
    }

    setSelectedVideo(null);
    youtubeSearchMutation.reset();
    searchMutation.mutate(query);
  };

  const hasResults = Boolean(searchMutation.data && searchMutation.data.length > 0);
  const youtubeResult = youtubeSearchMutation.data;
  const youtubeVideos = youtubeResult?.videos || [];
  const shouldShowYoutubePanel =
    searchMutation.isSuccess && !hasResults && (youtubeSearchMutation.isPending || Boolean(youtubeResult));

  return (
    <Card className={cn('relative overflow-hidden border-forest/10 bg-cream-light/95 shadow-xl dark:border-cream/10 dark:bg-forest-dark/95', className)}>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(196,98,45,0.16),transparent_34%),radial-gradient(circle_at_92%_8%,rgba(27,58,45,0.15),transparent_26%)] dark:bg-[linear-gradient(115deg,rgba(196,98,45,0.18),transparent_34%),radial-gradient(circle_at_92%_8%,rgba(245,237,214,0.10),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-terracotta/50 to-transparent" />

      <CardHeader className="relative pb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-terracotta/20 bg-white/70 px-3 py-1 text-xs font-semibold text-terracotta shadow-sm dark:bg-forest/80 dark:text-terracotta-light">
              <Sparkles className="h-3.5 w-3.5" />
              Free Recipe API
            </div>
            <CardTitle className="text-3xl text-forest dark:text-cream">{title}</CardTitle>
            {description && <CardDescription className="mt-2 max-w-2xl">{description}</CardDescription>}
          </div>
          <Badge variant="secondary" className="w-fit bg-white/75 dark:bg-cream/10">
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
              className="bg-white/90 pl-10 dark:bg-forest/90"
              placeholder="Search Arrabiata, chicken, curry..."
            />
          </div>
          <Button type="submit" variant="secondary" disabled={searchMutation.isPending || !searchTerm.trim()}>
            <Search className="h-4 w-4" />
            {searchMutation.isPending ? 'Searching...' : 'Search'}
          </Button>
        </form>

        {searchMutation.isError && (
          <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-950/40 dark:text-red-100">
            Unable to search the recipe API right now.
          </p>
        )}

        {importMutation.isError && (
          <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-950/40 dark:text-red-100">
            Import failed. Please try again.
          </p>
        )}

        {searchMutation.isSuccess && !hasResults && (
          <p className="rounded-lg border border-forest/10 bg-white/70 px-4 py-3 text-sm text-gray-700 dark:border-cream/10 dark:bg-forest/80 dark:text-gray-200">
            No importable API recipes found for that search. YouTube cooking videos are shown below when available.
          </p>
        )}

        {shouldShowYoutubePanel && (
          <div className="rounded-xl border border-forest/10 bg-white/80 p-4 shadow-sm dark:border-cream/10 dark:bg-forest/80">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="flex items-center gap-2 font-display text-2xl font-semibold text-forest dark:text-cream">
                  <Video className="h-6 w-6 text-terracotta" />
                  Cooking Videos
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Watch a YouTube tutorial while you decide what to cook.
                </p>
              </div>
              <Badge variant="secondary" className="w-fit">
                YouTube
              </Badge>
            </div>

            {youtubeSearchMutation.isPending && (
              <div className="flex items-center justify-center rounded-lg border border-dashed border-forest/15 bg-white/60 py-12 text-sm text-gray-600 dark:border-cream/15 dark:bg-forest-dark/60 dark:text-gray-300">
                Searching YouTube videos...
              </div>
            )}

            {!youtubeSearchMutation.isPending && youtubeResult && !youtubeResult.configured && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-400/30 dark:bg-yellow-950/40 dark:text-yellow-100">
                Add <span className="font-semibold">YOUTUBE_API_KEY</span> in <span className="font-semibold">server/.env</span> to enable recipe videos.
              </div>
            )}

            {!youtubeSearchMutation.isPending && youtubeResult?.configured && youtubeVideos.length === 0 && (
              <div className="rounded-lg border border-forest/10 bg-white/70 px-4 py-3 text-sm text-gray-700 dark:border-cream/10 dark:bg-forest-dark/60 dark:text-gray-200">
                No YouTube tutorials matched this recipe search.
              </div>
            )}

            {!youtubeSearchMutation.isPending && selectedVideo && (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-lg border border-forest/10 bg-black shadow-lg dark:border-cream/10">
                  <iframe
                    className="aspect-video w-full"
                    src={selectedVideo.embedUrl}
                    title={selectedVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {youtubeVideos.map((video) => {
                    const isSelected = selectedVideo.videoId === video.videoId;

                    return (
                      <div
                        key={video.videoId}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedVideo(video)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelectedVideo(video);
                          }
                        }}
                        className={cn(
                          'grid cursor-pointer grid-cols-[112px_1fr] gap-3 rounded-lg border p-2 text-left transition-all',
                          isSelected
                            ? 'border-terracotta bg-terracotta/10 dark:bg-terracotta/15'
                            : 'border-forest/10 bg-white/85 hover:border-terracotta/40 dark:border-cream/10 dark:bg-forest-dark/70'
                        )}
                      >
                        <div className="relative overflow-hidden rounded bg-gray-200 dark:bg-forest-light">
                          {video.thumbnailUrl ? (
                            <img src={video.thumbnailUrl} alt="" className="h-20 w-28 object-cover" />
                          ) : (
                            <div className="flex h-20 w-28 items-center justify-center text-gray-500 dark:text-gray-300">
                              <Video className="h-6 w-6" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white">
                            <PlayCircle className="h-8 w-8" />
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="line-clamp-2 font-semibold text-forest dark:text-cream">
                            {video.title || 'Recipe video'}
                          </div>
                          <div className="mt-1 line-clamp-1 text-xs text-gray-600 dark:text-gray-300">
                            {video.channelTitle || 'YouTube'}
                          </div>
                          <a
                            href={video.watchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-terracotta hover:text-terracotta-dark"
                          >
                            Open on YouTube
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
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
                    <div className="relative h-44 overflow-hidden bg-gray-200 dark:bg-forest-light sm:h-full">
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
                            onClick={() => {
                              onUseRecipe(externalRecipe);
                              toast({
                                title: 'Recipe loaded',
                                description: 'You can review and edit it before saving.',
                                tone: 'success',
                              });
                            }}
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

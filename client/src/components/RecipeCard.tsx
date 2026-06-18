import { Link } from 'react-router-dom';
import { Clock3, Globe2, Heart, ImageIcon, Users } from 'lucide-react';

interface Recipe {
  id: string;
  title: string;
  description?: string;
  cuisine?: string;
  difficulty: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  photoUrl?: string;
  isFavorite?: boolean;
  matchScore?: number;
  missingCount?: number;
  tags?: { id: string; name: string }[];
}

interface RecipeCardProps {
  recipe: Recipe;
  onFavoriteToggle?: (recipeId: string) => void;
}

const difficultyColors = {
  Easy: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-100',
  Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-100',
  Hard: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-100',
};

const RecipeCard = ({ recipe, onFavoriteToggle }: RecipeCardProps) => {
  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <div className="recipe-card group cursor-pointer">
      <Link to={`/recipes/${recipe.id}`}>
        <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded bg-gray-200 dark:bg-forest-light">
          {recipe.photoUrl ? (
            <img
              src={recipe.photoUrl}
              alt={recipe.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-cream-dark dark:text-cream/70">
              <ImageIcon className="h-14 w-14" />
            </div>
          )}

          <button
            onClick={(e) => {
              e.preventDefault();
              onFavoriteToggle?.(recipe.id);
            }}
            className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-terracotta shadow-lg transition-transform hover:scale-110 dark:bg-forest-dark/90 dark:text-cream"
            aria-label={recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className="h-5 w-5" fill={recipe.isFavorite ? 'currentColor' : 'none'} />
          </button>

          {recipe.matchScore !== undefined && recipe.matchScore > 0 && (
            <div className="absolute left-2 top-2 rounded-full bg-terracotta px-3 py-1 text-sm font-bold text-white shadow-lg">
              {recipe.matchScore}% Match
            </div>
          )}

          {recipe.missingCount !== undefined && recipe.missingCount > 0 && (
            <div className="absolute bottom-2 left-2 rounded-full bg-white/90 px-3 py-1 text-sm font-medium shadow dark:bg-forest-dark/90 dark:text-cream">
              Missing only {recipe.missingCount} {recipe.missingCount === 1 ? 'ingredient' : 'ingredients'}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="line-clamp-1 font-display text-xl font-semibold text-forest dark:text-cream">
            {recipe.title}
          </h3>

          {recipe.description && (
            <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
              {recipe.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2 text-xs">
            <span className={`badge ${difficultyColors[recipe.difficulty as keyof typeof difficultyColors]}`}>
              {recipe.difficulty}
            </span>
            <span className="badge inline-flex items-center gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-100">
              <Clock3 className="h-3 w-3" />
              {totalTime} min
            </span>
            <span className="badge inline-flex items-center gap-1 bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-100">
              <Users className="h-3 w-3" />
              {recipe.servings} servings
            </span>
            {recipe.cuisine && (
              <span className="badge inline-flex items-center gap-1 bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-100">
                <Globe2 className="h-3 w-3" />
                {recipe.cuisine}
              </span>
            )}
          </div>

          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {recipe.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="rounded bg-cream-dark px-2 py-1 text-xs dark:bg-forest-light"
                >
                  #{tag.name}
                </span>
              ))}
              {recipe.tags.length > 3 && (
                <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-300">
                  +{recipe.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default RecipeCard;

import { Link } from 'react-router-dom';

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

const RecipeCard = ({ recipe, onFavoriteToggle }: RecipeCardProps) => {
  const totalTime = recipe.prepTime + recipe.cookTime;

  const difficultyColors = {
    Easy: 'bg-green-100 text-green-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    Hard: 'bg-red-100 text-red-800',
  };

  return (
    <div className="recipe-card group cursor-pointer">
      <Link to={`/recipes/${recipe.id}`}>
        {/* Image */}
        <div className="relative aspect-[4/3] bg-gray-200 mb-3 overflow-hidden rounded">
          {recipe.photoUrl ? (
            <img
              src={recipe.photoUrl}
              alt={recipe.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              🍽️
            </div>
          )}
          
          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              onFavoriteToggle?.(recipe.id);
            }}
            className="absolute top-2 right-2 bg-white/90 p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
          >
            {recipe.isFavorite ? '❤️' : '🤍'}
          </button>

          {/* Match Score Badge */}
          {recipe.matchScore !== undefined && recipe.matchScore > 0 && (
            <div className="absolute top-2 left-2 bg-terracotta text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
              {recipe.matchScore}% Match
            </div>
          )}

          {/* Missing Ingredients Badge */}
          {recipe.missingCount !== undefined && recipe.missingCount > 0 && (
            <div className="absolute bottom-2 left-2 bg-white/90 px-3 py-1 rounded-full text-sm font-medium shadow">
              Missing only {recipe.missingCount} {recipe.missingCount === 1 ? 'ingredient' : 'ingredients'}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="font-display text-xl font-semibold text-forest dark:text-cream line-clamp-1">
            {recipe.title}
          </h3>
          
          {recipe.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {recipe.description}
            </p>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className={`badge ${difficultyColors[recipe.difficulty as keyof typeof difficultyColors]}`}>
              {recipe.difficulty}
            </span>
            <span className="badge bg-blue-100 text-blue-800">
              ⏱️ {totalTime} min
            </span>
            <span className="badge bg-purple-100 text-purple-800">
              👥 {recipe.servings} servings
            </span>
            {recipe.cuisine && (
              <span className="badge bg-orange-100 text-orange-800">
                🌍 {recipe.cuisine}
              </span>
            )}
          </div>

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {recipe.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs px-2 py-1 bg-cream-dark dark:bg-forest-light rounded"
                >
                  #{tag.name}
                </span>
              ))}
              {recipe.tags.length > 3 && (
                <span className="text-xs px-2 py-1 text-gray-500">
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

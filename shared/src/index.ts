// Shared types between client and server

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Recipe {
  id: string;
  userId: string;
  title: string;
  description?: string;
  cuisine?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  prepTime: number;
  cookTime: number;
  servings: number;
  photoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  ingredients?: Ingredient[];
  steps?: RecipeStep[];
  tags?: Tag[];
  isFavorite?: boolean;
  matchScore?: number; // For ingredient matching
}

export interface Ingredient {
  id: string;
  recipeId: string;
  name: string;
  quantity: number;
  unit: string;
  substitution?: string;
  order: number;
}

export interface RecipeStep {
  id: string;
  recipeId: string;
  stepNumber: number;
  instruction: string;
  timerMinutes?: number;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  recipes?: Recipe[];
}

export interface PantryItem {
  id: string;
  userId: string;
  name: string;
  quantity: number;
  unit: string;
  expiryDate?: Date;
  category: string;
  addedAt: Date;
}

export interface MealPlan {
  id: string;
  userId: string;
  name: string;
  weekStart: Date;
  createdAt: Date;
  updatedAt: Date;
  recipes?: MealPlanRecipe[];
}

export interface MealPlanRecipe {
  id: string;
  mealPlanId: string;
  recipeId: string;
  date: Date;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  addedAt: Date;
  recipe?: Recipe;
}

export interface CookHistory {
  id: string;
  userId: string;
  recipeId: string;
  cookedAt: Date;
  servings?: number;
  notes?: string;
  recipe?: Recipe;
}

export interface CookStats {
  totalCooks: number;
  mostCookedRecipe?: Recipe;
  favoriteCuisine?: string;
  cookStreak: number;
  cooksByDay: Record<string, number>;
}

// API Request/Response types

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CreateRecipeRequest {
  title: string;
  description?: string;
  cuisine?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  prepTime: number;
  cookTime: number;
  servings: number;
  ingredients: Omit<Ingredient, 'id' | 'recipeId'>[];
  steps: Omit<RecipeStep, 'id' | 'recipeId'>[];
  tags: string[];
}

export interface UpdateRecipeRequest extends Partial<CreateRecipeRequest> {}

export interface IngredientMatchRequest {
  ingredients: string[];
}

export interface IngredientMatchResponse {
  recipes: Recipe[];
}

export interface RecipeRemixRequest {
  recipeId: string;
  variation: 'healthier' | 'budget' | 'gourmet';
}

export interface RecipeRemixResponse {
  original: Recipe;
  remixed: Partial<CreateRecipeRequest>;
  changes: string[];
}

export interface ImportRecipeRequest {
  url: string;
}

export interface GroceryListItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  checked: boolean;
}

export interface GroceryListResponse {
  items: GroceryListItem[];
  mealPlanId: string;
}

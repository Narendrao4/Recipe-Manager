import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { format, addDays, startOfWeek } from 'date-fns';
import api from '../lib/api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

const RecipeCard = ({ recipe }: any) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'recipe',
    item: { recipe },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`bg-white dark:bg-forest-dark p-3 rounded-lg shadow cursor-move hover:shadow-lg transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="font-semibold text-sm">{recipe.title}</div>
      <div className="text-xs text-gray-500 mt-1">
        ⏱️ {recipe.prepTime + recipe.cookTime} min
      </div>
    </div>
  );
};

const MealSlot = ({ date, mealType, mealPlanId, recipes, onDrop }: any) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'recipe',
    drop: (item: any) => onDrop(item.recipe, date, mealType),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const mealRecipe = recipes.find(
    (r: any) =>
      format(new Date(r.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') &&
      r.mealType === mealType
  );

  return (
    <div
      ref={drop}
      className={`min-h-[80px] p-2 border-2 border-dashed rounded-lg transition-colors ${
        isOver ? 'border-terracotta bg-cream-light' : 'border-gray-300 dark:border-gray-600'
      }`}
    >
      {mealRecipe ? (
        <div className="bg-terracotta text-white p-2 rounded text-sm">
          {mealRecipe.recipe.title}
        </div>
      ) : (
        <div className="text-gray-400 text-xs text-center py-4">
          Drop recipe here
        </div>
      )}
    </div>
  );
};

const MealPlanner = () => {
  const queryClient = useQueryClient();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));

  const { data: mealPlans } = useQuery({
    queryKey: ['mealPlans'],
    queryFn: async () => {
      const { data } = await api.get('/meal-plans');
      return data;
    },
  });

  const { data: recipes } = useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const { data } = await api.get('/recipes');
      return data;
    },
  });

  const currentMealPlan = mealPlans?.find(
    (mp: any) => format(new Date(mp.weekStart), 'yyyy-MM-dd') === format(currentWeekStart, 'yyyy-MM-dd')
  );

  const createMealPlanMutation = useMutation({
    mutationFn: async (weekStart: Date) => {
      const { data } = await api.post('/meal-plans', {
        name: `Week of ${format(weekStart, 'MMM d, yyyy')}`,
        weekStart: weekStart.toISOString(),
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
    },
  });

  const addRecipeToMealPlanMutation = useMutation({
    mutationFn: async ({ mealPlanId, recipeId, date, mealType }: any) => {
      const { data } = await api.post(`/meal-plans/${mealPlanId}/recipes`, {
        recipeId,
        date: date.toISOString(),
        mealType,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
    },
  });

  const handleDrop = async (recipe: any, date: Date, mealType: string) => {
    let mealPlanId = currentMealPlan?.id;

    if (!mealPlanId) {
      const newPlan = await createMealPlanMutation.mutateAsync(currentWeekStart);
      mealPlanId = newPlan.id;
    }

    addRecipeToMealPlanMutation.mutate({
      mealPlanId,
      recipeId: recipe.id,
      date,
      mealType,
    });
  };

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-display font-bold text-forest dark:text-cream">
            📅 Meal Planner
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))}
              className="btn-outline"
            >
              ← Previous Week
            </button>
            <button
              onClick={() => setCurrentWeekStart(startOfWeek(new Date()))}
              className="btn-secondary"
            >
              This Week
            </button>
            <button
              onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))}
              className="btn-outline"
            >
              Next Week →
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-forest-dark rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">
            Week of {format(currentWeekStart, 'MMMM d, yyyy')}
          </h3>

          <div className="grid grid-cols-8 gap-2">
            {/* Header */}
            <div className="font-semibold"></div>
            {weekDates.map((date, i) => (
              <div key={i} className="font-semibold text-center">
                <div>{DAYS[i]}</div>
                <div className="text-sm text-gray-500">{format(date, 'MMM d')}</div>
              </div>
            ))}

            {/* Meal Rows */}
            {MEAL_TYPES.map((mealType) => (
              <>
                <div key={`label-${mealType}`} className="font-medium capitalize flex items-center">
                  {mealType}
                </div>
                {weekDates.map((date, i) => (
                  <MealSlot
                    key={`${mealType}-${i}`}
                    date={date}
                    mealType={mealType}
                    mealPlanId={currentMealPlan?.id}
                    recipes={currentMealPlan?.recipes || []}
                    onDrop={handleDrop}
                  />
                ))}
              </>
            ))}
          </div>

          {currentMealPlan && (
            <div className="mt-6 flex gap-4">
              <a
                href={`/api/meal-plans/${currentMealPlan.id}/grocery-list`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                📝 Generate Grocery List
              </a>
            </div>
          )}
        </div>

        {/* Recipe Selector */}
        <div className="bg-white dark:bg-forest-dark rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-display font-semibold mb-4">Available Recipes (Drag to plan)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recipes?.slice(0, 12).map((recipe: any) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default MealPlanner;

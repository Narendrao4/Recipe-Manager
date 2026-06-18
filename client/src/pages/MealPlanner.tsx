import { Fragment, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { format, addDays, startOfWeek } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, ClipboardList, Clock3, GripVertical } from 'lucide-react';
import api from '../lib/api';
import { useToast } from '../components/ui/toast';

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
      className={`cursor-move rounded-lg bg-white p-3 shadow transition-shadow hover:shadow-lg dark:bg-forest-dark ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
        <div>
          <div className="text-sm font-semibold">{recipe.title}</div>
          <div className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-300">
            <Clock3 className="h-3 w-3" />
            {recipe.prepTime + recipe.cookTime} min
          </div>
        </div>
      </div>
    </div>
  );
};

const MealSlot = ({ date, mealType, recipes, onDrop }: any) => {
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
      className={`min-h-[80px] rounded-lg border-2 border-dashed p-2 transition-colors ${
        isOver
          ? 'border-terracotta bg-cream-light dark:bg-forest-light'
          : 'border-gray-300 dark:border-gray-600'
      }`}
    >
      {mealRecipe ? (
        <div className="rounded bg-terracotta p-2 text-sm text-white">
          {mealRecipe.recipe.title}
        </div>
      ) : (
        <div className="py-4 text-center text-xs text-gray-400 dark:text-gray-300">
          Drop recipe here
        </div>
      )}
    </div>
  );
};

const MealPlanner = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
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
      toast({
        title: 'Meal plan created',
        description: 'A new weekly plan was created.',
        tone: 'success',
      });
    },
    onError: () => {
      toast({
        title: 'Plan creation failed',
        description: 'Unable to create a meal plan right now.',
        tone: 'error',
      });
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      toast({
        title: 'Recipe planned',
        description: `Added to ${variables.mealType} on ${format(variables.date, 'MMM d')}.`,
        tone: 'success',
      });
    },
    onError: () => {
      toast({
        title: 'Planning failed',
        description: 'Unable to add that recipe to the meal plan.',
        tone: 'error',
      });
    },
  });

  const handleDrop = async (recipe: any, date: Date, mealType: string) => {
    try {
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
    } catch {
      // Mutation callbacks surface the failure toast.
    }
  };

  const goToWeek = (date: Date, label: string) => {
    setCurrentWeekStart(date);
    toast({
      title: 'Week changed',
      description: label,
      tone: 'info',
    });
  };

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="flex items-center gap-3 text-4xl font-display font-bold text-forest dark:text-cream">
            <CalendarDays className="h-9 w-9 text-terracotta" />
            Meal Planner
          </h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => goToWeek(addDays(currentWeekStart, -7), 'Showing the previous week.')}
              className="btn-outline inline-flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous Week
            </button>
            <button
              onClick={() => goToWeek(startOfWeek(new Date()), 'Showing this week.')}
              className="btn-secondary"
            >
              This Week
            </button>
            <button
              onClick={() => goToWeek(addDays(currentWeekStart, 7), 'Showing the next week.')}
              className="btn-outline inline-flex items-center gap-2"
            >
              Next Week
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl bg-white p-6 shadow-lg dark:bg-forest-dark">
          <h3 className="mb-4 text-xl font-semibold">
            Week of {format(currentWeekStart, 'MMMM d, yyyy')}
          </h3>

          <div className="grid min-w-[920px] grid-cols-8 gap-2">
            <div className="font-semibold" />
            {weekDates.map((date, i) => (
              <div key={i} className="text-center font-semibold">
                <div>{DAYS[i]}</div>
                <div className="text-sm text-gray-500 dark:text-gray-300">{format(date, 'MMM d')}</div>
              </div>
            ))}

            {MEAL_TYPES.map((mealType) => (
              <Fragment key={mealType}>
                <div className="flex items-center font-medium capitalize">
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
              </Fragment>
            ))}
          </div>

          {currentMealPlan && (
            <div className="mt-6 flex gap-4">
              <a
                href={`/api/meal-plans/${currentMealPlan.id}/grocery-list`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-2"
                onClick={() =>
                  toast({
                    title: 'Grocery list opened',
                    description: 'Your list is opening in a new tab.',
                    tone: 'info',
                  })
                }
              >
                <ClipboardList className="h-4 w-4" />
                Generate Grocery List
              </a>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-forest-dark">
          <h2 className="mb-4 font-display text-2xl font-semibold">Available Recipes (Drag to plan)</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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

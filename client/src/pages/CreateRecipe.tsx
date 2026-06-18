import { FormEvent, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react';
import api from '../lib/api';
import RecipeApiImporter, { ExternalRecipeDraft } from '../components/RecipeApiImporter';
import { useToast } from '../components/ui/toast';

const createBlankIngredient = () => ({ name: '', quantity: '', unit: '', substitution: '' });
const createBlankStep = () => ({ instruction: '', timerMinutes: '' });

const CreateRecipe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isEditing = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [externalPhotoUrl, setExternalPhotoUrl] = useState('');
  const [ingredients, setIngredients] = useState([createBlankIngredient()]);
  const [steps, setSteps] = useState([createBlankStep()]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const { data: recipe } = useQuery({
    queryKey: ['recipe', id],
    queryFn: async () => {
      const { data } = await api.get(`/recipes/${id}`);
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (recipe) {
      setTitle(recipe.title);
      setDescription(recipe.description || '');
      setCuisine(recipe.cuisine || '');
      setDifficulty(recipe.difficulty);
      setPrepTime(recipe.prepTime.toString());
      setCookTime(recipe.cookTime.toString());
      setServings(recipe.servings.toString());
      setExternalPhotoUrl(recipe.photoUrl?.startsWith('http') ? recipe.photoUrl : '');
      setIngredients(recipe.ingredients.length > 0 ? recipe.ingredients : [createBlankIngredient()]);
      setSteps(
        recipe.steps.length > 0
          ? recipe.steps.map((s: any) => ({ instruction: s.instruction, timerMinutes: s.timerMinutes || '' }))
          : [createBlankStep()]
      );
      setTags(recipe.tags.map((t: any) => t.name));
    }
  }, [recipe]);

  const saveMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (isEditing) {
        const { data } = await api.put(`/recipes/${id}`, formData);
        return data;
      }

      const { data } = await api.post('/recipes', formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast({
        title: isEditing ? 'Recipe updated' : 'Recipe created',
        description: `${title || 'Recipe'} has been saved.`,
        tone: 'success',
      });
      navigate('/recipes');
    },
    onError: () => {
      toast({
        title: 'Save failed',
        description: 'Unable to save this recipe right now.',
        tone: 'error',
      });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('cuisine', cuisine);
    formData.append('difficulty', difficulty);
    formData.append('prepTime', prepTime);
    formData.append('cookTime', cookTime);
    formData.append('servings', servings);
    formData.append('ingredients', JSON.stringify(ingredients));
    formData.append('steps', JSON.stringify(steps));
    formData.append('tags', JSON.stringify(tags));

    if (photo) {
      formData.append('photo', photo);
    } else if (externalPhotoUrl) {
      formData.append('photoUrl', externalPhotoUrl);
    }

    saveMutation.mutate(formData);
  };

  const applyExternalRecipe = (externalRecipe: ExternalRecipeDraft) => {
    const importedIngredients = externalRecipe.ingredients
      .map((ingredient) => ({
        name: ingredient.name,
        quantity: ingredient.quantity.toString(),
        unit: ingredient.unit,
        substitution: ingredient.substitution || '',
      }))
      .filter((ingredient) => ingredient.name);

    const importedSteps = externalRecipe.steps
      .map((step) => ({
        instruction: step.instruction,
        timerMinutes: step.timerMinutes ? step.timerMinutes.toString() : '',
      }))
      .filter((step) => step.instruction);

    setTitle(externalRecipe.title);
    setDescription(externalRecipe.description || '');
    setCuisine(externalRecipe.cuisine || '');
    setDifficulty(externalRecipe.difficulty);
    setPrepTime(externalRecipe.prepTime.toString());
    setCookTime(externalRecipe.cookTime.toString());
    setServings(externalRecipe.servings.toString());
    setPhoto(null);
    setExternalPhotoUrl(externalRecipe.photoUrl || '');
    setIngredients(importedIngredients.length > 0 ? importedIngredients : [createBlankIngredient()]);
    setSteps(importedSteps.length > 0 ? importedSteps : [createBlankStep()]);
    setTags(externalRecipe.tags || []);
    setTagInput('');
  };

  const handleImportedRecipe = () => {
    queryClient.invalidateQueries({ queryKey: ['recipes'] });
    navigate('/recipes');
  };

  const addIngredient = () => {
    setIngredients([...ingredients, createBlankIngredient()]);
    toast({
      title: 'Ingredient row added',
      description: 'Fill in the new ingredient details.',
      tone: 'success',
    });
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
    toast({
      title: 'Ingredient removed',
      description: 'The ingredient row was removed.',
      tone: 'success',
    });
  };

  const updateIngredient = (index: number, field: string, value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const addStep = () => {
    setSteps([...steps, createBlankStep()]);
    toast({
      title: 'Step added',
      description: 'A new cooking step was added.',
      tone: 'success',
    });
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
    toast({
      title: 'Step removed',
      description: 'The cooking step was removed.',
      tone: 'success',
    });
  };

  const updateStep = (index: number, field: string, value: string) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < steps.length) {
      [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
      setSteps(newSteps);
      toast({
        title: 'Step moved',
        description: `Step moved ${direction}.`,
        tone: 'info',
      });
    }
  };

  const addTag = () => {
    const nextTag = tagInput.trim();
    if (!nextTag) {
      toast({
        title: 'Tag needed',
        description: 'Type a tag before adding it.',
        tone: 'info',
      });
      return;
    }

    if (tags.includes(nextTag)) {
      toast({
        title: 'Tag already added',
        description: `${nextTag} is already on this recipe.`,
        tone: 'info',
      });
      return;
    }

    setTags([...tags, nextTag]);
    setTagInput('');
    toast({
      title: 'Tag added',
      description: `#${nextTag} was added.`,
      tone: 'success',
    });
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
    toast({
      title: 'Tag removed',
      description: `#${tag} was removed.`,
      tone: 'success',
    });
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-8 text-4xl font-display font-bold text-forest dark:text-cream">
        {isEditing ? 'Edit Recipe' : 'Create New Recipe'}
      </h1>

      {!isEditing && (
        <RecipeApiImporter
          className="mb-8"
          title="Search and import recipes"
          description="Import directly to My Recipes, or load a recipe into this form to edit before saving."
          onUseRecipe={applyExternalRecipe}
          onImported={handleImportedRecipe}
          showImportAction
          showReviewAction
          importButtonLabel="Import now"
          reviewButtonLabel="Edit before saving"
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6 rounded-xl bg-white p-6 shadow-lg dark:bg-forest-dark">
          <h2 className="font-display text-2xl font-semibold">Basic Information</h2>

          <div>
            <label className="mb-2 block text-sm font-medium">Recipe Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Cuisine</label>
              <input
                type="text"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                className="input-field"
                placeholder="e.g., Italian, Mexican"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Difficulty *</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="input-field"
                required
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium">Prep Time (min) *</label>
              <input
                type="number"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                className="input-field"
                required
                min="0"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Cook Time (min) *</label>
              <input
                type="number"
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
                className="input-field"
                required
                min="0"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Servings *</label>
              <input
                type="number"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                className="input-field"
                required
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Recipe Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const selectedPhoto = e.target.files?.[0] || null;
                setPhoto(selectedPhoto);
                if (selectedPhoto) {
                  setExternalPhotoUrl('');
                  toast({
                    title: 'Photo selected',
                    description: selectedPhoto.name,
                    tone: 'success',
                  });
                }
              }}
              className="input-field"
            />
            {externalPhotoUrl && !photo && (
              <div className="mt-3 flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <img
                  src={externalPhotoUrl}
                  alt={title || 'Imported recipe'}
                  className="h-16 w-16 rounded object-cover"
                />
                <span className="flex-1 text-sm text-gray-600 dark:text-gray-300">
                  Imported image selected
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setExternalPhotoUrl('');
                    toast({
                      title: 'Imported image removed',
                      description: 'The recipe will save without that external image.',
                      tone: 'info',
                    });
                  }}
                  className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-300"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-xl bg-white p-6 shadow-lg dark:bg-forest-dark">
          <h2 className="font-display text-2xl font-semibold">Ingredients</h2>

          {ingredients.map((ingredient, index) => (
            <div key={index} className="flex flex-col gap-2 lg:flex-row">
              <input
                type="text"
                placeholder="Ingredient name"
                value={ingredient.name}
                onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                className="input-field flex-1"
                required
              />
              <input
                type="number"
                placeholder="Qty"
                value={ingredient.quantity}
                onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                className="input-field lg:w-24"
                step="0.01"
                required
              />
              <input
                type="text"
                placeholder="Unit"
                value={ingredient.unit}
                onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                className="input-field lg:w-32"
                required
              />
              <input
                type="text"
                placeholder="Substitution (optional)"
                value={ingredient.substitution}
                onChange={(e) => updateIngredient(index, 'substitution', e.target.value)}
                className="input-field flex-1"
              />
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                className="inline-flex items-center justify-center rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                aria-label="Remove ingredient"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <button type="button" onClick={addIngredient} className="btn-outline inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Ingredient
          </button>
        </div>

        <div className="space-y-4 rounded-xl bg-white p-6 shadow-lg dark:bg-forest-dark">
          <h2 className="font-display text-2xl font-semibold">Cooking Steps</h2>

          {steps.map((step, index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => moveStep(index, 'up')}
                  disabled={index === 0}
                  className="rounded bg-gray-200 px-2 py-1 disabled:opacity-30 dark:bg-forest-light"
                  aria-label="Move step up"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveStep(index, 'down')}
                  disabled={index === steps.length - 1}
                  className="rounded bg-gray-200 px-2 py-1 disabled:opacity-30 dark:bg-forest-light"
                  aria-label="Move step down"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{index + 1}.</span>
                  <textarea
                    placeholder="Step instruction"
                    value={step.instruction}
                    onChange={(e) => updateStep(index, 'instruction', e.target.value)}
                    className="input-field flex-1"
                    rows={2}
                    required
                  />
                </div>
                <input
                  type="number"
                  placeholder="Timer (minutes, optional)"
                  value={step.timerMinutes}
                  onChange={(e) => updateStep(index, 'timerMinutes', e.target.value)}
                  className="input-field w-48"
                  min="0"
                />
              </div>
              <button
                type="button"
                onClick={() => removeStep(index)}
                className="inline-flex items-center justify-center rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                aria-label="Remove step"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <button type="button" onClick={addStep} className="btn-outline inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Step
          </button>
        </div>

        <div className="space-y-4 rounded-xl bg-white p-6 shadow-lg dark:bg-forest-dark">
          <h2 className="font-display text-2xl font-semibold">Tags</h2>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              placeholder="Add tag (e.g., vegan, gluten-free)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className="input-field flex-1"
            />
            <button type="button" onClick={addTag} className="btn-outline">
              Add Tag
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-2 rounded-full bg-terracotta px-3 py-1 text-white"
              >
                #{tag}
                <button type="button" onClick={() => removeTag(tag)} className="rounded-full p-0.5 hover:bg-white/15">
                  <X className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <button type="submit" disabled={saveMutation.isPending} className="btn-primary flex-1">
            {saveMutation.isPending ? 'Saving...' : isEditing ? 'Update Recipe' : 'Create Recipe'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/recipes')}
            className="btn-outline flex-1"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateRecipe;

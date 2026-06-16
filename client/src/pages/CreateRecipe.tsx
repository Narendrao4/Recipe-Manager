import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import RecipeApiImporter, { ExternalRecipeDraft } from '../components/RecipeApiImporter';

const createBlankIngredient = () => ({ name: '', quantity: '', unit: '', substitution: '' });
const createBlankStep = () => ({ instruction: '', timerMinutes: '' });

const CreateRecipe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  // Fetch recipe for editing
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
      setSteps(recipe.steps.length > 0 ? recipe.steps.map((s: any) => ({ instruction: s.instruction, timerMinutes: s.timerMinutes || '' })) : [createBlankStep()]);
      setTags(recipe.tags.map((t: any) => t.name));
    }
  }, [recipe]);

  const saveMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (isEditing) {
        const { data } = await api.put(`/recipes/${id}`, formData);
        return data;
      } else {
        const { data } = await api.post('/recipes', formData);
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      navigate('/recipes');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
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
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: string, value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const addStep = () => {
    setSteps([...steps, createBlankStep()]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
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
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-display font-bold text-forest dark:text-cream mb-8">
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
        {/* Basic Info */}
        <div className="bg-white dark:bg-forest-dark rounded-xl shadow-lg p-6 space-y-6">
          <h2 className="text-2xl font-display font-semibold">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium mb-2">Recipe Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Cuisine</label>
              <input
                type="text"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                className="input-field"
                placeholder="e.g., Italian, Mexican"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Difficulty *</label>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Prep Time (min) *</label>
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
              <label className="block text-sm font-medium mb-2">Cook Time (min) *</label>
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
              <label className="block text-sm font-medium mb-2">Servings *</label>
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
            <label className="block text-sm font-medium mb-2">Recipe Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const selectedPhoto = e.target.files?.[0] || null;
                setPhoto(selectedPhoto);
                if (selectedPhoto) {
                  setExternalPhotoUrl('');
                }
              }}
              className="input-field"
            />
            {externalPhotoUrl && !photo && (
              <div className="mt-3 flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
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
                  onClick={() => setExternalPhotoUrl('')}
                  className="text-sm font-medium text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Ingredients */}
        <div className="bg-white dark:bg-forest-dark rounded-xl shadow-lg p-6 space-y-4">
          <h2 className="text-2xl font-display font-semibold">Ingredients</h2>

          {ingredients.map((ingredient, index) => (
            <div key={index} className="flex gap-2">
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
                className="input-field w-24"
                step="0.01"
                required
              />
              <input
                type="text"
                placeholder="Unit"
                value={ingredient.unit}
                onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                className="input-field w-32"
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
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                ✕
              </button>
            </div>
          ))}

          <button type="button" onClick={addIngredient} className="btn-outline">
            + Add Ingredient
          </button>
        </div>

        {/* Steps */}
        <div className="bg-white dark:bg-forest-dark rounded-xl shadow-lg p-6 space-y-4">
          <h2 className="text-2xl font-display font-semibold">Cooking Steps</h2>

          {steps.map((step, index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => moveStep(index, 'up')}
                  disabled={index === 0}
                  className="px-2 py-1 bg-gray-200 rounded disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveStep(index, 'down')}
                  disabled={index === steps.length - 1}
                  className="px-2 py-1 bg-gray-200 rounded disabled:opacity-30"
                >
                  ↓
                </button>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{index + 1}.</span>
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
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                ✕
              </button>
            </div>
          ))}

          <button type="button" onClick={addStep} className="btn-outline">
            + Add Step
          </button>
        </div>

        {/* Tags */}
        <div className="bg-white dark:bg-forest-dark rounded-xl shadow-lg p-6 space-y-4">
          <h2 className="text-2xl font-display font-semibold">Tags</h2>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add tag (e.g., vegan, gluten-free)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
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
                className="px-3 py-1 bg-terracotta text-white rounded-full flex items-center gap-2"
              >
                #{tag}
                <button type="button" onClick={() => removeTag(tag)} className="font-bold">
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
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

import { FormEvent, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, differenceInDays } from 'date-fns';
import {
  AlertTriangle,
  Archive,
  Beef,
  CheckCircle2,
  Clock3,
  Leaf,
  Milk,
  Package,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import api from '../lib/api';
import { useToast } from '../components/ui/toast';

const categories = {
  produce: { label: 'Produce', icon: Leaf },
  meat: { label: 'Meat', icon: Beef },
  dairy: { label: 'Dairy', icon: Milk },
  pantry: { label: 'Pantry', icon: Archive },
  other: { label: 'Other', icon: Package },
};

const Pantry = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [category, setCategory] = useState('pantry');

  const { data: pantryItems } = useQuery({
    queryKey: ['pantry'],
    queryFn: async () => {
      const { data } = await api.get('/pantry');
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (item: any) => {
      const { data } = await api.post('/pantry', item);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pantry'] });
      resetForm();
      toast({
        title: 'Pantry item added',
        description: `${name} was added to your pantry.`,
        tone: 'success',
      });
    },
    onError: () => {
      toast({
        title: 'Add failed',
        description: 'Unable to add that pantry item.',
        tone: 'error',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...item }: any) => {
      const { data } = await api.put(`/pantry/${id}`, item);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pantry'] });
      resetForm();
      toast({
        title: 'Pantry item updated',
        description: `${name} was updated.`,
        tone: 'success',
      });
    },
    onError: () => {
      toast({
        title: 'Update failed',
        description: 'Unable to update that pantry item.',
        tone: 'error',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/pantry/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pantry'] });
      toast({
        title: 'Pantry item deleted',
        description: 'The item was removed from your pantry.',
        tone: 'success',
      });
    },
    onError: () => {
      toast({
        title: 'Delete failed',
        description: 'Unable to remove that pantry item.',
        tone: 'error',
      });
    },
  });

  const resetForm = () => {
    setName('');
    setQuantity('');
    setUnit('');
    setExpiryDate('');
    setCategory('pantry');
    setEditingItem(null);
    setShowForm(false);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setName(item.name);
    setQuantity(item.quantity.toString());
    setUnit(item.unit);
    setExpiryDate(item.expiryDate ? format(new Date(item.expiryDate), 'yyyy-MM-dd') : '');
    setCategory(item.category);
    setShowForm(true);
    toast({
      title: 'Editing pantry item',
      description: `${item.name} is loaded into the form.`,
      tone: 'info',
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const itemData = {
      name,
      quantity: parseFloat(quantity),
      unit,
      expiryDate: expiryDate || null,
      category,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, ...itemData });
    } else {
      addMutation.mutate(itemData);
    }
  };

  const getExpiryStatus = (itemExpiryDate?: string) => {
    if (!itemExpiryDate) return 'none';
    const days = differenceInDays(new Date(itemExpiryDate), new Date());
    if (days < 0) return 'expired';
    if (days <= 3) return 'urgent';
    if (days <= 7) return 'soon';
    return 'good';
  };

  const getExpiryColor = (status: string) => {
    switch (status) {
      case 'expired':
        return 'border-red-500 bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-100';
      case 'urgent':
        return 'border-orange-500 bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-100';
      case 'soon':
        return 'border-yellow-500 bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-100';
      default:
        return 'border-gray-300 bg-white text-forest dark:border-cream/15 dark:bg-forest-dark dark:text-cream';
    }
  };

  const renderExpiryStatus = (status: string) => {
    switch (status) {
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            Expired
          </span>
        );
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            Expires very soon
          </span>
        );
      case 'soon':
        return (
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-4 w-4" />
            Expires soon
          </span>
        );
      case 'good':
        return (
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            Fresh
          </span>
        );
      default:
        return null;
    }
  };

  const groupedItems =
    pantryItems?.reduce((acc: any, item: any) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {}) || {};

  const isSaving = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="flex items-center gap-3 text-4xl font-display font-bold text-forest dark:text-cream">
          <Archive className="h-9 w-9 text-terracotta" />
          Pantry Tracker
        </h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary inline-flex items-center justify-center gap-2">
          {showForm ? null : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Add Item'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-forest-dark">
          <h2 className="mb-4 font-display text-2xl font-semibold">
            {editingItem ? 'Edit Item' : 'Add New Item'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Item Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-field"
                  required
                >
                  {Object.entries(categories).map(([value, item]) => (
                    <option key={value} value={value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Quantity *</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="input-field"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Unit *</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="input-field"
                  placeholder="e.g., lbs, oz, cups"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="submit" disabled={isSaving} className="btn-primary flex-1">
                {isSaving ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
              </button>
              <button type="button" onClick={resetForm} className="btn-outline flex-1">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {Object.keys(groupedItems).length > 0 ? (
        Object.entries(groupedItems).map(([cat, items]: any) => {
          const categoryMeta = categories[cat as keyof typeof categories] || categories.other;
          const CategoryIcon = categoryMeta.icon;

          return (
            <div key={cat} className="rounded-xl bg-white p-6 shadow-lg dark:bg-forest-dark">
              <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-semibold capitalize">
                <CategoryIcon className="h-6 w-6 text-terracotta" />
                {categoryMeta.label}
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((item: any) => {
                  const expiryStatus = getExpiryStatus(item.expiryDate);
                  return (
                    <div
                      key={item.id}
                      className={`rounded-lg border-2 p-4 ${getExpiryColor(expiryStatus)}`}
                    >
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <h3 className="text-lg font-semibold">{item.name}</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="rounded-md p-1 text-blue-600 hover:bg-blue-50 hover:text-blue-800 dark:text-blue-200 dark:hover:bg-blue-400/10"
                            aria-label={`Edit ${item.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate(item.id)}
                            className="rounded-md p-1 text-red-600 hover:bg-red-50 hover:text-red-800 dark:text-red-200 dark:hover:bg-red-400/10"
                            aria-label={`Delete ${item.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-sm">
                        <div>
                          Quantity: {item.quantity} {item.unit}
                        </div>
                        {item.expiryDate && (
                          <div className="mt-2 font-medium">
                            {renderExpiryStatus(expiryStatus)}
                            <div className="text-xs opacity-80">
                              {format(new Date(item.expiryDate), 'MMM d, yyyy')}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      ) : (
        <div className="rounded-xl bg-white py-20 text-center shadow-lg dark:bg-forest-dark">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-cream text-terracotta dark:bg-forest-light dark:text-cream">
            <Archive className="h-8 w-8" />
          </div>
          <h3 className="mb-2 font-display text-2xl font-semibold">Your pantry is empty</h3>
          <p className="text-gray-600 dark:text-gray-300">Start tracking your ingredients.</p>
        </div>
      )}
    </div>
  );
};

export default Pantry;

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, differenceInDays } from 'date-fns';
import api from '../lib/api';

const Pantry = () => {
  const queryClient = useQueryClient();
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
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/pantry/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pantry'] });
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
  };

  const handleSubmit = (e: React.FormEvent) => {
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

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return 'none';
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (days < 0) return 'expired';
    if (days <= 3) return 'urgent';
    if (days <= 7) return 'soon';
    return 'good';
  };

  const getExpiryColor = (status: string) => {
    switch (status) {
      case 'expired':
        return 'bg-red-100 border-red-500 text-red-800';
      case 'urgent':
        return 'bg-orange-100 border-orange-500 text-orange-800';
      case 'soon':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      default:
        return 'bg-white dark:bg-forest-dark border-gray-300';
    }
  };

  const groupedItems = pantryItems?.reduce((acc: any, item: any) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {}) || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-display font-bold text-forest dark:text-cream">
          🏪 Pantry Tracker
        </h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : '+ Add Item'}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-forest-dark rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-display font-semibold mb-4">
            {editingItem ? 'Edit Item' : 'Add New Item'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Item Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="produce">🥬 Produce</option>
                  <option value="meat">🥩 Meat</option>
                  <option value="dairy">🥛 Dairy</option>
                  <option value="pantry">🏺 Pantry</option>
                  <option value="other">📦 Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Quantity *</label>
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
                <label className="block text-sm font-medium mb-2">Unit *</label>
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
                <label className="block text-sm font-medium mb-2">Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1">
                {editingItem ? 'Update Item' : 'Add Item'}
              </button>
              <button type="button" onClick={resetForm} className="btn-outline flex-1">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pantry Items by Category */}
      {Object.keys(groupedItems).length > 0 ? (
        Object.entries(groupedItems).map(([cat, items]: any) => (
          <div key={cat} className="bg-white dark:bg-forest-dark rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-display font-semibold mb-4 capitalize">
              {cat === 'produce' && '🥬'} {cat === 'meat' && '🥩'} {cat === 'dairy' && '🥛'}
              {cat === 'pantry' && '🏺'} {cat === 'other' && '📦'} {cat}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item: any) => {
                const expiryStatus = getExpiryStatus(item.expiryDate);
                return (
                  <div
                    key={item.id}
                    className={`border-2 rounded-lg p-4 ${getExpiryColor(expiryStatus)}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="text-sm">
                      <div>
                        Quantity: {item.quantity} {item.unit}
                      </div>
                      {item.expiryDate && (
                        <div className="font-medium mt-2">
                          {expiryStatus === 'expired' && '🚨 Expired'}
                          {expiryStatus === 'urgent' && '⚠️ Expires very soon'}
                          {expiryStatus === 'soon' && '⏰ Expires soon'}
                          {expiryStatus === 'good' && '✅ Fresh'}
                          <div className="text-xs">
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
        ))
      ) : (
        <div className="text-center py-20 bg-white dark:bg-forest-dark rounded-xl">
          <div className="text-6xl mb-4">🏪</div>
          <h3 className="text-2xl font-display font-semibold mb-2">Your pantry is empty</h3>
          <p className="text-gray-600 dark:text-gray-300">Start tracking your ingredients!</p>
        </div>
      )}
    </div>
  );
};

export default Pantry;

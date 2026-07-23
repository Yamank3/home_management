import { useState } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight, UtensilsCrossed, ShoppingCart, X } from 'lucide-react';
import { useMeals } from '../../hooks/useMeals.js';
import { groceryApi } from '../../api.js';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const TYPE_COLORS = { breakfast: 'yellow', lunch: 'green', dinner: 'blue', snack: 'purple' };
const SLOTS = ['breakfast', 'lunch', 'dinner'];
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const EMPTY_MEAL_FORM = { name: '', type: 'dinner', prepTimeMinutes: '', cookTimeMinutes: '', servings: '', notes: '', ingredients: [] };

function formatWeekRange(weekStart) {
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const opts = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`;
}

export default function MealsPage() {
  const { meals, plan, weekStart, loading, createMeal, removeMeal, setPlanDay, prevWeek, nextWeek, addToGroceries } = useMeals();
  const [view, setView] = useState('planner');
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [mealForm, setMealForm] = useState(EMPTY_MEAL_FORM);
  const [ingInput, setIngInput] = useState({ name: '', quantity: '' });
  const [showAddToGrocery, setShowAddToGrocery] = useState(null);
  const [groceryLists, setGroceryLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState('');
  const [slotPicker, setSlotPicker] = useState(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const getPlanEntry = (date) => plan.find(p => p.date === date) || {};

  const handleAddMeal = async () => {
    if (!mealForm.name.trim()) return;
    await createMeal({ ...mealForm, prepTimeMinutes: mealForm.prepTimeMinutes || null, cookTimeMinutes: mealForm.cookTimeMinutes || null, servings: mealForm.servings || null });
    setMealForm(EMPTY_MEAL_FORM);
    setShowAddMeal(false);
  };

  const addIngredient = () => {
    if (!ingInput.name.trim()) return;
    setMealForm(f => ({ ...f, ingredients: [...f.ingredients, { ...ingInput }] }));
    setIngInput({ name: '', quantity: '' });
  };

  const openAddToGrocery = async (meal) => {
    const lists = await groceryApi.getLists();
    setGroceryLists(lists);
    setSelectedListId(lists[0]?.id || '');
    setShowAddToGrocery(meal);
  };

  const handleAddToGrocery = async () => {
    if (!selectedListId || !showAddToGrocery) return;
    await addToGroceries(showAddToGrocery.id, selectedListId);
    setShowAddToGrocery(null);
  };

  const openSlotPicker = (date, slot) => {
    setSlotPicker({ date, slot });
  };

  const selectMealForSlot = async (mealId) => {
    if (!slotPicker) return;
    await setPlanDay(slotPicker.date, slotPicker.slot, mealId || null);
    setSlotPicker(null);
  };

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Meal Planning"
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setView(v => v === 'planner' ? 'library' : 'planner')}>
              {view === 'planner' ? 'Meal Library' : 'Planner'}
            </Button>
            <Button size="sm" onClick={() => setShowAddMeal(true)}><Plus size={15} /> Add Meal</Button>
          </div>
        }
      />

      {view === 'planner' ? (
        <>
          {/* Week nav */}
          <div className="flex items-center gap-3 mb-5">
            <button onClick={prevWeek} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><ChevronLeft size={18} /></button>
            <span className="text-sm font-medium text-gray-700 flex-1 text-center">{formatWeekRange(weekStart)}</span>
            <button onClick={nextWeek} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><ChevronRight size={18} /></button>
          </div>

          {/* Planner grid */}
          <div className="space-y-2">
            {weekDays.map((date, i) => {
              const entry = getPlanEntry(date);
              const today = new Date().toISOString().split('T')[0];
              const isToday = date === today;
              return (
                <div key={date} className={`bg-white rounded-xl border ${isToday ? 'border-primary-200' : 'border-gray-100'} p-3`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-sm font-semibold ${isToday ? 'text-primary-600' : 'text-gray-700'}`}>{DAYS_SHORT[i]}</span>
                    <span className="text-xs text-gray-400">{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    {isToday && <Badge color="indigo">Today</Badge>}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {SLOTS.map(slot => {
                      const mealId = entry[slot];
                      const meal = meals.find(m => m.id === mealId);
                      return (
                        <div key={slot}>
                          <p className="text-xs text-gray-400 capitalize mb-1">{slot}</p>
                          {meal ? (
                            <div className="bg-gray-50 rounded-lg px-2 py-1.5 flex items-center gap-1">
                              <span className="text-xs font-medium text-gray-700 flex-1 truncate">{meal.name}</span>
                              <button onClick={() => setPlanDay(date, slot, null)} className="text-gray-300 hover:text-red-400 transition-colors shrink-0">
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => openSlotPicker(date, slot)}
                              className="w-full bg-gray-50 hover:bg-primary-50 hover:border-primary-200 border border-dashed border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-400 hover:text-primary-500 transition-colors text-left"
                            >
                              + Add
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {meals.length === 0 ? (
            <EmptyState icon={UtensilsCrossed} title="No meals saved yet" description="Add meals to your library to plan your week"
              action={<Button onClick={() => setShowAddMeal(true)}><Plus size={16} /> Add Meal</Button>} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {meals.map(meal => (
                <div key={meal.id} className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-medium text-gray-900 text-sm">{meal.name}</p>
                    <Badge color={TYPE_COLORS[meal.type] || 'gray'}>{meal.type}</Badge>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-400 mb-3">
                    {meal.prepTimeMinutes && <span>Prep {meal.prepTimeMinutes}m</span>}
                    {meal.cookTimeMinutes && <span>Cook {meal.cookTimeMinutes}m</span>}
                    {meal.servings && <span>{meal.servings} servings</span>}
                  </div>
                  {meal.ingredients.length > 0 && (
                    <p className="text-xs text-gray-500 mb-2">{meal.ingredients.length} ingredient{meal.ingredients.length !== 1 ? 's' : ''}</p>
                  )}
                  <div className="flex gap-2 pt-2 border-t border-gray-50">
                    {meal.ingredients.length > 0 && (
                      <button onClick={() => openAddToGrocery(meal)} className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
                        <ShoppingCart size={11} /> Add to groceries
                      </button>
                    )}
                    <button onClick={() => { if (confirm('Delete this meal?')) removeMeal(meal.id); }} className="text-xs text-red-400 hover:text-red-600 font-medium ml-auto">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Slot picker modal */}
      <Modal open={!!slotPicker} onClose={() => setSlotPicker(null)} title={`Choose ${slotPicker?.slot}`}>
        {meals.length === 0 ? (
          <p className="text-sm text-gray-500">No meals in library. Add some first.</p>
        ) : (
          <div className="space-y-1">
            {meals.map(m => (
              <button key={m.id} onClick={() => selectMealForSlot(m.id)}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-primary-50 text-sm text-gray-700 flex items-center justify-between">
                {m.name}
                <Badge color={TYPE_COLORS[m.type] || 'gray'}>{m.type}</Badge>
              </button>
            ))}
          </div>
        )}
      </Modal>

      {/* Add meal modal */}
      <Modal open={showAddMeal} onClose={() => setShowAddMeal(false)} title="Add Meal"
        footer={<>
          <Button variant="secondary" onClick={() => setShowAddMeal(false)}>Cancel</Button>
          <Button onClick={handleAddMeal}>Add Meal</Button>
        </>}
      >
        <div className="space-y-3">
          <Input label="Meal name *" placeholder="e.g. Spaghetti Bolognese" value={mealForm.name}
            onChange={e => setMealForm(f => ({ ...f, name: e.target.value }))} autoFocus />
          <Select label="Type" value={mealForm.type} onChange={e => setMealForm(f => ({ ...f, type: e.target.value }))}>
            {MEAL_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </Select>
          <div className="flex gap-2">
            <Input label="Prep time (min)" type="number" value={mealForm.prepTimeMinutes} onChange={e => setMealForm(f => ({ ...f, prepTimeMinutes: e.target.value }))} />
            <Input label="Cook time (min)" type="number" value={mealForm.cookTimeMinutes} onChange={e => setMealForm(f => ({ ...f, cookTimeMinutes: e.target.value }))} />
            <Input label="Servings" type="number" value={mealForm.servings} onChange={e => setMealForm(f => ({ ...f, servings: e.target.value }))} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Ingredients</p>
            {mealForm.ingredients.map((ing, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-gray-600 py-1">
                <span className="flex-1">{ing.name}</span>
                {ing.quantity && <span className="text-gray-400">{ing.quantity}</span>}
                <button onClick={() => setMealForm(f => ({ ...f, ingredients: f.ingredients.filter((_, i) => i !== idx) }))}
                  className="text-gray-300 hover:text-red-400"><X size={14} /></button>
              </div>
            ))}
            <div className="flex gap-2 mt-1">
              <Input placeholder="Ingredient" value={ingInput.name} onChange={e => setIngInput(i => ({ ...i, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addIngredient()} />
              <Input placeholder="Qty" value={ingInput.quantity} onChange={e => setIngInput(i => ({ ...i, quantity: e.target.value }))}
                className="w-24" onKeyDown={e => e.key === 'Enter' && addIngredient()} />
              <Button variant="secondary" size="sm" onClick={addIngredient}>Add</Button>
            </div>
          </div>
          <Input label="Notes" value={mealForm.notes} onChange={e => setMealForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
      </Modal>

      {/* Add to grocery list modal */}
      <Modal open={!!showAddToGrocery} onClose={() => setShowAddToGrocery(null)} title={`Add "${showAddToGrocery?.name}" ingredients`}
        footer={<>
          <Button variant="secondary" onClick={() => setShowAddToGrocery(null)}>Cancel</Button>
          <Button onClick={handleAddToGrocery} disabled={!selectedListId}>Add to List</Button>
        </>}
      >
        {groceryLists.length === 0 ? (
          <p className="text-sm text-gray-500">No shopping lists found. Create a grocery list first.</p>
        ) : (
          <Select label="Choose a shopping list" value={selectedListId} onChange={e => setSelectedListId(e.target.value)}>
            {groceryLists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </Select>
        )}
      </Modal>
    </div>
  );
}

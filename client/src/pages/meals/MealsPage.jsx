import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight, UtensilsCrossed, ShoppingCart, X, Check, AlertCircle, Loader2, Sparkles, Clock, CalendarPlus, Search, Link, PenLine } from 'lucide-react';
import { useMeals } from '../../hooks/useMeals.js';
import { mealsApi, groceryApi } from '../../api.js';
import { useAuth } from '../../context/AuthContext.jsx';
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

const EMPTY_MEAL_FORM = {
  name: '', type: 'dinner', prepTimeMinutes: '', cookTimeMinutes: '',
  servings: '', notes: '', ingredients: [],
};

function formatWeekRange(weekStart) {
  const start = new Date(weekStart);
  const end   = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const o = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-IN', o)} – ${end.toLocaleDateString('en-IN', o)}`;
}

export default function MealsPage() {
  const { household } = useAuth();
  const memberCount = household?.memberCount || 2;

  const {
    meals, plan, weekStart, loading,
    createMeal, removeMeal, setPlanDay, markCooked,
    prevWeek, nextWeek, addToGroceries,
  } = useMeals();

  const [view, setView]             = useState('planner');
  const [slotPicker, setSlotPicker] = useState(null);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [addMealMode, setAddMealMode] = useState('search');
  const [mealForm, setMealForm]     = useState(EMPTY_MEAL_FORM);
  const [ingInput, setIngInput]     = useState({ name: '', quantity: '' });
  const [recipeLooking, setRecipeLooking] = useState(false);
  const [recipeFound, setRecipeFound]     = useState(false);
  const [addIngredientsToList, setAddIngredientsToList] = useState(true);
  const debounceRef = useRef(null);

  // Search mode state
  const [searchQuery, setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState(null); // { builtin, library }
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null); // recipe chosen from search
  const searchDebounceRef = useRef(null);

  // URL import mode state
  const [importUrl, setImportUrl]       = useState('');
  const [importing, setImporting]       = useState(false);
  const [importError, setImportError]   = useState('');
  const [importedRecipe, setImportedRecipe] = useState(null);

  // Grocery modal
  const [showAddToGrocery, setShowAddToGrocery] = useState(null);
  const [groceryLists, setGroceryLists]         = useState([]);
  const [selectedListId, setSelectedListId]     = useState('');

  // Inventory check state
  const [invCheck, setInvCheck]         = useState(null);
  const [invChecking, setInvChecking]   = useState(false);
  const [checkedMealId, setCheckedMealId] = useState(null);

  // Suggestions state
  const [suggestions, setSuggestions]         = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Cook tracking
  const [cookResult, setCookResult] = useState(null);
  const cookTimerRef = useRef(null);

  const handleCookSlot = async (date, slot) => {
    const result = await markCooked(date, slot);
    if (result) {
      clearTimeout(cookTimerRef.current);
      setCookResult(result);
      cookTimerRef.current = setTimeout(() => setCookResult(null), 4000);
    }
  };

  const fetchSuggestions = useCallback(async () => {
    setSuggestionsLoading(true);
    try {
      const data = await mealsApi.getSuggestions(memberCount);
      setSuggestions(data);
    } catch {}
    setSuggestionsLoading(false);
  }, [memberCount]);

  // Fetch suggestions when switching to that view
  useEffect(() => {
    if (view === 'suggestions' && !suggestions) fetchSuggestions();
  }, [view, suggestions, fetchSuggestions]);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const getPlanEntry = (date) => plan.find(p => p.date === date) || {};

  // Auto-fill recipe when meal name is typed in Add Meal modal
  useEffect(() => {
    if (!showAddMeal) return;
    const name = mealForm.name.trim();
    if (!name || name.length < 3) { setRecipeFound(false); return; }
    clearTimeout(debounceRef.current);
    setRecipeLooking(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const recipe = await mealsApi.lookupRecipe(name, memberCount);
        if (recipe) {
          setMealForm(f => ({
            ...f,
            type: recipe.type || f.type,
            prepTimeMinutes: recipe.prepTimeMinutes ?? f.prepTimeMinutes,
            cookTimeMinutes: recipe.cookTimeMinutes ?? f.cookTimeMinutes,
            servings: recipe.servings ?? f.servings,
            ingredients: recipe.ingredients,
          }));
          setRecipeFound(true);
        } else {
          setRecipeFound(false);
        }
      } catch {}
      setRecipeLooking(false);
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [mealForm.name, showAddMeal, memberCount]);

  // Search debounce
  useEffect(() => {
    if (addMealMode !== 'search') return;
    const q = searchQuery.trim();
    if (!q || q.length < 2) { setSearchResults(null); return; }
    clearTimeout(searchDebounceRef.current);
    setSearchLoading(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const data = await mealsApi.searchRecipes(q, memberCount);
        setSearchResults(data);
      } catch {}
      setSearchLoading(false);
    }, 400);
    return () => clearTimeout(searchDebounceRef.current);
  }, [searchQuery, addMealMode, memberCount]);

  const resetAddMealModal = () => {
    setMealForm(EMPTY_MEAL_FORM);
    setRecipeFound(false);
    setSearchQuery('');
    setSearchResults(null);
    setSelectedRecipe(null);
    setImportUrl('');
    setImportError('');
    setImportedRecipe(null);
    setAddMealMode('search');
    setAddIngredientsToList(true);
    setIngInput({ name: '', quantity: '' });
  };

  const applyRecipeToForm = (recipe) => {
    setMealForm({
      name: recipe.name || '',
      type: recipe.type || 'dinner',
      prepTimeMinutes: recipe.prepTimeMinutes || '',
      cookTimeMinutes: recipe.cookTimeMinutes || '',
      servings: recipe.servings || '',
      notes: recipe.notes || '',
      ingredients: recipe.ingredients || [],
    });
    setSelectedRecipe(recipe);
    setAddMealMode('manual'); // move to edit/confirm view
  };

  const handleImportUrl = async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportError('');
    setImportedRecipe(null);
    try {
      const recipe = await mealsApi.importFromUrl(importUrl.trim(), memberCount);
      setImportedRecipe(recipe);
      applyRecipeToForm(recipe);
    } catch (err) {
      setImportError(err.message || 'Could not import recipe from this URL');
    }
    setImporting(false);
  };

  const handleAddMeal = async () => {
    if (!mealForm.name.trim()) return;
    await createMeal({
      ...mealForm,
      prepTimeMinutes: mealForm.prepTimeMinutes || null,
      cookTimeMinutes: mealForm.cookTimeMinutes || null,
      servings: mealForm.servings || null,
    });
    resetAddMealModal();
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

  // Check inventory for a meal's ingredients
  const checkInventory = async (meal) => {
    if (!meal?.ingredients?.length) return;
    setCheckedMealId(meal.id);
    setInvChecking(true);
    setInvCheck(null);
    try {
      const result = await mealsApi.checkInventory(meal.ingredients);
      setInvCheck(result);
    } catch {}
    setInvChecking(false);
  };

  // Add missing/specific ingredients to grocery list — uses server-side enrichment
  // so shelf life + category are populated and items auto-track to inventory when bought
  const addMissingToGroceries = async (missing, mealName = 'meal') => {
    const lists = await groceryApi.getLists();
    if (!lists.length) return;
    await mealsApi.addIngredientsToGroceries(missing, mealName, lists[0].id);
    setInvCheck(null);
    setCheckedMealId(null);
  };

  const openSlotPicker = (date, slot) => {
    setSlotPicker({ date, slot });
    setInvCheck(null);
    setCheckedMealId(null);
  };

  const selectMealForSlot = async (mealId) => {
    if (!slotPicker) return;
    await setPlanDay(slotPicker.date, slotPicker.slot, mealId || null);
    setSlotPicker(null);
    setInvCheck(null);
  };

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>;

  const addMealToToday = async (recipe) => {
    const slot = recipe.type === 'breakfast' ? 'breakfast'
               : recipe.type === 'lunch'     ? 'lunch'
               :                               'dinner';
    await setPlanDay(today, slot, recipe.id);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Meal Planning"
        action={
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant={view === 'suggestions' ? 'primary' : 'secondary'}
              onClick={() => { setView('suggestions'); setSuggestions(null); }}>
              <Sparkles size={14} /> Suggestions
            </Button>
            <Button size="sm" variant={view === 'library' ? 'primary' : 'secondary'}
              onClick={() => setView(v => v === 'library' ? 'planner' : 'library')}>
              {view === 'library' ? 'Planner' : 'Library'}
            </Button>
            <Button size="sm" onClick={() => { resetAddMealModal(); setShowAddMeal(true); }}>
              <Plus size={15} /> Add Meal
            </Button>
          </div>
        }
      />

      {/* ── SUGGESTIONS VIEW ── */}
      {view === 'suggestions' && (
        <SuggestionsView
          suggestions={suggestions}
          loading={suggestionsLoading}
          onRefresh={fetchSuggestions}
          onAddMissing={addMissingToGroceries}
          onAddToToday={addMealToToday}
          onSwitchToPlanner={() => setView('planner')}
        />
      )}

      {/* ── PLANNER VIEW ── */}
      {view === 'planner' && (
        <>
          <div className="flex items-center gap-3 mb-5">
            <button onClick={prevWeek} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><ChevronLeft size={18} /></button>
            <span className="text-sm font-medium text-gray-700 flex-1 text-center">{formatWeekRange(weekStart)}</span>
            <button onClick={nextWeek} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><ChevronRight size={18} /></button>
          </div>
          <div className="space-y-2">
            {weekDays.map((date, i) => {
              const entry   = getPlanEntry(date);
              const isToday = date === today;
              return (
                <div key={date} className={`bg-white rounded-xl border ${isToday ? 'border-primary-200' : 'border-gray-100'} p-3`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-sm font-semibold ${isToday ? 'text-primary-600' : 'text-gray-700'}`}>{DAYS_SHORT[i]}</span>
                    <span className="text-xs text-gray-400">{new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                    {isToday && <Badge color="indigo">Today</Badge>}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {SLOTS.map(slot => {
                      const meal = slot === 'breakfast' ? entry.breakfastMeal
                                 : slot === 'lunch'     ? entry.lunchMeal
                                 :                        entry.dinnerMeal;
                      const mealId = slot === 'breakfast' ? entry.breakfast
                                   : slot === 'lunch'     ? entry.lunch
                                   :                        entry.dinner;
                      return (
                        <div key={slot}>
                          <p className="text-xs text-gray-400 capitalize mb-1">{slot}</p>
                          {meal ? (() => {
                            const isCooked = entry.cookedSlots?.includes(slot);
                            return (
                              <div className={`rounded-lg px-2 py-1.5 ${isCooked ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                                <div className="flex items-center gap-1 mb-1">
                                  <span className={`text-xs font-medium flex-1 truncate ${isCooked ? 'text-green-700' : 'text-gray-700'}`}>
                                    {isCooked && '✓ '}{meal.name}
                                  </span>
                                  {!isCooked && (
                                    <button onClick={() => setPlanDay(date, slot, null)} className="text-gray-300 hover:text-red-400 shrink-0"><X size={12} /></button>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {!isCooked && (
                                    <button
                                      onClick={() => handleCookSlot(date, slot)}
                                      className="text-xs text-green-600 hover:text-green-800 font-medium flex items-center gap-0.5"
                                    >
                                      <Check size={10} /> Cooked
                                    </button>
                                  )}
                                  {meal.ingredients?.length > 0 && !isCooked && (
                                    <button
                                      onClick={() => { setCheckedMealId(meal.id); checkInventory(meal); }}
                                      className="text-xs text-primary-500 hover:text-primary-700 font-medium flex items-center gap-0.5"
                                    >
                                      <ShoppingCart size={10} /> Check
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })() : (
                            <button onClick={() => openSlotPicker(date, slot)}
                              className="w-full bg-gray-50 hover:bg-primary-50 hover:border-primary-200 border border-dashed border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-400 hover:text-primary-500 transition-colors text-left">
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
      )}

      {/* ── COOK RESULT TOAST ── */}
      {cookResult && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 md:bottom-8 z-50 bg-green-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 max-w-sm w-[90vw] animate-fade-in">
          <Check size={18} className="shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{cookResult.message}</p>
            {cookResult.consumed?.length > 0 && (
              <p className="text-xs text-green-200 mt-0.5 truncate">
                Updated: {cookResult.consumed.map(c => c.name).join(', ')}
              </p>
            )}
          </div>
          <button onClick={() => setCookResult(null)} className="shrink-0 opacity-70 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── LIBRARY VIEW ── */}
      {view === 'library' && (
        meals.length === 0 ? (
          <EmptyState icon={UtensilsCrossed} title="No meals saved yet"
            description="Add meals to your library — ingredients fill in automatically"
            action={<Button onClick={() => setShowAddMeal(true)}><Plus size={16} /> Add Meal</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {meals.map(meal => (
              <div key={meal.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-medium text-gray-900 text-sm">{meal.name}</p>
                  <Badge color={TYPE_COLORS[meal.type] || 'gray'}>{meal.type}</Badge>
                </div>
                <div className="flex gap-3 text-xs text-gray-400 mb-2">
                  {meal.prepTimeMinutes && <span>Prep {meal.prepTimeMinutes}m</span>}
                  {meal.cookTimeMinutes && <span>Cook {meal.cookTimeMinutes}m</span>}
                  {meal.servings && <span>{meal.servings} servings</span>}
                </div>
                {meal.ingredients?.length > 0 && (
                  <p className="text-xs text-gray-400 mb-2">{meal.ingredients.length} ingredient{meal.ingredients.length !== 1 ? 's' : ''}</p>
                )}

                {/* Inventory check result for this meal */}
                {checkedMealId === meal.id && (
                  <InventoryCheckPanel
                    invCheck={invCheck}
                    invChecking={invChecking}
                    onAddMissing={addMissingToGroceries}
                    onDismiss={() => { setInvCheck(null); setCheckedMealId(null); }}
                  />
                )}

                <div className="flex gap-2 pt-2 border-t border-gray-50 mt-2">
                  {meal.ingredients?.length > 0 && (
                    <>
                      <button onClick={() => checkInventory(meal)}
                        className="text-xs text-primary-500 hover:text-primary-700 font-medium flex items-center gap-1">
                        <ShoppingCart size={11} /> Check ingredients
                      </button>
                      <button onClick={() => openAddToGrocery(meal)}
                        className="text-xs text-green-600 hover:text-green-700 font-medium ml-2">
                        Add all to list
                      </button>
                    </>
                  )}
                  <button onClick={() => { if (confirm('Delete this meal?')) removeMeal(meal.id); }}
                    className="text-xs text-red-400 hover:text-red-600 font-medium ml-auto">Remove</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── SLOT PICKER MODAL ── */}
      <Modal open={!!slotPicker} onClose={() => { setSlotPicker(null); setInvCheck(null); }}
        title={`Choose ${slotPicker?.slot}`}>
        {meals.length === 0 ? (
          <p className="text-sm text-gray-500">No meals in library. Add some first.</p>
        ) : (
          <div className="space-y-1">
            {meals.map(m => (
              <div key={m.id}>
                <button onClick={() => selectMealForSlot(m.id)}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-primary-50 text-sm text-gray-700 flex items-center justify-between">
                  {m.name}
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge color={TYPE_COLORS[m.type] || 'gray'}>{m.type}</Badge>
                    {m.ingredients?.length > 0 && (
                      <button
                        onClick={e => { e.stopPropagation(); checkInventory(m); }}
                        className="text-xs text-primary-500 hover:text-primary-700 flex items-center gap-0.5 font-medium"
                      >
                        <ShoppingCart size={11} /> Check
                      </button>
                    )}
                  </div>
                </button>
                {checkedMealId === m.id && (
                  <div className="mx-3 mb-2">
                    <InventoryCheckPanel
                      invCheck={invCheck}
                      invChecking={invChecking}
                      onAddMissing={addMissingToGroceries}
                      onDismiss={() => { setInvCheck(null); setCheckedMealId(null); }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* ── ADD MEAL MODAL ── */}
      <Modal
        open={showAddMeal}
        onClose={() => { setShowAddMeal(false); resetAddMealModal(); }}
        title="Add Meal"
        footer={
          addMealMode === 'manual' ? <>
            <Button variant="secondary" onClick={() => setAddMealMode('search')}>← Back</Button>
            <Button onClick={handleAddMeal} disabled={!mealForm.name.trim()}>Save to Library</Button>
          </> : <>
            <Button variant="secondary" onClick={() => { setShowAddMeal(false); resetAddMealModal(); }}>Cancel</Button>
          </>
        }
      >
        {/* Mode tabs */}
        {addMealMode !== 'manual' && (
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-4">
            {[
              { id: 'search', icon: Search,  label: 'Search' },
              { id: 'url',    icon: Link,    label: 'Import URL' },
              { id: 'manual', icon: PenLine, label: 'Manual' },
            ].map(m => (
              <button key={m.id} onClick={() => setAddMealMode(m.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  addMealMode === m.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <m.icon size={13} /> {m.label}
              </button>
            ))}
          </div>
        )}

        {/* ── SEARCH MODE ── */}
        {addMealMode === 'search' && (
          <div className="space-y-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl outline-none focus:border-primary-500 bg-white"
                placeholder="Search meals… e.g. Biryani, Pasta, Salad"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchLoading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
            </div>

            {/* Search results */}
            {searchResults && (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {searchResults.builtin?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">From recipe book</p>
                    <div className="space-y-1">
                      {searchResults.builtin.map((r, i) => (
                        <button key={i} onClick={() => applyRecipeToForm(r)}
                          className="w-full text-left px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-primary-50 hover:border-primary-200 border border-transparent transition-colors flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{r.name}</p>
                            <p className="text-xs text-gray-400">{r.ingredients?.length || 0} ingredients · {(r.prepTimeMinutes || 0) + (r.cookTimeMinutes || 0)}m</p>
                          </div>
                          <Badge color={TYPE_COLORS[r.type] || 'gray'}>{r.type}</Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {searchResults.library?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">From your library</p>
                    <div className="space-y-1">
                      {searchResults.library.map((r, i) => (
                        <button key={i} onClick={() => applyRecipeToForm(r)}
                          className="w-full text-left px-3 py-2.5 rounded-xl bg-primary-50 border border-primary-100 hover:border-primary-300 transition-colors flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{r.name}</p>
                            <p className="text-xs text-gray-400">{r.ingredients?.length || 0} ingredients</p>
                          </div>
                          <Badge color={TYPE_COLORS[r.type] || 'gray'}>{r.type}</Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {searchResults.builtin?.length === 0 && searchResults.library?.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No recipes found for "{searchQuery}"</p>
                    <div className="flex gap-2 justify-center mt-3">
                      <Button size="sm" variant="secondary" onClick={() => setAddMealMode('url')}>
                        <Link size={13} /> Import from URL
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => {
                        setMealForm(f => ({ ...f, name: searchQuery }));
                        setAddMealMode('manual');
                      }}>
                        <PenLine size={13} /> Add manually
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!searchResults && !searchLoading && (
              <div className="py-4 text-center text-sm text-gray-400">
                Type a meal name to search, or{' '}
                <button onClick={() => setAddMealMode('url')} className="text-primary-500 font-medium hover:underline">import from a URL</button>
              </div>
            )}
          </div>
        )}

        {/* ── URL IMPORT MODE ── */}
        {addMealMode === 'url' && (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-3">Paste a link from any recipe website or YouTube cooking video</p>
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-2.5 text-sm border border-gray-300 rounded-xl outline-none focus:border-primary-500 bg-white"
                  placeholder="https://www.example.com/recipe/..."
                  value={importUrl}
                  onChange={e => { setImportUrl(e.target.value); setImportError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleImportUrl()}
                  autoFocus
                />
                <Button onClick={handleImportUrl} disabled={importing || !importUrl.trim()} size="sm">
                  {importing ? <Loader2 size={14} className="animate-spin" /> : 'Import'}
                </Button>
              </div>
              {importError && (
                <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                  <AlertCircle size={12} /> {importError}
                </p>
              )}
            </div>

            {importing && (
              <div className="flex items-center gap-2 py-4 text-sm text-gray-400 justify-center">
                <Loader2 size={16} className="animate-spin" /> Fetching recipe…
              </div>
            )}

            <div className="text-xs text-gray-400 space-y-1">
              <p className="font-medium text-gray-500">Works with:</p>
              <p>🌐 AllRecipes, BBC Good Food, Bon Appétit, Serious Eats, NYT Cooking</p>
              <p>🎥 YouTube cooking channels (extracts ingredients from description)</p>
              <p>🍛 Hebbar's Kitchen, Swasthi's Recipes, Ranveer Brar, Kunal Kapur</p>
            </div>
          </div>
        )}

        {/* ── MANUAL / EDIT MODE ── */}
        {addMealMode === 'manual' && (
          <div className="space-y-3">
            {selectedRecipe && (
              <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg">
                <Check size={13} className="text-primary-600 shrink-0" />
                <p className="text-xs text-primary-700 font-medium">
                  {importedRecipe ? 'Imported from URL — review and save' : 'Recipe found — review and save'}
                </p>
              </div>
            )}
            <Input label="Meal name *" placeholder="e.g. Dal Tadka"
              value={mealForm.name} onChange={e => setMealForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            <Select label="Type" value={mealForm.type} onChange={e => setMealForm(f => ({ ...f, type: e.target.value }))}>
              {MEAL_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </Select>
            <div className="flex gap-2">
              <Input label="Prep (min)" type="number" value={mealForm.prepTimeMinutes}
                onChange={e => setMealForm(f => ({ ...f, prepTimeMinutes: e.target.value }))} />
              <Input label="Cook (min)" type="number" value={mealForm.cookTimeMinutes}
                onChange={e => setMealForm(f => ({ ...f, cookTimeMinutes: e.target.value }))} />
              <Input label="Servings" type="number" value={mealForm.servings}
                onChange={e => setMealForm(f => ({ ...f, servings: e.target.value }))} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Ingredients {mealForm.ingredients.length > 0 && <span className="text-gray-400 font-normal">({mealForm.ingredients.length})</span>}
              </p>
              {mealForm.ingredients.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-2 mb-2 max-h-40 overflow-y-auto space-y-1">
                  {mealForm.ingredients.map((ing, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <span className="flex-1 text-gray-700">{ing.name}</span>
                      <span className="text-gray-400 text-xs">{ing.quantity}</span>
                      <button onClick={() => setMealForm(f => ({ ...f, ingredients: f.ingredients.filter((_, i) => i !== idx) }))}
                        className="text-gray-300 hover:text-red-400 shrink-0"><X size={13} /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input placeholder="Ingredient" value={ingInput.name}
                  onChange={e => setIngInput(i => ({ ...i, name: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addIngredient()} />
                <Input placeholder="Qty" value={ingInput.quantity}
                  onChange={e => setIngInput(i => ({ ...i, quantity: e.target.value }))}
                  className="w-24" onKeyDown={e => e.key === 'Enter' && addIngredient()} />
                <Button variant="secondary" size="sm" onClick={addIngredient}>Add</Button>
              </div>
            </div>
            <Input label="Notes" value={mealForm.notes}
              onChange={e => setMealForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        )}
      </Modal>

      {/* ── ADD TO GROCERY MODAL ── */}
      <Modal open={!!showAddToGrocery} onClose={() => setShowAddToGrocery(null)}
        title={`Add "${showAddToGrocery?.name}" ingredients`}
        footer={<>
          <Button variant="secondary" onClick={() => setShowAddToGrocery(null)}>Cancel</Button>
          <Button onClick={handleAddToGrocery} disabled={!selectedListId}>Add to List</Button>
        </>}
      >
        {groceryLists.length === 0 ? (
          <p className="text-sm text-gray-500">No shopping lists found. Create a grocery list first.</p>
        ) : (
          <Select label="Choose a shopping list" value={selectedListId}
            onChange={e => setSelectedListId(e.target.value)}>
            {groceryLists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </Select>
        )}
      </Modal>
    </div>
  );
}

// ── Inventory Check Panel ─────────────────────────────────────────────────────
function InventoryCheckPanel({ invCheck, invChecking, onAddMissing, onDismiss }) {
  if (invChecking) return (
    <div className="flex items-center gap-2 py-2 text-xs text-gray-400">
      <Loader2 size={13} className="animate-spin" /> Checking your inventory…
    </div>
  );
  if (!invCheck) return null;

  const { have, missing } = invCheck;

  return (
    <div className="mt-2 rounded-xl border border-gray-200 bg-white overflow-hidden">
      {have.length > 0 && (
        <div className="px-3 py-2 border-b border-gray-100">
          <p className="text-xs font-semibold text-green-700 mb-1.5 flex items-center gap-1">
            <Check size={12} /> You have ({have.length})
          </p>
          <div className="space-y-1">
            {have.map((ing, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                <span className="flex-1">{ing.name}</span>
                <span className="text-gray-400">{ing.quantity}</span>
                {ing.daysLeft != null && (
                  <span className={`text-xs font-medium ${ing.daysLeft <= 3 ? 'text-red-500' : ing.daysLeft <= 7 ? 'text-amber-500' : 'text-green-500'}`}>
                    {ing.daysLeft <= 0 ? 'may be out' : `${ing.daysLeft}d left`}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {missing.length > 0 && (
        <div className="px-3 py-2">
          <p className="text-xs font-semibold text-red-700 mb-1.5 flex items-center gap-1">
            <AlertCircle size={12} /> Need to buy ({missing.length})
          </p>
          <div className="space-y-1 mb-3">
            {missing.map((ing, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                <span className="flex-1">{ing.name}</span>
                <span className="text-gray-400">{ing.quantity}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => onAddMissing(missing)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors"
          >
            <ShoppingCart size={12} /> Add {missing.length} missing item{missing.length !== 1 ? 's' : ''} to grocery list
          </button>
        </div>
      )}

      {missing.length === 0 && have.length > 0 && (
        <div className="px-3 py-2 text-xs text-green-700 font-medium flex items-center gap-1">
          <Check size={13} /> You have everything for this meal!
        </div>
      )}

      <div className="px-3 py-1.5 border-t border-gray-100">
        <button onClick={onDismiss} className="text-xs text-gray-400 hover:text-gray-600">Dismiss</button>
      </div>
    </div>
  );
}

// ── Suggestions View ──────────────────────────────────────────────────────────
const TYPE_COLORS_SG = { breakfast: 'yellow', lunch: 'green', dinner: 'blue', snack: 'purple' };
const TYPE_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];

function SuggestionsView({ suggestions, loading, onRefresh, onAddMissing, onAddToToday, onSwitchToPlanner }) {
  const [addingId, setAddingId] = useState(null);
  const [addedIds, setAddedIds] = useState(new Set());

  const handleAddToToday = async (recipe) => {
    setAddingId(recipe.id);
    try {
      await onAddToToday(recipe);
      setAddedIds(prev => new Set([...prev, recipe.id]));
    } catch {}
    setAddingId(null);
  };

  const handleAddMissing = async (missing) => {
    await onAddMissing(missing);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
      <Loader2 size={20} className="animate-spin" />
      <span className="text-sm">Checking your inventory…</span>
    </div>
  );

  if (!suggestions) return null;

  const { canMake, almostCanMake } = suggestions;

  // Group canMake by meal type
  const byType = TYPE_ORDER.reduce((acc, t) => {
    const items = canMake.filter(s => s.recipe.type === t);
    if (items.length) acc[t] = items;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">Based on what's in your inventory right now</p>
        <button onClick={onRefresh} className="text-xs text-primary-500 hover:text-primary-700 font-medium flex items-center gap-1">
          <Sparkles size={11} /> Refresh
        </button>
      </div>

      {/* ── Ready to cook ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">✅</span>
          <h2 className="text-sm font-bold text-gray-800">Ready to cook</h2>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{canMake.length} meal{canMake.length !== 1 ? 's' : ''}</span>
        </div>

        {canMake.length === 0 ? (
          <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-6 text-center">
            <p className="text-sm text-gray-500 font-medium">No meals fully covered by your inventory yet</p>
            <p className="text-xs text-gray-400 mt-1">Buy more groceries or check the "Almost there" section below</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(byType).map(([type, items]) => (
              <div key={type}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 capitalize">{type}</p>
                <div className="space-y-2">
                  {items.map(({ recipe, have }) => {
                    const totalMin = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);
                    const isAdded  = addedIds.has(recipe.id);
                    const isAdding = addingId === recipe.id;
                    return (
                      <div key={recipe.id} className="bg-white rounded-xl border border-green-100 p-3 flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-semibold text-gray-800">{recipe.name}</span>
                            <Badge color={TYPE_COLORS_SG[recipe.type] || 'gray'}>{recipe.type}</Badge>
                            {totalMin > 0 && (
                              <span className="flex items-center gap-0.5 text-xs text-gray-400">
                                <Clock size={11} /> {totalMin}m
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {have.slice(0, 5).map((h, i) => (
                              <span key={i} className={`text-xs px-1.5 py-0.5 rounded-full ${
                                h.daysLeft != null && h.daysLeft <= 3 ? 'bg-red-50 text-red-600' :
                                h.daysLeft != null && h.daysLeft <= 7 ? 'bg-amber-50 text-amber-600' :
                                'bg-green-50 text-green-700'
                              }`}>
                                {h.name.split(' (')[0]}
                                {h.daysLeft != null && h.daysLeft <= 7 && ` (${h.daysLeft}d)`}
                              </span>
                            ))}
                            {have.length > 5 && <span className="text-xs text-gray-400">+{have.length - 5} more</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddToToday(recipe)}
                          disabled={isAdding || isAdded}
                          className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            isAdded ? 'bg-green-100 text-green-700' :
                            'bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50'
                          }`}
                        >
                          {isAdded ? <><Check size={11} /> Added</> :
                           isAdding ? <Loader2 size={11} className="animate-spin" /> :
                           <><CalendarPlus size={11} /> Today</>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Almost there ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">🛒</span>
          <h2 className="text-sm font-bold text-gray-800">Almost there</h2>
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{almostCanMake.length} meal{almostCanMake.length !== 1 ? 's' : ''}</span>
          <span className="text-xs text-gray-400 ml-1">— buy 1–3 items</span>
        </div>

        {almostCanMake.length === 0 ? (
          <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-5 text-center">
            <p className="text-sm text-gray-400">No meals are 1–3 ingredients away</p>
          </div>
        ) : (
          <div className="space-y-2">
            {almostCanMake.map(({ recipe, have, missing }) => {
              const totalMin = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);
              return (
                <div key={recipe.id} className="bg-white rounded-xl border border-amber-100 p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800">{recipe.name}</span>
                      <Badge color={TYPE_COLORS_SG[recipe.type] || 'gray'}>{recipe.type}</Badge>
                      {totalMin > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-gray-400">
                          <Clock size={11} /> {totalMin}m
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Missing items */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {missing.map((m, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-medium">
                        <X size={9} /> {m.name.split(' (')[0]} <span className="text-red-400">{m.quantity}</span>
                      </span>
                    ))}
                  </div>

                  {/* Have items (muted) */}
                  {have.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {have.slice(0, 4).map((h, i) => (
                        <span key={i} className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">
                          ✓ {h.name.split(' (')[0]}
                        </span>
                      ))}
                      {have.length > 4 && <span className="text-xs text-gray-400">+{have.length - 4} more</span>}
                    </div>
                  )}

                  <button
                    onClick={() => handleAddMissing(missing)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <ShoppingCart size={11} />
                    Add {missing.length} item{missing.length !== 1 ? 's' : ''} to grocery list
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

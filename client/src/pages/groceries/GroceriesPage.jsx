import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, ShoppingBag, Loader2, Check, Pencil } from 'lucide-react';
import { useGroceries } from '../../hooks/useGroceries.js';
import { groceryApi } from '../../api.js';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Checkbox from '../../components/ui/Checkbox.jsx';

const CATEGORIES = [
  { id: 'produce',          label: 'Produce',              emoji: '🥦', color: 'green'  },
  { id: 'dairy',            label: 'Dairy & Eggs',         emoji: '🥛', color: 'blue'   },
  { id: 'meat',             label: 'Meat & Poultry',       emoji: '🥩', color: 'red'    },
  { id: 'seafood',          label: 'Seafood',              emoji: '🐟', color: 'blue'   },
  { id: 'deli',             label: 'Deli & Charcuterie',   emoji: '🧀', color: 'orange' },
  { id: 'bakery',           label: 'Bakery & Bread',       emoji: '🍞', color: 'yellow' },
  { id: 'pasta-grains',     label: 'Pasta & Grains',       emoji: '🍝', color: 'yellow' },
  { id: 'canned-goods',     label: 'Canned Goods',         emoji: '🥫', color: 'gray'   },
  { id: 'pantry',           label: 'Pantry & Spices',      emoji: '🧂', color: 'gray'   },
  { id: 'frozen',           label: 'Frozen Foods',         emoji: '🧊', color: 'indigo' },
  { id: 'beverages',        label: 'Beverages',            emoji: '🧃', color: 'purple' },
  { id: 'alcohol',          label: 'Alcohol',              emoji: '🍷', color: 'red'    },
  { id: 'snacks',           label: 'Snacks & Chips',       emoji: '🍿', color: 'orange' },
  { id: 'sweets',           label: 'Sweets & Candy',       emoji: '🍫', color: 'pink'   },
  { id: 'health-foods',     label: 'Health Foods',         emoji: '🌿', color: 'green'  },
  { id: 'vitamins',         label: 'Vitamins',             emoji: '💊', color: 'green'  },
  { id: 'cleaning',         label: 'Cleaning',             emoji: '🧹', color: 'blue'   },
  { id: 'laundry',          label: 'Laundry',              emoji: '🧺', color: 'blue'   },
  { id: 'kitchen-supplies', label: 'Kitchen Supplies',     emoji: '🍽️', color: 'gray'  },
  { id: 'personal-care',    label: 'Personal Care',        emoji: '🧴', color: 'purple' },
  { id: 'baby',             label: 'Baby & Kids',          emoji: '🍼', color: 'yellow' },
  { id: 'pet',              label: 'Pet Supplies',         emoji: '🐾', color: 'orange' },
  { id: 'other',            label: 'Other',                emoji: '🛒', color: 'gray'   },
];

const GROUPS = [
  { id: 'fresh',         label: 'Fresh Food',      emoji: '🥦', catIds: ['produce','dairy','meat','seafood','deli'] },
  { id: 'dry-goods',     label: 'Dry Goods',       emoji: '🍞', catIds: ['bakery','pasta-grains','canned-goods','pantry'] },
  { id: 'frozen-cold',   label: 'Frozen & Cold',   emoji: '🧊', catIds: ['frozen'] },
  { id: 'drinks',        label: 'Drinks',          emoji: '🧃', catIds: ['beverages','alcohol'] },
  { id: 'snacks-sweets', label: 'Snacks & Sweets', emoji: '🍿', catIds: ['snacks','sweets'] },
  { id: 'health',        label: 'Health',          emoji: '🌿', catIds: ['health-foods','vitamins'] },
  { id: 'household',     label: 'Household',       emoji: '🧹', catIds: ['cleaning','laundry','kitchen-supplies'] },
  { id: 'personal',      label: 'Personal & Care', emoji: '🧴', catIds: ['personal-care','baby','pet'] },
  { id: 'other',         label: 'Other',           emoji: '🛒', catIds: ['other'] },
];

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
const CAT_IDS = CATEGORIES.map(c => c.id);

function shelfLabel(days) {
  if (!days) return null;
  if (days >= 365) return `${Math.round(days / 365)}yr shelf life`;
  if (days >= 30)  return `${Math.round(days / 30)}mo shelf life`;
  return `${days}d shelf life`;
}

function freqLabel(f) {
  if (!f) return null;
  if (f < 1) return 'Occasionally';
  if (f === 1) return 'Once / month';
  return `${f}× / month`;
}

export default function GroceriesPage() {
  const {
    lists, items, activeListId, setActiveListId,
    loading, createList, deleteList,
    addItem, toggleBought, removeItem, clearBought,
  } = useGroceries();

  // New list modal
  const [newListName, setNewListName]   = useState('');
  const [newListGroups, setNewListGroups] = useState([]);
  const [showNewList, setShowNewList]   = useState(false);

  // Add item modal
  const [showAddItem, setShowAddItem]   = useState(false);
  const [itemName, setItemName]         = useState('');
  const [looking, setLooking]           = useState(false);
  const [suggestion, setSuggestion]     = useState(null); // auto-filled fields
  const [editing, setEditing]           = useState(false); // show edit fields
  const [editFields, setEditFields]     = useState({ category:'other', quantity:'', note:'', monthlyFrequency:null, shelfLifeDays:null });
  const debounceRef = useRef(null);

  const activeList = lists.find(l => l.id === activeListId);
  const boughtCount = items.filter(i => i.bought).length;
  const activeFocusGroups = activeList?.focusGroups || [];
  const focusCatIds = activeFocusGroups.length > 0
    ? GROUPS.filter(g => activeFocusGroups.includes(g.id)).flatMap(g => g.catIds)
    : null;

  const grouped = CAT_IDS.reduce((acc, cat) => {
    if (focusCatIds && !focusCatIds.includes(cat)) return acc;
    const catItems = items.filter(i => i.category === cat && !i.bought);
    if (catItems.length) acc[cat] = catItems;
    return acc;
  }, {});
  const unknownItems = items.filter(i => !CAT_MAP[i.category] && !i.bought);
  if (unknownItems.length) grouped['other'] = [...(grouped['other'] || []), ...unknownItems];
  const boughtItems = items.filter(i => i.bought);

  // Debounced lookup as user types
  useEffect(() => {
    if (!showAddItem) return;
    const name = itemName.trim();
    if (!name) { setSuggestion(null); setEditing(false); return; }
    clearTimeout(debounceRef.current);
    setLooking(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const match = await groceryApi.lookup(name);
        setSuggestion(match);
        if (match) {
          setEditFields({
            category: match.category,
            quantity: match.quantity || '',
            note: '',
            monthlyFrequency: match.monthlyFrequency ?? null,
            shelfLifeDays: match.shelfLifeDays ?? null,
          });
        } else {
          setEditFields({ category: 'other', quantity: '', note: '', monthlyFrequency: null, shelfLifeDays: null });
        }
      } catch {}
      setLooking(false);
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [itemName, showAddItem]);

  const resetAddItem = () => {
    setItemName('');
    setSuggestion(null);
    setEditing(false);
    setEditFields({ category:'other', quantity:'', note:'', monthlyFrequency:null, shelfLifeDays:null });
  };

  const handleAddItem = async () => {
    if (!itemName.trim()) return;
    await addItem({
      name: itemName.trim(),
      ...editFields,
    });
    resetAddItem();
    setShowAddItem(false);
  };

  // New list handlers
  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    await createList(newListName.trim(), newListGroups);
    setNewListName('');
    setNewListGroups([]);
    setShowNewList(false);
  };

  const toggleGroup = (id) =>
    setNewListGroups(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);

  const catMeta = (cat) => CAT_MAP[cat] || CAT_MAP['other'];

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <PageHeader
        title="Groceries"
        subtitle={activeList ? `${items.filter(i => !i.bought).length} items remaining` : undefined}
        action={
          <Button size="sm" onClick={() => setShowNewList(true)}>
            <Plus size={15} /> New List
          </Button>
        }
      />

      {/* List tabs */}
      {lists.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 pb-1">
          {lists.map(list => (
            <button key={list.id} onClick={() => setActiveListId(list.id)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                list.id === activeListId
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {list.name}
            </button>
          ))}
        </div>
      )}

      {/* Focus group chips */}
      {activeFocusGroups.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-4">
          {GROUPS.filter(g => activeFocusGroups.includes(g.id)).map(g => (
            <span key={g.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium border border-primary-200">
              {g.emoji} {g.label}
            </span>
          ))}
        </div>
      )}

      {lists.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No shopping lists yet"
          description="Create your first shopping list to get started"
          action={<Button onClick={() => setShowNewList(true)}><Plus size={16} /> Create List</Button>}
        />
      ) : (
        <>
          <div className="flex justify-between items-center mb-4 gap-2">
            <Button size="sm" variant="secondary" onClick={() => { resetAddItem(); setShowAddItem(true); }}>
              <Plus size={15} /> Add Item
            </Button>
            <div className="flex gap-2">
              {boughtCount > 0 && (
                <Button size="sm" variant="ghost" onClick={clearBought}>
                  Clear bought ({boughtCount})
                </Button>
              )}
              <Button size="icon" variant="ghost"
                onClick={() => { if (confirm('Delete this list and all its items?')) deleteList(activeListId); }}
                title="Delete list"
              >
                <Trash2 size={16} className="text-red-400" />
              </Button>
            </div>
          </div>

          {items.length === 0 && (
            <EmptyState icon={ShoppingBag} title="List is empty" description="Add items to get started" />
          )}

          {Object.entries(grouped).map(([cat, catItems]) => {
            const m = catMeta(cat);
            return (
              <div key={cat} className="mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{m.emoji} {m.label}</p>
                <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
                  {catItems.map(item => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                      <Checkbox checked={item.bought} onChange={() => toggleBought(item.id, !item.bought)} />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-800">{item.name}</span>
                        {item.quantity && <span className="text-xs text-gray-400 ml-2">{item.quantity}</span>}
                        <div className="flex gap-1.5 mt-0.5 flex-wrap">
                          {item.monthlyFrequency != null && (
                            <span className="text-xs text-gray-400">{freqLabel(item.monthlyFrequency)}</span>
                          )}
                          {item.shelfLifeDays != null && (
                            <span className="text-xs text-gray-400">· {shelfLabel(item.shelfLifeDays)}</span>
                          )}
                          {item.note ? <span className="text-xs text-gray-400 truncate">· {item.note}</span> : null}
                        </div>
                      </div>
                      <Badge color={m.color}>{m.emoji}</Badge>
                      <button onClick={() => removeItem(item.id)} className="p-1 text-gray-300 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {boughtItems.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">✓ Bought</p>
              <div className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100">
                {boughtItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <Checkbox checked onChange={() => toggleBought(item.id, false)} />
                    <span className="flex-1 text-sm text-gray-400 line-through">{item.name}</span>
                    <button onClick={() => removeItem(item.id)} className="p-1 text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Add Item Modal ── */}
      <Modal
        open={showAddItem}
        onClose={() => { setShowAddItem(false); resetAddItem(); }}
        title="Add Item"
        footer={<>
          <Button variant="secondary" onClick={() => { setShowAddItem(false); resetAddItem(); }}>Cancel</Button>
          <Button onClick={handleAddItem} disabled={!itemName.trim()}>Add to List</Button>
        </>}
      >
        <div className="space-y-4">
          {/* Name input */}
          <div className="relative">
            <Input
              label="What do you need?"
              placeholder="e.g. Milk, Chicken breast, Shampoo…"
              value={itemName}
              onChange={e => setItemName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !looking && itemName.trim() && handleAddItem()}
              autoFocus
            />
            {looking && (
              <Loader2 size={14} className="absolute right-3 top-9 text-gray-400 animate-spin" />
            )}
          </div>

          {/* Auto-filled suggestion card */}
          {itemName.trim() && !looking && (
            <div className={`rounded-xl border p-4 transition-colors ${suggestion ? 'border-primary-200 bg-primary-50' : 'border-gray-200 bg-gray-50'}`}>
              {suggestion ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Check size={15} className="text-primary-600" />
                      <span className="text-sm font-semibold text-primary-700">Details filled automatically</span>
                    </div>
                    <button
                      onClick={() => setEditing(e => !e)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600 transition-colors"
                    >
                      <Pencil size={12} /> {editing ? 'Hide' : 'Edit'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{catMeta(editFields.category).emoji}</span>
                      <div>
                        <p className="text-xs text-gray-400">Category</p>
                        <p className="font-medium text-gray-700">{catMeta(editFields.category).label}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Quantity</p>
                      <p className="font-medium text-gray-700">{editFields.quantity || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">How often</p>
                      <p className="font-medium text-gray-700">{freqLabel(editFields.monthlyFrequency) || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Shelf life</p>
                      <p className="font-medium text-gray-700">{shelfLabel(editFields.shelfLifeDays) || '—'}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">No match found — <span className="font-medium">added as "Other"</span></p>
                  <button
                    onClick={() => setEditing(e => !e)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600 transition-colors"
                  >
                    <Pencil size={12} /> {editing ? 'Hide' : 'Set manually'}
                  </button>
                </div>
              )}

              {/* Editable override fields */}
              {editing && (
                <div className="mt-4 space-y-3 border-t border-gray-200 pt-4">
                  <Select label="Category" value={editFields.category}
                    onChange={e => setEditFields(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                    ))}
                  </Select>
                  <Input label="Quantity" placeholder="e.g. 2 L" value={editFields.quantity}
                    onChange={e => setEditFields(f => ({ ...f, quantity: e.target.value }))} />
                  <div className="flex gap-2">
                    <Input label="Times/month" type="number" min="0" step="0.5"
                      placeholder="e.g. 4"
                      value={editFields.monthlyFrequency ?? ''}
                      onChange={e => setEditFields(f => ({ ...f, monthlyFrequency: e.target.value ? parseFloat(e.target.value) : null }))} />
                    <Input label="Shelf life (days)" type="number" min="1"
                      placeholder="e.g. 7"
                      value={editFields.shelfLifeDays ?? ''}
                      onChange={e => setEditFields(f => ({ ...f, shelfLifeDays: e.target.value ? parseInt(e.target.value) : null }))} />
                  </div>
                  <Input label="Note (optional)" placeholder="e.g. Organic preferred"
                    value={editFields.note}
                    onChange={e => setEditFields(f => ({ ...f, note: e.target.value }))} />
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* ── New List Modal ── */}
      <Modal open={showNewList} onClose={() => setShowNewList(false)} title="New Shopping List"
        footer={<>
          <Button variant="secondary" onClick={() => setShowNewList(false)}>Cancel</Button>
          <Button onClick={handleCreateList} disabled={!newListName.trim()}>Create</Button>
        </>}
      >
        <div className="space-y-4">
          <Input label="List name" placeholder="e.g. Weekly Shop" value={newListName}
            onChange={e => setNewListName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateList()} autoFocus />
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Category groups <span className="text-gray-400 font-normal">(optional)</span></p>
            <p className="text-xs text-gray-400 mb-3">Leave empty to show all categories.</p>
            <div className="grid grid-cols-3 gap-2">
              {GROUPS.map(g => {
                const selected = newListGroups.includes(g.id);
                return (
                  <button key={g.id} type="button" onClick={() => toggleGroup(g.id)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-colors ${
                      selected
                        ? 'bg-primary-50 border-primary-400 text-primary-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl">{g.emoji}</span>
                    <span className="text-xs font-medium leading-tight">{g.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

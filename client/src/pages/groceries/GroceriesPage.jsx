import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, ShoppingBag, Loader2, Check, Pencil, RotateCcw } from 'lucide-react';
import { useGroceries } from '../../hooks/useGroceries.js';
import { groceryApi } from '../../api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Checkbox from '../../components/ui/Checkbox.jsx';
import LowStockAlerts from '../../components/LowStockAlerts.jsx';

const CATEGORIES = [
  { id: 'produce',          label: 'Produce',              emoji: '🥦', color: 'green'  },
  { id: 'dairy',            label: 'Dairy & Eggs',         emoji: '🥛', color: 'blue'   },
  { id: 'meat',             label: 'Meat & Poultry',       emoji: '🥩', color: 'red'    },
  { id: 'seafood',          label: 'Seafood',              emoji: '🐟', color: 'blue'   },
  { id: 'deli',             label: 'Deli & Charcuterie',   emoji: '🧀', color: 'orange' },
  { id: 'bakery',           label: 'Bakery & Bread',       emoji: '🍞', color: 'yellow' },
  { id: 'pasta-grains',     label: 'Dal & Grains',         emoji: '🫘', color: 'yellow' },
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

const DEFAULT_FIELDS = { category: 'other', quantity: '', note: '', monthlyFrequency: null, shelfLifeDays: null };

export default function GroceriesPage() {
  const { household } = useAuth();
  const memberCount = household?.memberCount || null;
  const {
    lists, items, activeListId,
    loading, createList, addItem, toggleBought, reAddItem, removeItem, clearBought,
  } = useGroceries();

  // Ensure a default list exists
  useEffect(() => {
    if (!loading && lists.length === 0) {
      createList('My Groceries', []);
    }
  }, [loading, lists.length]);

  const boughtCount = items.filter(i => i.bought).length;
  const pendingCount = items.filter(i => !i.bought).length;

  // Edit-on-buy modal — shown when user taps checkbox on a pending item
  const [buyModal, setBuyModal]   = useState(null); // the item being confirmed
  const [buyForm, setBuyForm]     = useState({});   // editable fields
  const [buying, setBuying]       = useState(false);

  const openBuyModal = (item) => {
    setBuyModal(item);
    setBuyForm({
      quantity:    item.quantity || '',
      note:        item.note    || '',
      shelfLifeDays: item.shelfLifeDays ?? '',
    });
  };

  const confirmBuy = async () => {
    if (!buyModal) return;
    setBuying(true);
    // Save any edits first, then mark as bought
    await toggleBought(buyModal.id, true, {
      quantity:      buyForm.quantity,
      note:          buyForm.note,
      shelfLifeDays: buyForm.shelfLifeDays !== '' ? parseInt(buyForm.shelfLifeDays) || null : null,
    });
    setBuyModal(null);
    setBuying(false);
  };

  // Grouped by category (only non-bought, in canonical order)
  const grouped = CAT_IDS.reduce((acc, cat) => {
    const catItems = items.filter(i => i.category === cat && !i.bought);
    if (catItems.length) acc[cat] = catItems;
    return acc;
  }, {});
  const unknownItems = items.filter(i => !CAT_MAP[i.category] && !i.bought);
  if (unknownItems.length) grouped['other'] = [...(grouped['other'] || []), ...unknownItems];
  const boughtItems = items.filter(i => i.bought);

  // Add item modal state
  const [showAdd, setShowAdd]       = useState(false);
  const [itemName, setItemName]     = useState('');
  const [looking, setLooking]       = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [editing, setEditing]       = useState(false);
  const [fields, setFields]         = useState(DEFAULT_FIELDS);
  const debounceRef                 = useRef(null);

  // Debounced auto-lookup as user types
  useEffect(() => {
    if (!showAdd) return;
    const name = itemName.trim();
    if (!name) { setSuggestion(null); setEditing(false); setFields(DEFAULT_FIELDS); return; }
    clearTimeout(debounceRef.current);
    setLooking(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const match = await groceryApi.lookup(name, memberCount);
        setSuggestion(match);
        setFields(match
          ? { category: match.category, quantity: match.quantity || '', note: '', monthlyFrequency: match.monthlyFrequency ?? null, shelfLifeDays: match.shelfLifeDays ?? null }
          : DEFAULT_FIELDS
        );
      } catch {}
      setLooking(false);
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [itemName, showAdd]);

  const resetAdd = () => {
    setItemName('');
    setSuggestion(null);
    setEditing(false);
    setFields(DEFAULT_FIELDS);
  };

  const handleAdd = async () => {
    if (!itemName.trim()) return;
    await addItem({ name: itemName.trim(), ...fields });
    resetAdd();
    // keep modal open so user can add more items quickly
    setItemName('');
  };

  const catMeta = id => CAT_MAP[id] || CAT_MAP['other'];

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <PageHeader
        title="Groceries"
        subtitle={pendingCount > 0 ? `${pendingCount} item${pendingCount !== 1 ? 's' : ''} to buy` : 'Nothing to buy'}
        action={
          <div className="flex items-center gap-2">
            {boughtCount > 0 && (
              <Button size="sm" variant="ghost" onClick={clearBought}>
                Clear bought ({boughtCount})
              </Button>
            )}
            <Button size="sm" onClick={() => { resetAdd(); setShowAdd(true); }}>
              <Plus size={15} /> Add Item
            </Button>
          </div>
        }
      />

      {/* Low stock alerts */}
      <LowStockAlerts onReAdded={() => {}} />

      {/* Empty state */}
      {items.length === 0 && (
        <EmptyState
          icon={ShoppingBag}
          title="Your grocery list is empty"
          description="Tap Add Item and type what you need — details fill in automatically"
          action={
            <Button onClick={() => { resetAdd(); setShowAdd(true); }}>
              <Plus size={16} /> Add Item
            </Button>
          }
        />
      )}

      {/* Grouped items */}
      {Object.entries(grouped).map(([cat, catItems]) => {
        const m = catMeta(cat);
        return (
          <div key={cat} className="mb-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              {m.emoji} {m.label}
            </p>
            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
              {catItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <Checkbox checked={false} onChange={() => openBuyModal(item)} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-800">{item.name}</span>
                    {item.quantity && (
                      <span className="text-xs text-gray-400 ml-2">{item.quantity}</span>
                    )}
                    <div className="flex gap-2 mt-0.5 flex-wrap">
                      {item.monthlyFrequency != null && (
                        <span className="text-xs text-gray-400">{freqLabel(item.monthlyFrequency)}</span>
                      )}
                      {item.shelfLifeDays != null && (
                        <span className="text-xs text-gray-400">· {shelfLabel(item.shelfLifeDays)}</span>
                      )}
                      {item.note ? <span className="text-xs text-gray-400 truncate">· {item.note}</span> : null}
                    </div>
                  </div>
                  <span className="text-base shrink-0">{m.emoji}</span>
                  <button onClick={() => removeItem(item.id)}
                    className="p-1 text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Bought section */}
      {boughtItems.length > 0 && (
        <div className="mt-2 mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            ✓ Bought ({boughtCount})
          </p>
          <div className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100">
            {boughtItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <Checkbox checked onChange={() => toggleBought(item.id, false)} />
                <span className="flex-1 text-sm text-gray-400 line-through truncate">{item.name}</span>
                <button
                  onClick={() => reAddItem(item)}
                  title="Add to list again"
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors shrink-0"
                >
                  <RotateCcw size={12} /> Re-add
                </button>
                <button onClick={() => removeItem(item.id)}
                  className="p-1 text-gray-300 hover:text-red-400 transition-colors shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Add Item Modal ── */}
      <Modal
        open={showAdd}
        onClose={() => { setShowAdd(false); resetAdd(); }}
        title="Add Item"
        footer={<>
          <Button variant="secondary" onClick={() => { setShowAdd(false); resetAdd(); }}>Done</Button>
          <Button onClick={handleAdd} disabled={!itemName.trim() || looking}>
            Add
          </Button>
        </>}
      >
        <div className="space-y-4">
          <div className="relative">
            <Input
              label="What do you need?"
              placeholder="e.g. Milk, Chicken breast, Shampoo…"
              value={itemName}
              onChange={e => setItemName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !looking && itemName.trim()) handleAdd(); }}
              autoFocus
            />
            {looking && (
              <Loader2 size={14} className="absolute right-3 top-9 text-gray-400 animate-spin" />
            )}
          </div>

          {/* Auto-fill preview */}
          {itemName.trim() && !looking && (
            <div className={`rounded-xl border p-4 ${suggestion ? 'border-primary-200 bg-primary-50' : 'border-gray-200 bg-gray-50'}`}>
              {suggestion ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-primary-600" />
                      <span className="text-sm font-semibold text-primary-700">Auto-filled</span>
                    </div>
                    <button onClick={() => setEditing(e => !e)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600">
                      <Pencil size={11} /> {editing ? 'Hide' : 'Edit'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{catMeta(fields.category).emoji}</span>
                      <div>
                        <p className="text-xs text-gray-400">Category</p>
                        <p className="font-medium text-gray-700">{catMeta(fields.category).label}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Quantity</p>
                      <p className="font-medium text-gray-700">{fields.quantity || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">How often</p>
                      <p className="font-medium text-gray-700">{freqLabel(fields.monthlyFrequency) || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Shelf life</p>
                      <p className="font-medium text-gray-700">{shelfLabel(fields.shelfLifeDays) || '—'}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">Not recognised — will add as <span className="font-medium">Other</span></p>
                  <button onClick={() => setEditing(e => !e)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600">
                    <Pencil size={11} /> {editing ? 'Hide' : 'Set manually'}
                  </button>
                </div>
              )}

              {editing && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                  <Select label="Category" value={fields.category}
                    onChange={e => setFields(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                    ))}
                  </Select>
                  <Input label="Quantity" placeholder="e.g. 2 L"
                    value={fields.quantity}
                    onChange={e => setFields(f => ({ ...f, quantity: e.target.value }))} />
                  <div className="flex gap-2">
                    <Input label="Times/month" type="number" min="0" step="0.5"
                      placeholder="e.g. 4"
                      value={fields.monthlyFrequency ?? ''}
                      onChange={e => setFields(f => ({ ...f, monthlyFrequency: e.target.value ? parseFloat(e.target.value) : null }))} />
                    <Input label="Shelf life (days)" type="number" min="1"
                      placeholder="e.g. 7"
                      value={fields.shelfLifeDays ?? ''}
                      onChange={e => setFields(f => ({ ...f, shelfLifeDays: e.target.value ? parseInt(e.target.value) : null }))} />
                  </div>
                  <Input label="Note" placeholder="e.g. Organic preferred"
                    value={fields.note}
                    onChange={e => setFields(f => ({ ...f, note: e.target.value }))} />
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* ── Buy Confirmation Modal ── */}
      <Modal
        open={!!buyModal}
        onClose={() => setBuyModal(null)}
        title={`Marking as bought: ${buyModal?.name}`}
        footer={<>
          <Button variant="secondary" onClick={() => setBuyModal(null)}>Cancel</Button>
          <Button onClick={confirmBuy} disabled={buying}>
            {buying ? 'Saving…' : 'Mark as Bought'}
          </Button>
        </>}
      >
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Confirm or edit the details before adding to inventory.
            Items with shelf life ≥ 7 days are automatically tracked.
          </p>
          <Input
            label="Quantity bought"
            placeholder="e.g. 500g, 1 kg, 250 ml"
            value={buyForm.quantity || ''}
            onChange={e => setBuyForm(f => ({ ...f, quantity: e.target.value }))}
            autoFocus
          />
          <div>
            <label className="text-sm font-medium text-gray-700">Shelf life (days)</label>
            <p className="text-xs text-gray-400 mb-1">How long this item typically lasts at home</p>
            <input
              type="number"
              min="1"
              placeholder="e.g. 7 for veggies, 365 for spices"
              value={buyForm.shelfLifeDays ?? ''}
              onChange={e => setBuyForm(f => ({ ...f, shelfLifeDays: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-primary-500 bg-white"
            />
            {buyForm.shelfLifeDays && parseInt(buyForm.shelfLifeDays) >= 7 && (
              <p className="text-xs text-green-600 mt-1">
                ✓ Will be tracked in inventory with estimated end date
              </p>
            )}
            {buyForm.shelfLifeDays && parseInt(buyForm.shelfLifeDays) < 7 && (
              <p className="text-xs text-gray-400 mt-1">
                Shelf life under 7 days — won't be tracked in inventory
              </p>
            )}
          </div>
          <Input
            label="Note (optional)"
            placeholder="e.g. Brand, variant"
            value={buyForm.note || ''}
            onChange={e => setBuyForm(f => ({ ...f, note: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  );
}

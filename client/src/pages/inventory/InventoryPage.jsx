import { useState } from 'react';
import { Plus, Trash2, Package, Search, Wrench, ShoppingCart, CalendarClock, User, CheckSquare, Square } from 'lucide-react';
import { useInventory } from '../../hooks/useInventory.js';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';

const HW_CATEGORIES = ['appliances', 'electronics', 'furniture', 'tools', 'vehicles', 'garden', 'other'];
const CAT_COLORS = {
  appliances: 'blue', electronics: 'indigo', furniture: 'yellow',
  tools: 'orange', vehicles: 'gray', garden: 'green', other: 'gray',
};

// Grocery category groups — same as GroceriesPage
const GROCERY_GROUPS = [
  { id: 'all',           label: 'All',              emoji: '🛒', catIds: null },
  { id: 'fresh',         label: 'Fresh Food',       emoji: '🥦', catIds: ['produce','dairy','meat','seafood','deli'] },
  { id: 'dry-goods',     label: 'Dry Goods',        emoji: '🍞', catIds: ['bakery','pasta-grains','canned-goods','pantry'] },
  { id: 'frozen-cold',   label: 'Frozen & Cold',    emoji: '🧊', catIds: ['frozen'] },
  { id: 'drinks',        label: 'Drinks',           emoji: '🧃', catIds: ['beverages','alcohol'] },
  { id: 'snacks-sweets', label: 'Snacks & Sweets',  emoji: '🍿', catIds: ['snacks','sweets'] },
  { id: 'health',        label: 'Health',           emoji: '🌿', catIds: ['health-foods','vitamins'] },
  { id: 'household',     label: 'Household',        emoji: '🧹', catIds: ['cleaning','laundry','kitchen-supplies'] },
  { id: 'personal',      label: 'Personal & Care',  emoji: '🧴', catIds: ['personal-care','baby','pet'] },
  { id: 'other',         label: 'Other',            emoji: '📦', catIds: ['other'] },
];

const EMPTY_FORM = {
  name: '', category: 'appliances', brand: '', model: '',
  purchaseDate: '', purchasePrice: '', warrantyExpiry: '',
  lastMaintenanceDate: '', nextMaintenanceDate: '', maintenanceNotes: '',
  location: '', notes: '',
};

const today = new Date().toISOString().split('T')[0];

function warrantyStatus(expiry) {
  if (!expiry) return null;
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  if (expiry < today) return { label: 'Warranty expired', color: 'red' };
  if (expiry <= in30) return { label: 'Warranty expiring soon', color: 'yellow' };
  return { label: `Warranty until ${expiry}`, color: 'green' };
}

function stockStatus(estimatedEndDate) {
  if (!estimatedEndDate) return null;
  const daysLeft = Math.round((new Date(estimatedEndDate) - new Date(today)) / 86400000);
  if (daysLeft < 0)  return { label: 'Stock likely finished', color: 'red', days: daysLeft };
  if (daysLeft <= 3) return { label: `Runs out in ${daysLeft}d`, color: 'red', days: daysLeft };
  if (daysLeft <= 7) return { label: `Runs out in ${daysLeft}d`, color: 'yellow', days: daysLeft };
  return { label: `~${daysLeft}d remaining`, color: 'green', days: daysLeft };
}

export default function InventoryPage() {
  const { items, loading, search, setSearch, categoryFilter, setCategoryFilter, create, update, remove, bulkRemove } = useInventory();
  const [tab, setTab]                   = useState('grocery');
  const [groceryGroup, setGroceryGroup] = useState('all');
  const [showAdd, setShowAdd]           = useState(false);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [editId, setEditId]             = useState(null);

  // Multi-select state
  const [selectMode, setSelectMode]     = useState(false);
  const [selected, setSelected]         = useState(new Set());
  const [deleting, setDeleting]         = useState(false);

  const toggleSelect = (id) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const toggleSelectAll = (visibleIds) => {
    const allSelected = visibleIds.every(id => selected.has(id));
    setSelected(allSelected ? new Set() : new Set(visibleIds));
  };

  const exitSelectMode = () => { setSelectMode(false); setSelected(new Set()); };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} item${selected.size !== 1 ? 's' : ''}?`)) return;
    setDeleting(true);
    await bulkRemove([...selected]);
    exitSelectMode();
    setDeleting(false);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    if (editId) await update(editId, form);
    else await create(form);
    setForm(EMPTY_FORM);
    setShowAdd(false);
    setEditId(null);
  };

  const openEdit = (item) => {
    setForm({ ...EMPTY_FORM, ...item, purchasePrice: item.purchasePrice != null ? String(item.purchasePrice) : '' });
    setEditId(item.id);
    setShowAdd(true);
  };

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>;

  const groceryItems   = items.filter(i => i.fromGrocery);
  const householdItems = items.filter(i => !i.fromGrocery);

  const activeGroup = GROCERY_GROUPS.find(g => g.id === groceryGroup);
  const filteredGroceryItems = groceryItems.filter(item => {
    if (!activeGroup?.catIds) return true;
    return activeGroup.catIds.includes(item.category);
  }).filter(item => !search || item.name.toLowerCase().includes(search.toLowerCase()));

  const visibleIds = tab === 'grocery'
    ? filteredGroceryItems.map(i => i.id)
    : householdItems.map(i => i.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every(id => selected.has(id));

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Inventory"
        subtitle={`${groceryItems.length} grocery · ${householdItems.length} household`}
        action={
          selectMode ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{selected.size} selected</span>
              <Button size="sm" variant="secondary" onClick={exitSelectMode}>Cancel</Button>
              <Button size="sm" variant="danger" onClick={handleBulkDelete} disabled={selected.size === 0 || deleting}>
                <Trash2 size={14} /> {deleting ? 'Deleting…' : `Delete (${selected.size})`}
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              {tab === 'household' && (
                <Button size="sm" onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowAdd(true); }}>
                  <Plus size={15} /> Add Item
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => setSelectMode(true)}>
                <CheckSquare size={14} /> Select
              </Button>
            </div>
          )
        }
      />

      {/* Main tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { id: 'grocery',   label: '🛒 From Groceries', count: groceryItems.length },
          { id: 'household', label: '📦 Household',       count: householdItems.length },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              tab === t.id
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {t.label}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── GROCERY TAB ── */}
      {tab === 'grocery' && (
        <>
          {/* Category group pills */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-4">
            {GROCERY_GROUPS.map(g => {
              const count = g.catIds
                ? groceryItems.filter(i => g.catIds.includes(i.category)).length
                : groceryItems.length;
              if (g.id !== 'all' && count === 0) return null; // hide empty groups
              return (
                <button
                  key={g.id}
                  onClick={() => setGroceryGroup(g.id)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    groceryGroup === g.id
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span>{g.emoji}</span>
                  <span>{g.label}</span>
                  <span className={`text-xs px-1 rounded-full ${groceryGroup === g.id ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-primary-500 bg-white"
              placeholder="Search items…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {groceryItems.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="No grocery items tracked yet"
              description="When you tick off an item in the Groceries section, it automatically appears here with purchase date and estimated end date"
            />
          ) : filteredGroceryItems.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title={`No ${activeGroup?.label || ''} items in inventory`}
              description="Buy items from this category and tick them off in groceries"
            />
          ) : (
            <div className="space-y-3">
              {/* Select all bar */}
              {selectMode && filteredGroceryItems.length > 0 && (
                <button onClick={() => toggleSelectAll(filteredGroceryItems.map(i => i.id))}
                  className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-800 pb-1">
                  {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                  {allSelected ? 'Deselect all' : 'Select all'}
                </button>
              )}
              {filteredGroceryItems.map(item => {
                const ss = stockStatus(item.estimatedEndDate);
                const isSelected = selected.has(item.id);
                return (
                  <div key={item.id}
                    onClick={selectMode ? () => toggleSelect(item.id) : undefined}
                    className={`bg-white rounded-xl border p-4 transition-colors ${
                      selectMode ? 'cursor-pointer ' : ''
                    }${isSelected ? 'border-primary-400 bg-primary-50' : ss?.color === 'red' ? 'border-red-200' : 'border-gray-100'}`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {selectMode && (
                          <span className="shrink-0">
                            {isSelected ? <CheckSquare size={16} className="text-primary-600" /> : <Square size={16} className="text-gray-300" />}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                          {item.stockQuantity && (
                            <p className="text-xs text-gray-400 mt-0.5">Qty: {item.stockQuantity}</p>
                          )}
                        </div>
                      </div>
                      {ss && !selectMode && <Badge color={ss.color}>{ss.label}</Badge>}
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      {item.purchaseDate && (
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <CalendarClock size={12} className="text-gray-400 shrink-0" />
                          <span>Bought {item.purchaseDate}</span>
                        </div>
                      )}
                      {item.purchasedBy && (
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <User size={12} className="text-gray-400 shrink-0" />
                          <span>By {item.purchasedBy}</span>
                        </div>
                      )}
                      {item.estimatedEndDate && (
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <CalendarClock size={12} className="text-gray-400 shrink-0" />
                          <span>Est. end {item.estimatedEndDate}</span>
                        </div>
                      )}
                      {item.monthlyFrequency != null && (
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <span>
                            {item.monthlyFrequency < 1 ? 'Occasionally' :
                             item.monthlyFrequency === 1 ? 'Once/month' :
                             `${item.monthlyFrequency}×/month`}
                          </span>
                        </div>
                      )}
                    </div>

                    {item.notes && (
                      <p className="text-xs text-gray-400 mt-2 truncate">{item.notes}</p>
                    )}

                    <div className="flex justify-end mt-3 pt-3 border-t border-gray-50">
                      {!selectMode && (
                        <button onClick={() => { if (confirm('Remove from inventory?')) remove(item.id); }}
                          className="text-xs text-red-400 hover:text-red-600 font-medium flex items-center gap-1">
                          <Trash2 size={12} /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── HOUSEHOLD TAB ── */}
      {tab === 'household' && (
        <>
          {/* Search + category filter */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-primary-500 bg-white"
                placeholder="Search items…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white outline-none focus:border-primary-500"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="">All categories</option>
              {HW_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>

          {householdItems.length === 0 ? (
            <EmptyState icon={Package} title="No household items yet"
              description="Track appliances, electronics, and household items"
              action={<Button onClick={() => { setForm(EMPTY_FORM); setShowAdd(true); }}><Plus size={16} /> Add Item</Button>}
            />
          ) : (
            <div className="space-y-2">
              {/* Select all bar */}
              {selectMode && householdItems.length > 0 && (
                <button onClick={() => toggleSelectAll(householdItems.map(i => i.id))}
                  className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-800 pb-1">
                  {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                  {allSelected ? 'Deselect all' : 'Select all'}
                </button>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {householdItems.map(item => {
                const ws = warrantyStatus(item.warrantyExpiry);
                const maintenanceDue = item.nextMaintenanceDate && item.nextMaintenanceDate <= today;
                const isSelected = selected.has(item.id);
                return (
                  <div key={item.id}
                    onClick={selectMode ? () => toggleSelect(item.id) : undefined}
                    className={`bg-white rounded-xl border p-4 transition-colors ${
                      selectMode ? 'cursor-pointer ' : ''
                    }${isSelected ? 'border-primary-400 bg-primary-50' : 'border-gray-100'}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {selectMode && (
                          <span className="shrink-0">
                            {isSelected ? <CheckSquare size={16} className="text-primary-600" /> : <Square size={16} className="text-gray-300" />}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                          {(item.brand || item.model) && (
                            <p className="text-xs text-gray-400">{[item.brand, item.model].filter(Boolean).join(' · ')}</p>
                          )}
                        </div>
                      </div>
                      {!selectMode && <Badge color={CAT_COLORS[item.category] || 'gray'} className="shrink-0">{item.category}</Badge>}
                    </div>
                    {item.location && <p className="text-xs text-gray-500 mb-2">{item.location}</p>}
                    {!selectMode && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {ws && <Badge color={ws.color}>{ws.label}</Badge>}
                        {maintenanceDue && (
                          <Badge color="orange"><Wrench size={10} className="mr-1" />Maintenance due</Badge>
                        )}
                      </div>
                    )}
                    {!selectMode && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                        <button onClick={() => openEdit(item)} className="text-xs text-primary-500 hover:text-primary-700 font-medium">Edit</button>
                        <button onClick={() => { if (confirm('Remove this item?')) remove(item.id); }}
                          className="text-xs text-red-400 hover:text-red-600 font-medium ml-auto">Remove</button>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit modal (household items only) */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setEditId(null); }} title={editId ? 'Edit Item' : 'Add Item'}
        footer={<>
          <Button variant="secondary" onClick={() => { setShowAdd(false); setEditId(null); }}>Cancel</Button>
          <Button onClick={handleSubmit}>{editId ? 'Save' : 'Add'}</Button>
        </>}
      >
        <div className="space-y-3">
          <Input label="Item name *" placeholder="e.g. Washing Machine" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
          <div className="flex gap-2">
            <Select label="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {HW_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </Select>
            <Input label="Location" placeholder="e.g. Kitchen" value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <Input label="Brand" placeholder="e.g. Samsung" value={form.brand}
              onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
            <Input label="Model" placeholder="e.g. WW80" value={form.model}
              onChange={e => setForm(f => ({ ...f, model: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <Input label="Purchase date" type="date" value={form.purchaseDate}
              onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))} />
            <Input label="Purchase price (₹)" type="number" placeholder="0" value={form.purchasePrice}
              onChange={e => setForm(f => ({ ...f, purchasePrice: e.target.value }))} />
          </div>
          <Input label="Warranty expiry" type="date" value={form.warrantyExpiry}
            onChange={e => setForm(f => ({ ...f, warrantyExpiry: e.target.value }))} />
          <div className="flex gap-2">
            <Input label="Last maintenance" type="date" value={form.lastMaintenanceDate}
              onChange={e => setForm(f => ({ ...f, lastMaintenanceDate: e.target.value }))} />
            <Input label="Next maintenance" type="date" value={form.nextMaintenanceDate}
              onChange={e => setForm(f => ({ ...f, nextMaintenanceDate: e.target.value }))} />
          </div>
          <Input label="Notes" value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
      </Modal>
    </div>
  );
}

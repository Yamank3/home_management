import { useState } from 'react';
import { Plus, Trash2, Package, Search, AlertTriangle, Wrench } from 'lucide-react';
import { useInventory } from '../../hooks/useInventory.js';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';

const CATEGORIES = ['appliances', 'electronics', 'furniture', 'tools', 'vehicles', 'garden', 'other'];
const CAT_COLORS = {
  appliances: 'blue', electronics: 'indigo', furniture: 'yellow',
  tools: 'orange', vehicles: 'gray', garden: 'green', other: 'gray',
};

const EMPTY_FORM = {
  name: '', category: 'appliances', brand: '', model: '',
  purchaseDate: '', purchasePrice: '', warrantyExpiry: '',
  lastMaintenanceDate: '', nextMaintenanceDate: '', maintenanceNotes: '',
  location: '', notes: '',
};

function warrantyStatus(expiry) {
  if (!expiry) return null;
  const today = new Date().toISOString().split('T')[0];
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  if (expiry < today) return { label: 'Expired', color: 'red' };
  if (expiry <= in30) return { label: 'Expiring soon', color: 'yellow' };
  return { label: `Warranty until ${expiry}`, color: 'green' };
}

export default function InventoryPage() {
  const { items, loading, search, setSearch, categoryFilter, setCategoryFilter, create, update, remove } = useInventory();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);

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

  const today = new Date().toISOString().split('T')[0];

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Inventory"
        subtitle={`${items.length} item${items.length !== 1 ? 's' : ''}`}
        action={<Button size="sm" onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowAdd(true); }}><Plus size={15} /> Add Item</Button>}
      />

      {/* Search + filter */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-primary-500 bg-white"
            placeholder="Search items..."
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
          {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Package} title="No items in inventory" description="Track appliances, electronics, and household items"
          action={<Button onClick={() => setShowAdd(true)}><Plus size={16} /> Add Item</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map(item => {
            const ws = warrantyStatus(item.warrantyExpiry);
            const maintenanceDue = item.nextMaintenanceDate && item.nextMaintenanceDate <= today;
            return (
              <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                    {(item.brand || item.model) && (
                      <p className="text-xs text-gray-400">{[item.brand, item.model].filter(Boolean).join(' · ')}</p>
                    )}
                  </div>
                  <Badge color={CAT_COLORS[item.category] || 'gray'} className="shrink-0">{item.category}</Badge>
                </div>
                {item.location && (
                  <p className="text-xs text-gray-500 mb-2">{item.location}</p>
                )}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {ws && <Badge color={ws.color}>{ws.label}</Badge>}
                  {maintenanceDue && (
                    <Badge color="orange">
                      <Wrench size={10} className="mr-1" />Maintenance due
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                  <button onClick={() => openEdit(item)} className="text-xs text-primary-500 hover:text-primary-700 font-medium">Edit</button>
                  <button onClick={() => { if (confirm('Remove this item?')) remove(item.id); }} className="text-xs text-red-400 hover:text-red-600 font-medium ml-auto">Remove</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showAdd} onClose={() => { setShowAdd(false); setEditId(null); }} title={editId ? 'Edit Item' : 'Add Item'}
        footer={<>
          <Button variant="secondary" onClick={() => { setShowAdd(false); setEditId(null); }}>Cancel</Button>
          <Button onClick={handleSubmit}>{editId ? 'Save' : 'Add'}</Button>
        </>}
      >
        <div className="space-y-3">
          <Input label="Item name *" placeholder="e.g. Washing Machine" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
          <div className="flex gap-2">
            <Select label="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </Select>
            <Input label="Location" placeholder="e.g. Kitchen" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <Input label="Brand" placeholder="e.g. Bosch" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
            <Input label="Model" placeholder="e.g. Serie 6" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <Input label="Purchase date" type="date" value={form.purchaseDate} onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))} />
            <Input label="Purchase price" type="number" placeholder="0.00" value={form.purchasePrice} onChange={e => setForm(f => ({ ...f, purchasePrice: e.target.value }))} />
          </div>
          <Input label="Warranty expiry" type="date" value={form.warrantyExpiry} onChange={e => setForm(f => ({ ...f, warrantyExpiry: e.target.value }))} />
          <div className="flex gap-2">
            <Input label="Last maintenance" type="date" value={form.lastMaintenanceDate} onChange={e => setForm(f => ({ ...f, lastMaintenanceDate: e.target.value }))} />
            <Input label="Next maintenance" type="date" value={form.nextMaintenanceDate} onChange={e => setForm(f => ({ ...f, nextMaintenanceDate: e.target.value }))} />
          </div>
          <Input label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
      </Modal>
    </div>
  );
}

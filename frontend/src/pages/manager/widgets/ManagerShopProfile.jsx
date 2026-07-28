import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axiosClient';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapPinPicker({ position, onPick }) {
  const markerRef = useRef(null);

  useMapEvents({
    click(e) {
      if (e.latlng) {
        onPick([e.latlng.lat, e.latlng.lng]);
      }
    },
  });

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          onPick([latLng.lat, latLng.lng]);
        }
      },
    }),
    [onPick]
  );

  return position ? (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  ) : null;
}

function RecenterMap({ position }) {
  const map = useMap();
  const posKey = position ? `${position[0]}_${position[1]}` : '';

  useEffect(() => {
    if (position && position[0] && position[1]) {
      map.flyTo(position, map.getZoom() || 14, { animate: true, duration: 0.8 });
    }
  }, [posKey, map]);

  return null;
}

export function ManagerShopProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    shopName: '', address: '', phone: '', category: 'grocery', hours: '8am – 9pm', isOpen: true,
  });
  const [pinPos, setPinPos] = useState(null); // [lat, lng]
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(true);

  // Manual coordinate edit controls
  const [showCoordEdit, setShowCoordEdit] = useState(false);
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');

  // Sync lat/lng inputs when pinPos updates (from map click/drag)
  useEffect(() => {
    if (pinPos && pinPos[0] !== undefined && pinPos[1] !== undefined) {
      setLatInput(pinPos[0].toString());
      setLngInput(pinPos[1].toString());
    }
  }, [pinPos]);

  // Load shop profile & active stock control inventory automatically
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/shops/my');
        setShop(data);
        setForm({
          shopName: data.shopName || '',
          address:  data.address  || '',
          phone:    data.phone    || '',
          category: data.category || 'grocery',
          hours:    data.hours    || '8am – 9pm',
          isOpen:   data.isOpen   !== false,
        });
        if (data.location?.coordinates && (data.location.coordinates[0] !== 0 || data.location.coordinates[1] !== 0)) {
          setPinPos([data.location.coordinates[1], data.location.coordinates[0]]);
        } else {
          setPinPos([9.7827, 80.0130]);
        }
      } catch {
        setPinPos([9.7827, 80.0130]);
      } finally { setLoading(false); }
    })();

    // Fetch active stock control items automatically
    (async () => {
      try {
        const res = await api.get('/manager/inventory', { params: { status: 'active' } });
        setInventoryItems(res.data || []);
      } catch {
        setInventoryItems([]);
      } finally {
        setLoadingInventory(false);
      }
    })();
  }, []);

  const handleLatInputChange = (val) => {
    setLatInput(val);
    const parsedLat = parseFloat(val);
    const parsedLng = parseFloat(lngInput);
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      setPinPos([parsedLat, parsedLng]);
    }
  };

  const handleLngInputChange = (val) => {
    setLngInput(val);
    const parsedLat = parseFloat(latInput);
    const parsedLng = parseFloat(val);
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      setPinPos([parsedLat, parsedLng]);
    }
  };

  const handleApplyCustomCoords = (e) => {
    e.preventDefault();
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid numeric latitude and longitude coordinates.');
      return;
    }
    setPinPos([lat, lng]);
    setSuccess(`📍 Pin point updated to coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    setShowCoordEdit(false);
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      // Auto sync active stock control items into stockSummary
      const stockSummary = inventoryItems.map((item) => ({
        name: `${item.foodName} (${item.quantity} ${item.unit})`,
        inStock: true,
        category: item.category || 'produce',
      }));

      const payload = {
        ...form,
        location: { type: 'Point', coordinates: pinPos ? [pinPos[1], pinPos[0]] : [80.0130, 9.7827] },
        stockSummary: stockSummary,
      };
      const { data } = await api.post('/shops', payload);
      setShop(data.shop);
      setSuccess('✅ Shop profile & location pin saved successfully! Consumer store map updated.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save shop profile');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 text-sm animate-pulse">Loading shop profile...</div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            🏪 Shop Profile & Location Pin
          </h1>
          <p className="text-slate-400 text-sm mt-1">Set up your shop map pin point, operating hours, and business details for consumers.</p>
        </div>
        {shop?.isVerified && (
          <span className="text-[10px] px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
            ✓ Verified Shop
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {error   && <div className="glass border border-red-500/20 bg-red-500/5 text-red-400 text-sm px-4 py-3 rounded-xl">⚠️ {error}</div>}
        {success && <div className="glass border border-emerald-500/20 bg-emerald-500/5 text-emerald-300 text-sm px-4 py-3 rounded-xl font-bold">✅ {success}</div>}

        <div className="glass rounded-2xl border border-white/10 p-5 space-y-4">
          <p className="text-xs font-bold text-slate-400 uppercase">Basic Info</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase">Shop Name *</label>
              <input type="text" value={form.shopName} onChange={e => setForm({...form, shopName: e.target.value})} required className="input-dark w-full px-3.5 py-2.5 text-xs rounded-xl" placeholder="e.g. Fresh Garden Market" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase">Phone</label>
              <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input-dark w-full px-3.5 py-2.5 text-xs rounded-xl" placeholder="+94 77 123 4567" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-400 uppercase">Address *</label>
            <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} required className="input-dark w-full px-3.5 py-2.5 text-xs rounded-xl" placeholder="123 Main Street, Colombo 3" />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase">Category</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input-dark w-full px-3.5 py-2.5 text-xs rounded-xl">
                {['grocery','produce','supermarket','convenience','organic','other'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase">Opening Hours</label>
              <input type="text" value={form.hours} onChange={e => setForm({...form, hours: e.target.value})} className="input-dark w-full px-3.5 py-2.5 text-xs rounded-xl" placeholder="8am – 9pm" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase">Status</label>
              <button type="button" onClick={() => setForm({...form, isOpen: !form.isOpen})} className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-all ${form.isOpen ? 'bg-brand-500/20 text-brand-300 border-brand-500/30' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                {form.isOpen ? '🟢 Open' : '🔴 Closed'}
              </button>
            </div>
          </div>
        </div>

        {/* Map location picker with Pin Point indicator & Edit Button */}
        <div className="glass rounded-2xl border border-white/10 p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
                <span>📍</span> Shop Map Location Pin Point
              </p>
              <p className="text-xs text-slate-400">Click or drag the marker on the map to set your shop location.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowCoordEdit(!showCoordEdit)}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-1"
              >
                <span>✏️</span> {showCoordEdit ? 'Close Edit' : 'Edit Coordinates'}
              </button>
            </div>
          </div>

          {/* Coordinate manual editing drawer */}
          {showCoordEdit && (
            <div className="bg-white/5 border border-cyan-500/30 p-4 rounded-xl space-y-3 fade-up">
              <p className="text-xs font-bold text-cyan-300">Enter Exact GPS Pin Coordinates:</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={latInput}
                    onChange={(e) => handleLatInputChange(e.target.value)}
                    className="input-dark w-full px-3 py-2 text-xs rounded-xl font-mono"
                    placeholder="e.g. 9.78270"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={lngInput}
                    onChange={(e) => handleLngInputChange(e.target.value)}
                    className="input-dark w-full px-3 py-2 text-xs rounded-xl font-mono"
                    placeholder="e.g. 80.01300"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleApplyCustomCoords}
                className="btn-glow w-full py-2 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1"
              >
                <span>🎯</span> Apply Pin Location Coordinates
              </button>
            </div>
          )}

          {pinPos && (
            <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-400 font-bold">📍 Active Pin Point:</span>
                <span className="text-xs font-mono text-emerald-300">{pinPos[0].toFixed(5)}, {pinPos[1].toFixed(5)}</span>
              </div>
              <span className="text-[10px] text-slate-400 italic">Drag marker or click map to move</span>
            </div>
          )}

          <div className="rounded-xl overflow-hidden border border-white/10 relative cursor-crosshair" style={{ height: 340 }}>
            <MapContainer
              center={pinPos || [9.7827, 80.0130]}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <RecenterMap position={pinPos} />
              <MapPinPicker position={pinPos} onPick={setPinPos} />
            </MapContainer>
            <div className="absolute bottom-2 left-2 z-[400] glass px-3 py-1.5 rounded-lg text-[10px] font-bold text-white shadow-lg flex items-center gap-1.5">
              <span>👇</span> Drag marker or click map to reposition shop pin
            </div>
          </div>
        </div>

        {/* Live Automatic Inventory Display Card */}
        <div className="glass rounded-2xl border border-brand-500/30 bg-brand-500/5 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <p className="text-xs font-bold text-brand-300 uppercase flex items-center gap-1.5">
                <span>🍎</span> Live Products (Synced from Stock Control & Inventory)
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                All active produce & items from your <strong className="text-white">Stock Control</strong> page are automatically published to consumers with products and prices.
              </p>
            </div>
            <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30 shrink-0">
              ⚡ Auto-Synced
            </span>
          </div>

          {loadingInventory ? (
            <p className="text-xs text-slate-400 animate-pulse">Loading stock control inventory...</p>
          ) : inventoryItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {inventoryItems.map((item) => (
                <div key={item._id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🛍️</span>
                    <div>
                      <p className="text-xs font-bold text-white capitalize">{item.foodName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{item.quantity} {item.unit} · {item.category}</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                    🟢 In Stock
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-400 italic bg-white/5 rounded-xl border border-white/5">
              No active stock items found in Stock Control & Inventory. Add items under <strong className="text-white">Inventory</strong> to showcase them to consumers automatically.
            </div>
          )}
        </div>

        <button type="submit" disabled={saving} className="btn-glow w-full py-3.5 rounded-xl text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-glow">
          {saving ? <><span className="spinner" /> Saving Shop Profile & Map Location...</> : '💾 Save Shop Profile & Map Location'}
        </button>
      </form>
    </div>
  );
}

export default ManagerShopProfile;

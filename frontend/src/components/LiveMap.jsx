import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Map, Flame, MapPin, Navigation, Crosshair, Search, Globe, PlusCircle, Trash2, X, Check } from 'lucide-react';

const createCustomIcon = (status, isSelected) => {
  const colorMap = {
    LOW: '#10b981',
    MODERATE: '#3b82f6',
    HIGH: '#f59e0b',
    CRITICAL: '#f43f5e'
  };
  const color = colorMap[status] || '#3b82f6';
  const size = isSelected ? 'w-8 h-8 scale-110 ring-4 ring-blue-500/50' : 'w-7 h-7';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="background-color: ${color};" class="${size} rounded-full border-2 border-slate-950 flex items-center justify-center text-white shadow-xl transition-all duration-300">
        <div class="w-2.5 h-2.5 bg-white rounded-full"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

const userGpsIcon = L.divIcon({
  className: 'user-gps-marker',
  html: `
    <div class="relative flex items-center justify-center w-6 h-6">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
      <span class="relative inline-flex rounded-full h-4 w-4 bg-cyan-500 border-2 border-white shadow-lg"></span>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const searchedPinIcon = L.divIcon({
  className: 'searched-pin-marker',
  html: `
    <div class="relative flex items-center justify-center w-7 h-7 bg-purple-600 rounded-full border-2 border-white shadow-xl text-white">
      <div class="w-2.5 h-2.5 bg-white rounded-full"></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const newZoneDraftIcon = L.divIcon({
  className: 'draft-pin-marker',
  html: `
    <div class="relative flex items-center justify-center w-8 h-8 bg-emerald-500 rounded-full border-2 border-white shadow-xl text-white animate-bounce">
      <span class="text-xs font-bold">+</span>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const TILE_LAYERS = {
  dark: {
    name: 'Dark Mode',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    maxZoom: 20,
    maxNativeZoom: 19
  },
  street: {
    name: 'Street View',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 20,
    maxNativeZoom: 19
  },
  satellite: {
    name: 'Satellite View',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
    maxZoom: 20,
    maxNativeZoom: 19
  }
};

function MapFlyController({ flyTarget }) {
  const map = useMap();
  const lastTargetRef = useRef(null);

  useEffect(() => {
    if (flyTarget && flyTarget !== lastTargetRef.current) {
      lastTargetRef.current = flyTarget;
      map.flyTo([flyTarget.lat, flyTarget.lng], flyTarget.zoom || 17, {
        animate: true,
        duration: 1.0
      });
    }
  }, [flyTarget, map]);

  useEffect(() => {
    map.invalidateSize();
  }, [map]);

  return null;
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
}

export function LiveMap({
  zones = [],
  selectedZoneId,
  onSelectZone,
  heatmapData = [],
  onCreateZone,
  onDeleteZone
}) {
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [tileStyle, setTileStyle] = useState('dark');
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);

  // Dynamic Zone Creation Mode States
  const [isAddMode, setIsAddMode] = useState(false);
  const [draftCoords, setDraftCoords] = useState(null);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneCapacity, setNewZoneCapacity] = useState(100);

  const initialLat = zones.length > 0 ? zones[0].latitude : 9.9252;
  const initialLng = zones.length > 0 ? zones[0].longitude : 78.1198;

  const handleZoneSelect = (zoneId) => {
    onSelectZone(zoneId);
    const z = zones.find((item) => item.id === zoneId);
    if (z) {
      setFlyTarget({ lat: z.latitude, lng: z.longitude, zoom: 18 });
    }
  };

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setSearchedLocation(null);
        setIsLocating(false);
        setFlyTarget({ lat: latitude, lng: longitude, zoom: 18 });
      },
      (error) => {
        setIsLocating(false);
        alert(`Failed to get live location: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearchLocation = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();
      setIsSearching(false);

      if (data && data.length > 0) {
        const first = data[0];
        const lat = parseFloat(first.lat);
        const lng = parseFloat(first.lon);
        setSearchedLocation({ lat, lng, displayName: first.display_name });
        setFlyTarget({ lat, lng, zoom: 17 });
      } else {
        alert(`Location '${searchQuery}' not found. Please try a different search term.`);
      }
    } catch (err) {
      setIsSearching(false);
      alert(`Search failed: ${err.message}`);
    }
  };

  const handleMapClick = (lat, lng) => {
    if (isAddMode) {
      setDraftCoords({ lat, lng });
      setNewZoneName(`Zone ${zones.length + 1}`);
    }
  };

  const handleCreateZoneSubmit = async (e) => {
    e.preventDefault();
    if (!draftCoords || !newZoneName.trim()) return;

    if (onCreateZone) {
      await onCreateZone({
        name: newZoneName,
        capacity: parseInt(newZoneCapacity, 10) || 100,
        latitude: draftCoords.lat,
        longitude: draftCoords.lng
      });
    }

    setDraftCoords(null);
    setIsAddMode(false);
  };

  const statusColors = {
    LOW: '#10b981',
    MODERATE: '#3b82f6',
    HIGH: '#f59e0b',
    CRITICAL: '#f43f5e'
  };

  const activeTile = TILE_LAYERS[tileStyle] || TILE_LAYERS.dark;

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full relative overflow-hidden">
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 z-10">
        <div className="flex items-center gap-2">
          <Map className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">INTERACTIVE MONITORING MAP</h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Add Zone Mode Toggle */}
          <button
            onClick={() => {
              setIsAddMode(!isAddMode);
              if (isAddMode) setDraftCoords(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
              isAddMode
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-500/10 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isAddMode ? 'Cancel Add Mode' : '+ Add Camera Point'}</span>
          </button>

          {/* Map Style Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
            {(['dark', 'street', 'satellite']).map((styleKey) => (
              <button
                key={styleKey}
                onClick={() => setTileStyle(styleKey)}
                className={`px-2 py-0.5 rounded-lg font-bold capitalize transition-colors ${
                  tileStyle === styleKey ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {styleKey}
              </button>
            ))}
          </div>

          {/* Live GPS Button */}
          <button
            onClick={handleLocateUser}
            disabled={isLocating}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
              userLocation
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-cyan-400' : 'text-cyan-400'}`} />
            <span>{isLocating ? 'Locating...' : userLocation ? 'GPS: Live' : 'Locate Me'}</span>
          </button>

          {/* Heatmap Toggle */}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
              showHeatmap
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-lg shadow-amber-500/10'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${showHeatmap ? 'animate-bounce text-amber-400' : 'text-slate-400'}`} />
            <span>{showHeatmap ? 'Heatmap: Active' : 'Show Heatmap'}</span>
          </button>
        </div>
      </div>

      {/* Mode Instruction Banner */}
      {isAddMode && (
        <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center justify-between z-10 animate-pulse">
          <span className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>Add Mode Active:</strong> Click anywhere on the map to place a new camera monitoring zone point.</span>
          </span>
          <button onClick={() => setIsAddMode(false)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Manual Location Search Bar */}
      <form onSubmit={handleSearchLocation} className="mb-3 relative z-10 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search address or location (e.g. Madurai, TCE Campus, Chennai)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95 disabled:opacity-50 shrink-0"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Map Container Canvas */}
      <div className="relative flex-1 bg-slate-950 rounded-xl border border-slate-800/80 overflow-hidden min-h-[350px] z-0">
        <MapContainer
          center={[initialLat, initialLng]}
          zoom={16}
          maxZoom={20}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%', minHeight: '350px', backgroundColor: '#090d16' }}
        >
          <MapFlyController flyTarget={flyTarget} />
          <MapClickHandler onMapClick={handleMapClick} />

          {/* Tile Layer */}
          <TileLayer
            key={tileStyle}
            attribution={activeTile.attribution}
            url={activeTile.url}
            maxZoom={activeTile.maxZoom}
            maxNativeZoom={activeTile.maxNativeZoom}
          />

          {/* Draft New Zone Point Pin */}
          {draftCoords && (
            <Marker position={[draftCoords.lat, draftCoords.lng]} icon={newZoneDraftIcon}>
              <Popup defaultOpen={true}>
                <div className="p-2 bg-slate-900 text-slate-100 rounded-lg text-xs font-sans min-w-[180px]">
                  <h4 className="font-bold text-emerald-400 mb-2">New Camera Point</h4>
                  <p className="text-[10px] text-slate-400 mb-2">
                    Lat: {draftCoords.lat.toFixed(4)}, Lng: {draftCoords.lng.toFixed(4)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Searched Location Marker */}
          {searchedLocation && (
            <Marker position={[searchedLocation.lat, searchedLocation.lng]} icon={searchedPinIcon}>
              <Popup>
                <div className="p-2 bg-slate-900 text-slate-100 rounded-lg text-xs font-sans max-w-[200px]">
                  <strong className="text-purple-400 block text-sm mb-1">Searched Location</strong>
                  <p className="text-slate-300 mb-1">{searchedLocation.displayName}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* User Live GPS Marker */}
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userGpsIcon}>
              <Popup>
                <div className="p-2 bg-slate-900 text-slate-100 rounded-lg text-xs font-sans">
                  <strong className="text-cyan-400 block text-sm mb-1">Your Live GPS Location</strong>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Heatmap Density Circles */}
          {showHeatmap &&
            heatmapData.map((hp) => (
              <Circle
                key={`heat-${hp.zone_id}`}
                center={[hp.latitude, hp.longitude]}
                radius={90 * (hp.weight || 0.5) + 35}
                pathOptions={{
                  fillColor: statusColors[hp.status] || '#3b82f6',
                  fillOpacity: Math.max(0.3, (hp.weight || 0.3) * 0.65),
                  color: statusColors[hp.status] || '#3b82f6',
                  weight: 1
                }}
              />
            ))}

          {/* Zone Pins / Markers */}
          {zones.map((z) => {
            const isSelected = selectedZoneId === z.id;
            const customIcon = createCustomIcon(z.status, isSelected);

            return (
              <Marker
                key={z.id}
                position={[z.latitude, z.longitude]}
                icon={customIcon}
                eventHandlers={{
                  click: () => handleZoneSelect(z.id)
                }}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-2 bg-slate-900 text-slate-100 rounded-lg border border-slate-800 text-xs font-sans min-w-[170px]">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-extrabold text-sm text-white">{z.name}</h4>
                      {onDeleteZone && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete zone '${z.name}'?`)) {
                              onDeleteZone(z.id);
                            }
                          }}
                          className="text-slate-400 hover:text-rose-400 p-0.5"
                          title="Delete Zone"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="flex justify-between">
                        <span className="text-slate-400">People:</span>
                        <strong className="text-white">{z.people_count} / {z.capacity}</strong>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-400">Occupancy:</span>
                        <strong className="text-white">{z.occupancy.toFixed(1)}%</strong>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-400">Status:</span>
                        <strong style={{ color: statusColors[z.status] }}>{z.status}</strong>
                      </p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Inline Create Zone Form Modal Overlay */}
      {draftCoords && (
        <div className="mt-3 p-4 rounded-xl bg-slate-950 border border-slate-800 shadow-2xl z-10 animate-fade-in">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <h4 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4" />
              Configure New Monitoring Zone
            </h4>
            <button onClick={() => setDraftCoords(null)} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateZoneSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-1 uppercase">Zone Name</label>
              <input
                type="text"
                required
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                placeholder="e.g. North Gate"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-1 uppercase">Max Capacity</label>
              <input
                type="number"
                min="1"
                required
                value={newZoneCapacity}
                onChange={(e) => setNewZoneCapacity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Zone</span>
              </button>

              <button
                type="button"
                onClick={() => setDraftCoords(null)}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </form>

          <p className="mt-2 text-[10px] text-slate-500">
            Coordinates: {draftCoords.lat.toFixed(5)}, {draftCoords.lng.toFixed(5)}
          </p>
        </div>
      )}

      {/* Map Footer Info */}
      <div className="relative z-10 flex flex-wrap items-center justify-between text-[10px] text-slate-400 pt-3 border-t border-slate-800/80 mt-3 gap-2">
        <span className="flex items-center gap-1 font-semibold text-slate-300">
          <Navigation className="w-3.5 h-3.5 text-blue-400" />
          Click map in <strong>+ Add Camera Point</strong> mode to set custom zones dynamically
        </span>
      </div>
    </div>
  );
}

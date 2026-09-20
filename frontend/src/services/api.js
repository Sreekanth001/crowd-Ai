const API_BASE = '/api';

export async function fetchLocations() {
  const res = await fetch(`${API_BASE}/locations`);
  if (!res.ok) throw new Error('Failed to fetch locations');
  return res.json();
}

export async function fetchLocationSummary(locationId) {
  const res = await fetch(`${API_BASE}/locations/${locationId}/summary`);
  if (!res.ok) throw new Error('Failed to fetch location summary');
  return res.json();
}

export async function fetchLocationHeatmap(locationId) {
  const res = await fetch(`${API_BASE}/locations/${locationId}/heatmap`);
  if (!res.ok) throw new Error('Failed to fetch location heatmap');
  return res.json();
}

export async function fetchZoneHistory(zoneId, timeFilter = 'today') {
  const res = await fetch(`${API_BASE}/zones/${zoneId}/history?time_filter=${timeFilter}`);
  if (!res.ok) throw new Error('Failed to fetch zone history');
  return res.json();
}

export async function fetchActiveAlerts() {
  const res = await fetch(`${API_BASE}/alerts`);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export async function resolveAlert(alertId) {
  const res = await fetch(`${API_BASE}/alerts/${alertId}/resolve`, {
    method: 'PUT'
  });
  if (!res.ok) throw new Error('Failed to resolve alert');
  return res.json();
}

export async function updateZoneCapacity(zoneId, newCapacity) {
  const res = await fetch(`${API_BASE}/zones/${zoneId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ capacity: newCapacity })
  });
  if (!res.ok) throw new Error('Failed to update zone capacity');
  return res.json();
}

export async function createZone(locationId, zoneData) {
  const payload = { location_id: locationId, ...zoneData };
  const res = await fetch(`${API_BASE}/locations/${locationId}/zones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Failed to create zone');
  }
  return res.json();
}

export async function deleteZone(zoneId) {
  const res = await fetch(`${API_BASE}/zones/${zoneId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete zone');
  return res.json();
}

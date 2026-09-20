import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { StatCard } from '../components/StatCard';
import { LocationSelector } from '../components/LocationSelector';
import { LiveMap } from '../components/LiveMap';
import { ZoneList } from '../components/ZoneList';
import { VideoMonitor } from '../components/VideoMonitor';
import { AlertPanel } from '../components/AlertPanel';
import { CrowdChart } from '../components/CrowdChart';
import { analyticsWS } from '../services/websocket';
import {
  fetchLocations, fetchLocationSummary, fetchLocationHeatmap,
  fetchActiveAlerts, resolveAlert, updateZoneCapacity, fetchZoneHistory,
  createZone, deleteZone
} from '../services/api';
import { Users, Building2, Percent, Bell, Activity } from 'lucide-react';

export function Dashboard() {
  const [locations, setLocations] = useState([
    { id: 'loc-tce-campus', name: 'TCE Campus', latitude: 9.9252, longitude: 78.1198, zone_count: 4 }
  ]);
  const [selectedLocationId, setSelectedLocationId] = useState('loc-tce-campus');

  const [summary, setSummary] = useState({
    total_people: 0,
    total_capacity: 980,
    overall_occupancy: 0.0,
    active_alerts_count: 0,
    zones: [
      { id: 'zone-main-gate', location_id: 'loc-tce-campus', name: 'Main Gate', capacity: 100, latitude: 9.9252, longitude: 78.1198, people_count: 0, occupancy: 0.0, status: 'LOW' },
      { id: 'zone-canteen', location_id: 'loc-tce-campus', name: 'Canteen', capacity: 80, latitude: 9.9258, longitude: 78.1204, people_count: 0, occupancy: 0.0, status: 'LOW' },
      { id: 'zone-auditorium', location_id: 'loc-tce-campus', name: 'Auditorium', capacity: 300, latitude: 9.9246, longitude: 78.1192, people_count: 0, occupancy: 0.0, status: 'LOW' },
      { id: 'zone-ground', location_id: 'loc-tce-campus', name: 'Ground', capacity: 500, latitude: 9.9262, longitude: 78.1188, people_count: 0, occupancy: 0.0, status: 'LOW' }
    ]
  });

  const [selectedZoneId, setSelectedZoneId] = useState('zone-main-gate');
  const [heatmapData, setHeatmapData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [timeFilter, setTimeFilter] = useState('today');
  const [isConnected, setIsConnected] = useState(false);
  const [sourceType, setSourceType] = useState('stopped');

  // Load locations & location summary periodically
  const loadData = async () => {
    try {
      const locs = await fetchLocations();
      if (locs && locs.length > 0) setLocations(locs);

      const sumData = await fetchLocationSummary(selectedLocationId);
      if (sumData) setSummary(sumData);

      const heat = await fetchLocationHeatmap(selectedLocationId);
      if (heat) setHeatmapData(heat);

      const alts = await fetchActiveAlerts();
      if (alts) setAlerts(alts);

      const hist = await fetchZoneHistory(selectedZoneId, timeFilter);
      if (hist && hist.datapoints) {
        const formatted = hist.datapoints.map((d) => ({ time: d.time, people: d.people }));
        setTrendData(formatted);
      }
    } catch (err) {
      console.warn('Backend sync warning:', err.message);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [selectedLocationId, selectedZoneId, timeFilter]);

  // WebSocket real-time subscription
  useEffect(() => {
    analyticsWS.connect();
    setIsConnected(true);

    const unsubscribe = analyticsWS.subscribe((data) => {
      setIsConnected(true);
      if (data.source) setSourceType(data.source);

      // Update Main Gate live metrics in summary state
      if (data.people_count !== undefined) {
        setSummary((prev) => {
          const updatedZones = prev.zones.map((z) => {
            if (z.id === 'zone-main-gate') {
              return {
                ...z,
                people_count: data.people_count,
                capacity: data.capacity || z.capacity,
                occupancy: data.occupancy || z.occupancy,
                status: data.status || z.status
              };
            }
            return z;
          });

          const totalPeople = updatedZones.reduce((acc, z) => acc + z.people_count, 0);
          const totalCap = updatedZones.reduce((acc, z) => acc + z.capacity, 0);
          const overallOcc = totalCap > 0 ? (totalPeople / totalCap) * 100 : 0.0;

          return {
            ...prev,
            total_people: totalPeople,
            total_capacity: totalCap,
            overall_occupancy: overallOcc,
            zones: updatedZones
          };
        });

        if (data.timestamp) {
          const timeStr = new Date(data.timestamp).toLocaleTimeString([], {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          });
          setTrendData((prev) => {
            const updated = [...prev, { time: timeStr, people: data.people_count }];
            return updated.slice(-25);
          });
        }
      }
    });

    return () => {
      unsubscribe();
      analyticsWS.disconnect();
    };
  }, []);

  const handleUpdateCapacity = async (zoneId, newCapacity) => {
    try {
      await updateZoneCapacity(zoneId, newCapacity);
      loadData();
    } catch (err) {
      console.error('Failed to update capacity:', err);
    }
  };

  const handleCreateZone = async (zoneData) => {
    try {
      const newZone = await createZone(selectedLocationId, zoneData);
      if (newZone) {
        setSelectedZoneId(newZone.id);
        await loadData();
      }
    } catch (err) {
      console.error('Failed to create zone:', err);
      alert(`Failed to create zone: ${err.message}`);
    }
  };

  const handleDeleteZone = async (zoneId) => {
    try {
      await deleteZone(zoneId);
      if (selectedZoneId === zoneId) {
        setSelectedZoneId('zone-main-gate');
      }
      await loadData();
    } catch (err) {
      console.error('Failed to delete zone:', err);
      alert(`Failed to delete zone: ${err.message}`);
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await resolveAlert(alertId);
      loadData();
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  const handleStartWebcam = async () => {
    try {
      const res = await fetch('/api/webcam/start', { method: 'POST' });
      if (res.ok) {
        setSourceType('webcam');
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleUploadVideo = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload_video', { method: 'POST', body: formData });
      if (res.ok) {
        setSourceType('file');
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleStopVideo = async () => {
    try {
      await fetch('/api/webcam/stop', { method: 'POST' });
      setSourceType('stopped');
    } catch (err) {
      console.error('Failed to stop video:', err);
    }
  };

  const activeZone = summary.zones.find((z) => z.id === selectedZoneId) || summary.zones[0];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      <Header
        capacity={activeZone?.capacity || 100}
        onUpdateCapacity={(cap) => handleUpdateCapacity(selectedZoneId, cap)}
        isConnected={isConnected}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col gap-6">
        {/* Top Control Bar with Location Selector */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-extrabold text-white tracking-wide">
              Smart Multi-Zone Dashboard
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Phase 2 Active
            </span>
          </div>

          <LocationSelector
            locations={locations}
            selectedLocationId={selectedLocationId}
            onSelectLocation={setSelectedLocationId}
          />
        </div>

        {/* 4 Location Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="TOTAL PEOPLE"
            value={summary.total_people}
            description="Active Across All Zones"
            icon={Users}
            color="blue"
          />
          <StatCard
            title="TOTAL CAPACITY"
            value={summary.total_capacity}
            description="Combined Safety Threshold"
            icon={Building2}
            color="emerald"
          />
          <StatCard
            title="OVERALL OCCUPANCY"
            value={`${summary.overall_occupancy.toFixed(1)}%`}
            description="Campus Density Ratio"
            icon={Percent}
            color={summary.overall_occupancy > 80 ? 'rose' : 'purple'}
          />
          <StatCard
            title="ACTIVE ALERTS"
            value={alerts.length}
            description="Requires Security Attention"
            icon={Bell}
            color={alerts.length > 0 ? 'red' : 'amber'}
          />
        </div>

        {/* Multi-Zone Grid Cards */}
        <ZoneList
          zones={summary.zones}
          selectedZoneId={selectedZoneId}
          onSelectZone={setSelectedZoneId}
          onUpdateCapacity={handleUpdateCapacity}
          onDeleteZone={handleDeleteZone}
        />

        {/* Middle Main Section: Interactive LiveMap + Camera Monitor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <LiveMap
            zones={summary.zones}
            selectedZoneId={selectedZoneId}
            onSelectZone={setSelectedZoneId}
            heatmapData={heatmapData}
            onCreateZone={handleCreateZone}
            onDeleteZone={handleDeleteZone}
          />

          <VideoMonitor
            source={sourceType}
            onStartWebcam={handleStartWebcam}
            onUploadVideo={handleUploadVideo}
            onStopVideo={handleStopVideo}
            peopleCount={activeZone?.people_count || 0}
          />
        </div>

        {/* Bottom Section: Smart Alert Panel + Real-Time Trend Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div>
            <AlertPanel alerts={alerts} onResolveAlert={handleResolveAlert} />
          </div>

          <div className="lg:col-span-2">
            <CrowdChart data={trendData} />
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 px-6 text-center text-xs text-slate-500">
        CrowdVision AI Phase 2 &copy; 2026 — Smart Multi-Zone Crowd Management System (FastAPI + YOLO + React + SQLite)
      </footer>
    </div>
  );
}

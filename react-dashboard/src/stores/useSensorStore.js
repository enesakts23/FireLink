import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Sensor configuration
const SENSOR_CONFIG = {
  temperature: { unit: '°C', min: -20, max: 80, label: 'Temperature', icon: 'Thermometer', color: '#2D7A6F' },
  humidity: { unit: '%', min: 0, max: 100, label: 'Humidity', icon: 'Droplets', color: '#3A9E8F' },
  gas: { unit: 'kOhm', min: 0, max: 500, label: 'Gas Resistance', icon: 'Wind', color: '#6366F1' },
  'air-quality': { unit: 'IAQ', min: 0, max: 500, label: 'Air Quality', icon: 'Activity', color: '#8B5CF6' },
  no2: { unit: 'ppm', min: 0, max: 10, label: 'NO₂', icon: 'AlertTriangle', color: '#D97706' },
  co: { unit: 'ppm', min: 0, max: 100, label: 'CO', icon: 'Skull', color: '#DC2626' },
  tvoc: { unit: 'ppb', min: 0, max: 1000, label: 'TVOC', icon: 'Cloud', color: '#0891B2' },
  eco2: { unit: 'ppm', min: 400, max: 5000, label: 'eCO₂', icon: 'Leaf', color: '#16A34A' },
  'surface-temp': { unit: '°C', min: -20, max: 150, label: 'Surface Temp 1', icon: 'Flame', color: '#E8731A' },
  'surface-temp-2': { unit: '°C', min: -20, max: 150, label: 'Surface Temp 2', icon: 'Flame', color: '#F97316' },
  pressure: { unit: 'hPa', min: 900, max: 1100, label: 'Pressure', icon: 'Gauge', color: '#6366F1' },
  current: { unit: 'mA', min: 0, max: 1000, label: 'Current', icon: 'Zap', color: '#EAB308' },
};

const SENSOR_POSITIONS = {
  temperature: { x: -3, y: 6, z: 2, floor: 2 },
  humidity: { x: 3, y: 6, z: -2, floor: 2 },
  gas: { x: 0, y: 4, z: 0, floor: 1 },
  'air-quality': { x: -4, y: 4, z: -3, floor: 1 },
  no2: { x: 4, y: 2, z: 3, floor: 0 },
  co: { x: -2, y: 2, z: -4, floor: 0 },
  tvoc: { x: 2, y: 6, z: 3, floor: 2 },
  eco2: { x: -4, y: 4, z: 3, floor: 1 },
  'surface-temp': { x: 0, y: 2, z: -3, floor: 0 },
  'surface-temp-2': { x: 3, y: 4, z: 0, floor: 1 },
  pressure: { x: -3, y: 2, z: 2, floor: 0 },
  current: { x: 4, y: 6, z: -3, floor: 2 },
};

const initializeSensors = () => {
  const sensors = {};
  Object.keys(SENSOR_CONFIG).forEach((id) => {
    sensors[id] = {
      id,
      ...SENSOR_CONFIG[id],
      position: SENSOR_POSITIONS[id],
      value: 0,
      history: [],
      status: 'normal',
      trend: 'stable',
      lastUpdate: null,
    };
  });
  return sensors;
};

// Default devices
const DEFAULT_DEVICES = [
  { id: 'device-1', name: 'Main Building', location: 'Ankara, Turkey', type: 'indoor', color: '#2D7A6F', status: 'online', floors: 3, sensorCount: 12 },
  { id: 'device-2', name: 'Warehouse A', location: 'Istanbul, Turkey', type: 'warehouse', color: '#6366F1', status: 'online', floors: 1, sensorCount: 12 },
  { id: 'device-3', name: 'Server Room', location: 'Izmir, Turkey', type: 'datacenter', color: '#E8731A', status: 'warning', floors: 1, sensorCount: 12 },
];

// Initialize per-device sensor data
const initializeDeviceSensors = () => {
  const deviceSensors = {};
  DEFAULT_DEVICES.forEach((device) => {
    deviceSensors[device.id] = initializeSensors();
  });
  return deviceSensors;
};

const initializeDeviceHealth = () => {
  const health = {};
  DEFAULT_DEVICES.forEach((device) => {
    health[device.id] = { panelHealth: 100, systemStatus: 'normal' };
  });
  return health;
};

export const useSensorStore = create(
  subscribeWithSelector((set, get) => ({
    // Multi-device state
    devices: DEFAULT_DEVICES,
    activeDeviceId: 'device-1',
    deviceSensors: initializeDeviceSensors(),
    deviceHealth: initializeDeviceHealth(),

    // Current active device sensors (computed-like getter via selector)
    get sensors() {
      const state = get();
      return state.deviceSensors[state.activeDeviceId] || initializeSensors();
    },

    // System state (for active device)
    systemStatus: 'normal',
    connectionStatus: 'disconnected',
    panelHealth: 100,
    lastMessageTime: null,

    // UI state
    theme: 'light',
    selectedSensor: null,
    hoveredSensor: null,
    activePage: 'dashboard',
    sidebarCollapsed: false,
    cameraTarget: null,
    acknowledgedAlerts: {},
    modelLoaded: false,
    performanceTier: 'high', // 'high' | 'medium' | 'low'

    // Device actions
    setActiveDevice: (deviceId) => {
      const state = get();
      const health = state.deviceHealth[deviceId] || { panelHealth: 100, systemStatus: 'normal' };
      set({
        activeDeviceId: deviceId,
        selectedSensor: null,
        cameraTarget: null,
        panelHealth: health.panelHealth,
        systemStatus: health.systemStatus,
      });
    },

    addDevice: (device) => {
      set((state) => ({
        devices: [...state.devices, device],
        deviceSensors: { ...state.deviceSensors, [device.id]: initializeSensors() },
        deviceHealth: { ...state.deviceHealth, [device.id]: { panelHealth: 100, systemStatus: 'normal' } },
      }));
    },

    removeDevice: (deviceId) => {
      set((state) => {
        const devices = state.devices.filter((d) => d.id !== deviceId);
        const { [deviceId]: _s, ...deviceSensors } = state.deviceSensors;
        const { [deviceId]: _h, ...deviceHealth } = state.deviceHealth;
        const activeDeviceId = state.activeDeviceId === deviceId ? devices[0]?.id : state.activeDeviceId;
        return { devices, deviceSensors, deviceHealth, activeDeviceId };
      });
    },

    // Sensor actions
    updateSensor: (sensorId, value, status = null) => {
      set((state) => {
        const deviceId = state.activeDeviceId;
        const sensors = state.deviceSensors[deviceId];
        const sensor = sensors?.[sensorId];
        if (!sensor) return state;

        const newHistory = [...sensor.history, value].slice(-60);
        const trend = calculateTrend(newHistory);

        return {
          deviceSensors: {
            ...state.deviceSensors,
            [deviceId]: {
              ...sensors,
              [sensorId]: {
                ...sensor,
                value,
                history: newHistory,
                status: status || sensor.status,
                trend,
                lastUpdate: Date.now(),
              },
            },
          },
          lastMessageTime: Date.now(),
        };
      });
    },

    updateSensorStatus: (sensorId, status) => {
      set((state) => {
        const deviceId = state.activeDeviceId;
        const sensors = state.deviceSensors[deviceId];
        return {
          deviceSensors: {
            ...state.deviceSensors,
            [deviceId]: {
              ...sensors,
              [sensorId]: { ...sensors[sensorId], status },
            },
          },
        };
      });
    },

    updateBulkSensors: (sensorData, anomalySensorIds = [], deviceId = null) => {
      set((state) => {
        const targetDeviceId = deviceId || state.activeDeviceId;
        const sensors = { ...(state.deviceSensors[targetDeviceId] || {}) };
        let hasCritical = false;

        Object.entries(sensorData).forEach(([id, value]) => {
          if (sensors[id]) {
            const isCritical = anomalySensorIds.includes(id);
            const newHistory = [...sensors[id].history, value].slice(-60);
            const trend = calculateTrend(newHistory);

            sensors[id] = {
              ...sensors[id],
              value,
              history: newHistory,
              status: isCritical ? 'critical' : 'normal',
              trend,
              lastUpdate: Date.now(),
            };

            if (isCritical) hasCritical = true;
          }
        });

        const deviceSystemStatus = hasCritical ? 'critical' : 'normal';
        const devicePanelHealth = state.deviceHealth[targetDeviceId]?.panelHealth || 100;

        // Update device status in device list
        const devices = state.devices.map((d) =>
          d.id === targetDeviceId
            ? { ...d, status: hasCritical ? 'critical' : 'online' }
            : d
        );

        const isActiveDevice = targetDeviceId === state.activeDeviceId;

        return {
          deviceSensors: { ...state.deviceSensors, [targetDeviceId]: sensors },
          deviceHealth: {
            ...state.deviceHealth,
            [targetDeviceId]: { panelHealth: devicePanelHealth, systemStatus: deviceSystemStatus },
          },
          devices,
          ...(isActiveDevice ? { systemStatus: deviceSystemStatus, lastMessageTime: Date.now() } : {}),
        };
      });
    },

    setConnectionStatus: (status) => set({ connectionStatus: status }),
    setSystemStatus: (status) => set({ systemStatus: status }),
    setPanelHealth: (health, deviceId = null) => {
      set((state) => {
        const targetDeviceId = deviceId || state.activeDeviceId;
        const isActiveDevice = targetDeviceId === state.activeDeviceId;
        return {
          deviceHealth: {
            ...state.deviceHealth,
            [targetDeviceId]: {
              ...state.deviceHealth[targetDeviceId],
              panelHealth: health,
            },
          },
          ...(isActiveDevice ? { panelHealth: health } : {}),
        };
      });
    },

    selectSensor: (sensorId) => set({ selectedSensor: sensorId }),
    setHoveredSensor: (sensorId) => set({ hoveredSensor: sensorId }),
    setActivePage: (page) => set({ activePage: page }),
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setCameraTarget: (target) => set({ cameraTarget: target }),
    setModelLoaded: (loaded) => set({ modelLoaded: loaded }),
    setPerformanceTier: (tier) => set({ performanceTier: tier }),
    acknowledgeAlert: (sensorId) => set((state) => ({
      acknowledgedAlerts: { ...state.acknowledgedAlerts, [sensorId]: Date.now() },
    })),
    focusSensor: (sensorId) => set({ selectedSensor: sensorId, cameraTarget: sensorId }),
    toggleTheme: () => {
      const newTheme = get().theme === 'light' ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
      set({ theme: newTheme });
    },
    setTheme: (theme) => {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      set({ theme });
    },

    getCriticalSensors: () => {
      const state = get();
      const sensors = state.deviceSensors[state.activeDeviceId] || {};
      return Object.values(sensors).filter((s) => s.status === 'critical');
    },

    getWarningSensors: () => {
      const state = get();
      const sensors = state.deviceSensors[state.activeDeviceId] || {};
      return Object.values(sensors).filter((s) => s.status === 'warning');
    },

    getSensorById: (id) => {
      const state = get();
      const sensors = state.deviceSensors[state.activeDeviceId] || {};
      return sensors[id];
    },

    // Get sensors for active device
    getActiveSensors: () => {
      const state = get();
      return state.deviceSensors[state.activeDeviceId] || {};
    },

    // Get sensor status map for 3D: { [id]: 'normal'|'warning'|'critical'|'offline' }
    getSensorStatusMap: () => {
      const state = get();
      const sensors = state.deviceSensors[state.activeDeviceId] || {};
      const map = {};
      Object.keys(sensors).forEach((id) => { map[id] = sensors[id].status; });
      return map;
    },

    // Get sensor 3D transform data
    getSensor3DTransform: (sensorId) => {
      return SENSOR_POSITIONS[sensorId] || null;
    },
  }))
);

function calculateTrend(history) {
  if (history.length < 5) return 'stable';
  const recent = history.slice(-5);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const first = recent[0];
  const last = recent[recent.length - 1];
  const diff = last - first;
  const threshold = avg * 0.05;
  if (diff > threshold) return 'rising';
  if (diff < -threshold) return 'falling';
  return 'stable';
}

export { SENSOR_CONFIG, SENSOR_POSITIONS };

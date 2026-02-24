import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Cpu, BarChart3, Bell, Settings, Flame, Plus,
  Building2, Server, Warehouse, MapPin, Check, X,
  Sun, Moon,
} from 'lucide-react';
import { useSensorStore } from '../../stores/useSensorStore';

const DEVICE_ICONS = {
  indoor: Building2,
  warehouse: Warehouse,
  datacenter: Server,
};

export function BottomNavigation() {
  const activePage = useSensorStore((state) => state.activePage);
  const setActivePage = useSensorStore((state) => state.setActivePage);
  const systemStatus = useSensorStore((state) => state.systemStatus);
  const devices = useSensorStore((state) => state.devices);
  const activeDeviceId = useSensorStore((state) => state.activeDeviceId);
  const setActiveDevice = useSensorStore((state) => state.setActiveDevice);
  const addDevice = useSensorStore((state) => state.addDevice);
  const theme = useSensorStore((state) => state.theme);
  const toggleTheme = useSensorStore((state) => state.toggleTheme);

  const [showDevicePanel, setShowDevicePanel] = useState(false);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'sensors', icon: Cpu, label: 'Sensors' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'alerts', icon: Bell, label: 'Alerts' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const activeDevice = devices.find((d) => d.id === activeDeviceId);

  const handleAddDevice = () => {
    if (!newDeviceName.trim()) return;
    const id = `device-${Date.now()}`;
    const colors = ['#2D7A6F', '#6366F1', '#E8731A', '#DC2626', '#8B5CF6', '#0891B2'];
    addDevice({
      id,
      name: newDeviceName.trim(),
      location: 'New Location',
      type: 'indoor',
      color: colors[devices.length % colors.length],
      status: 'online',
      floors: 1,
      sensorCount: 12,
    });
    setNewDeviceName('');
    setShowAddDevice(false);
    setActiveDevice(id);
  };

  const isDark = theme === 'dark';

  return (
    <motion.nav
      className="fixed left-0 top-0 bottom-0 w-[72px] z-50 flex flex-col items-center bg-sidebar-bg border-r border-border"
      initial={{ x: -72, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Logo */}
      <div className="pt-5 pb-4">
        <button
          className={`w-11 h-11 rounded-2xl flex items-center justify-center relative group ${
            isDark ? 'bg-primary glow-cyan' : 'bg-text-primary'
          }`}
          onClick={() => setActivePage('dashboard')}
        >
          <Flame className={isDark ? 'text-text-inverse' : 'text-white'} size={20} />
          {systemStatus === 'critical' && (
            <motion.span
              className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-danger border-2 border-sidebar-bg"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          )}
        </button>
      </div>

      {/* Device Selector Button */}
      <div className="pb-3 px-2 w-full">
        <button
          className={`w-full h-11 rounded-xl flex items-center justify-center transition-all duration-200 relative ${
            showDevicePanel
              ? 'bg-primary text-white'
              : isDark
                ? 'bg-surface text-text-secondary hover:bg-primary-lighter hover:text-primary'
                : 'bg-surface-dark text-text-secondary hover:bg-primary-lighter hover:text-primary'
          }`}
          onClick={() => setShowDevicePanel(!showDevicePanel)}
        >
          <div
            className="w-3 h-3 rounded-full absolute left-2 top-2"
            style={{ backgroundColor: activeDevice?.color || '#2D7A6F' }}
          />
          {(() => {
            const DeviceIcon = DEVICE_ICONS[activeDevice?.type] || Building2;
            return <DeviceIcon size={18} />;
          })()}
        </button>
      </div>

      <div className="w-8 h-px bg-border mb-3" />

      {/* Nav Items */}
      <div className="flex flex-col items-center gap-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <div key={item.id} className="relative group">
              <button
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? isDark
                      ? 'bg-primary text-text-inverse shadow-sm glow-cyan'
                      : 'bg-text-primary text-white shadow-sm'
                    : isDark
                      ? 'text-text-tertiary hover:text-primary hover:bg-primary-lighter'
                      : 'text-text-tertiary hover:text-text-primary hover:bg-surface-dark'
                }`}
                onClick={() => setActivePage(item.id)}
              >
                <Icon size={20} />
              </button>
              {/* Tooltip */}
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                <div className={`text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg ${
                  isDark ? 'bg-primary text-text-inverse' : 'bg-text-primary text-white'
                }`}>
                  {item.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom: Theme Toggle + Add + Avatar */}
      <div className="flex flex-col items-center gap-2 pb-5">
        {/* Theme Toggle */}
        <button
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
            isDark
              ? 'text-primary hover:bg-primary-lighter glow-cyan'
              : 'text-text-tertiary hover:text-accent hover:bg-accent-light'
          }`}
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <AnimatePresence mode="wait">
            {isDark ? (
              <motion.div key="sun" initial={{ rotate: -90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} exit={{ rotate: 90, scale: 0 }} transition={{ duration: 0.2 }}>
                <Sun size={20} />
              </motion.div>
            ) : (
              <motion.div key="moon" initial={{ rotate: 90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} exit={{ rotate: -90, scale: 0 }} transition={{ duration: 0.2 }}>
                <Moon size={20} />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        <button
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
            isDark
              ? 'text-text-tertiary hover:text-primary hover:bg-primary-lighter'
              : 'text-text-tertiary hover:text-primary hover:bg-primary-lighter'
          }`}
          onClick={() => { setShowDevicePanel(true); setShowAddDevice(true); }}
        >
          <Plus size={20} />
        </button>
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
          isDark ? 'bg-primary glow-cyan' : 'bg-primary'
        }`}>
          <span className={`text-xs font-bold ${isDark ? 'text-text-inverse' : 'text-white'}`}>FL</span>
        </div>
      </div>

      {/* Device Panel */}
      <AnimatePresence>
        {showDevicePanel && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowDevicePanel(false); setShowAddDevice(false); }}
            />
            <motion.div
              className={`fixed left-[72px] top-0 bottom-0 w-72 border-r border-border z-50 shadow-xl flex flex-col ${
                isDark ? 'bg-sidebar-bg backdrop-blur-xl glow-card' : 'bg-card-bg'
              }`}
              initial={{ x: -288, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -288, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="p-5 border-b border-border">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-display font-bold text-lg text-text-primary">Devices</h3>
                  <button
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-text-tertiary hover:bg-surface-dark"
                    onClick={() => { setShowDevicePanel(false); setShowAddDevice(false); }}
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="text-xs text-text-tertiary">{devices.length} registered device{devices.length !== 1 ? 's' : ''}</p>
              </div>

              <div className="flex-1 overflow-auto p-3 space-y-2">
                {devices.map((device) => {
                  const isActive = device.id === activeDeviceId;
                  const DeviceIcon = DEVICE_ICONS[device.type] || Building2;
                  return (
                    <motion.button
                      key={device.id}
                      className={`w-full p-3.5 rounded-xl text-left transition-all duration-200 border ${
                        isActive
                          ? isDark
                            ? 'bg-primary-lighter border-primary/30 shadow-sm glow-cyan'
                            : 'bg-primary-lighter border-primary/20 shadow-sm'
                          : isDark
                            ? 'bg-surface border-border hover:border-primary/20'
                            : 'bg-card-bg border-border hover:border-primary/20 hover:shadow-sm'
                      }`}
                      onClick={() => { setActiveDevice(device.id); setShowDevicePanel(false); }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: device.color + '18', color: device.color }}
                        >
                          <DeviceIcon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-text-primary truncate">{device.name}</span>
                            {isActive && <Check size={14} className="text-primary flex-shrink-0" />}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <MapPin size={10} className="text-text-tertiary flex-shrink-0" />
                            <span className="text-[11px] text-text-tertiary truncate">{device.location}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              device.status === 'critical' ? 'bg-danger'
                              : device.status === 'warning' ? 'bg-warning'
                              : 'bg-success'
                            }`} />
                            <span className="text-[10px] text-text-tertiary uppercase tracking-wider">{device.status}</span>
                            <span className="text-[10px] text-text-tertiary ml-auto">{device.sensorCount} sensors</span>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Add Device */}
              <div className="p-3 border-t border-border">
                {showAddDevice ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <input
                      type="text"
                      placeholder="Device name..."
                      value={newDeviceName}
                      onChange={(e) => setNewDeviceName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddDevice()}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
                        onClick={handleAddDevice}
                      >
                        Add Device
                      </button>
                      <button
                        className="px-3 py-2 rounded-xl bg-surface text-text-secondary text-sm hover:bg-surface-dark transition-colors"
                        onClick={() => { setShowAddDevice(false); setNewDeviceName(''); }}
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <button
                    className="w-full py-2.5 rounded-xl border border-dashed border-border text-text-tertiary text-sm hover:border-primary hover:text-primary hover:bg-primary-lighter transition-all flex items-center justify-center gap-2"
                    onClick={() => setShowAddDevice(true)}
                  >
                    <Plus size={16} />
                    Add Device
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

export function MiniStatusBar() {
  const connectionStatus = useSensorStore((state) => state.connectionStatus);
  const panelHealth = useSensorStore((state) => state.panelHealth);
  const isConnected = connectionStatus === 'connected';

  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-danger animate-pulse'}`} />
        <span className={`text-xs font-medium ${isConnected ? 'text-success' : 'text-danger'}`}>
          {isConnected ? 'Online' : 'Offline'}
        </span>
      </div>
      <span className="text-border">|</span>
      <span className="text-xs text-text-tertiary">Health {panelHealth.toFixed(0)}%</span>
    </div>
  );
}

export default BottomNavigation;

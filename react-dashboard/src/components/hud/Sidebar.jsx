import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Cpu, BarChart3, Bell, Settings, Flame, Plus,
  Building2, Server, Warehouse, MapPin, Check, X, ChevronLeft, ChevronRight,
  Sun, Moon, Wifi, WifiOff,
} from 'lucide-react';
import { useSensorStore } from '../../stores/useSensorStore';

const DEVICE_ICONS = { indoor: Building2, warehouse: Warehouse, datacenter: Server };

export function Sidebar() {
  const activePage = useSensorStore((s) => s.activePage);
  const setActivePage = useSensorStore((s) => s.setActivePage);
  const systemStatus = useSensorStore((s) => s.systemStatus);
  const connectionStatus = useSensorStore((s) => s.connectionStatus);
  const panelHealth = useSensorStore((s) => s.panelHealth);
  const devices = useSensorStore((s) => s.devices);
  const activeDeviceId = useSensorStore((s) => s.activeDeviceId);
  const setActiveDevice = useSensorStore((s) => s.setActiveDevice);
  const addDevice = useSensorStore((s) => s.addDevice);
  const theme = useSensorStore((s) => s.theme);
  const toggleTheme = useSensorStore((s) => s.toggleTheme);
  const collapsed = useSensorStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useSensorStore((s) => s.toggleSidebar);

  const [showDevicePanel, setShowDevicePanel] = useState(false);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');

  const isDark = theme === 'dark';
  const isConnected = connectionStatus === 'connected';
  const sidebarWidth = collapsed ? 72 : 240;
  const activeDevice = devices.find((d) => d.id === activeDeviceId);

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'sensors', icon: Cpu, label: 'Sensors' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'alerts', icon: Bell, label: 'Alerts' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const handleAddDevice = () => {
    if (!newDeviceName.trim()) return;
    const id = `device-${Date.now()}`;
    const colors = ['#2D7A6F', '#6366F1', '#E8731A', '#DC2626', '#8B5CF6', '#0891B2'];
    addDevice({
      id, name: newDeviceName.trim(), location: 'New Location', type: 'indoor',
      color: colors[devices.length % colors.length], status: 'online', floors: 1, sensorCount: 12,
    });
    setNewDeviceName('');
    setShowAddDevice(false);
    setActiveDevice(id);
  };

  return (
    <>
      <motion.nav
        className="fixed left-0 top-0 bottom-0 z-50 flex flex-col bg-sidebar-bg border-r border-border overflow-hidden"
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* ─── Logo ─── */}
        <div className={`flex items-center gap-3 px-4 pt-5 pb-4 ${collapsed ? 'justify-center' : ''}`}>
          <button
            className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 relative ${
              isDark ? 'bg-primary glow-cyan' : 'bg-text-primary'
            }`}
            onClick={() => setActivePage('dashboard')}
          >
            <Flame className={isDark ? 'text-text-inverse' : 'text-white'} size={20} />
            {systemStatus === 'critical' && (
              <motion.span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-danger border-2 border-sidebar-bg"
                animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} />
            )}
          </button>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }} className="min-w-0">
                <span className={`font-display font-bold text-base text-text-primary tracking-tight leading-tight block ${isDark ? 'neon-text' : ''}`}>
                  FIRELINK
                </span>
                <span className="text-[10px] text-text-tertiary block">Detection System</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Device Selector ─── */}
        <div className={`px-3 pb-3 ${collapsed ? 'flex justify-center' : ''}`}>
          <button
            className={`${collapsed ? 'w-11 h-11' : 'w-full px-3 py-2.5'} rounded-xl flex items-center gap-3 transition-all duration-200 ${
              showDevicePanel
                ? isDark ? 'bg-primary text-text-inverse' : 'bg-primary text-white'
                : isDark
                  ? 'bg-surface text-text-secondary hover:bg-primary-lighter hover:text-primary'
                  : 'bg-surface text-text-secondary hover:bg-primary-lighter hover:text-primary'
            } ${collapsed ? 'justify-center' : ''}`}
            onClick={() => setShowDevicePanel(!showDevicePanel)}
          >
            <div className="relative flex-shrink-0">
              {(() => {
                const DeviceIcon = DEVICE_ICONS[activeDevice?.type] || Building2;
                return <DeviceIcon size={18} />;
              })()}
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-sidebar-bg"
                style={{ backgroundColor: activeDevice?.color || '#2D7A6F' }} />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex-1 min-w-0 text-left">
                  <div className="text-[13px] font-medium truncate">{activeDevice?.name || 'Select Device'}</div>
                  <div className="text-[10px] opacity-60 truncate">{activeDevice?.location}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        <div className="mx-3 h-px bg-border mb-2" />

        {/* ─── Nav Items ─── */}
        <div className={`flex flex-col gap-1 px-3 flex-1 ${collapsed ? 'items-center' : ''}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <div key={item.id} className="relative group">
                <button
                  className={`${collapsed ? 'w-11 h-11 justify-center' : 'w-full px-3 py-2.5 justify-start'} rounded-xl flex items-center gap-3 transition-all duration-200 ${
                    isActive
                      ? isDark
                        ? 'bg-primary text-text-inverse glow-cyan'
                        : 'bg-text-primary text-white shadow-sm'
                      : isDark
                        ? 'text-text-tertiary hover:text-primary hover:bg-primary-lighter'
                        : 'text-text-tertiary hover:text-text-primary hover:bg-surface-dark'
                  }`}
                  onClick={() => setActivePage(item.id)}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }} className="text-sm font-medium">
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
                {collapsed && (
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-[60]">
                    <div className={`text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg ${
                      isDark ? 'bg-primary text-text-inverse' : 'bg-text-primary text-white'
                    }`}>{item.label}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ─── Bottom ─── */}
        <div className={`px-3 pb-4 flex flex-col gap-1.5 ${collapsed ? 'items-center' : ''}`}>
          {/* Status bar */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="px-3 py-2 rounded-xl bg-surface mb-1">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {isConnected ? <Wifi size={12} className="text-success" /> : <WifiOff size={12} className="text-danger" />}
                    <span className={`text-[11px] font-medium ${isConnected ? 'text-success' : 'text-danger'}`}>
                      {isConnected ? 'Connected' : 'Offline'}
                    </span>
                  </div>
                  <span className="text-[11px] text-text-tertiary font-mono">{panelHealth.toFixed(0)}%</span>
                </div>
                <div className="h-1 rounded-full bg-border overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${panelHealth}%` }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Theme toggle */}
          <button
            className={`${collapsed ? 'w-11 h-11 justify-center' : 'w-full px-3 py-2.5 justify-start'} rounded-xl flex items-center gap-3 transition-all duration-300 ${
              isDark
                ? 'text-primary hover:bg-primary-lighter'
                : 'text-text-tertiary hover:text-accent hover:bg-accent-light'
            }`}
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <AnimatePresence mode="wait">
              {isDark ? (
                <motion.div key="sun" initial={{ rotate: -90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} exit={{ rotate: 90, scale: 0 }} transition={{ duration: 0.2 }}>
                  <Sun size={20} className="flex-shrink-0" />
                </motion.div>
              ) : (
                <motion.div key="moon" initial={{ rotate: 90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} exit={{ rotate: -90, scale: 0 }} transition={{ duration: 0.2 }}>
                  <Moon size={20} className="flex-shrink-0" />
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }} className="text-sm font-medium">
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Collapse toggle */}
          <button
            className={`${collapsed ? 'w-11 h-11 justify-center' : 'w-full px-3 py-2.5 justify-start'} rounded-xl flex items-center gap-3 transition-all duration-200 text-text-tertiary hover:text-text-primary hover:bg-surface-dark`}
            onClick={toggleSidebar}
          >
            {collapsed ? <ChevronRight size={20} className="flex-shrink-0" /> : <ChevronLeft size={20} className="flex-shrink-0" />}
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }} className="text-sm font-medium">
                  Collapse
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Avatar */}
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : 'px-3 py-2'}`}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-primary glow-cyan' : 'bg-primary'}`}>
              <span className={`text-xs font-bold ${isDark ? 'text-text-inverse' : 'text-white'}`}>FL</span>
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-w-0">
                  <div className="text-[13px] font-medium text-text-primary truncate">Admin</div>
                  <div className="text-[10px] text-text-tertiary truncate">firelink@system</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.nav>

      {/* ─── Device Panel ─── */}
      <AnimatePresence>
        {showDevicePanel && (
          <>
            <motion.div className="fixed inset-0 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowDevicePanel(false); setShowAddDevice(false); }} />
            <motion.div
              className={`fixed top-0 bottom-0 w-72 border-r border-border z-50 shadow-xl flex flex-col ${
                isDark ? 'bg-sidebar-bg backdrop-blur-xl glow-card' : 'bg-card-bg'
              }`}
              style={{ left: sidebarWidth }}
              initial={{ x: -288, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -288, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="p-5 border-b border-border">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-display font-bold text-lg text-text-primary">Devices</h3>
                  <button className="w-7 h-7 rounded-lg flex items-center justify-center text-text-tertiary hover:bg-surface-dark"
                    onClick={() => { setShowDevicePanel(false); setShowAddDevice(false); }}>
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
                    <motion.button key={device.id}
                      className={`w-full p-3.5 rounded-xl text-left transition-all duration-200 border ${
                        isActive
                          ? isDark ? 'bg-primary-lighter border-primary/30 glow-cyan' : 'bg-primary-lighter border-primary/20 shadow-sm'
                          : isDark ? 'bg-surface border-border hover:border-primary/20' : 'bg-card-bg border-border hover:border-primary/20 hover:shadow-sm'
                      }`}
                      onClick={() => { setActiveDevice(device.id); setShowDevicePanel(false); }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: device.color + '18', color: device.color }}>
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
                              device.status === 'critical' ? 'bg-danger' : device.status === 'warning' ? 'bg-warning' : 'bg-success'
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

              <div className="p-3 border-t border-border">
                {showAddDevice ? (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                    <input type="text" placeholder="Device name..." value={newDeviceName}
                      onChange={(e) => setNewDeviceName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddDevice()}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary"
                      autoFocus />
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
                        onClick={handleAddDevice}>Add Device</button>
                      <button className="px-3 py-2 rounded-xl bg-surface text-text-secondary text-sm hover:bg-surface-dark transition-colors"
                        onClick={() => { setShowAddDevice(false); setNewDeviceName(''); }}>Cancel</button>
                    </div>
                  </motion.div>
                ) : (
                  <button className="w-full py-2.5 rounded-xl border border-dashed border-border text-text-tertiary text-sm hover:border-primary hover:text-primary hover:bg-primary-lighter transition-all flex items-center justify-center gap-2"
                    onClick={() => setShowAddDevice(true)}>
                    <Plus size={16} /> Add Device
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function MiniStatusBar() {
  const connectionStatus = useSensorStore((s) => s.connectionStatus);
  const panelHealth = useSensorStore((s) => s.panelHealth);
  const isConnected = connectionStatus === 'connected';
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-danger animate-pulse'}`} />
        <span className={`text-xs font-medium ${isConnected ? 'text-success' : 'text-danger'}`}>{isConnected ? 'Online' : 'Offline'}</span>
      </div>
      <span className="text-border">|</span>
      <span className="text-xs text-text-tertiary">Health {panelHealth.toFixed(0)}%</span>
    </div>
  );
}

export default Sidebar;

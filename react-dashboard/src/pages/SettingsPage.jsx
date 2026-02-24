import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wifi, Shield, Bell, Monitor, Thermometer, Sliders,
  Sun, Moon, Volume2, Eye, Radio, Server,
} from 'lucide-react';
import { useSensorStore } from '../stores/useSensorStore';

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } },
  item: { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } } },
};

function Toggle({ enabled, onChange }) {
  return (
    <button
      className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
        enabled ? 'bg-primary' : 'bg-border'
      }`}
      onClick={() => onChange(!enabled)}
    >
      <motion.div
        className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm"
        animate={{ left: enabled ? 24 : 4 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

function SettingRow({ icon: Icon, label, description, children }) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-3.5">
        <div className="w-9 h-9 rounded-[12px] bg-surface flex items-center justify-center text-text-secondary">
          <Icon size={17} />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">{label}</p>
          {description && <p className="text-[11px] text-text-tertiary mt-0.5">{description}</p>}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}

function SettingSection({ title, children }) {
  return (
    <motion.div className={`bg-card-bg border border-border rounded-[20px] p-5 shadow-sm`} variants={stagger.item}>
      <h3 className="font-display font-bold text-lg text-text-primary mb-1">{title}</h3>
      <div className="divide-y divide-border">{children}</div>
    </motion.div>
  );
}

export default function SettingsPage() {
  const theme = useSensorStore((s) => s.theme);
  const toggleTheme = useSensorStore((s) => s.toggleTheme);
  const isDark = theme === 'dark';

  const [settings, setSettings] = useState({
    mqttEnabled: true,
    mqttHost: '213.142.151.191',
    mqttPort: '9001',
    mqttTopic: 'aicofire',
    autoReconnect: true,
    tempThreshold: 60,
    coThreshold: 50,
    humidityThreshold: 80,
    alertSound: true,
    alertNotifications: true,
    alertEmail: false,
    autoRotate3D: true,
    showParticles: true,
    highContrast: false,
    compactMode: false,
  });

  const update = (key, value) => setSettings((s) => ({ ...s, [key]: value }));

  return (
    <motion.div className="h-full p-6 overflow-auto" initial="hidden" animate="visible" exit={{ opacity: 0 }} variants={stagger.container}>
      <div className="max-w-[800px] mx-auto space-y-5">
        {/* Header */}
        <motion.div variants={stagger.item}>
          <h1 className="font-display font-bold text-[32px] text-text-primary tracking-tight leading-none">Settings</h1>
          <p className="text-[13px] text-text-secondary mt-2">Configuration Panel</p>
        </motion.div>

        {/* Connection Settings */}
        <SettingSection title="Connection">
          <SettingRow icon={Wifi} label="MQTT Connection" description="Enable real-time sensor data stream">
            <Toggle enabled={settings.mqttEnabled} onChange={(v) => update('mqttEnabled', v)} />
          </SettingRow>
          <SettingRow icon={Server} label="MQTT Broker" description={`${settings.mqttHost}:${settings.mqttPort}`}>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={settings.mqttHost}
                onChange={(e) => update('mqttHost', e.target.value)}
                className="w-36 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-text-primary outline-none focus:border-primary text-right"
              />
              <span className="text-text-tertiary text-xs">:</span>
              <input
                type="text"
                value={settings.mqttPort}
                onChange={(e) => update('mqttPort', e.target.value)}
                className="w-16 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-text-primary outline-none focus:border-primary text-right"
              />
            </div>
          </SettingRow>
          <SettingRow icon={Radio} label="MQTT Topic" description="Subscribe to sensor data topic">
            <input
              type="text"
              value={settings.mqttTopic}
              onChange={(e) => update('mqttTopic', e.target.value)}
              className="w-32 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-text-primary outline-none focus:border-primary text-right"
            />
          </SettingRow>
          <SettingRow icon={Wifi} label="Auto Reconnect" description="Reconnect on connection loss">
            <Toggle enabled={settings.autoReconnect} onChange={(v) => update('autoReconnect', v)} />
          </SettingRow>
        </SettingSection>

        {/* Threshold Settings */}
        <SettingSection title="Thresholds">
          <SettingRow icon={Thermometer} label="Temperature Alert" description={`Trigger at ${settings.tempThreshold}°C`}>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="30"
                max="100"
                value={settings.tempThreshold}
                onChange={(e) => update('tempThreshold', Number(e.target.value))}
                className="w-28 accent-primary"
              />
              <span className="text-sm font-mono font-semibold text-text-primary w-10 text-right">{settings.tempThreshold}°</span>
            </div>
          </SettingRow>
          <SettingRow icon={Shield} label="CO Alert" description={`Trigger at ${settings.coThreshold} ppm`}>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="10"
                max="100"
                value={settings.coThreshold}
                onChange={(e) => update('coThreshold', Number(e.target.value))}
                className="w-28 accent-primary"
              />
              <span className="text-sm font-mono font-semibold text-text-primary w-10 text-right">{settings.coThreshold}</span>
            </div>
          </SettingRow>
          <SettingRow icon={Sliders} label="Humidity Alert" description={`Trigger at ${settings.humidityThreshold}%`}>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="40"
                max="100"
                value={settings.humidityThreshold}
                onChange={(e) => update('humidityThreshold', Number(e.target.value))}
                className="w-28 accent-primary"
              />
              <span className="text-sm font-mono font-semibold text-text-primary w-10 text-right">{settings.humidityThreshold}%</span>
            </div>
          </SettingRow>
        </SettingSection>

        {/* Display Settings */}
        <SettingSection title="Display">
          <SettingRow icon={isDark ? Moon : Sun} label="Theme" description={isDark ? 'Void / Neon (Dark)' : 'Clean / Apple (Light)'}>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                isDark
                  ? 'bg-primary-lighter text-primary border-primary/20 glow-cyan'
                  : 'bg-surface text-text-primary border-border hover:border-primary/30'
              }`}
              onClick={toggleTheme}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
              {isDark ? 'Switch to Light' : 'Switch to Dark'}
            </button>
          </SettingRow>
          <SettingRow icon={Bell} label="Alert Sound" description="Play sound on critical alerts">
            <Toggle enabled={settings.alertSound} onChange={(v) => update('alertSound', v)} />
          </SettingRow>
          <SettingRow icon={Bell} label="Push Notifications" description="Browser notification on alerts">
            <Toggle enabled={settings.alertNotifications} onChange={(v) => update('alertNotifications', v)} />
          </SettingRow>
          <SettingRow icon={Monitor} label="3D Auto Rotate" description="Rotate building model automatically">
            <Toggle enabled={settings.autoRotate3D} onChange={(v) => update('autoRotate3D', v)} />
          </SettingRow>
          <SettingRow icon={Eye} label="Show Particles" description="Floating particles in 3D scene">
            <Toggle enabled={settings.showParticles} onChange={(v) => update('showParticles', v)} />
          </SettingRow>
          <SettingRow icon={Monitor} label="Compact Mode" description="Reduce spacing for smaller screens">
            <Toggle enabled={settings.compactMode} onChange={(v) => update('compactMode', v)} />
          </SettingRow>
        </SettingSection>

        {/* Version info */}
        <motion.div className="text-center py-4" variants={stagger.item}>
          <p className="text-[11px] text-text-tertiary">FIRELINK Detection System v2.0</p>
          <p className="text-[10px] text-text-tertiary mt-1">Built with React 19 + Three.js + Tailwind CSS 4</p>
        </motion.div>
      </div>
    </motion.div>
  );
}

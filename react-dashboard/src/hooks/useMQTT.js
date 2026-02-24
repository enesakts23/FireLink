import { useEffect, useCallback, useRef } from 'react';
import Paho from 'paho-mqtt';
import { useSensorStore } from '../stores/useSensorStore';

const MQTT_CONFIG = {
  host: '213.142.151.191',
  port: 9001,
  topic: 'aicofire',
  clientId: `aico-react-${Math.random().toString(16).substring(2, 10)}`,
  reconnectDelay: 3000,
  maxReconnectAttempts: 10,
};

const WARNING1_SENSORS = ['temperature', 'humidity', 'gas', 'air-quality', 'no2', 'co', 'tvoc', 'eco2'];
const WARNING2_SENSORS = ['surface-temp', 'surface-temp-2', 'pressure', 'current'];

function hexToByte(hexString) {
  if (!hexString || hexString.length < 2) return 0;
  return parseInt(hexString, 16) || 0;
}

function parseWarning1(warningHex) {
  const warningByte = hexToByte(warningHex);
  const anomalies = [];
  for (let i = 0; i < 8; i++) {
    if ((warningByte >> i) & 1) anomalies.push(WARNING1_SENSORS[i]);
  }
  return anomalies;
}

function parseWarning2(warningHex) {
  const warningByte = hexToByte(warningHex);
  const anomalies = [];
  for (let i = 0; i < 4; i++) {
    if ((warningByte >> i) & 1) anomalies.push(WARNING2_SENSORS[i]);
  }
  return anomalies;
}

function parseFireSensorData(message) {
  try {
    const parts = message.split(';');
    if (parts.length < 17 || parts[0] !== 'A' || parts[parts.length - 1] !== 'B') return null;

    const sensorData = {
      temperature: parseFloat(parts[1]) || 0,
      humidity: parseFloat(parts[2]) || 0,
      gas: parseFloat(parts[3]) || 0,
      'air-quality': parseFloat(parts[4]) || 0,
      no2: parseFloat(parts[5]) || 0,
      co: parseFloat(parts[6]) || 0,
      tvoc: parseFloat(parts[7]) || 0,
      eco2: parseFloat(parts[8]) || 0,
      'surface-temp': parseFloat(parts[9]) || 0,
      'surface-temp-2': parseFloat(parts[10]) || 0,
      pressure: parseFloat(parts[11]) || 0,
      current: parseFloat(parts[12]) || 0,
    };

    const anomalySensorIds = [
      ...parseWarning1(parts[14]),
      ...parseWarning2(parts[13]),
    ];

    return {
      sensorData,
      anomalySensorIds,
      panelHealth: parseFloat(parts[15]) || 100,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[MQTT] Parse error:', error);
    return null;
  }
}

export function useMQTT() {
  const clientRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);

  const { setConnectionStatus, updateBulkSensors, setPanelHealth, setSystemStatus } = useSensorStore();

  const connect = useCallback(() => {
    if (clientRef.current) {
      try { clientRef.current.disconnect(); } catch (e) {}
    }

    setConnectionStatus('connecting');
    const client = new Paho.Client(MQTT_CONFIG.host, MQTT_CONFIG.port, MQTT_CONFIG.clientId);

    client.onConnectionLost = () => {
      setConnectionStatus('disconnected');
      setSystemStatus('offline');
      scheduleReconnect();
    };

    client.onMessageArrived = (message) => {
      const parsed = parseFireSensorData(message.payloadString);
      if (parsed) {
        updateBulkSensors(parsed.sensorData, parsed.anomalySensorIds);
        setPanelHealth(parsed.panelHealth);
      }
    };

    client.connect({
      onSuccess: () => {
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        client.subscribe(MQTT_CONFIG.topic);
      },
      onFailure: () => {
        setConnectionStatus('error');
        scheduleReconnect();
      },
      useSSL: false,
      timeout: 10,
    });

    clientRef.current = client;
  }, [setConnectionStatus, updateBulkSensors, setPanelHealth, setSystemStatus]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MQTT_CONFIG.maxReconnectAttempts) {
      setConnectionStatus('error');
      return;
    }
    reconnectAttemptsRef.current += 1;
    const delay = MQTT_CONFIG.reconnectDelay + (reconnectAttemptsRef.current * 1000);
    reconnectTimeoutRef.current = setTimeout(() => connect(), delay);
  }, [connect, setConnectionStatus]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (clientRef.current) {
      try { clientRef.current.disconnect(); } catch (e) {}
      clientRef.current = null;
    }
    setConnectionStatus('disconnected');
  }, [setConnectionStatus]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { connect, disconnect, isConnected: useSensorStore((s) => s.connectionStatus === 'connected') };
}

/**
 * Multi-device simulator - generates data for ALL devices
 */
export function useMQTTSimulator() {
  const { updateBulkSensors, setConnectionStatus, setPanelHealth, devices } = useSensorStore();
  const intervalRef = useRef(null);
  const devicesRef = useRef(devices);

  // Keep ref updated
  useEffect(() => {
    devicesRef.current = devices;
  }, [devices]);

  useEffect(() => {
    setConnectionStatus('connected');

    const generateDataForDevice = (deviceId) => {
      const sensorData = {
        temperature: 22 + Math.random() * 8 - 4,
        humidity: 45 + Math.random() * 20 - 10,
        gas: 150 + Math.random() * 100,
        'air-quality': 50 + Math.random() * 100,
        no2: Math.random() * 2,
        co: Math.random() * 10,
        tvoc: Math.random() * 300,
        eco2: 400 + Math.random() * 600,
        'surface-temp': 25 + Math.random() * 10,
        'surface-temp-2': 26 + Math.random() * 10,
        pressure: 1000 + Math.random() * 20 - 10,
        current: 50 + Math.random() * 100,
      };

      const anomalySensorIds = [];
      if (Math.random() < 0.04) {
        const sensors = Object.keys(sensorData);
        anomalySensorIds.push(sensors[Math.floor(Math.random() * sensors.length)]);
      }

      updateBulkSensors(sensorData, anomalySensorIds, deviceId);
      setPanelHealth(95 + Math.random() * 5, deviceId);
    };

    const generateAllData = () => {
      devicesRef.current.forEach((device) => {
        generateDataForDevice(device.id);
      });
    };

    generateAllData();
    intervalRef.current = setInterval(generateAllData, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setConnectionStatus('disconnected');
    };
  }, [updateBulkSensors, setConnectionStatus, setPanelHealth]);
}

export default useMQTT;

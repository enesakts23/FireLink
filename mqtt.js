class MQTTClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.brokerHost = '213.142.151.191';
        this.brokerPort = 9001;
        this.topic = 'aicofire';
        this.clientId = 'aicofire_web_' + Math.random().toString(16).substr(2, 8);
        this.init();
    }

    init() {
        try {
            this.client = new Paho.MQTT.Client(this.brokerHost, this.brokerPort, this.clientId);
            this.client.onConnectionLost = this.onConnectionLost.bind(this);
            this.client.onMessageArrived = this.onMessageArrived.bind(this);
            this.connect();
        } catch (error) {
            console.error('❌ MQTT Client initialization failed:', error);
        }
    }

    connect() {
        const connectOptions = {
            onSuccess: this.onConnect.bind(this),
            onFailure: this.onConnectFailure.bind(this),
            useSSL: false,
            keepAliveInterval: 60,
            cleanSession: true,
            timeout: 10
        };

        try {
            this.client.connect(connectOptions);
        } catch (error) {
            console.error('❌ Connection attempt failed:', error);
        }
    }

    onConnect() {
        console.log('✅ Connected to MQTT broker successfully!');
        this.isConnected = true;        
        this.client.subscribe(this.topic);
    }

    onConnectFailure(error) {
        console.error('❌ MQTT Connection failed:', error);
        this.isConnected = false;
        
        setTimeout(() => {
            console.log('🔄 Retrying connection...');
            this.connect();
        }, 5000);
    }

    onConnectionLost(responseObject) {
        if (responseObject.errorCode !== 0) {
            console.warn('⚠️ Connection lost:', responseObject.errorMessage);
            this.isConnected = false;
            
            setTimeout(() => {
                console.log('🔄 Attempting to reconnect...');
                this.connect();
            }, 3000);
        }
    }

    onMessageArrived(message) {
        const timestamp = new Date().toLocaleTimeString('tr-TR');
        const payload = message.payloadString;

        this.parseFireSensorData(payload, timestamp);
    }

    parseFireSensorData(data, timestamp) {
        try {
            // Split the data by semicolon
            const parts = data.split(';');

            // Ensure the message starts with 'A' and ends with 'B'
            if (parts[0] !== 'A' || parts[parts.length - 1] !== 'B') {
                console.warn('Invalid message format');
                return;
            }

            // Map the data to corresponding sensor values
            const sensorData = {
                temperature: parseFloat(parts[1]),
                humidity: parseFloat(parts[2]),
                gas: parseFloat(parts[3]),
                'air-quality': parseFloat(parts[4]),
                no2: parseFloat(parts[5]),
                co: parseFloat(parts[6]),
                tvoc: parseFloat(parts[7]),
                eco2: parseFloat(parts[8]),
                'surface-temp': parseFloat(parts[9]),
                'surface-temp-2': parseFloat(parts[10]),
                pressure: parseFloat(parts[11]),
                current: parseFloat(parts[12]),
                warning2: parseInt(parts[13], 10),
                warning1: parseInt(parts[14], 10),
                panelHealth: parseFloat(parts[15])
            };

            // Update the dashboard with the parsed data
            this.updateDashboardSensors(sensorData);
        } catch (error) {
            console.error('❌ Error parsing sensor data:', error);
        }
    }
    
    parseAnomalyWarnings(warning1Hex) {
        try {
            console.log('🚨 ANOMALY DETECTION (Warning1):');
            console.log(`⚠️  Warning1: ${warning1Hex} (anomaly detection)`);
            
            const warningValue = this.hexToByte(warning1Hex);
            
            console.log(`🔍 Warning1 hex: ${warning1Hex}`);
            console.log(`🔍 Warning1 byte value: ${warningValue}`);
            console.log(`🔍 Warning1 binary: ${warningValue.toString(2).padStart(8, '0')}`);
            
            const sensorNames = [
                'Sıcaklık (Temperature)',
                'Nem (Humidity)',
                'Gaz Rezistans (Gas Resistance)',
                'Hava Kalite (Air Quality)',
                'NO2',
                'CO',
                'TVOC',
                'eCO2'
            ];
            
            const sensorIds = [
                'temperature',
                'humidity',
                'gas',
                'air-quality',
                'no2',
                'co',
                'tvoc',
                'eco2'
            ];
            
            const anomalies = [];
            const anomalySensorIds = [];
            
            for (let i = 0; i < 8; i++) {
                const bitValue = (warningValue >> i) & 1;
                if (bitValue === 1) {
                    anomalies.push(sensorNames[i]);
                    anomalySensorIds.push(sensorIds[i]);
                    console.log(`🔴 ANOMALY DETECTED - Bit ${i}: ${sensorNames[i]} (${sensorIds[i]})`);
                }
            }
            
            if (anomalies.length === 0) {
                console.log('✅ No anomalies detected - all sensors normal');
            } else {
                console.log(`🚨 TOTAL ANOMALIES: ${anomalies.length}`);
            }
                        
            return anomalySensorIds;
            
        } catch (error) {
            console.error('❌ Error parsing anomaly warnings:', error);
            return [];
        }
    }
    
    parseAnomalyWarningsForWarning2(warning2Hex) {
        try {
            console.log('🚨 ANOMALY DETECTION (Warning2):');
            console.log(`⚠️  Warning2: ${warning2Hex} (anomaly detection)`);
            
            const warningValue = this.hexToByte(warning2Hex);
            
            console.log(`🔍 Warning2 hex: ${warning2Hex}`);
            console.log(`🔍 Warning2 byte value: ${warningValue}`);
            console.log(`🔍 Warning2 binary: ${warningValue.toString(2).padStart(8, '0')}`);
            
            const sensorNames = [
                'Yüzey Sıcaklık 1 (Surface Temp 1)',
                'Yüzey Sıcaklık 2 (Surface Temp 2)',
                'Basınç (Pressure)',
                'Akım (Current)',
                '',
                '',
                '',
                ''
            ];
            
            const sensorIds = [
                'surface-temp',
                'surface-temp-2',
                'pressure',
                'current',
                '',
                '',
                '',
                ''
            ];
            
            const anomalies = [];
            const anomalySensorIds = [];
            
            for (let i = 0; i < 8; i++) {
                if (sensorIds[i] === '') continue;
                const bitValue = (warningValue >> i) & 1;
                if (bitValue === 1) {
                    anomalies.push(sensorNames[i]);
                    anomalySensorIds.push(sensorIds[i]);
                    console.log(`🔴 ANOMALY DETECTED - Bit ${i}: ${sensorNames[i]} (${sensorIds[i]})`);
                }
            }
            
            if (anomalies.length === 0) {
                console.log('✅ No anomalies detected for Warning2 - all sensors normal');
            } else {
                console.log(`🚨 TOTAL ANOMALIES for Warning2: ${anomalies.length}`);
            }
                        
            return anomalySensorIds;
            
        } catch (error) {
            console.error('❌ Error parsing anomaly warnings for Warning2:', error);
            return [];
        }
    }
    
    hexToByte(hexString) {
        try {
            const cleanHex = hexString.replace('0x', '').replace('0X', '');
            return parseInt(cleanHex, 16);
        } catch (error) {
            console.error(`❌ Error converting hex ${hexString} to byte:`, error);
            return 0;
        }
    }
    
    updateDashboardSensors(sensorData, anomalySensorIds = []) {
        if (!window.modernFireDashboard) {
            window.pendingMQTTData = { sensorData, anomalySensorIds };
            return;
        }
        const dashboard = window.modernFireDashboard;
        Object.keys(sensorData).forEach(sensorId => {
            if (dashboard.sensors[sensorId]) {
                dashboard.sensors[sensorId].status = 'normal';
            }
        });
        Object.keys(sensorData).forEach(sensorId => {
            const value = sensorData[sensorId];
            if (sensorId === 'boardHealth') {
                dashboard.systemState.boardHealth = value;
                return;
            }
            if (sensorId === 'panelHealth') {
                // Panel health için ayrı işlem, belki ileride ekle
                return;
            }
            dashboard.updateSensorHistory(sensorId, parseFloat(value.toFixed(2)));
            dashboard.updateSensorValue(sensorId, value);
            const hasAnomaly = anomalySensorIds.includes(sensorId);
            if (hasAnomaly) {
                dashboard.sensors[sensorId].status = 'critical';
            }
            dashboard.updateTrendIndicator(sensorId);
            dashboard.updateStatusBadge(sensorId, dashboard.sensors[sensorId].status);
            dashboard.updateTrendDisplay(sensorId, dashboard.sensors[sensorId].trend);
            dashboard.updateCardStyling(sensorId, dashboard.sensors[sensorId].status);
            dashboard.renderChart(sensorId);
        });
        try {
            if (typeof dashboard.updateSystemStatus === 'function') {
                dashboard.updateSystemStatus();
            }
            if (typeof dashboard.updateTimestamp === 'function') {
                dashboard.updateTimestamp();
            }
        } catch (error) {
        }
    }

    sendMessage(message) {
        if (this.isConnected) {
            const mqttMessage = new Paho.MQTT.Message(message);
            mqttMessage.destinationName = this.topic;
            this.client.send(mqttMessage);
            console.log(`📤 Message sent: ${message}`);
        } else {
            console.warn('⚠️ Cannot send message - not connected to broker');
        }
    }

    disconnect() {
        if (this.client && this.isConnected) {
            this.client.disconnect();
            console.log('🔌 Disconnected from MQTT broker');
        }
    }
}

let mqttClient;

document.addEventListener('DOMContentLoaded', function() {
    mqttClient = new MQTTClient();
});

window.addEventListener('beforeunload', function() {
    if (mqttClient) {
        mqttClient.disconnect();
    }
});
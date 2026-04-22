import paho.mqtt.client as mqtt
import sqlite3
from datetime import datetime
import logging
import os

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class MQTTtoSQLite:
    def __init__(self):
        self.mqtt_broker = "213.142.151.191"
        self.mqtt_port = 1883
        self.mqtt_topic = "aicotest"
        self.client_id = "aicofire_python_db"
        
        # SQLite database file path
        self.db_path = os.path.join(os.path.dirname(__file__), 'fire_sensors.db')
        
        self.mqtt_client = mqtt.Client(client_id=self.client_id)
        self.mqtt_client.on_connect = self.on_connect
        self.mqtt_client.on_message = self.on_message
        self.db_connection = None
        
        self.setup_database()
        self.connect_mqtt()

    def setup_database(self):
        try:
            self.db_connection = sqlite3.connect(self.db_path, check_same_thread=False)
            cursor = self.db_connection.cursor()
            
            create_table_query = """
            CREATE TABLE IF NOT EXISTS fire_sensor_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sensor_number INTEGER,
                temperature REAL,
                humidity REAL,
                gas_resistance REAL,
                air_quality REAL,
                no2 REAL,
                co REAL,
                tvoc REAL,
                eco2 REAL,
                surface_temp_1 REAL,
                surface_temp_2 REAL,
                pressure REAL,
                current REAL,
                warning1 INTEGER,
                warning2 INTEGER,
                panel_health REAL,
                timestamp DATETIME
            )
            """
            
            cursor.execute(create_table_query)
            
            # Create indexes for better query performance
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_sensor ON fire_sensor_data(sensor_number)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_timestamp ON fire_sensor_data(timestamp)")
            
            self.db_connection.commit()
            logging.info(f"✅ SQLite database initialized at: {self.db_path}")
            
        except sqlite3.Error as err:
            logging.error(f"❌ Database error: {err}")

    def connect_mqtt(self):
        try:
            self.mqtt_client.connect(self.mqtt_broker, self.mqtt_port, 60)
            self.mqtt_client.loop_start()
            logging.info("✅ Connected to MQTT broker")
        except Exception as e:
            logging.error(f"❌ MQTT connection failed: {e}")

    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            logging.info("✅ MQTT connection successful")
            client.subscribe(self.mqtt_topic)
            logging.info(f"📡 Subscribed to topic: {self.mqtt_topic}")
        else:
            logging.error(f"❌ MQTT connection failed with code: {rc}")

    def on_message(self, client, userdata, msg):
        try:
            payload = msg.payload.decode('utf-8')
            logging.info(f"📥 Received message: {payload}")
            self.parse_and_save_data(payload)
        except Exception as e:
            logging.error(f"❌ Error processing message: {e}")

    def parse_and_save_data(self, data):
        """
        Parse MQTT message format: A;sensor_num;temp;hum;gas;aq;no2;co;tvoc;eco2;st1;st2;pres;cur;W1;W2;health;B
        """
        try:
            parts = data.split(';')
            
            # Validate message format
            if len(parts) < 18 or parts[0] != 'A' or parts[-1] != 'B':
                logging.warning("⚠️ Invalid message format - must start with 'A' and end with 'B'")
                return
            
            # Parse sensor data
            sensor_number = int(parts[1])
            temperature = float(parts[2])
            humidity = float(parts[3])
            gas_resistance = float(parts[4])
            air_quality = float(parts[5])
            no2 = float(parts[6])
            co = float(parts[7])
            tvoc = float(parts[8])
            eco2 = float(parts[9])
            surface_temp_1 = float(parts[10])
            surface_temp_2 = float(parts[11])
            pressure = float(parts[12])  # Already in atm
            current_ma = float(parts[13])
            current = current_ma / 1000.0  # Convert mA to A
            warning1 = int(parts[14])
            warning2 = int(parts[15])
            panel_health = float(parts[16])
            
            timestamp = datetime.now()
            
            # Log warning bits
            if warning1 > 0 or warning2 > 0:
                logging.warning(f"🚨 WARNINGS DETECTED - W1: {warning1} (binary: {bin(warning1)}), W2: {warning2} (binary: {bin(warning2)})")
            
            # Save to database
            self.save_to_database(
                sensor_number, temperature, humidity, gas_resistance, air_quality,
                no2, co, tvoc, eco2, surface_temp_1, surface_temp_2, 
                pressure, current, warning1, warning2, panel_health, timestamp
            )
            
        except ValueError as e:
            logging.error(f"❌ Error parsing values: {e} - Data: {data}")
        except Exception as e:
            logging.error(f"❌ Error parsing sensor data: {e}")

    def save_to_database(self, sensor_number, temperature, humidity, gas_resistance, air_quality,
                        no2, co, tvoc, eco2, surface_temp_1, surface_temp_2,
                        pressure, current, warning1, warning2, panel_health, timestamp):
        try:
            cursor = self.db_connection.cursor()
            
            insert_query = """
            INSERT INTO fire_sensor_data 
            (sensor_number, temperature, humidity, gas_resistance, air_quality, no2, co, 
             tvoc, eco2, surface_temp_1, surface_temp_2, pressure, current, 
             warning1, warning2, panel_health, timestamp) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """
            
            values = (sensor_number, temperature, humidity, gas_resistance, air_quality,
                     no2, co, tvoc, eco2, surface_temp_1, surface_temp_2,
                     pressure, current, warning1, warning2, panel_health, timestamp)
            
            cursor.execute(insert_query, values)
            self.db_connection.commit()
            
            logging.info(f"✅ Data saved - Sensor #{sensor_number} | Temp: {temperature:.2f}°C | Hum: {humidity:.2f}% | Current: {current:.3f}A | Pressure: {pressure:.2f}atm | Health: {panel_health:.1f}%")
            
        except sqlite3.Error as err:
            logging.error(f"❌ Database insert error: {err}")
            self.reconnect_database()
        except Exception as e:
            logging.error(f"❌ Unexpected database error: {e}")

    def reconnect_database(self):
        try:
            if self.db_connection:
                self.db_connection.close()
            self.db_connection = sqlite3.connect(self.db_path, check_same_thread=False)
            logging.info("🔄 Database reconnected")
        except Exception as e:
            logging.error(f"❌ Database reconnection failed: {e}")

    def run(self):
        try:
            logging.info("🚀 MQTT to MySQL service started")
            while True:
                pass
        except KeyboardInterrupt:
            logging.info("🛑 Service stopped by user")
            self.cleanup()

    def cleanup(self):
        if self.mqtt_client:
            self.mqtt_client.loop_stop()
            self.mqtt_client.disconnect()
        if self.db_connection:
            self.db_connection.close()
        logging.info("🧹 Cleanup completed")

if __name__ == "__main__":
    mqtt_sqlite = MQTTtoSQLite()
    mqtt_sqlite.run()
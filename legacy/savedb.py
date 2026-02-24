import paho.mqtt.client as mqtt
import mysql.connector
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class MQTTtoMySQL:
    def __init__(self):
        self.mqtt_broker = "localhost"
        self.mqtt_port = 1883
        self.mqtt_topic = "aicofire"
        self.client_id = "aicofire_python_db"
        
        self.db_config = {
            'host': 'localhost',
            'user': 'root',
            'password': '123qwe',
            'database': 'aicofire',
            'autocommit': True
        }
        
        self.mqtt_client = mqtt.Client(client_id=self.client_id)
        self.mqtt_client.on_connect = self.on_connect
        self.mqtt_client.on_message = self.on_message
        self.db_connection = None
        self.mqtt_connected = False  # Bağlantı durumunu takip et
        
        self.setup_database()
        self.connect_mqtt()

    def setup_database(self):
        try:
            self.db_connection = mysql.connector.connect(**self.db_config)
            cursor = self.db_connection.cursor()
            
            create_table_query = """
            CREATE TABLE IF NOT EXISTS sensors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sicaklik FLOAT,
                nem FLOAT,
                hava_kalite FLOAT,
                gaz_rezistans FLOAT,
                yuzey_sicaklik FLOAT NULL,
                yuzey_sicaklik_2 FLOAT NULL,
                tvoc FLOAT,
                eco2 FLOAT,
                no2 FLOAT,
                co FLOAT,
                pressure FLOAT NULL,
                current FLOAT NULL,
                board_health FLOAT NULL,
                warning2 VARCHAR(8),
                warning1 VARCHAR(8),
                panel_health FLOAT NULL,
                time DATETIME
            )
            """
            
            cursor.execute(create_table_query)
            self.db_connection.commit()
            
            # Corrected ALTER TABLE queries to remove IF NOT EXISTS
            alter_queries = [
                "ALTER TABLE sensors ADD COLUMN yuzey_sicaklik_2 FLOAT NULL",
                "ALTER TABLE sensors ADD COLUMN pressure FLOAT NULL",
                "ALTER TABLE sensors ADD COLUMN current FLOAT NULL",
                "ALTER TABLE sensors ADD COLUMN board_health FLOAT NULL",
                "ALTER TABLE sensors ADD COLUMN warning2 VARCHAR(8) NULL",
                "ALTER TABLE sensors ADD COLUMN panel_health FLOAT NULL"
            ]

            for query in alter_queries:
                try:
                    cursor.execute(query)
                except mysql.connector.Error as err:
                    if err.errno == 1060:  # Duplicate column error
                        logging.warning(f"⚠️ Column already exists: {err}")
                    else:
                        logging.error(f"❌ SQL error: {err}")
            
            self.db_connection.commit()
            logging.info("✅ Database table created/updated successfully")
            
        except mysql.connector.Error as err:
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
            if not self.mqtt_connected:  # Sadece ilk bağlantıda mesaj göster
                logging.info("✅ MQTT connection successful")
                self.mqtt_connected = True
            client.subscribe(self.mqtt_topic)
            if not hasattr(self, 'subscribed') or not self.subscribed:
                logging.info(f"📡 Subscribed to topic: {self.mqtt_topic}")
                self.subscribed = True
        else:
            logging.error(f"❌ MQTT connection failed with code: {rc}")
            self.mqtt_connected = False

    def on_message(self, client, userdata, msg):
        try:
            payload = msg.payload.decode('utf-8')
            logging.info(f"📥 Received message: {payload}")
            self.parse_and_save_data(payload)
        except Exception as e:
            logging.error(f"❌ Error processing message: {e}")

    def parse_and_save_data(self, data):
        try:
            # Split the data by semicolon
            parts = data.split(';')

            # Enhanced debugging logs to capture the exact issue
            logging.debug(f"Raw message: {data}")
            logging.debug(f"Split parts: {parts}")

            # Strip whitespace from all parts
            parts = [part.strip() for part in parts]

            # Validate message structure
            # Enhanced debugging for invalid message format
            logging.debug(f"Message parts after split: {parts}")
            logging.debug(f"Message length: {len(parts)}")

            if parts[0] != 'A':
                logging.warning("⚠️ Message does not start with 'A'")
            if parts[-1] != 'B':
                logging.warning("⚠️ Message does not end with 'B'")
            if len(parts) != 17:
                logging.warning(f"⚠️ Expected 17 parts, but got {len(parts)}")
            
            # Ensure the message starts with 'A' and ends with 'B'
            if parts[0] != 'A' or parts[-1] != 'B':
                logging.warning("⚠️ Invalid message format")
                return

            # Map the data to corresponding fields
            sensor_data = {
                'sicaklik': float(parts[1]),
                'nem': float(parts[2]),
                'gaz_rezistans': float(parts[3]),
                'hava_kalite': float(parts[4]),
                'no2': float(parts[5]),
                'co': float(parts[6]),
                'tvoc': float(parts[7]),
                'eco2': float(parts[8]),
                'yuzey_sicaklik': float(parts[9]),
                'yuzey_sicaklik_2': float(parts[10]),
                'pressure': float(parts[11]),
                'current': float(parts[12]),
                'warning2': parts[13],
                'warning1': parts[14],
                'panel_health': float(parts[15]),
                'time': datetime.now()
            }

            # Convert warning1 and warning2 to binary strings
            sensor_data['warning1'] = format(int(parts[14]), '08b')
            sensor_data['warning2'] = format(int(parts[13]), '08b')

            # Insert the data into the database
            cursor = self.db_connection.cursor()
            insert_query = """
            INSERT INTO sensors (sicaklik, nem, gaz_rezistans, hava_kalite, no2, co, tvoc, eco2, yuzey_sicaklik, yuzey_sicaklik_2, pressure, current, warning2, warning1, panel_health, time)
            VALUES (%(sicaklik)s, %(nem)s, %(gaz_rezistans)s, %(hava_kalite)s, %(no2)s, %(co)s, %(tvoc)s, %(eco2)s, %(yuzey_sicaklik)s, %(yuzey_sicaklik_2)s, %(pressure)s, %(current)s, %(warning2)s, %(warning1)s, %(panel_health)s, %(time)s)
            """
            cursor.execute(insert_query, sensor_data)
            self.db_connection.commit()
            logging.info("✅ Data saved to database successfully")
        except Exception as e:
            logging.error(f"❌ Error parsing and saving data: {e}")

    def reconnect_database(self):
        try:
            if self.db_connection:
                self.db_connection.close()
            self.db_connection = mysql.connector.connect(**self.db_config)
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
        self.mqtt_connected = False
        self.subscribed = False
        logging.info("🧹 Cleanup completed")

if __name__ == "__main__":
    mqtt_mysql = MQTTtoMySQL()
    mqtt_mysql.run()
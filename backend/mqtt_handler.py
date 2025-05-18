# mqtt_handler.py

import os
import json
import time
import logging
from datetime import datetime
from threading import Thread
import paho.mqtt.client as mqtt
from dotenv import load_dotenv

load_dotenv()

MQTT_BROKER = os.getenv('MQTT_BROKER', 'broker.hivemq.com')
MQTT_PORT = int(os.getenv('MQTT_PORT', 1883))
MQTT_TOPICS = {
    'data': 'solar_medhaitam/data',
    'irradiation': 'solar_medhaitam/irradiation',
    'status': 'solar_medhaitam/status',
    'alerts': 'solar_medhaitam/alerts',
    'commands': 'solar_medhaitam/commands'
}

logger = logging.getLogger("SolarMonitor")

class MQTTHandler:
    def __init__(self, data_store, socketio):
        self.client = mqtt.Client()
        self.data_store = data_store
        self.socketio = socketio
        self.connected = False

        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.client.on_disconnect = self.on_disconnect

    def connect(self):
        try:
            logger.info(f"Connecting to MQTT Broker: {MQTT_BROKER}:{MQTT_PORT}")
            self.client.connect(MQTT_BROKER, MQTT_PORT, 60)
            Thread(target=self.client.loop_forever, daemon=True).start()
        except Exception as e:
            logger.error(f"MQTT connection failed: {str(e)}")
            time.sleep(5)
            self.connect()

    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            self.connected = True
            logger.info("✅ MQTT connected")
            for topic in MQTT_TOPICS.values():
                client.subscribe(topic)
                logger.info(f"📡 Subscribed to: {topic}")
        else:
            logger.error(f"❌ MQTT connection failed with code {rc}")

    def on_message(self, client, userdata, msg):
        try:
            payload = json.loads(msg.payload.decode())
            topic = msg.topic

            logger.debug(f"📥 MQTT [{topic}]: {payload}")
            print(f"📨 [DEBUG] {msg.topic} => {payload}")  # 👈 AJOUTE ÇA
            if topic == MQTT_TOPICS['data']:
                enriched = {
                    'timestamp': datetime.utcnow().isoformat(),
                    'source': 'cpp_publisher',
                    'panelRefVoltage': payload.get("panelRefVoltage"),
                    'panelRefCurrent': payload.get("panelRefCurrent"),
                    'panelRefPower': payload.get("panelRefPower"),
                    'panelRefEfficiency': payload.get("panelRefEfficiency"),
                    'panelRefTemp': payload.get("panelRefTemp") or payload.get("panleRefTemp"),  # typo fallback
                    'irradiation': payload.get("irradiation"),
                    'system_status': {
                        'frequency_ref': payload.get("frequency_ref"),
                        'output_freq': payload.get("output_freq"),
                        'output_power': payload.get("output_power"),
                        'dc_bus_voltage': payload.get("dc_bus_voltage")
                    }
                
                
                }
                print(f"📨 [DEBUG] {msg.topic} => {payload}")
                self.data_store.update('solar', enriched)
                self.socketio.emit('solar_data', enriched)

            elif topic == MQTT_TOPICS['irradiation']:
                self.data_store.update('irradiation', payload)
                self.socketio.emit('irradiation_update', payload)
                print(f"📨 [DEBUG] {msg.topic} => {payload}")
            elif topic == MQTT_TOPICS['status']:
                self.data_store.update('status', payload)
                self.socketio.emit('system_status', payload)
                print(f"📨 [DEBUG] {msg.topic} => {payload}")
            elif topic == MQTT_TOPICS['alerts']:
                self.data_store.update('alerts', payload)
                self.socketio.emit('system_alert', payload)
                logger.warning(f"⚠️ ALERT: {payload}")
                print(f"📨 [DEBUG] {msg.topic} => {payload}")
        except json.JSONDecodeError:
            logger.error(f"❌ Invalid JSON on topic {msg.topic}")
        except Exception as e:
            logger.error(f"❌ Error processing message: {str(e)}", exc_info=True)

    def on_disconnect(self, client, userdata, rc):
        self.connected = False
        if rc != 0:
            logger.warning("⚠️ Unexpected disconnection. Reconnecting...")
            time.sleep(5)
            self.connect()

    def publish(self, topic, payload):
        if self.connected:
            try:
                logger.info(f"📤 Publishing to {topic}: {payload}")
                self.client.publish(topic, json.dumps(payload))
                return True
            except Exception as e:
                logger.error(f"❌ Publish error: {str(e)}")
        return False
    
import paho.mqtt.client as mqtt
from flask_socketio import SocketIO
import json
import logging
from datetime import datetime

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MQTT Handler")

class MQTTHandler:
    def __init__(self, socketio: SocketIO):
        self.socketio = socketio
        self.client = mqtt.Client()
        self.connected = False
        self.latest_metrics = {}

        # Configuration MQTT
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.client.on_disconnect = self._on_disconnect

        # Topics configuration
        self.topics = {
            "solar/data": self._handle_solar_data,
            "solar/irradiation": self._handle_irradiation,
            "solar/status": self._handle_status,
            "solar/alerts": self._handle_alerts
        }

    def connect(self, broker="localhost", port=1883, keepalive=60):
        try:
            self.client.connect(broker, port, keepalive)
            self.client.loop_start()
            logger.info(f"Connecting to MQTT broker at {broker}:{port}")
        except Exception as e:
            logger.error(f"Connection failed: {str(e)}")

    def _on_connect(self, client, userdata, flags, rc):
        self.connected = True
        logger.info("✅ MQTT Connected")
        for topic in self.topics.keys():
            client.subscribe(topic)
            logger.info(f"📡 Subscribed to topic: {topic}")

    def _on_message(self, client, userdata, msg):
        try:
            handler = self.topics.get(msg.topic)
            if handler:
                payload = json.loads(msg.payload.decode())
                handler(payload)
            else:
                logger.warning(f"No handler for topic: {msg.topic}")
        except json.JSONDecodeError:
            logger.warning(f"⚠️ Invalid JSON received on topic {msg.topic}")
        except Exception as e:
            logger.error(f"❌ Error processing message on {msg.topic}: {str(e)}")

    def _on_disconnect(self, client, userdata, rc):
        self.connected = False
        logger.warning(f"🔌 MQTT Disconnected (rc: {rc})")

    def _handle_solar_data(self, data):
        """Process solar panel metrics"""
        processed = {
            "panelRefVoltage": data.get("panelRefVoltage"),
            "panelRefCurrent": data.get("panelRefCurrent"),
            "panelRefPower": data.get("panelRefPower"),
            "panleRefTemp": data.get("panleRefTemp"),
            "panelRefEfficiency": data.get("panelRefEfficiency"),
            "irradiation": data.get("irradiation"),
            "timestamp": data.get("timestamp"),
            "source": data.get("source"),
            "frequency_ref": data.get("frequency_ref"),
            "output_freq": data.get("output_freq"),
            "output_power": data.get("output_power"),
            "dc_bus_voltage": data.get("dc_bus_voltage"),
            "module_temp": data.get("module_temp"),
            "dc_current": data.get("dc_current"),
            "dc_power": data.get("dc_power"),
            "dc_efficiency": data.get("dc_efficiency"),
            "flow_speed": data.get("flow_speed"),
            "voc_voltage": data.get("voc_voltage"),
            "daily_flow": data.get("daily_flow"),
            "cumulative_flow_low": data.get("cumulative_flow_low"),
            "cumulative_flow_high": data.get("cumulative_flow_high"),
            "daily_gen_power": data.get("daily_gen_power"),
            "total_power_low": data.get("total_power_low"),
            "total_power_high": data.get("total_power_high"),

        }
        self.latest_metrics['solar_data'] = processed
        self.socketio.emit('solar_update', processed)
        logger.info(f"📤 Solar data: {processed}")

    def _handle_irradiation(self, data):
        """Process irradiation data"""
        processed = {
            'irradiation': float(data.get('value', 0)),
            'unit': 'W/m²',
            'timestamp': datetime.now().isoformat()
        }
        self.latest_metrics['irradiation'] = processed
        self.socketio.emit('irradiation_update', processed)
        logger.info(f"☀️ Irradiation: {processed}")

    def _handle_status(self, data):
        """Process system status"""
        data['timestamp'] = datetime.now().isoformat()
        self.latest_metrics['status'] = data
        self.socketio.emit('system_status', data)
        logger.info(f"🔄 Status: {data}")

    def _handle_alerts(self, data):
        """Process system alerts"""
        data['timestamp'] = datetime.now().isoformat()
        self.latest_metrics['alert'] = data
        self.socketio.emit('system_alert', data)
        logger.warning(f"🚨 ALERT: {data}")

    def publish(self, topic, payload):
        if self.connected:
            self.client.publish(topic, json.dumps(payload))
            return True
        return False

    def get_latest_metrics(self):
        """Return latest metrics for API access"""
        return self.latest_metrics

    def disconnect(self):
        self.client.loop_stop()
        self.client.disconnect()
        logger.info("🛑 MQTT Disconnected gracefully")

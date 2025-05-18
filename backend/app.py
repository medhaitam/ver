# app.py

from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from datetime import datetime
from threading import Lock
import logging

from mqtt_handler import MQTTHandler

# Initialize Flask
app = Flask(__name__)
CORS(app)

# SocketIO configuration
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Logging config
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger("SolarMonitor")

# Thread-safe data store
class DataStore:
    def __init__(self):
        self.lock = Lock()
        self.data = {
            'solar': None,
            'irradiation': None,
            'status': None,
            'alerts': [],
            'last_update': None
        }

    def update(self, key, value):
        with self.lock:
            if key == 'alerts':
                self.data['alerts'].append(value)
            else:
                self.data[key] = value
            self.data['last_update'] = datetime.utcnow().isoformat()

    def get_all(self):
        with self.lock:
            return self.data.copy()

# Create instances
data_store = DataStore()
mqtt_handler = MQTTHandler(data_store, socketio)
mqtt_handler.connect()

# SocketIO events
@socketio.on('connect')
def on_connect():
    logger.info(f"🔌 Client connected: {request.sid}")
    emit('connection_ack', {'status': 'connected', 'time': datetime.utcnow().isoformat()})
    emit('initial_data', data_store.get_all())

@socketio.on('disconnect')
def on_disconnect():
    logger.info(f"❌ Client disconnected: {request.sid}")

# REST API
@app.route('/api/data', methods=['GET'])
def get_data():
    return jsonify(data_store.get_all())

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'services': {
            'flask': 'running',
            'socketio': 'running',
            'mqtt': 'connected' if mqtt_handler.connected else 'disconnected'
        },
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/api/command', methods=['POST'])
def send_command():
    if not request.is_json:
        return jsonify({'error': 'Invalid JSON'}), 400

    command = request.get_json()
    if mqtt_handler.publish('solar_medhaitam/commands', command):
        return jsonify({'status': 'command_sent'})
    return jsonify({'error': 'MQTT not connected'}), 503

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=False, use_reloader=False, allow_unsafe_werkzeug=True)

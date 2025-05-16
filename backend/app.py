#!/usr/bin/env python3
from flask import Flask, jsonify
from flask_socketio import SocketIO
from mqtt_handler import MQTTHandler
from flask import request
from flask_socketio import emit
import threading
import logging
from datetime import datetime
import signal
import sys

# Configuration de l'application
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
socketio = SocketIO(app, 
                   cors_allowed_origins="*",
                   async_mode='threading',
                   logger=True,
                   engineio_logger=True)

# Configuration MQTT
MQTT_BROKER = "localhost"
MQTT_PORT = 1883
MQTT_TOPICS = [
    "solar/data",          # Données principales
    "solar/irradiation",   # Mesures d'irradiation
    "solar/alerts",        # Alertes système
    "solar/status"         # Status des équipements
]

# Initialisation du handler MQTT
mqtt_handler = MQTTHandler(socketio)

def create_app():
    """Factory pour la création de l'application"""
    configure_logging()
    register_blueprints()
    return app

def configure_logging():
    """Configuration du système de logs"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler('solar_backend.log')
        ]
    )

def register_blueprints():
    """Enregistrement des blueprints (pour extensions futures)"""
    pass

@socketio.on('connect')
def handle_connect():
    """Gestion des connexions Socket.IO"""
    logging.info(f"Client connected: {request.sid}")
    emit('connection_ack', {'status': 'connected', 'time': datetime.now().isoformat()})

@socketio.on('disconnect')
def handle_disconnect():
    """Gestion des déconnexions Socket.IO"""
    logging.info(f"Client disconnected: {request.sid}")

@app.route('/api/health')
def health_check():
    """Endpoint de santé de l'application"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'services': {
            'flask': 'running',
            'socketio': 'running',
            'mqtt': 'connected' if mqtt_handler.connected else 'disconnected'
        },
        'version': '1.0.0'
    })

@app.route('/api/metrics')
def get_metrics():
    """Endpoint pour récupérer les dernières métriques"""
    return jsonify(mqtt_handler.get_latest_metrics())

def start_mqtt_client():
    """Démarrage du client MQTT dans un thread séparé"""
    try:
        mqtt_handler.connect(broker=MQTT_BROKER, port=MQTT_PORT)
        for topic in MQTT_TOPICS:
            mqtt_handler.subscribe(topic)
    except Exception as e:
        logging.error(f"Failed to start MQTT client: {str(e)}")
        sys.exit(1)

def shutdown_handler(signum, frame):
    """Gestion propre de l'arrêt de l'application"""
    logging.info("Shutting down server...")
    mqtt_handler.disconnect()
    socketio.stop()
    sys.exit(0)

if __name__ == '__main__':
    # Gestion des signaux d'arrêt
    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)

    # Démarrage des services
    mqtt_thread = threading.Thread(target=start_mqtt_client, daemon=True)
    mqtt_thread.start()

    # Démarrer le serveur Socket.IO
    socketio.run(app, 
                host='0.0.0.0', 
                port=5000, 
                debug=False, 
                use_reloader=False,
                allow_unsafe_werkzeug=True)
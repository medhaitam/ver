import mqtt from 'mqtt';

const MQTT_BROKER = 'wss://test.mosquitto.org:8081'; // use your broker URL (WebSocket)
const TOPIC = 'solar/data'; // the topic where data is published

const options = {
  connectTimeout: 4000,
  clientId: 'solar_monitor_' + Math.random().toString(16).substr(2, 8),
  keepalive: 60,
  clean: true,
};

const client = mqtt.connect(MQTT_BROKER, options);

export { client, TOPIC };

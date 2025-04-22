// backend/server.js
const mqtt = require('mqtt');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const MQTT_BROKER = 'mqtt://localhost:1883';
const MQTT_TOPIC = 'solar/data';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

server.listen(3001, () => {
  console.log('🚀 Backend server running on http://localhost:3001');
});

// Connect to MQTT broker
const mqttClient = mqtt.connect(MQTT_BROKER);

mqttClient.on('connect', () => {
  console.log('✅ MQTT connected');
  mqttClient.subscribe(MQTT_TOPIC, (err) => {
    if (err) {
      console.error('❌ Subscription error:', err);
    } else {
      console.log(`📡 Subscribed to topic: ${MQTT_TOPIC}`);
    }
  });
});

// Handle incoming MQTT messages
mqttClient.on('message', (topic, message) => {
  const payload = message.toString();
  console.log(`📨 MQTT received: ${payload}`);
  try {
    const parsed = JSON.parse(payload);
    console.log('➡️ Emitting to frontend:', parsed);
    io.emit('mqtt-data', parsed);
  } catch (error) {
    console.error('❌ JSON parse error:', error);
  }
});

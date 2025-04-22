import React, { useEffect, useState } from 'react';
import { client, TOPIC } from '../mqttConfig';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function MqttDashboard() {
  const [data, setData] = useState([]);

  useEffect(() => {
    client.on('connect', () => {
      console.log('Connected to MQTT broker');
      client.subscribe(TOPIC);
    });

    client.on('message', (topic, message) => {
      if (topic === TOPIC) {
        const payload = JSON.parse(message.toString());
        setData(prev => [...prev.slice(-19), { ...payload, time: new Date().toLocaleTimeString() }]);
      }
    });

    return () => client.end(); // cleanup on unmount
  }, []);

  return (
    <div className="p-4">
      <h2>Live Solar Monitoring</h2>
      <LineChart width={600} height={300} data={data}>
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
        <Line type="monotone" dataKey="voltage" stroke="#8884d8" />
        <Line type="monotone" dataKey="current" stroke="#82ca9d" />
      </LineChart>
    </div>
  );
}

import paho.mqtt.client as mqtt
import json
import random
import time

client = mqtt.Client()
client.connect("localhost", 1883, 60)

while True:
    payload = {
        "voltage": random.randint(300, 400),
        "current": round(random.uniform(0, 10), 2)
    }
    client.publish("solar/data", json.dumps(payload))
    print("📤 Sent:", payload)
    time.sleep(3)

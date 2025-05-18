#include <iostream>
#include <chrono>
#include <thread>
#include <string>
#include <random>
#include <iomanip>
#include <fstream>
#include <nlohmann/json.hpp>
#include "mqtt/async_client.h"

using json = nlohmann::json;

// Configuration
const std::string SERVER_ADDRESS { "tcp://broker.hivemq.com:1883" };
const std::string CLIENT_ID { "solar_pub_" + std::to_string(std::time(nullptr)) };
const std::string DATA_TOPIC { "solar_medhaitam/data" };
const std::string IRRADIATION_TOPIC { "solar_medhaitam/irradiation" };
const std::string STATUS_TOPIC { "solar_medhaitam/status" };
const std::string ALERTS_TOPIC { "solar_medhaitam/alerts" };

const int QOS = 1;
const int PUBLISH_INTERVAL_SEC = 2;
const auto TIMEOUT = std::chrono::seconds(5);

class SolarCallback : public virtual mqtt::callback {
public:
    void connection_lost(const std::string& cause) override {
        std::cerr << "⚠️ Connection lost: " << cause << std::endl;
    }

    void delivery_complete(mqtt::delivery_token_ptr token) override {
        if (token && token->get_message()) {
            std::cout << "✔ Delivered message to: " 
                      << token->get_message()->get_topic()
                      << " [ID: " << token->get_message_id() << "]" << std::endl;
        }
    }

    void connected(const std::string& cause) override {
        std::cout << "✅ Successfully connected to broker" << std::endl;
    }
};

class SolarSensorSimulator {
private:
    std::random_device rd;
    std::mt19937 gen;
    std::uniform_real_distribution<> dis;

public:
    SolarSensorSimulator() : gen(rd()), dis(0.0, 1.0) {}

    double generate_value(double min, double max, int precision = 2) {
        double value = min + (max - min) * dis(gen);
        return std::round(value * std::pow(10, precision)) / std::pow(10, precision);
    }

    json create_solar_payload() {
        auto now = std::chrono::system_clock::now();
        auto timestamp = std::chrono::duration_cast<std::chrono::milliseconds>(
            now.time_since_epoch()).count();

        // Core solar metrics
        double panelRefVoltage = generate_value(300, 500);
        double panelRefCurrent = generate_value(5, 16);
        double panelRefPower = panelRefVoltage * panelRefCurrent;
        double panelRefTemp = generate_value(25, 41);
        double panelRefEfficiency = generate_value(15, 26);
        double irradiation = generate_value(500, 1000);

        return {
            {"panelRefVoltage", panelRefVoltage},
            {"panelRefCurrent", panelRefCurrent},
            {"panelRefPower", panelRefPower},
            {"panelRefTemp", panelRefTemp},
            {"panelRefEfficiency", panelRefEfficiency},
            {"irradiation", irradiation},
            {"timestamp", timestamp},
            {"source", "cpp_simulator"},
            
            // System metrics
            {"frequency_ref", generate_value(50, 70, 1)},
            {"output_freq", generate_value(50, 60, 1)},
            {"output_power", generate_value(50, 100)},
            {"dc_bus_voltage", static_cast<int>(generate_value(600, 800))},
            {"module_temp", generate_value(25, 36)},
            {"dc_current", generate_value(10, 21)},
            {"dc_power", generate_value(5, 20)},
            {"dc_efficiency", generate_value(90, 100)}
        };
    }

    json create_irradiation_payload() {
        return {
            {"value", generate_value(500, 1000)},
            {"unit", "W/m²"},
            {"timestamp", std::chrono::duration_cast<std::chrono::milliseconds>(
                std::chrono::system_clock::now().time_since_epoch()).count()}
        };
    }

    json create_status_payload() {
        return {
            {"status", "normal"},
            {"uptime", generate_value(0, 100)},
            {"timestamp", std::chrono::duration_cast<std::chrono::milliseconds>(
                std::chrono::system_clock::now().time_since_epoch()).count()}
        };
    }

    json create_alert_payload() {
        const std::string alerts[] = {"overheat", "low_voltage", "high_current"};
        return {
            {"type", alerts[rand() % 3]},
            {"severity", generate_value(1, 3)},
            {"message", "Check system immediately"},
            {"timestamp", std::chrono::duration_cast<std::chrono::milliseconds>(
                std::chrono::system_clock::now().time_since_epoch()).count()}
        };
    }
};

void publish_message(mqtt::async_client& client, const std::string& topic, const json& payload) {
    try {
        std::string payload_str = payload.dump();
        auto msg = mqtt::make_message(
            topic,
            payload_str.data(),
            payload_str.size(),
            QOS,
            false
        );
        client.publish(msg)->wait_for(TIMEOUT);
        std::cout << "📤 Published to " << topic << ": " << payload_str << std::endl;
    } catch (const mqtt::exception& e) {
        std::cerr << "⚠️ Publish failed to " << topic << ": " << e.what() << std::endl;
    }
}

int main() {
    std::cout << "🚀 Starting Solar Panel MQTT Publisher" << std::endl;
    std::cout << "🔌 Connecting to: " << SERVER_ADDRESS << std::endl;
    std::cout << "📡 Topics:" << std::endl;
    std::cout << "  - " << DATA_TOPIC << std::endl;
    std::cout << "  - " << IRRADIATION_TOPIC << std::endl;
    std::cout << "  - " << STATUS_TOPIC << std::endl;
    std::cout << "  - " << ALERTS_TOPIC << std::endl;

    try {
        // 1. Create MQTT client
        mqtt::async_client client(SERVER_ADDRESS, CLIENT_ID);
        SolarCallback cb;
        client.set_callback(cb);

        // 2. Configure connection options
        auto connOpts = mqtt::connect_options_builder()
            .keep_alive_interval(std::chrono::seconds(30))
            .clean_session(true)
            .automatic_reconnect(true)
            .finalize();

        // 3. Connect to broker
        std::cout << "⏳ Connecting to broker..." << std::endl;
        client.connect(connOpts)->wait();
        std::cout << "✅ Connected successfully!" << std::endl;

        SolarSensorSimulator simulator;
        int cycle_counter = 0;

        while (true) {
            cycle_counter++;
            
            // 4. Always publish solar data
            json solar_data = simulator.create_solar_payload();
            publish_message(client, DATA_TOPIC, solar_data);

            // 5. Publish irradiation every 3 cycles
            if (cycle_counter % 3 == 0) {
                json irr_data = simulator.create_irradiation_payload();
                publish_message(client, IRRADIATION_TOPIC, irr_data);
            }

            // 6. Publish status every 5 cycles
            if (cycle_counter % 5 == 0) {
                json status_data = simulator.create_status_payload();
                publish_message(client, STATUS_TOPIC, status_data);
            }

            // 7. Random alerts (10% chance)
            if ((rand() % 10) == 0) {
                json alert_data = simulator.create_alert_payload();
                publish_message(client, ALERTS_TOPIC, alert_data);
            }

            std::this_thread::sleep_for(std::chrono::seconds(PUBLISH_INTERVAL_SEC));
        }

    } catch (const mqtt::exception& e) {
        std::cerr << "❌ MQTT Error: " << e.what() << std::endl;
        return 1;
    } catch (const std::exception& e) {
        std::cerr << "❌ Fatal error: " << e.what() << std::endl;
        return 1;
    }

    return 0;
}
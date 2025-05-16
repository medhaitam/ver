#include <iostream>
#include <cstdlib>
#include <ctime>
#include <chrono>
#include <thread>
#include <string>
#include <cstring>
#include <random>
#include <iomanip>
#include "mqtt/async_client.h"

const std::string SERVER_ADDRESS { "tcp://localhost:1883" };
const std::string CLIENT_ID { "solar_publisher" };
const std::string TOPIC { "solar/data" };

const int QOS = 1;
const auto TIMEOUT = std::chrono::seconds(10);
const int PUBLISH_INTERVAL = 1; // seconds

class callback : public virtual mqtt::callback {
public:
    void connection_lost(const std::string& cause) override {
        std::cout << "Connection lost: " << cause << std::endl;
    }

    void delivery_complete(mqtt::delivery_token_ptr token) override {
        std::cout << "Delivery complete for token: " 
                  << (token ? token->get_message_id() : -1) << std::endl;
    }
};

int main() {
    // Initialize random number generation
    std::srand(std::time(nullptr));
    std::random_device rd;
    std::mt19937 gen(rd());

    // Create MQTT client
    mqtt::async_client client(SERVER_ADDRESS, CLIENT_ID);
    callback cb;
    client.set_callback(cb);

    // Connection options
    mqtt::connect_options connOpts;
    connOpts.set_keep_alive_interval(60);
    connOpts.set_clean_session(true);

    try {
        // Connect to the MQTT broker
        mqtt::token_ptr conntok = client.connect(connOpts);
        std::cout << "Connecting..." << std::endl;
        conntok->wait();
        std::cout << "Connected" << std::endl;

        // Main loop to publish data
        while (true) {
            // Get current timestamp
            auto now = std::chrono::system_clock::now();
            auto timestamp = std::chrono::duration_cast<std::chrono::milliseconds>(
                now.time_since_epoch()).count();

            // Generate random values for each parameter
            double panelRefVoltage = 300 + (rand() % 201);          // 300-500V
            double panelRefCurrent = 5 + (rand() % 11) + (rand() % 100) / 100.0; // 5.00-15.99A
            double panelRefPower = panelRefVoltage * panelRefCurrent; // Calculated
            double panleRefTemp = 25 + (rand() % 16) + (rand() % 100) / 100.0; // 25.00-40.99°C
            double panelRefEfficiency = 90 + (rand() % 11) + (rand() % 100) / 100.0; // 15.00-25.99%
            double irradiation = 500 + (rand() % 501) + (rand() % 100) / 100.0; // 500.00-1000.99 W/m²
            
            double frequency_ref = 50 + (rand() % 21) / 10.0;       // 50.0-70.0 Hz
            double output_freq = 50 + (rand() % 11) / 10.0;        // 50.0-60.0 Hz
            double output_power = 50 + (rand() % 51) + (rand() % 100) / 100.0; // 50.00-100.99 kW
            int dc_bus_voltage = 600 + (rand() % 201);             // 600-800 V
            double module_temp = 25 + (rand() % 11) + (rand() % 100) / 100.0; // 25.00-35.99°C
            double dc_current = 10 + (rand() % 11) + (rand() % 100) / 100.0; // 10.00-20.99 A
            double dc_power = dc_bus_voltage * dc_current / 1000.0; // Calculated in kW
            double dc_efficiency = 90 + (rand() % 11) + (rand() % 100) / 100.0; // 90.00-100.99%
            double flow_speed = 5 + (rand() % 11) + (rand() % 100) / 100.0; // 5.00-15.99 m³/h
            int voc_voltage = 700 + (rand() % 101);                // 700-800 V
            double daily_flow = 10 + (rand() % 91) + (rand() % 100) / 100.0; // 10.00-100.99 m³
            double cumulative_flow_low = 500 + (rand() % 501) + (rand() % 100) / 100.0; // 500.00-1000.99 m³
            double cumulative_flow_high = 0.2 + (rand() % 4) / 10.0; // 0.2-0.5 km³
            double daily_gen_power = 10 + (rand() % 21) + (rand() % 100) / 100.0; // 10.00-30.99 kWh
            double total_power_low = 100 + (rand() % 101) + (rand() % 100) / 100.0; // 100.00-200.99 kWh
            double total_power_high = 0.1 + (rand() % 10) / 10.0; // 0.1-1.0 MWh
        
            // Construction du JSON
            std::ostringstream payload;
            payload << std::fixed << std::setprecision(2);
            payload << "{"
                    << "\"panelRefVoltage\":" << panelRefVoltage << ","
                    << "\"panelRefCurrent\":" << panelRefCurrent << ","
                    << "\"panelRefPower\":" << panelRefPower << ","
                    << "\"panleRefTemp\":" << panleRefTemp << ","
                    << "\"panelRefEfficiency\":" << panelRefEfficiency << ","
                    << "\"irradiation\":" << irradiation << ","
                    << "\"timestamp\":" << timestamp << ","
                    << "\"source\":\"simulator\","
                    << "\"frequency_ref\":" << frequency_ref << ","
                    << "\"output_freq\":" << output_freq << ","
                    << "\"output_power\":" << output_power << ","
                    << "\"dc_bus_voltage\":" << dc_bus_voltage << ","
                    << "\"module_temp\":" << module_temp << ","
                    << "\"dc_current\":" << dc_current << ","
                    << "\"dc_power\":" << dc_power << ","
                    << "\"dc_efficiency\":" << dc_efficiency << ","
                    << "\"flow_speed\":" << flow_speed << ","
                    << "\"voc_voltage\":" << voc_voltage << ","
                    << "\"daily_flow\":" << daily_flow << ","
                    << "\"cumulative_flow_low\":" << cumulative_flow_low << ","
                    << "\"cumulative_flow_high\":" << cumulative_flow_high << ","
                    << "\"daily_gen_power\":" << daily_gen_power << ","
                    << "\"total_power_low\":" << total_power_low << ","
                    << "\"total_power_high\":" << total_power_high
                    << "}";
        
            // Envoi MQTT
            auto msg = mqtt::make_message(TOPIC, payload.str(), QOS, false);
            client.publish(msg)->wait_for(TIMEOUT);
        
            std::cout << "📤 Sent: " << payload.str() << std::endl;
        
            // Pause entre deux envois
            std::this_thread::sleep_for(std::chrono::seconds(PUBLISH_INTERVAL));
        }
        
        // Disconnect
        std::cout << "Disconnecting..." << std::endl;
        client.disconnect()->wait();
        std::cout << "Disconnected" << std::endl;
    }
    catch (const mqtt::exception& exc) {
        std::cerr << "Error: " << exc.what() << std::endl;
        return 1;
    }

    return 0;
}
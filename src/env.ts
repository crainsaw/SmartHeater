import { join as joinPath } from 'path'

/**
 * Storage settings
 */
const dataFolder = joinPath(__dirname, '..', '/storage/')
export const TRAIN_DATA_FILE = joinPath(dataFolder, '/trainData.json')
export const HISTORICAL_ENV_FILE = joinPath(dataFolder, '/envData.csv')
export const HISTORICAL_STATUS_FILE = joinPath(dataFolder, '/statusChangeData.csv')
export const SCHEDULE_DATA_FILE = joinPath(dataFolder, '/schedule.json')

/**
 * The number of neighbors to select for predicition
 */
export const NUM_NEAREST_NEIGHBORS = 5

/**
 * Shelly MQTT Topic
 */
export const SHELLY_MQTT = {
    mqttBrokerAddress: '192.168.0.5',
    commandTopic: 'shellies/shellyplug-s-F8D0BB/relay/0/command'
}

/**
 * Environment update interval
 */
export const UPDATE_INTERVAL_MINS = 5

/**
 * The difference to the target temperature before the heater is turned on again
 * Heating is enabled when: targetTemperature > currrentTemperature - HEATUP_THRESHOLD
 */
export const HEATUP_THRESHOLD = 0.3


/**
 * Webinterface port
 */
export const WEB_INTERFACE_PORT = 3000


/**
 * DHT22 Adafruit Library Settings
 */
export const DHT_SETTINGS = {
    path: '/home/pi/homecontrol/Adafruit_Python_DHT/examples/AdafruitDHT.py',
    a: 22,
    b: 4
}

/**
 * Settings for the 433mhz raspberryRemote library
 */
export const RASPBERRY_REMOTE_SETTINGS = {
    path: '/home/pi/homecontrol/raspberry-remote/send',
    systemCode: '01001',
    unitCode: 3,
} 
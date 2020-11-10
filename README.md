# Smart Heater
Smart heating system for electric heaters (e.g. the old ELV infrared heaters) which only accept the states on and off.

# Notice
The project is in an early stage and should not yet be used in production. In the current state it should more be seen as proof of concept to gather some training data to improve the algorithms.

# Project Description
The goal of this project is to enable smart heating with electric heaters which only provide two states: enabled or disabled. In order to allow energy efficiency while still providing maximum comfort the systems target is to enable the heater in the latest possible moment to reach the target temperature at the scheduled time. It achieves that by learning how long the specific heater needs to heat up the particular room. The systems allows to set schedules (e.g. heat up to 21 degrees Celsius between 6am and 8am and 6pm to 10pm am on workdays) but also to set the heater manually (e.g. heat up to 23 degrees for the next 3 hours).

The system setup consists of a controller (e.g. Raspberry Pi) which needs to have access to a sensor providing the rooms temperature. I am using the DHT22 but the system is plugabble so that you can use any source of temperature reading. It also needs to be able to switch the electric heater for which I am using the Shelly Plug S over MQTT. But again you can plug into the system whatever suits you best. The system provides a rudimentary web interface based on node.js and uses machine learning to provide the intelligent heating.


# Installation
Install docker. Then build the image and run it:
```bash
docker build . --tag crine/smart-heater

docker run --volume=/path/to/storageData:/heater/server/storage -p 3000:3000 --device /dev/gpiomem -d crine/smart-heater
```
The system as it is assumes you are using the Raspberry PI with the DHT 22 and the Shelly Plug S over MQTT. It will expose the web interface on port 3000.

# Project Structure
The project is split into three sub projects:
- The web interface (exposes control over a webinterface)
- The Heating Kernel (all the logic lives here)
- The environment (all interfaces to outside the Raspberry like temperature, humidity and power plugs)

# The schedule system
The rules which result into the current rooms target temperature are split into 4 levels with ascending priority:
1) The standard temperature (e.g. 19 degrees Celsius)
2) The standard schedule (e.g. 21 degrees Celsius between Monday and Friday between 7am and 10pm)
3) One time overrides for holidays (e.g. 17 degrees between 10th and 13th of October)
4) Manual Override (e.g. 23 degrees for the next 3 hours)

The system will always make sure that the temperature defined by the rule with the highest priority is reached at time specified by the respective rule.


# TODO's
- complete the documentation for how to setup and use this system
- create a documentation for development
- add linting and tests
- create env example file
- cleanup codebase

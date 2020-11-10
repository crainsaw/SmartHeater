FROM arm32v7/node

RUN sudo apt-get update \
    && sudo apt-get upgrade \
    && sudo apt-get install git-core \
    && mkdir -p /heater/server/storage \
    && cd /heater \
    && git clone git://git.drogon.net/wiringPi \
    && cd wiringPi \
    && ./build \
    && cd /heater \
    && git clone git://github.com/xkonni/raspberry-remote.git \
    && cd raspberry-remote/ \
    && make send \
    && sudo apt-get install build-essential python-dev python-openssl \
    && cd /heater/ \
    && git clone https://github.com/adafruit/Adafruit_Python_DHT.git \
    && cd Adafruit_Python_DHT \
    && sudo python setup.py install \
    && rm -rf /var/lib/apt/lists/*

ENV rapsberryRemoteBin /heater/raspberry-remote/send
ENV dhtBin /heater/Adafruit_Python_DHT/examples/AdafruitDHT.py
ENV heaterServerDir /heater/server

COPY dist ${heaterServerDir}/dist
COPY package.json ${heaterServerDir}/package.json
COPY static ${heaterServerDir}/static

RUN CD $heaterServerDir \
    && npm install --only=production

WORKDIR ${heaterServerDir}
CMD ["node", "dist/main.js"]


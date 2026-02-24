# AICO Fire Detection System

Premium 3D Dashboard for real-time fire detection and monitoring system.

## Project Structure

```
firesensor/
├── index.html              # Main dashboard entry point
├── mqtt.js                 # MQTT connection handler
├── requirements.txt        # Python dependencies
├── src/
│   ├── css/
│   │   └── dashboard.css   # Dashboard styles
│   └── js/
│       └── dashboard.js    # Dashboard logic
└── legacy/                 # Previous version files
    ├── aicofiresystem.*    # Old dashboard
    ├── db_config.php       # Database config
    ├── get_data.php        # Data API
    └── savedb.py           # Database saver
```

## Features

- Multi-device support (3 AICO panels)
- Real-time sensor monitoring
- Premium bezier curve charts
- 3D electrical panel visualization
- Energy flow visualization
- Glass-morphism UI design

## Sensors

| Sensor | Unit | Range |
|--------|------|-------|
| Temperature | °C | 0-80 |
| Humidity | % | 0-100 |
| CO | ppm | 0-100 |
| Gas Resistance | ohm | 0-1000 |
| Air Quality | AQI | 0-500 |
| NO2 | ppm | 0-5 |
| TVOC | ppb | 0-1000 |
| eCO2 | ppm | 400-5000 |
| Surface Temp | °C | 0-150 |
| Pressure | hPa | 900-1100 |
| Current | A | 0-100 |

## MQTT Protocol

### Byte Structure (56 bytes)

| Offset | Field | Type | Size |
|--------|-------|------|------|
| 0 | START | Marker | 1 |
| 1-4 | Temperature | float | 4 |
| 5-8 | Humidity | float | 4 |
| 9-12 | Gas Resistance | float | 4 |
| 13-16 | Air Quality | float | 4 |
| 17-20 | NO2 | float | 4 |
| 21-24 | CO | float | 4 |
| 25-28 | TVOC | float | 4 |
| 29-32 | eCO2 | float | 4 |
| 33-36 | Surface Temp 1 | float | 4 |
| 37-40 | Surface Temp 2 | float | 4 |
| 41-44 | Pressure | float | 4 |
| 45-48 | Current | float | 4 |
| 49 | Warning2 | byte | 1 |
| 50 | Warning1 | byte | 1 |
| 51-54 | Panel Health | float | 4 |
| 55 | END | Marker | 1 |

### Warning Bits

**Warning1:**
- Bit 0: Temperature
- Bit 1: Humidity
- Bit 2: Gas Resistance
- Bit 3: Air Quality
- Bit 4: NO2
- Bit 5: CO
- Bit 6: TVOC
- Bit 7: eCO2

**Warning2:**
- Bit 0: Surface Temp 1
- Bit 1: Surface Temp 2
- Bit 2: Pressure
- Bit 3: Current

## Usage

1. Open `index.html` in browser
2. Connect to MQTT broker
3. Monitor sensors in real-time

## License

Proprietary - AICO Systems

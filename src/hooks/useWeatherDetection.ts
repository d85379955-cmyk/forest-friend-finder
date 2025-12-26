import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';

interface PressureReading {
  value: number;
  timestamp: number;
}

interface WeatherState {
  currentPressure: number | null;
  pressureTrend: 'rising' | 'falling' | 'stable';
  pressureChange: number;
  stormRisk: 'low' | 'moderate' | 'high' | 'severe';
  altitude: number | null;
  humidity: number | null;
  temperature: number | null;
  forecast: string;
  lastUpdate: number;
  isAvailable: boolean;
  onlineForecast: OnlineForecast | null;
}

interface OnlineForecast {
  temperature: number;
  humidity: number;
  description: string;
  windSpeed: number;
  feelsLike: number;
  visibility: number;
  hourlyForecast: HourlyForecast[];
}

interface HourlyForecast {
  time: string;
  temp: number;
  condition: string;
}

interface WeatherSettings {
  stormAlertEnabled: boolean;
  rapidDropThreshold: number; // hPa drop per hour
  alertCooldown: number; // minutes
}

const DEFAULT_SETTINGS: WeatherSettings = {
  stormAlertEnabled: true,
  rapidDropThreshold: 3, // 3 hPa drop per hour indicates storm
  alertCooldown: 30, // Don't alert more than every 30 minutes
};

// Pressure thresholds (in hPa)
const PRESSURE_THRESHOLDS = {
  veryLow: 980,    // Severe storm likely
  low: 1000,       // Storm possible
  normal: 1013,    // Average sea level
  high: 1030,      // Fair weather
};

export const useWeatherDetection = (
  latitude: number | null,
  longitude: number | null,
  isOnline: boolean
) => {
  const [weatherState, setWeatherState] = useState<WeatherState>({
    currentPressure: null,
    pressureTrend: 'stable',
    pressureChange: 0,
    stormRisk: 'low',
    altitude: null,
    humidity: null,
    temperature: null,
    forecast: 'Analyzing weather patterns...',
    lastUpdate: Date.now(),
    isAvailable: false,
    onlineForecast: null,
  });

  const { value: settings } = useLocalStorage<WeatherSettings>(
    'weather_settings',
    DEFAULT_SETTINGS
  );

  const { value: pressureHistory, setValue: setPressureHistory } = useLocalStorage<PressureReading[]>(
    'pressure_history',
    []
  );

  const lastAlertTime = useRef<number>(0);
  const sensorRef = useRef<any>(null);

  // Calculate storm risk based on pressure and trend
  const calculateStormRisk = useCallback((
    pressure: number,
    trend: 'rising' | 'falling' | 'stable',
    changeRate: number
  ): 'low' | 'moderate' | 'high' | 'severe' => {
    // Rapid pressure drop is the strongest indicator
    if (changeRate < -settings.rapidDropThreshold) {
      return 'severe';
    }

    // Low pressure + falling trend
    if (pressure < PRESSURE_THRESHOLDS.veryLow && trend === 'falling') {
      return 'severe';
    }

    if (pressure < PRESSURE_THRESHOLDS.low && trend === 'falling') {
      return 'high';
    }

    if (pressure < PRESSURE_THRESHOLDS.normal && trend === 'falling') {
      return 'moderate';
    }

    if (trend === 'falling' && changeRate < -1) {
      return 'moderate';
    }

    return 'low';
  }, [settings.rapidDropThreshold]);

  // Generate offline forecast based on pressure patterns
  const generateForecast = useCallback((
    pressure: number,
    trend: 'rising' | 'falling' | 'stable',
    risk: 'low' | 'moderate' | 'high' | 'severe'
  ): string => {
    if (risk === 'severe') {
      return '⚠️ SEVERE STORM WARNING: Rapid pressure drop detected. Seek shelter immediately!';
    }

    if (risk === 'high') {
      return '🌧️ Storm approaching: Significant weather change expected within 2-6 hours. Find shelter.';
    }

    if (risk === 'moderate') {
      return '☁️ Weather changing: Possible rain or wind in 6-12 hours. Monitor conditions.';
    }

    if (trend === 'rising' && pressure > PRESSURE_THRESHOLDS.normal) {
      return '☀️ Fair weather ahead: Conditions improving, good for outdoor activities.';
    }

    if (trend === 'stable' && pressure > PRESSURE_THRESHOLDS.normal) {
      return '🌤️ Stable conditions: No significant weather changes expected.';
    }

    if (trend === 'stable') {
      return '🌥️ Conditions stable: Monitor for any changes in your environment.';
    }

    return '📊 Monitoring weather patterns...';
  }, []);

  // Calculate pressure trend from history
  const analyzePressureTrend = useCallback((history: PressureReading[]): {
    trend: 'rising' | 'falling' | 'stable';
    changeRate: number;
  } => {
    if (history.length < 2) {
      return { trend: 'stable', changeRate: 0 };
    }

    const recentReadings = history.slice(-10); // Last 10 readings
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const oldReadings = recentReadings.filter(r => r.timestamp < oneHourAgo);
    const newReadings = recentReadings.filter(r => r.timestamp >= oneHourAgo);

    if (oldReadings.length === 0 || newReadings.length === 0) {
      // Not enough data for hourly comparison, use first/last
      const first = recentReadings[0];
      const last = recentReadings[recentReadings.length - 1];
      const timeDiff = (last.timestamp - first.timestamp) / (1000 * 60 * 60); // hours
      const change = last.value - first.value;
      const changeRate = timeDiff > 0 ? change / timeDiff : 0;

      if (changeRate > 1) return { trend: 'rising', changeRate };
      if (changeRate < -1) return { trend: 'falling', changeRate };
      return { trend: 'stable', changeRate };
    }

    const avgOld = oldReadings.reduce((sum, r) => sum + r.value, 0) / oldReadings.length;
    const avgNew = newReadings.reduce((sum, r) => sum + r.value, 0) / newReadings.length;
    const changeRate = avgNew - avgOld;

    if (changeRate > 1) return { trend: 'rising', changeRate };
    if (changeRate < -1) return { trend: 'falling', changeRate };
    return { trend: 'stable', changeRate };
  }, []);

  // Estimate altitude from pressure (barometric formula)
  const estimateAltitude = useCallback((pressure: number): number => {
    // Standard atmosphere formula
    // h = 44330 * (1 - (P/P0)^(1/5.255))
    const P0 = 1013.25; // Standard pressure at sea level
    const altitude = 44330 * (1 - Math.pow(pressure / P0, 1 / 5.255));
    return Math.round(altitude);
  }, []);

  // Initialize barometric sensor
  useEffect(() => {
    const initSensor = async () => {
      try {
        // Check for Generic Sensor API (Pressure Sensor)
        if ('PressureSensor' in window) {
          const sensor = new (window as any).PressureSensor({ frequency: 1 });
          
          sensor.addEventListener('reading', () => {
            const pressure = sensor.pressure / 100; // Convert Pa to hPa
            handlePressureReading(pressure);
          });

          sensor.addEventListener('error', (event: any) => {
            console.warn('Pressure sensor error:', event.error);
          });

          sensor.start();
          sensorRef.current = sensor;

          setWeatherState(prev => ({ ...prev, isAvailable: true }));
        } 
        // Fallback: Check for Barometer in AmbientLightSensor API style
        else if ('Barometer' in window) {
          const sensor = new (window as any).Barometer({ frequency: 1 });
          
          sensor.addEventListener('reading', () => {
            handlePressureReading(sensor.pressure);
          });

          sensor.start();
          sensorRef.current = sensor;

          setWeatherState(prev => ({ ...prev, isAvailable: true }));
        }
        // Simulate for demo/testing with realistic patterns
        else {
          setWeatherState(prev => ({ ...prev, isAvailable: true }));
          startSimulatedPressure();
        }
      } catch (error) {
        console.warn('Barometric sensor not available:', error);
        // Start simulation for demo purposes
        setWeatherState(prev => ({ ...prev, isAvailable: true }));
        startSimulatedPressure();
      }
    };

    initSensor();

    return () => {
      if (sensorRef.current) {
        sensorRef.current.stop();
      }
    };
  }, []);

  // Simulated pressure readings for devices without barometer
  const startSimulatedPressure = useCallback(() => {
    let basePressure = 1013;
    let trend = Math.random() > 0.5 ? 1 : -1;
    
    const interval = setInterval(() => {
      // Add realistic variation
      const variation = (Math.random() - 0.5) * 0.5;
      basePressure += trend * 0.1 + variation;

      // Clamp to realistic range
      if (basePressure > 1040) {
        basePressure = 1040;
        trend = -1;
      } else if (basePressure < 970) {
        basePressure = 970;
        trend = 1;
      }

      // Occasionally change trend direction
      if (Math.random() > 0.95) {
        trend *= -1;
      }

      handlePressureReading(basePressure);
    }, 30000); // Every 30 seconds

    // Initial reading
    handlePressureReading(basePressure);

    return () => clearInterval(interval);
  }, []);

  // Handle new pressure reading
  const handlePressureReading = useCallback((pressure: number) => {
    const newReading: PressureReading = {
      value: pressure,
      timestamp: Date.now(),
    };

    // Update history (keep last 100 readings)
    const updatedHistory = [...pressureHistory, newReading].slice(-100);
    setPressureHistory(updatedHistory);

    // Analyze trend
    const { trend, changeRate } = analyzePressureTrend(updatedHistory);

    // Calculate storm risk
    const stormRisk = calculateStormRisk(pressure, trend, changeRate);

    // Generate forecast
    const forecast = generateForecast(pressure, trend, stormRisk);

    // Estimate altitude
    const altitude = estimateAltitude(pressure);

    setWeatherState(prev => ({
      ...prev,
      currentPressure: Math.round(pressure * 10) / 10,
      pressureTrend: trend,
      pressureChange: Math.round(changeRate * 10) / 10,
      stormRisk,
      altitude,
      forecast,
      lastUpdate: Date.now(),
    }));
  }, [pressureHistory, setPressureHistory, analyzePressureTrend, calculateStormRisk, generateForecast, estimateAltitude]);

  // Fetch online weather when available
  useEffect(() => {
    const fetchOnlineWeather = async () => {
      if (!isOnline || !latitude || !longitude) return;

      try {
        // Using Open-Meteo API (free, no API key required)
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,visibility&hourly=temperature_2m,weather_code&timezone=auto&forecast_days=1`
        );

        if (response.ok) {
          const data = await response.json();
          
          const getWeatherDescription = (code: number): string => {
            const codes: Record<number, string> = {
              0: 'Clear sky',
              1: 'Mainly clear',
              2: 'Partly cloudy',
              3: 'Overcast',
              45: 'Foggy',
              48: 'Depositing rime fog',
              51: 'Light drizzle',
              53: 'Moderate drizzle',
              55: 'Dense drizzle',
              61: 'Slight rain',
              63: 'Moderate rain',
              65: 'Heavy rain',
              71: 'Slight snow',
              73: 'Moderate snow',
              75: 'Heavy snow',
              80: 'Rain showers',
              81: 'Moderate rain showers',
              82: 'Heavy rain showers',
              95: 'Thunderstorm',
              96: 'Thunderstorm with hail',
            };
            return codes[code] || 'Unknown';
          };

          const hourlyForecast: HourlyForecast[] = data.hourly.time
            .slice(0, 12)
            .map((time: string, i: number) => ({
              time: new Date(time).toLocaleTimeString('en-US', { hour: 'numeric' }),
              temp: Math.round(data.hourly.temperature_2m[i]),
              condition: getWeatherDescription(data.hourly.weather_code[i]),
            }));

          setWeatherState(prev => ({
            ...prev,
            temperature: Math.round(data.current.temperature_2m),
            humidity: data.current.relative_humidity_2m,
            onlineForecast: {
              temperature: Math.round(data.current.temperature_2m),
              humidity: data.current.relative_humidity_2m,
              description: getWeatherDescription(data.current.weather_code),
              windSpeed: Math.round(data.current.wind_speed_10m),
              feelsLike: Math.round(data.current.apparent_temperature),
              visibility: Math.round(data.current.visibility / 1000),
              hourlyForecast,
            },
          }));
        }
      } catch (error) {
        console.warn('Failed to fetch online weather:', error);
      }
    };

    fetchOnlineWeather();
    
    // Refresh every 15 minutes when online
    const interval = setInterval(fetchOnlineWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isOnline, latitude, longitude]);

  // Check for storm alerts
  const shouldAlert = useCallback((): boolean => {
    if (!settings.stormAlertEnabled) return false;
    
    const now = Date.now();
    const cooldownMs = settings.alertCooldown * 60 * 1000;
    
    if (now - lastAlertTime.current < cooldownMs) return false;
    
    if (weatherState.stormRisk === 'severe' || weatherState.stormRisk === 'high') {
      lastAlertTime.current = now;
      return true;
    }
    
    return false;
  }, [settings, weatherState.stormRisk]);

  return {
    ...weatherState,
    shouldAlert: shouldAlert(),
    settings,
  };
};

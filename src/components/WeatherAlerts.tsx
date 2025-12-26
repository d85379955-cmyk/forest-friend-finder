import { useState, useEffect } from 'react';
import { Cloud, CloudRain, CloudLightning, Sun, Wind, Thermometer, Droplets, Eye, AlertTriangle, TrendingUp, TrendingDown, Minus, Mountain, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useWeatherDetection } from '@/hooks/useWeatherDetection';
import { cn } from '@/lib/utils';

interface WeatherAlertsProps {
  latitude: number | null;
  longitude: number | null;
  isOnline: boolean;
  onStormAlert?: () => void;
}

export const WeatherAlerts = ({ latitude, longitude, isOnline, onStormAlert }: WeatherAlertsProps) => {
  const weather = useWeatherDetection(latitude, longitude, isOnline);
  const [expanded, setExpanded] = useState(false);

  // Trigger alert callback
  useEffect(() => {
    if (weather.shouldAlert && onStormAlert) {
      onStormAlert();
    }
  }, [weather.shouldAlert, onStormAlert]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'severe': return 'text-destructive';
      case 'high': return 'text-warning';
      case 'moderate': return 'text-accent';
      default: return 'text-success';
    }
  };

  const getRiskBg = (risk: string) => {
    switch (risk) {
      case 'severe': return 'bg-destructive/20 border-destructive/50';
      case 'high': return 'bg-warning/20 border-warning/50';
      case 'moderate': return 'bg-accent/20 border-accent/50';
      default: return 'bg-success/20 border-success/50';
    }
  };

  const getTrendIcon = () => {
    switch (weather.pressureTrend) {
      case 'rising': return <TrendingUp className="w-4 h-4 text-success" />;
      case 'falling': return <TrendingDown className="w-4 h-4 text-destructive" />;
      default: return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getWeatherIcon = () => {
    if (weather.stormRisk === 'severe') return <CloudLightning className="w-8 h-8 text-destructive" />;
    if (weather.stormRisk === 'high') return <CloudRain className="w-8 h-8 text-warning" />;
    if (weather.pressureTrend === 'falling') return <Cloud className="w-8 h-8 text-muted-foreground" />;
    return <Sun className="w-8 h-8 text-accent" />;
  };

  return (
    <div className="space-y-4">
      {/* Storm Alert Banner */}
      {(weather.stormRisk === 'severe' || weather.stormRisk === 'high') && (
        <div className={cn(
          "rounded-xl border p-4 animate-pulse",
          getRiskBg(weather.stormRisk)
        )}>
          <div className="flex items-center gap-3">
            <AlertTriangle className={cn("w-6 h-6", getRiskColor(weather.stormRisk))} />
            <div>
              <p className={cn("font-display font-bold", getRiskColor(weather.stormRisk))}>
                {weather.stormRisk === 'severe' ? 'SEVERE STORM WARNING' : 'STORM APPROACHING'}
              </p>
              <p className="text-sm text-muted-foreground">
                Rapid pressure drop detected - seek shelter
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Weather Card */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3">
            {getWeatherIcon()}
            <div>
              <h3 className="font-display font-semibold text-foreground">Weather Alerts</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {isOnline ? (
                  <>
                    <Wifi className="w-3 h-3 text-success" />
                    Online forecast available
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-warning" />
                    Barometric detection active
                  </>
                )}
              </p>
            </div>
          </div>
          
          <div className={cn(
            "px-3 py-1 rounded-full text-xs font-semibold border",
            getRiskBg(weather.stormRisk),
            getRiskColor(weather.stormRisk)
          )}>
            {weather.stormRisk.toUpperCase()} RISK
          </div>
        </div>

        {/* Barometric Pressure Display */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-display font-bold text-foreground">
              {weather.currentPressure || '---'}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              hPa {getTrendIcon()}
            </div>
          </div>

          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-display font-bold text-foreground flex items-center justify-center gap-1">
              {weather.pressureChange > 0 ? '+' : ''}{weather.pressureChange}
            </div>
            <div className="text-xs text-muted-foreground">hPa/hr</div>
          </div>

          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-display font-bold text-foreground flex items-center justify-center gap-1">
              <Mountain className="w-4 h-4" />
              {weather.altitude || '---'}
            </div>
            <div className="text-xs text-muted-foreground">m altitude</div>
          </div>
        </div>

        {/* Forecast */}
        <div className="mt-4 p-3 bg-secondary/30 rounded-lg">
          <p className="text-sm text-foreground">{weather.forecast}</p>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
            {/* Online Forecast (when available) */}
            {weather.onlineForecast && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <RefreshCw className="w-3 h-3" />
                  Live weather data
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-secondary/50 rounded-lg p-2 text-center">
                    <Thermometer className="w-4 h-4 mx-auto text-accent" />
                    <div className="text-lg font-display font-bold text-foreground mt-1">
                      {weather.onlineForecast.temperature}°C
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Feels {weather.onlineForecast.feelsLike}°
                    </div>
                  </div>

                  <div className="bg-secondary/50 rounded-lg p-2 text-center">
                    <Droplets className="w-4 h-4 mx-auto text-primary" />
                    <div className="text-lg font-display font-bold text-foreground mt-1">
                      {weather.onlineForecast.humidity}%
                    </div>
                    <div className="text-xs text-muted-foreground">Humidity</div>
                  </div>

                  <div className="bg-secondary/50 rounded-lg p-2 text-center">
                    <Wind className="w-4 h-4 mx-auto text-muted-foreground" />
                    <div className="text-lg font-display font-bold text-foreground mt-1">
                      {weather.onlineForecast.windSpeed}
                    </div>
                    <div className="text-xs text-muted-foreground">km/h</div>
                  </div>

                  <div className="bg-secondary/50 rounded-lg p-2 text-center">
                    <Eye className="w-4 h-4 mx-auto text-success" />
                    <div className="text-lg font-display font-bold text-foreground mt-1">
                      {weather.onlineForecast.visibility}
                    </div>
                    <div className="text-xs text-muted-foreground">km</div>
                  </div>
                </div>

                <div className="p-2 bg-primary/10 rounded-lg text-center">
                  <p className="text-sm font-medium text-primary">
                    {weather.onlineForecast.description}
                  </p>
                </div>

                {/* Hourly Forecast */}
                <div className="overflow-x-auto">
                  <div className="flex gap-2 min-w-max pb-2">
                    {weather.onlineForecast.hourlyForecast.map((hour, i) => (
                      <div 
                        key={i}
                        className="bg-secondary/30 rounded-lg p-2 text-center min-w-[60px]"
                      >
                        <div className="text-xs text-muted-foreground">{hour.time}</div>
                        <div className="text-sm font-display font-bold text-foreground mt-1">
                          {hour.temp}°
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Offline Mode Info */}
            {!isOnline && (
              <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium text-warning mb-1">Offline Weather Detection</p>
                    <p>Using barometric pressure sensor to detect weather changes. 
                    A rapid pressure drop (3+ hPa/hour) indicates approaching storms.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Last Update */}
            <div className="text-xs text-muted-foreground text-center">
              Last updated: {new Date(weather.lastUpdate).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

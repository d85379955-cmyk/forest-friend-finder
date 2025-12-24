import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Compass, Crosshair, AlertTriangle, Map, X } from "lucide-react";
import { toast } from "sonner";

interface OfflineMapProps {
  latitude: number | null;
  longitude: number | null;
  heading: number | null;
  isOpen: boolean;
  onClose: () => void;
  sosActive?: boolean;
}

export const OfflineMap: React.FC<OfflineMapProps> = ({
  latitude,
  longitude,
  heading,
  isOpen,
  onClose,
  sosActive = false,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const { token, setToken, hasToken } = useMapboxToken();
  const [tokenInput, setTokenInput] = useState("");
  const [mapStyle, setMapStyle] = useState<"satellite" | "outdoors" | "dark">("outdoors");

  const styles = {
    satellite: "mapbox://styles/mapbox/satellite-streets-v12",
    outdoors: "mapbox://styles/mapbox/outdoors-v12",
    dark: "mapbox://styles/mapbox/dark-v11",
  };

  // Initialize map
  useEffect(() => {
    if (!isOpen || !hasToken || !mapContainer.current) return;

    mapboxgl.accessToken = token;

    const initialLng = longitude || 0;
    const initialLat = latitude || 0;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: styles[mapStyle],
        center: [initialLng, initialLat],
        zoom: latitude && longitude ? 15 : 2,
        pitch: 45,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        "top-right"
      );

      // Add geolocate control
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true,
          },
          trackUserLocation: true,
          showUserHeading: true,
        }),
        "top-right"
      );

      // Add scale control
      map.current.addControl(new mapboxgl.ScaleControl(), "bottom-right");

      // Create custom marker for current position
      if (latitude && longitude) {
        const el = document.createElement("div");
        el.className = "relative";
        el.innerHTML = `
          <div class="w-6 h-6 bg-safe rounded-full border-2 border-white shadow-lg flex items-center justify-center animate-pulse">
            <div class="w-2 h-2 bg-white rounded-full"></div>
          </div>
          ${sosActive ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-danger rounded-full animate-ping"></div>' : ''}
        `;

        marker.current = new mapboxgl.Marker(el)
          .setLngLat([longitude, latitude])
          .addTo(map.current);
      }
    } catch (error) {
      console.error("Map initialization error:", error);
      toast.error("Failed to initialize map");
    }

    return () => {
      marker.current?.remove();
      map.current?.remove();
    };
  }, [isOpen, hasToken, token, mapStyle]);

  // Update marker position when GPS changes
  useEffect(() => {
    if (map.current && marker.current && latitude && longitude) {
      marker.current.setLngLat([longitude, latitude]);
      map.current.flyTo({
        center: [longitude, latitude],
        essential: true,
      });
    }
  }, [latitude, longitude]);

  // Handle token save
  const handleSaveToken = () => {
    if (tokenInput.startsWith("pk.")) {
      setToken(tokenInput);
      toast.success("Mapbox token saved!");
    } else {
      toast.error("Invalid token. It should start with 'pk.'");
    }
  };

  // Center on current location
  const centerOnLocation = () => {
    if (map.current && latitude && longitude) {
      map.current.flyTo({
        center: [longitude, latitude],
        zoom: 16,
        essential: true,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-background/90 backdrop-blur-sm border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-safe" />
            <h2 className="text-lg font-bold text-foreground">Offline Map</h2>
            {sosActive && (
              <span className="bg-danger/20 text-danger text-xs px-2 py-0.5 rounded-full animate-pulse">
                SOS ACTIVE
              </span>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Map style switcher */}
        {hasToken && (
          <div className="flex gap-2 mt-3">
            {(["outdoors", "satellite", "dark"] as const).map((style) => (
              <Button
                key={style}
                variant={mapStyle === style ? "default" : "outline"}
                size="sm"
                onClick={() => setMapStyle(style)}
                className="capitalize text-xs"
              >
                {style}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Map or Token Input */}
      {hasToken ? (
        <>
          <div ref={mapContainer} className="w-full h-full" />

          {/* GPS Info Overlay */}
          <div className="absolute bottom-4 left-4 right-4 bg-card/90 backdrop-blur-sm rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-safe" />
                <span className="text-sm font-medium text-foreground">Current Location</span>
              </div>
              <Button variant="outline" size="sm" onClick={centerOnLocation}>
                <Crosshair className="w-4 h-4 mr-1" />
                Center
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Latitude</p>
                <p className="text-sm font-mono text-foreground">
                  {latitude?.toFixed(6) || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Longitude</p>
                <p className="text-sm font-mono text-foreground">
                  {longitude?.toFixed(6) || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Heading</p>
                <p className="text-sm font-mono text-foreground flex items-center justify-center gap-1">
                  <Compass className="w-3 h-3" />
                  {heading ? `${Math.round(heading)}°` : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Compass indicator */}
          {heading !== null && (
            <div
              className="absolute top-24 left-4 w-12 h-12 bg-card/90 backdrop-blur-sm rounded-full border border-border flex items-center justify-center"
              style={{ transform: `rotate(${-heading}deg)` }}
            >
              <Navigation className="w-6 h-6 text-safe" />
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full p-6 pt-24">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-warning" />
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">Mapbox Token Required</h3>
              <p className="text-muted-foreground text-sm">
                To use offline maps, you need a free Mapbox public token. 
                Get one at{" "}
                <a
                  href="https://mapbox.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-safe underline"
                >
                  mapbox.com
                </a>
              </p>
            </div>

            <div className="space-y-3">
              <Input
                placeholder="pk.eyJ1Ijoi... (your public token)"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="font-mono text-sm"
              />
              <Button onClick={handleSaveToken} className="w-full">
                Save Token
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Your token is stored locally on this device only.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

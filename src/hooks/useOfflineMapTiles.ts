import { useState, useCallback, useEffect } from "react";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";
import { useLocalStorage } from "./useLocalStorage";

interface TileInfo {
  x: number;
  y: number;
  z: number;
  url: string;
  cachedAt: number;
}

interface CacheStatus {
  totalTiles: number;
  cachedTiles: number;
  isDownloading: boolean;
  progress: number;
  error: string | null;
  lastSync: number | null;
}

const TILE_SERVER = "https://tile.openstreetmap.org";
const CACHE_DIR = "map_tiles";
const MAX_CACHE_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Convert lat/lng to tile coordinates
const latLngToTile = (lat: number, lng: number, zoom: number) => {
  const x = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
  const y = Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
      Math.pow(2, zoom)
  );
  return { x, y, z: zoom };
};

// Get tile URL
const getTileUrl = (x: number, y: number, z: number) => {
  return `${TILE_SERVER}/${z}/${x}/${y}.png`;
};

// Generate tiles for an area
const generateTilesForArea = (
  centerLat: number,
  centerLng: number,
  radiusKm: number,
  minZoom: number,
  maxZoom: number
): TileInfo[] => {
  const tiles: TileInfo[] = [];
  
  for (let z = minZoom; z <= maxZoom; z++) {
    // Calculate approximate tile coverage based on radius
    const tilesPerKm = Math.pow(2, z) / 40075; // Earth's circumference in km
    const tileRadius = Math.ceil(radiusKm * tilesPerKm);
    
    const centerTile = latLngToTile(centerLat, centerLng, z);
    
    for (let dx = -tileRadius; dx <= tileRadius; dx++) {
      for (let dy = -tileRadius; dy <= tileRadius; dy++) {
        const x = centerTile.x + dx;
        const y = centerTile.y + dy;
        
        // Validate tile coordinates
        const maxTile = Math.pow(2, z) - 1;
        if (x >= 0 && x <= maxTile && y >= 0 && y <= maxTile) {
          tiles.push({
            x,
            y,
            z,
            url: getTileUrl(x, y, z),
            cachedAt: 0,
          });
        }
      }
    }
  }
  
  return tiles;
};

export const useOfflineMapTiles = () => {
  const isNative = Capacitor.isNativePlatform();
  
  const { value: cachedTileIndex, setValue: setCachedTileIndex } = useLocalStorage<TileInfo[]>(
    "cached_tile_index",
    []
  );
  
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({
    totalTiles: 0,
    cachedTiles: cachedTileIndex.length,
    isDownloading: false,
    progress: 0,
    error: null,
    lastSync: null,
  });

  // Initialize cache directory
  const initCacheDir = useCallback(async () => {
    if (!isNative) return;
    
    try {
      await Filesystem.mkdir({
        path: CACHE_DIR,
        directory: Directory.Cache,
        recursive: true,
      });
    } catch (e) {
      // Directory might already exist
    }
  }, [isNative]);

  useEffect(() => {
    initCacheDir();
  }, [initCacheDir]);

  // Get tile file path
  const getTilePath = (x: number, y: number, z: number) => {
    return `${CACHE_DIR}/${z}_${x}_${y}.png`;
  };

  // Check if tile is cached
  const isTileCached = useCallback(
    (x: number, y: number, z: number) => {
      const tile = cachedTileIndex.find(
        (t) => t.x === x && t.y === y && t.z === z
      );
      if (!tile) return false;
      
      // Check if cache is still valid
      return Date.now() - tile.cachedAt < MAX_CACHE_AGE_MS;
    },
    [cachedTileIndex]
  );

  // Download and cache a single tile
  const cacheTile = useCallback(
    async (x: number, y: number, z: number): Promise<boolean> => {
      if (!isNative) return false;
      
      try {
        const url = getTileUrl(x, y, z);
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch tile: ${response.status}`);
        }
        
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]); // Remove data:image/png;base64, prefix
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        
        await Filesystem.writeFile({
          path: getTilePath(x, y, z),
          data: base64,
          directory: Directory.Cache,
        });
        
        return true;
      } catch (error) {
        console.error(`Failed to cache tile ${z}/${x}/${y}:`, error);
        return false;
      }
    },
    [isNative]
  );

  // Get cached tile as base64 data URL
  const getCachedTile = useCallback(
    async (x: number, y: number, z: number): Promise<string | null> => {
      if (!isNative) return null;
      
      try {
        const result = await Filesystem.readFile({
          path: getTilePath(x, y, z),
          directory: Directory.Cache,
        });
        
        return `data:image/png;base64,${result.data}`;
      } catch (error) {
        return null;
      }
    },
    [isNative]
  );

  // Download tiles for an area
  const downloadAreaTiles = useCallback(
    async (
      latitude: number,
      longitude: number,
      radiusKm: number = 5,
      minZoom: number = 10,
      maxZoom: number = 15
    ) => {
      if (!isNative) {
        setCacheStatus((prev) => ({
          ...prev,
          error: "Tile caching requires native platform",
        }));
        return;
      }
      
      const tiles = generateTilesForArea(latitude, longitude, radiusKm, minZoom, maxZoom);
      
      setCacheStatus((prev) => ({
        ...prev,
        totalTiles: tiles.length,
        isDownloading: true,
        progress: 0,
        error: null,
      }));
      
      let successCount = 0;
      const newCachedTiles: TileInfo[] = [...cachedTileIndex];
      
      for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        
        // Skip if already cached and valid
        if (isTileCached(tile.x, tile.y, tile.z)) {
          successCount++;
          continue;
        }
        
        const success = await cacheTile(tile.x, tile.y, tile.z);
        
        if (success) {
          successCount++;
          
          // Update index
          const existingIndex = newCachedTiles.findIndex(
            (t) => t.x === tile.x && t.y === tile.y && t.z === tile.z
          );
          
          const cachedTile = { ...tile, cachedAt: Date.now() };
          
          if (existingIndex >= 0) {
            newCachedTiles[existingIndex] = cachedTile;
          } else {
            newCachedTiles.push(cachedTile);
          }
        }
        
        // Update progress
        setCacheStatus((prev) => ({
          ...prev,
          cachedTiles: successCount,
          progress: ((i + 1) / tiles.length) * 100,
        }));
        
        // Small delay to prevent overwhelming the server
        if (i % 10 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
      
      setCachedTileIndex(newCachedTiles);
      
      setCacheStatus((prev) => ({
        ...prev,
        isDownloading: false,
        cachedTiles: successCount,
        lastSync: Date.now(),
      }));
    },
    [isNative, cachedTileIndex, setCachedTileIndex, isTileCached, cacheTile]
  );

  // Clear all cached tiles
  const clearCache = useCallback(async () => {
    if (!isNative) return;
    
    try {
      await Filesystem.rmdir({
        path: CACHE_DIR,
        directory: Directory.Cache,
        recursive: true,
      });
      
      await initCacheDir();
      setCachedTileIndex([]);
      
      setCacheStatus((prev) => ({
        ...prev,
        cachedTiles: 0,
        lastSync: null,
      }));
    } catch (error) {
      console.error("Failed to clear cache:", error);
    }
  }, [isNative, initCacheDir, setCachedTileIndex]);

  // Get cache size in MB
  const getCacheSize = useCallback(async (): Promise<number> => {
    if (!isNative) return 0;
    
    try {
      const result = await Filesystem.readdir({
        path: CACHE_DIR,
        directory: Directory.Cache,
      });
      
      let totalSize = 0;
      for (const file of result.files) {
        if (file.size) {
          totalSize += file.size;
        }
      }
      
      return totalSize / (1024 * 1024); // Convert to MB
    } catch (error) {
      return 0;
    }
  }, [isNative]);

  return {
    cacheStatus,
    downloadAreaTiles,
    getCachedTile,
    isTileCached,
    clearCache,
    getCacheSize,
    isNative,
  };
};

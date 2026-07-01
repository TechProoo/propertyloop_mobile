// Native map (iOS/Android) built on OpenStreetMap via Leaflet inside a WebView.
//
// We deliberately avoid `react-native-maps` here: on Android its default
// provider is Google Maps, which requires a billed Google Cloud API key and
// hard-crashes the Explore tab when the key is absent. OpenStreetMap needs no
// key, no billing, and no Google account — so the map "just works" for free.
//
// The web build still resolves PropertyMap.web.tsx instead of this file.
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import type { Listing } from "@/api/types";

export type MapLayer = "standard" | "satellite";
export type PropertyMapHandle = { recenter: () => void };

// Default map viewport — Lekki Phase 1 / Lagos. Listings don't yet carry
// geocoordinates from the backend, so markers are spread deterministically
// around this region (stable per index). Swap to real lat/long once the
// listings API returns them.
const DEFAULT_REGION = { latitude: 6.454, longitude: 3.473, zoom: 14 };

function spreadCoord(i: number) {
  const angle = i * 2.39996323; // golden angle — even, non-overlapping spiral
  const radius = 0.0016 + (i % 5) * 0.0014;
  return {
    latitude: DEFAULT_REGION.latitude + radius * Math.cos(angle),
    longitude: DEFAULT_REGION.longitude + radius * Math.sin(angle),
  };
}

type Props = {
  items: Listing[];
  mapType: MapLayer;
  selectedPin: string | null;
  onSelectPin: (id: string) => void;
};

type MarkerDatum = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

// The Leaflet page. Self-contained: sets up the map + tile layers and exposes
// renderMarkers / setSelected / setTile / recenter for the RN side to drive via
// injectJavaScript. Marker taps + a one-time "ready" signal come back over
// postMessage.
const HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; background: #e8e4dc; }
  .leaflet-control-attribution { font-size: 9px; opacity: 0.7; }
  .pl-marker { width: 0; height: 0; }
  .pl-pin {
    position: absolute;
    transform: translate(-50%, -50%);
    white-space: nowrap;
    background: #ffffff;
    color: #1a2120;
    font-family: -apple-system, Roboto, "Segoe UI", sans-serif;
    font-weight: 700;
    font-size: 12px;
    padding: 6px 11px;
    border-radius: 100px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.16);
    border: 1px solid rgba(0,0,0,0.04);
  }
  .pl-pin.on { background: #1a2120; color: #ffffff; font-size: 13px; padding: 8px 12px; }
  /* Clustered pins: a branded circle showing how many listings are stacked. */
  .pl-cluster { width: 0; height: 0; }
  .pl-cluster-badge {
    position: absolute;
    transform: translate(-50%, -50%);
    min-width: 36px;
    height: 36px;
    padding: 0 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    background: #1f6f43;
    color: #ffffff;
    font-family: -apple-system, Roboto, "Segoe UI", sans-serif;
    font-weight: 700;
    font-size: 14px;
    border-radius: 100px;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.22);
  }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var D = { lat: ${DEFAULT_REGION.latitude}, lng: ${DEFAULT_REGION.longitude}, zoom: ${DEFAULT_REGION.zoom} };
  var map = L.map('map', { zoomControl: false, attributionControl: true }).setView([D.lat, D.lng], D.zoom);
  var tiles = {
    standard: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }),
    satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: '&copy; Esri' })
  };
  var current = tiles.standard.addTo(map);
  var markers = {};
  var selected = null;

  // Group nearby pins into a single count badge; they split apart as you zoom
  // in, and fan out (spiderfy) when fully zoomed and still overlapping.
  var clusters = L.markerClusterGroup({
    maxClusterRadius: 55,
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: true,
    zoomToBoundsOnClick: true,
    iconCreateFunction: function (cluster) {
      return L.divIcon({
        className: 'pl-cluster',
        iconSize: [0, 0],
        html: '<div class="pl-cluster-badge">' + cluster.getChildCount() + '</div>'
      });
    }
  }).addTo(map);

  function post(o) { if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(o)); }
  function pin(label, on) {
    return L.divIcon({ className: 'pl-marker', iconSize: [0, 0], html: '<div class="pl-pin' + (on ? ' on' : '') + '">' + label + '</div>' });
  }
  function renderMarkers(items, sel) {
    selected = sel;
    clusters.clearLayers();
    markers = {};
    items.forEach(function (it) {
      var m = L.marker([it.latitude, it.longitude], { icon: pin(it.label, it.id === selected) });
      m._label = it.label;
      m.on('click', function () { post({ type: 'select', id: it.id }); });
      markers[it.id] = m;
    });
    clusters.addLayers(Object.keys(markers).map(function (id) { return markers[id]; }));
  }
  function setSelected(sel) {
    selected = sel;
    Object.keys(markers).forEach(function (id) { markers[id].setIcon(pin(markers[id]._label, id === sel)); });
    // Reveal the chosen pin if it's hidden inside a cluster.
    if (sel && markers[sel]) clusters.zoomToShowLayer(markers[sel], function () {});
  }
  function setTile(type) { map.removeLayer(current); current = (tiles[type] || tiles.standard).addTo(map); }
  function recenter() { map.setView([D.lat, D.lng], D.zoom, { animate: true }); }

  post({ type: 'ready' });
</script>
</body>
</html>`;

export const PropertyMap = forwardRef<PropertyMapHandle, Props>(
  function PropertyMap({ items, mapType, selectedPin, onSelectPin }, ref) {
    const webRef = useRef<WebView>(null);
    const [ready, setReady] = useState(false);

    useImperativeHandle(ref, () => ({
      recenter: () => {
        webRef.current?.injectJavaScript("recenter(); true;");
      },
    }));

    const markerData = useMemo<MarkerDatum[]>(
      () =>
        items.map((listing, i) => ({
          id: listing.id,
          label: listing.priceLabel,
          ...spreadCoord(i),
        })),
      [items],
    );

    // (Re)draw markers once the page is ready and whenever the listing set
    // changes. Pushing the current selection alongside avoids a flicker between
    // render and the setSelected effect below.
    useEffect(() => {
      if (!ready) return;
      webRef.current?.injectJavaScript(
        `renderMarkers(${JSON.stringify(markerData)}, ${JSON.stringify(selectedPin)}); true;`,
      );
      // selectedPin intentionally omitted — its own effect handles highlight
      // changes without a full marker rebuild.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, markerData]);

    useEffect(() => {
      if (!ready) return;
      webRef.current?.injectJavaScript(
        `setSelected(${JSON.stringify(selectedPin)}); true;`,
      );
    }, [ready, selectedPin]);

    useEffect(() => {
      if (!ready) return;
      webRef.current?.injectJavaScript(`setTile(${JSON.stringify(mapType)}); true;`);
    }, [ready, mapType]);

    const onMessage = (e: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(e.nativeEvent.data) as {
          type?: string;
          id?: string;
        };
        if (msg.type === "ready") setReady(true);
        else if (msg.type === "select" && msg.id) onSelectPin(msg.id);
      } catch {
        /* ignore malformed bridge messages */
      }
    };

    return (
      <WebView
        ref={webRef}
        style={{ flex: 1, backgroundColor: "#e8e4dc" }}
        source={{ html: HTML }}
        originWhitelist={["*"]}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        androidLayerType="hardware"
        overScrollMode="never"
        // Map tiles + Leaflet load from CDN; the app already requires network.
        cacheEnabled
      />
    );
  },
);

mapboxgl.accessToken = 'pk.eyJ1IjoibGFzY29uY29yZSIsImEiOiJjbWE1cHZncHgwanZiMmpxdXFzdjY3aTN2In0.KHIXaS5McVLHm4PqB2nkkA';

const map = new mapboxgl.Map({
  container: 'map', // ID of the map container
  style: 'mapbox://styles/lasconcore/cmamqp05s01hl01s3dmc68id6',
  center: [-4.2818, 55.8687], // Center at Glasgow
  zoom: 13 // Initial zoom level
});

// Add geolocate control to the map.
map.addControl(
  new mapboxgl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
    showUserHeading: true
  })
);

// Hamburger menu toggle functionality
const menuToggle = document.getElementById('menu-toggle');
const menu = document.getElementById('menu');

menuToggle.addEventListener('click', () => {
  menu.classList.toggle('open');
  menuToggle.classList.toggle('open');
});

const aboutLink = document.querySelector('a[href="#about"]');
const aboutText = document.querySelector('.about-text');

aboutLink.addEventListener('click', (e) => {
  e.preventDefault();
  aboutText.classList.toggle('visible');
});

const contactLink = document.querySelector('a[href="#contact"]');
const contactText = document.querySelector('.contact-text');

contactLink.addEventListener('click', (e) => {
  e.preventDefault();
  contactText.classList.toggle('visible');
});

const mapLink = document.querySelector('a[href="#map"]');
const mapText = document.querySelector('.map-text');

mapLink.addEventListener('click', (e) => {
  e.preventDefault();
  mapText.classList.toggle('visible');
});

// --- Basemap toggle ---
const basemapToggle = document.createElement('div');
basemapToggle.className = 'basemap-toggle';
basemapToggle.innerHTML = '<img src="images/satellite_preview.jpg" alt="Satellite Preview">';
document.body.appendChild(basemapToggle);

let isSatellite = false;

basemapToggle.addEventListener('click', () => {
  if (isSatellite) {
    map.setStyle('mapbox://styles/lasconcore/cmamqp05s01hl01s3dmc68id6');
    basemapToggle.innerHTML = '<img src="images/satellite_preview.jpg" alt="Satellite Preview">';
  } else {
    map.setStyle('mapbox://styles/lasconcore/cmaehk5c800s501skh2up8xkp');
    basemapToggle.innerHTML = '<img src="images/streets_preview.jpg" alt="Streets Preview">';
  }
  isSatellite = !isSatellite;
});

// --- Compass reset ---
const compassReset = document.createElement('div');
compassReset.className = 'compass-reset';
compassReset.innerHTML = '<img src="images/compass_icon.png" alt="Compass">';
document.body.appendChild(compassReset);

compassReset.style.opacity = '0';
compassReset.style.pointerEvents = 'none';

map.on('rotate', () => {
  const bearing = map.getBearing();
  compassReset.style.transform = `rotate(${bearing}deg)`;

  if (Math.abs(bearing) > 0.1) {
    compassReset.style.opacity = '1';
    compassReset.style.pointerEvents = 'auto';
  } else {
    compassReset.style.opacity = '0';
    compassReset.style.pointerEvents = 'none';
  }
});

compassReset.addEventListener('click', () => {
  map.easeTo({ bearing: 0 });
});

// =========================
// FILTERING: Hardened version
// =========================
const AREA_SOURCE_LAYER_PATTERN = /SRK_Area/i;
const POINT_SOURCE_LAYER_PATTERN = /SRK_Points/i;

function getTargetLayerIds() {
  const layers = (map.getStyle() && map.getStyle().layers) || [];
  const targetIds = [];
  for (const lyr of layers) {
    if (!lyr || !lyr['source-layer']) continue;
    const sl = lyr['source-layer'];
    const type = lyr.type;
    const matchesSource =
      AREA_SOURCE_LAYER_PATTERN.test(sl) ||
      POINT_SOURCE_LAYER_PATTERN.test(sl);
    const plausibleType =
      type === 'circle' || type === 'symbol' || type === 'fill' || type === 'line';
    if (matchesSource && plausibleType) targetIds.push(lyr.id);
  }
  return targetIds;
}

// Substring-match filter for resilience to whitespace/case issues
function makeFilterExpr(activeFilters) {
  const needles = activeFilters.map(s => String(s).toLowerCase());
  const haystack = ['downcase', ['coalesce', ['get', 'AcesBLvl'], '']];
  const anyNeedleFound = ['any', ...needles.map(n => ['>=', ['index-of', n, haystack], 0])];
  return anyNeedleFound;
}

function applyFiltersToAllTargetLayers(activeFilters) {
  const filterExpr = makeFilterExpr(activeFilters);
  const layerIds = getTargetLayerIds();
  layerIds.forEach(id => {
    try {
      map.setFilter(id, filterExpr);
    } catch (e) {}
  });
  logFilteredLayers('apply');
}

function logFilteredLayers(context = 'initial') {
  const ids = getTargetLayerIds();
  console.log(`[SRK] (${context}) filtering ${ids.length} layers:`, ids);
}

// Debug: click to inspect features under cursor
map.on('click', (e) => {
  const feats = map.queryRenderedFeatures(e.point);
  if (!feats || !feats.length) return;
  const rows = feats.map(f => ({
    layer: f.layer && f.layer.id,
    sourceLayer: f.layer && f.layer['source-layer'],
    type: f.layer && f.layer.type,
    AcesBLvl: f.properties && f.properties.AcesBLvl,
  }));
  console.table(rows);
});

// =========================
// Filter toggle UI wiring
// =========================
document.addEventListener('DOMContentLoaded', function() {
  const filterToggle = document.getElementById('filter-toggle');
  const filterBox = document.getElementById('filter-box');
  const filterClose = document.querySelector('.filter-close');
  const filterButtons = document.querySelectorAll('.filter-btn');

  function currentActiveFilters() {
    const active = [];
    filterButtons.forEach(btn => {
      if (btn.classList.contains('active')) {
        active.push(btn.getAttribute('data-filter'));
      }
    });
    return active;
  }

  function updateMapFilters() {
    applyFiltersToAllTargetLayers(currentActiveFilters());
  }

  filterToggle.addEventListener('click', function() {
    filterBox.classList.add('open');
    filterToggle.style.display = 'none';
  });

  filterClose.addEventListener('click', function() {
    filterBox.classList.remove('open');
    filterToggle.style.display = 'flex';
  });

  filterButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      btn.classList.toggle('active');
      updateMapFilters();
    });
  });

  map.on('load', function() {
    updateMapFilters();
  });

  map.on('style.load', function() {
    updateMapFilters();
  });
});

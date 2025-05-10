mapboxgl.accessToken = 'pk.eyJ1IjoibGFzY29uY29yZSIsImEiOiJjbWE1cHZncHgwanZiMmpxdXFzdjY3aTN2In0.KHIXaS5McVLHm4PqB2nkkA';

const map = new mapboxgl.Map({
  container: 'map', // ID of the map container
  style: 'mapbox://styles/lasconcore/cma5bbtvu003r01sd7yy51bro',
  center: [-4.2818, 55.8687], // Center at Glasgow
  zoom: 13 // Initial zoom level
});

// Add geolocate control to the map.
map.addControl(
  new mapboxgl.GeolocateControl({
      positionOptions: {
          enableHighAccuracy: true
      },
      // When active the map will receive updates to the device's location as it changes.
      trackUserLocation: true,
      // Draw an arrow next to the location dot to indicate which direction the device is heading.
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
  e.preventDefault(); // Prevent default anchor behavior
  aboutText.classList.toggle('visible');
});

const contactLink = document.querySelector('a[href="#contact"]');
const contactText = document.querySelector('.contact-text');

contactLink.addEventListener('click', (e) => {
  e.preventDefault(); // Prevent default anchor behavior
  contactText.classList.toggle('visible');
});

const mapLink = document.querySelector('a[href="#map"]');
const mapText = document.querySelector('.map-text');

mapLink.addEventListener('click', (e) => {
  e.preventDefault(); // Prevent default anchor behavior
  mapText.classList.toggle('visible');
});

const basemapToggle = document.createElement('div');
basemapToggle.className = 'basemap-toggle';
basemapToggle.innerHTML = '<img src="images/satellite_preview.jpg" alt="Satellite Preview">';
document.body.appendChild(basemapToggle);

let isSatellite = false;

basemapToggle.addEventListener('click', () => {
  if (isSatellite) {
    map.setStyle('mapbox://styles/lasconcore/cma5bbtvu003r01sd7yy51bro'); // Streets style
    basemapToggle.innerHTML = '<img src="images/satellite_preview.jpg" alt="Satellite Preview">';
  } else {
    map.setStyle('mapbox://styles/lasconcore/cmaehk5c800s501skh2up8xkp'); // Satellite Streets style
    basemapToggle.innerHTML = '<img src="images/streets_preview.jpg" alt="Streets Preview">';
  }
  isSatellite = !isSatellite;
});

// Add rotating compass functionality
const compassReset = document.createElement('div');
compassReset.className = 'compass-reset';
compassReset.innerHTML = '<img src="images/compass_icon.png" alt="Compass">';
document.body.appendChild(compassReset);

// Hide compass initially
compassReset.style.opacity = '0';
compassReset.style.pointerEvents = 'none';

// Update compass rotation and visibility based on map bearing
map.on('rotate', () => {
  const bearing = map.getBearing();
  compassReset.style.transform = `rotate(${bearing}deg)`;

  if (Math.abs(bearing) > 0.1) {
    compassReset.style.opacity = '1'; // Fade in
    compassReset.style.pointerEvents = 'auto';
  } else {
    compassReset.style.opacity = '0'; // Fade out
    compassReset.style.pointerEvents = 'none';
  }
});

// Reset map bearing to 0 when compass is clicked
compassReset.addEventListener('click', () => {
  map.easeTo({ bearing: 0 });
});

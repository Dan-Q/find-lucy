'use strict';

const body = document.body;

const expeditionId = parseInt((window.location.search || '').replaceAll(/[^\d]/g, ''));
const renderFlags = (window.location.search || '').replaceAll(/(\d|[^\w])/g, '').split('');

const modeStepThrough = renderFlags.indexOf('x') >= 0;
const modeAnimate = renderFlags.indexOf('a') >= 0;
const modeAnimateFollow = modeAnimate && (renderFlags.indexOf('f') >= 0);
const modeAnimateNoDelay = renderFlags.indexOf('n') >= 0;
const modeComplete = renderFlags.indexOf('c') >= 0;
const modeShowBatteryLevel = renderFlags.indexOf('b') >= 0;
const animationSpeed = 20000; // higher = faster: the number of milliseconds between two points is divided by this to get the frame delay

let stepThroughLineSegments = [];

if(!expeditionId){
  function renderExpeditionList(expeditions){
    body.innerHTML = `
      <h1 style="margin-left: 2.4rem;">Choose an expedition:</h1>
      <ol>
        ${expeditions.map(e=>`
          <li>
            <strong>${e.title}</strong> (${e.start_on}):
            <ul>
              <li><a href="?${e.id}">live</a> [default]</li>
              <li><a href="?${e.id}a">anim</a> [10s] (or <a href="?${e.id}an">0.5s</a>)</li>
              <li><a href="?${e.id}af">follow</a> [10s] (or <a href="?${e.id}afn">0.5s</a>)</li>
              <li><a href="?${e.id}c">complete</a> (with <a href="?${e.id}cb">battery depletion</a>?)</li>
            </ul>
          </li>
        `)}
      </ol>
    `;
  }

  fetch(`location.php?expedition=${expeditionId}`).then(r=>r.json()).then(renderExpeditionList);
} else {
  body.innerHTML = '<div id="map"></div><div id="stats"></div>';
  const stats = document.getElementById('stats');

  let marker, polyline;
  let map = L.map('map').setView([51.76, -1.40], 13);
  let loadedTiles = false;
  let locs;
  let animationFrame = 0;

  const boatIcon = L.icon({
    iconUrl: 'boat.png',
    iconSize: [54, 54],
    iconAnchor: [27, 27],
    popupAnchor: [0, -12],
  });

  const robinIcon = L.icon({
    iconUrl: 'robin-head-128.png',
    iconSize: [64, 64],
    iconAnchor: [32, 32],
    popupAnchor: [0, -64],
  });

  const flagIcon = L.icon({
    iconUrl: 'flag.png',
    iconSize: [54, 54],
    iconAnchor: [15, 44],
    popupAnchor: [0, -26],
  });

  const photoIcon = L.icon({
    iconUrl: 'flag-photo.png',
    iconSize: [54, 54],
    iconAnchor: [15, 44],
    popupAnchor: [0, -26],
  });

  const videoIcon = L.icon({
    iconUrl: 'flag-video.png',
    iconSize: [54, 54],
    iconAnchor: [15, 44],
    popupAnchor: [0, -26],
  });

  const batteryIcon = L.icon({
    iconUrl: 'battery.png',
    iconSize: [27, 27],
    iconAnchor: [13, 13],
    popupAnchor: [0, -12],
  });

  function renderMap(){
    L.tileLayer(
      'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'MAPBOX API TOKEN GOES HERE'
      }
    ).addTo(map);
  }

  function drawLocation( loc, markerType, popup, openPopup ){
    if(markerType == 'boat') {
      marker = L.marker( [ loc.latitude, loc.longitude ], { icon: boatIcon } );
    } else if(markerType == 'robin') {
      marker = L.marker( [ loc.latitude, loc.longitude ], { icon: robinIcon } );
    } else if(markerType == 'flag') {
      marker = L.marker( [ loc.latitude, loc.longitude ], { icon: flagIcon } );
    } else if(markerType == 'photo') {
      marker = L.marker( [ loc.latitude, loc.longitude ], { icon: photoIcon } );
    } else if(markerType == 'video') {
      marker = L.marker( [ loc.latitude, loc.longitude ], { icon: videoIcon } );
    } else if(markerType == 'battery') {
      marker = L.marker( [ loc.latitude, loc.longitude ], { icon: batteryIcon } );
    } else {
      marker = L.circle( [ loc.latitude, loc.longitude ], { radius: 12, color: markerType } );
    }
    marker.addTo(map);
    marker.bindPopup( `<p><b>${loc.datetime} UTC</b></p>${popup}`, { minWidth: 280, maxWidth: 480 } );
    if( openPopup ) marker.openPopup();

    if(!loadedTiles) { // delay tile loading so we don't start preloading completely irrelevant location data, and "jump" to initial coords
      loadedTiles = true;
      setTimeout(renderMap, 250);
    }
  }

  function drawAllLocations(){
    // Draw line
    polyline = L.polyline( locs.map(l=>[parseFloat(l.latitude), parseFloat(l.longitude)]), { color: 'red' } ).addTo(map);
    // Draw current location
    const latest = locs[0];
    if(modeComplete){
      // journey complete: zoom to show journey, don't show tooltip
      drawLocation( latest, 'robin' );
      let limitLatitude = [latest.latitude, latest.latitude];
      let limitLongitude = [latest.longitude, latest.longitude];
      locs.forEach(loc=>{
        if(loc.latitude > limitLatitude[0]) limitLatitude[0] = loc.latitude;
        if(loc.latitude < limitLatitude[1]) limitLatitude[1] = loc.latitude;
        if(loc.longitude > limitLongitude[0]) limitLongitude[0] = loc.longitude;
        if(loc.longitude < limitLongitude[1]) limitLongitude[1] = loc.longitude;
      });
      map.fitBounds( [[limitLatitude[0], limitLongitude[0]], [limitLatitude[1], limitLongitude[1]]] );
    } else {
      // journey incomplete: zoom to show current location with tooltip
      drawLocation( latest, 'robin', `<p>Robin is here!<br>(${latest.latitude}, ${latest.longitude})</p>`, true );
      map.flyTo( [ latest.latitude, latest.longitude ], 13 );
    }
    // Draw points of interest (popups)
    locs.filter(l=>!!l.popup).forEach(loc=>{
      let popupText = loc.popup;
      let popupIcon = 'flag';
      if(loc.author) popupText = `${popupText}<p>&mdash; ${loc.author}</p>`;
      if(!! popupText.match(/<img/)) popupIcon = 'photo';
      if(!! popupText.match(/<video/)) popupIcon = 'video';
      drawLocation( loc, popupIcon, loc.popup, false );
    });
    // Draw points of interest (battery level drops)
    if(modeShowBatteryLevel){
      locs.filter(l=>!l.popup && (l.battery>0)).forEach(loc=>{
        drawLocation( loc, 'battery', `Battery level: ${loc.battery}%.`, false );
      });
    }
    // calculate interesting data - speed
    const lastDistance = map.distance([locs[0].latitude, locs[0].longitude], [locs[1].latitude, locs[1].longitude]); // metres
    const lastDuration = (Date.parse(locs[0].datetime) - Date.parse(locs[1].datetime)) / 1000; // seconds
    const metresPerSecond = lastDistance / lastDuration; // metres per second
    const kilometresPerHour = Math.round(metresPerSecond * 360) / 100;
    // calculate interesting data - distance
    let lastLoc = locs[0];
    let cumulativeDistance = 0;
    locs.forEach(loc=>{
      cumulativeDistance = cumulativeDistance + map.distance([lastLoc.latitude, lastLoc.longitude], [loc.latitude, loc.longitude]);
      lastLoc = loc;
    });
    const cumulativeDistanceKm = Math.round(cumulativeDistance / 10) / 100;
    // show interesting data
    let outputData = [];
    if(!modeComplete) {
      outputData.push(`<strong>Speed:</strong> ${kilometresPerHour} km/h`);
    }
    outputData.push(`<strong>Distance:</strong> ${cumulativeDistanceKm} km`);
    stats.innerHTML = outputData.join('<br>');
  }

  function animateNextPoint(){
    animationFrame++;
    const previousLoc = locs[locs.length - animationFrame];
    const currentLoc = locs[locs.length - animationFrame - 1];
    if(!previousLoc || !currentLoc) return;
    polyline = L.polyline(
      [
        [ parseFloat(previousLoc.latitude), parseFloat(previousLoc.longitude) ],
        [ parseFloat(currentLoc.latitude), parseFloat(currentLoc.longitude) ]
      ],
      { color: 'red' }
    ).addTo(map);
    const newPoint = [ parseFloat(currentLoc.latitude), parseFloat(currentLoc.longitude) ];
    marker.setLatLng( newPoint );
    if(modeAnimateFollow) map.setView( newPoint );
    const nextLoc = locs[locs.length - animationFrame - 2];
    if(!nextLoc) return;
    const millisecondsFromThisPoint = moment(nextLoc.datetime) - moment(currentLoc.datetime);
    const frameDelay = millisecondsFromThisPoint / animationSpeed;
    setTimeout(animateNextPoint, frameDelay);
  }

  function stepForward(){
    if(!modeStepThrough) return;
    animationFrame++;
    const previousLoc = locs[locs.length - animationFrame];
    const currentLoc = locs[locs.length - animationFrame - 1];
    if(!previousLoc || !currentLoc) return;
    stepThroughLineSegments[animationFrame] = L.polyline(
      [
        [ parseFloat(previousLoc.latitude), parseFloat(previousLoc.longitude) ],
        [ parseFloat(currentLoc.latitude), parseFloat(currentLoc.longitude) ]
      ],
      { color: 'red' }
    ).addTo(map);
    const newPoint = [ parseFloat(currentLoc.latitude), parseFloat(currentLoc.longitude) ];
    stats.innerText = JSON.stringify(currentLoc, null, 2);
    marker.setLatLng( newPoint );
  }

  function stepBackward(){
    if(!modeStepThrough) return;
    map.removeLayer(stepThroughLineSegments[animationFrame]);
    animationFrame--;
    const reverseLoc = locs[locs.length - animationFrame - 1];
    const newPoint = [ parseFloat(reverseLoc.latitude), parseFloat(reverseLoc.longitude) ];
    stats.innerText = JSON.stringify(reverseLoc, null, 2);
    marker.setLatLng( newPoint );
  }

  function drawThrUKStart(){
    // 50.0644345,-5.7126191 - lands end
    // 50.078409,-5.704176 - sennen cove
    drawLocation( { datetime: 'Starting early May; times in', latitude: 50.078409, longitude: -5.704176 }, 'boat', 'Lucy and Robin will start their journey here!', true );
    map.flyTo( [ 54, -3 ], 5 );
  }

  function suppressPoint(){
    // authentication by server side magic cookie
    const currentLoc = locs[locs.length - animationFrame - 1];
    fetch(
      `suppress.php?datetime=${currentLoc.datetime}`,
      {
        method: 'POST',
        credentials: 'same-origin',
      }
    ).then(response=>response.text()).then(text=>console.log(text));
  }

  function initialRender(loadedLocs){
    locs = loadedLocs;
    if(modeAnimate || modeStepThrough){
      const firstLoc = locs[locs.length - 1];
      drawLocation( firstLoc, 'robin' );
      map.setView( [ firstLoc.latitude, firstLoc.longitude ], 13 );
      setTimeout(renderMap, 250);
      if(modeStepThrough) {
        // Step-through animation mode: draw controls/output?
        stats.innerText = JSON.stringify(firstLoc, null, 2);
      } else {
        // Regular animation mode: queue the start!
        const secondsUntilAnimationStarts = modeAnimateNoDelay ? 0.5 : 10;
        setTimeout(animateNextPoint, secondsUntilAnimationStarts * 1000);
      }
    } else if(locs.length == 0) {
      // no points; assume this is an UNSTARTED journey and show where it'll start in a dramatic way
      drawThrUKStart();
    } else {
      drawAllLocations();
    }
  }

  document.addEventListener('keypress', function(e){
    const key = e.key.toLowerCase();
    const repeat = e.shiftKey ? 25 : 1; // hold SHIFT to JUMP fast!
    for(let i = 0; i < repeat; i++){
      if(key == 'n') stepForward();
      if(key == 'p') stepBackward();
      if(key == 's') suppressPoint();
    }
  });

  fetch(`location.php?expedition=${expeditionId}`).then(r=>r.json()).then(initialRender);
}

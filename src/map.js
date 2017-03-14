var Utils = require('./utils');
var Pokemon = require('./pokemon');

var Platform = require('platform');
var platform = Platform.os.family;

var Throbber = require('./throbber');
var Get = require('./get');
var Filter = require('./filter');
var TypeChart = require('./type-chart');

var defaultLatLng = [37.475533, 126.964645];
var defaultScale = 16;


$(function() {
  Filter.initFilter(updatePokemons.bind(this, false, true));
  TypeChart.init();
  var paramLatLng = Get.getUrlParameter('p');
  if (paramLatLng) {
    paramLatLng = paramLatLng.split(',').map(Number);
  }
  var latLng = paramLatLng || defaultLatLng;
  var scale = Math.min(10, Math.max(parseInt(Get.getUrlParameter('z')), 16)) || defaultScale;
  var paramId = Get.getUrlParameter('id');
  L.mapbox.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';
  var map = new L.mapbox.Map('map', 'mapbox.streets')
    .setView(latLng, scale);
  L.control.locate({
    flyTo: false,
    keepCurrentZoomLevel: true,
    strings: {
      title: '내 위치 보기',
      metersUnit: 'm',
      feetUnit: 'ft',
      popup: '점을 중심으로 {distance}{unit} 안에 있습니다.',
      outsideMapBoundsMsg: '지도 밖에 있는 것 같습니다.'
    }
  }).addTo(map);

  var placeInvisibleZoom = 14;

  function removeMarkersOutOfBounds(markers, bounds, forceClear) {
    var toBeRemoved = [];
    var now = Date.now() / 1000;
    var zoom = map.getZoom();
    markers.forEach(function(marker, id, _) {
      if (!bounds.contains(marker.getLatLng()) ||
          (marker.pokemon && (forceClear || Number(marker.pokemon['despawn']) < now)) ||
          (marker.pokemon === undefined && zoom <= placeInvisibleZoom)) {
        if (marker === selectedMarker) {
          return;
        }
        map.removeLayer(marker);
        toBeRemoved.push(id);
      }
    });
    for (var id of toBeRemoved) {
      if (markers.has(id)) {
        markers.delete(id);
      }
    }
  }

  var selectedMarker = null;
  function updatePopupTimestamp() {
    if (selectedMarker == null) {
      return;
    }
    if (selectedMarker.pokemon) {
      $('span.despawn').text(selectedMarker.pokemon.getRemainTimeStr());
    }
  }

  /* pokemon marker */
  var pokemon_marker_width = 40;
  var pokemon_marker_height = 40;
  var PokemonMarker = L.Icon.extend({
    options: {
      iconSize: [pokemon_marker_width, pokemon_marker_height],
      iconAnchor: [pokemon_marker_width / 2, pokemon_marker_height / 2],
      popupAnchor: [0, -pokemon_marker_height * 0.3]
    }
  });

  var NewMarker = L.divIcon({
    className: 'new-marker',
    html: '<div class="new-notification"></div>',
    iconSize: [40, 40]
  });

  var pokemonMarkerTempletes = {
  };

  var pokemonMarkers = new Map();

  function addPokemons(pokemons, bounds, forceClear, newNotification) {
    var now = Date.now() / 1000;
    $.each(pokemons, function(i, pokemon) {
      var pokemon = new Pokemon(pokemon);
      var id = pokemon.id;
      var pokemon_id = pokemon.pokemon_id;
      var pokemonMarker = pokemonMarkerTempletes[pokemon.pokemon_id];
      if (pokemonMarker === undefined) {
        pokemonMarker = new PokemonMarker({iconUrl: 'static/images/pokemons/' + pokemon_id + '.png'});
        pokemonMarkerTempletes[pokemon_id] = pokemonMarker;
      }
      var marker = new L.marker(
          pokemon.getLatLng(),
          {icon: pokemonMarker});
      marker.pokemon = pokemon;
      pokemon.setMarker(marker);
      marker.bindPopup('');
      marker.setOpacity(pokemon.getOpacity(now));
      marker.addEventListener('click', function(e) {
        var now = Date.now() / 1000;
        marker.setOpacity(pokemon.getOpacity(now));
        selectedMarker = e.target;
        selectedMarker.setPopupContent(selectedMarker.pokemon.getPopupContents());
        // The popup will be open automatically by the default event listener
      });
      marker.addEventListener('dblclick', function(e) {
        // To prevent the map from being moved when a marker is double-clicked
      });
      if (!pokemonMarkers.has(id)) {
        map.addLayer(marker);
        pokemonMarkers.set(id, marker);

        if (newNotification) {
          var newMarker = L.marker(pokemon.getLatLng(), {icon: NewMarker});
          map.addLayer(newMarker);
          setTimeout(function() {
            map.removeLayer(newMarker);
          }, 1000);
        }
        if (i === 0) {
          if(paramId && paramId === pokemon.id) {
            marker.fireEvent('click');
            paramId = null;
            paramLatLng = null;
          } else if (paramLatLng) {
            var pLatLng = pokemon.getLatLng();
            if (pLatLng[0] === paramLatLng[0] &&
                pLatLng[1] === paramLatLng[1]) {
              marker.fireEvent('click');
            }
            paramLatLng = null;
          }
        }
      }
    });
  }

  var updatePokemonsFlag = false;
  function updatePokemons(newNotification, forceClear) {
    if (updatePokemonsFlag) {
      return;
    }
    updatePokemonsFlag = true;
    Throbber.showThrobber();
    var bounds = Utils.boundsWithPadding(map.getBounds(), 1);
    var params = {
      'min_latitude': bounds._southWest.lat,
      'max_latitude': bounds._northEast.lat,
      'min_longitude': bounds._southWest.lng,
      'max_longitude': bounds._northEast.lng,
      'zoom_level': map.getZoom(),
      'filters': Filter.getFilters().join(',')
    };
    $.get('pokemons.json', params, function(pokemons) {
      removeMarkersOutOfBounds(pokemonMarkers, bounds, forceClear);
      addPokemons(pokemons, bounds, forceClear, newNotification);
      Throbber.hideThrobber();
      updatePokemonsFlag = false;
    });
    if (paramId !== null) {
      $.get('pokemon.json', {'id': paramId}, function(pokemons) {
        addPokemons(pokemons, bounds, forceClear, false, paramId);
      });
    }
  }
  /* pokemon marker end */

  /* place marker */
  var place_marker_width = 15;
  var place_marker_height = 15;
  var PlaceMarker = L.Icon.extend({
    options: {
      iconSize: [place_marker_width, place_marker_height],
      iconAnchor: [place_marker_width / 2, place_marker_height / 2]
    }
  });

  var placeMarkerTempletes = {
  };

  var placeMarkers = new Map();

  var updatePlacesFlag = false;
  function updatePlaces() {
    if (updatePlacesFlag) {
      return;
    }
    var bounds = Utils.boundsWithPadding(map.getBounds(), 0.5);
    if (map.getZoom() <= placeInvisibleZoom) {
      removeMarkersOutOfBounds(placeMarkers, bounds);
      return;
    }
    Throbber.showThrobber();
    updatePlacesFlag = true;
    var params = {
      'min_latitude': bounds._southWest.lat,
      'max_latitude': bounds._northEast.lat,
      'min_longitude': bounds._southWest.lng,
      'max_longitude': bounds._northEast.lng
    };
    $.get('places.json', params, function(places) {
      removeMarkersOutOfBounds(placeMarkers, bounds);
      if (map.getZoom() <= placeInvisibleZoom) {
        return;
      }
      $.each(places, function(i, place) {
        var id = place['id'];
        var placeMarker = placeMarkerTempletes[place['type']];
        if (placeMarker === undefined) {
          placeMarker = new PlaceMarker({iconUrl: 'static/images/places/' + place['type'] + '.png'});
          placeMarkerTempletes[place['type']] = placeMarker;
        }
        var marker = new L.marker(
            [place['latitude'], place['longitude']],
            {icon: placeMarker});
        if (!placeMarkers.has(id)) {
          map.addLayer(marker);
          placeMarkers.set(id, marker);
        }
      });
      Throbber.hideThrobber();
      updatePlacesFlag = false;
    });
  }

  function updatePokemonsInMap() {
    var now = Date.now() / 1000;
    var bounds = map.getBounds();
    pokemonMarkers.forEach(function(marker, id, _) {
      if (!bounds.contains(marker.getLatLng())) {
        return;
      }
      var opacity = marker.pokemon.getOpacity(now);
      marker.setOpacity(opacity);
    });
  }

  function update(forceClear) {
    updatePokemonsInMap();
    updatePlaces();
    updatePokemons(false, forceClear);
  }

  update();
  var zoom = map.getZoom();
  map.on('moveend', function() {
    var new_zoom = map.getZoom();
    var forceClear = new_zoom < zoom;
    zoom = new_zoom;
    update(forceClear);
  });

  map.on('popupclose', function() {
    var now = Date.now() / 1000;
    if (selectedMarker) {
      selectedMarker.setOpacity(selectedMarker.pokemon.getOpacity(now, true));
    }
    selectedMarker = null;
  });

  setInterval(updatePopupTimestamp, 1000);
  setInterval(function() {
    updatePokemons(true, false);
  }, 60 * 1000);
  setInterval(updatePokemonsInMap, 60 * 1000);
});

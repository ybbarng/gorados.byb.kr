var Utils = require('./utils');
var Pokemon = require('./pokemon');

$(function() {
  L.mapbox.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';
  var map = new L.mapbox.Map('map', 'mapbox.streets', {
      maxZoom: 16
    })
    .setView([37.475533, 126.964645], 16);
  L.control.locate().addTo(map);

  function removeMarkersOutOfBounds(markers, bounds) {
    var toBeRemoved = [];
    var now = Date.now() / 1000;
    markers.forEach(function(marker, id, _) {
      if (!bounds.contains(marker.getLatLng()) ||
          (marker.pokemon && Number(marker.pokemon['despawn']) < now)) {
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
  function updatePopup() {
    if (selectedMarker == null) {
      return;
    }
    if (selectedMarker.pokemon) {
      selectedMarker.setPopupContent(Pokemon.toString(selectedMarker.pokemon));
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

  var pokemonMarkerTempletes = {
  };

  var pokemonMarkers = new Map();

  var updatePokemonsFlag = false;
  function updatePokemons() {
    if (updatePokemonsFlag) {
      return;
    }
    updatePokemonsFlag = true;
    var bounds = Utils.boundsWithPadding(map.getBounds(), 1);
    var params = {
      'min_latitude': bounds._southWest.lat,
      'max_latitude': bounds._northEast.lat,
      'min_longitude': bounds._southWest.lng,
      'max_longitude': bounds._northEast.lng
    };
    $.get('pokemons.json', params, function(pokemons) {
      removeMarkersOutOfBounds(pokemonMarkers, bounds);
      $.each(pokemons, function(i, pokemon) {
        var id = pokemon['id'];
        var pokemonMarker = pokemonMarkerTempletes[pokemon['pokemon_id']];
        if (pokemonMarker === undefined) {
          var pokemon_id = pokemon['pokemon_id'];
          if (pokemon['disguise'] === '1') { // If ditto
            pokemon_id = '132';
          }
          pokemonMarker = new PokemonMarker({iconUrl: 'static/images/pokemons/' + pokemon_id + '.png'});
          pokemonMarkerTempletes[pokemon['pokemon_id']] = pokemonMarker;
        }
        var marker = new L.marker(
            [pokemon['latitude'], pokemon['longitude']],
            {icon: pokemonMarker});
        marker.pokemon = pokemon;
        marker.bindPopup('');
        marker.addEventListener('click', function(e) {
          var now = Date.now() / 1000;
          marker.setOpacity(Pokemon.getOpacity(e.target, now));
          selectedMarker = e.target;
          updatePopup();
          // The popup will be open automatically by the default event listener
        });
        marker.addEventListener('dblclick', function(e) {
          // To prevent the map from being moved when a marker is double-clicked
        });
        if (!pokemonMarkers.has(id)) {
          map.addLayer(marker);
          pokemonMarkers.set(id, marker);
        }
      });
      updatePokemonsFlag = false;
    });
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
    updatePlacesFlag = true;
    var bounds = Utils.boundsWithPadding(map.getBounds(), 0.5);
    var params = {
      'min_latitude': bounds._southWest.lat,
      'max_latitude': bounds._northEast.lat,
      'min_longitude': bounds._southWest.lng,
      'max_longitude': bounds._northEast.lng
    };
    $.get('places.json', params, function(places) {
      removeMarkersOutOfBounds(placeMarkers, bounds);
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
      var opacity = Pokemon.getOpacity(marker, now);
      marker.setOpacity(opacity);
    });
  }

  function update() {
    updatePokemonsInMap();
    updatePlaces();
    updatePokemons();
  }

  update();
  map.on('moveend', function() {
    update();
  });

  map.on('popupclose', function() {
    var now = Date.now() / 1000;
    selectedMarker.setOpacity(Pokemon.getOpacity(selectedMarker, now, true));
    selectedMarker = null;
  });

  setInterval(updatePopup, 1000);
  setInterval(updatePokemons, 60 * 1000);
  setInterval(updatePokemonsInMap, 1000);
});

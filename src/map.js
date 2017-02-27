var Utils = require('./utils');

$(function() {
  L.mapbox.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';
  var map = new L.mapbox.Map('map', 'mapbox.streets', {
      maxZoom: 16
    })
    .setView([37.475533, 126.964645], 16);
  L.control.locate().addTo(map);

  var pokemon_width = 40;
  var pokemon_height = 40;
  var PokemonMarker = L.Icon.extend({
    options: {
      iconSize: [pokemon_width, pokemon_height],
      iconAnchor: [pokemon_width / 2, pokemon_height / 2]
    }
  });

  var pokemonMarkers = {
  };

  var markers = new Map();

  function removeMarkersOutOfBounds(bounds) {
    var toBeRemoved = [];
    markers.forEach(function(marker, id, _) {
      if (!bounds.contains(marker.getLatLng())) {
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

  var updateFlag = false;
  function updatePokemons() {
    if (updateFlag) {
      return;
    }
    updateFlag = true;
    var bounds = Utils.boundsWithPadding(map.getBounds(), 1);
    removeMarkersOutOfBounds(bounds);
    var params = {
      'min_latitude': bounds._southWest.lat,
      'max_latitude': bounds._northEast.lat,
      'min_longitude': bounds._southWest.lng,
      'max_longitude': bounds._northEast.lng
    };
    $.get('pokemons.json', params, function(pokemons) {
      $('.pokemon-marker').remove();
      $.each(pokemons, function(i, pokemon) {
        var id = pokemon['id'];
        var pokemonMarker = pokemonMarkers[pokemon['pokemon_id']];
        if (pokemonMarker === undefined) {
          pokemonMarker = new PokemonMarker({iconUrl: 'static/images/pokemons/' + pokemon['pokemon_id'] + '.png'});
          pokemonMarkers[pokemon['pokemon_id']] = pokemonMarker;
        }
        var marker = new L.marker(
            [pokemon['latitude'], pokemon['longitude']],
            {icon: pokemonMarker});
        if (!markers.has(id)) {
          map.addLayer(marker);
          markers.set(id, marker);
        }
      });
      updateFlag = false;
    });
  }
  updatePokemons();

  map.on('moveend', function() {
    updatePokemons();
  });
});

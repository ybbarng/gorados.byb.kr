$(function() {
  L.mapbox.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';
  var map = new L.mapbox.Map('map', 'mapbox.streets')
    .setView([37.475533, 126.964645], 16);

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

  var markers = [];

  var updateFlag = false;
  function updatePokemons() {
    if (updateFlag) {
      return;
    }
    updateFlag = true;
    for (var i = 0; i < markers.length; i++) {
      map.removeLayer(markers[i]);
    }
    var bounds = map.getBounds();
    var params = {
      'min_latitude': bounds._southWest.lat,
      'max_latitude': bounds._northEast.lat,
      'min_longitude': bounds._southWest.lng,
      'max_longitude': bounds._northEast.lng
    };
    $.get('pokemons.json', params, function(pokemons) {
      $('.pokemon-marker').remove();
      $.each(pokemons, function(i, pokemon) {
        var pokemonMarker = pokemonMarkers[pokemon['pokemon_id']];
        if (pokemonMarker === undefined) {
          pokemonMarker = new PokemonMarker({iconUrl: 'static/images/pokemons/' + pokemon['pokemon_id'] + '.png'});
          pokemonMarkers[pokemon['pokemon_id']] = pokemonMarker;
        }
        var marker = new L.marker(
            [pokemon['latitude'], pokemon['longitude']],
            {icon: pokemonMarker});
        map.addLayer(marker);
        markers.push(marker);
      });
      updateFlag = false;
    });
  }
  updatePokemons();

  map.on('moveend', function() {
    updatePokemons();
  });
});

import Pokemon from "./pokemon";
import * as Utils from "./utils";

import Platform from "platform";

import * as Filter from "./filter";
import * as Get from "./get";
import * as Throbber from "./throbber";
import * as TypeChart from "./type-chart";

const platform = Platform.os.family;

const defaultLatLng = [37.475533, 126.964645];
const defaultScale = 16;

$(function () {
  Filter.initFilter(updatePokemons.bind(this, false, true));
  TypeChart.init();
  let paramLatLng = Get.getUrlParameter("p");
  if (paramLatLng) {
    paramLatLng = paramLatLng.split(",").map(Number);
  }
  const latLng = paramLatLng || defaultLatLng;
  const scale =
    Math.min(10, Math.max(Number.parseInt(Get.getUrlParameter("z")), 16)) ||
    defaultScale;
  let paramId = Get.getUrlParameter("id");
  L.mapbox.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  const map = new L.mapbox.Map("map", "mapbox.streets").setView(latLng, scale);
  L.control
    .locate({
      flyTo: false,
      keepCurrentZoomLevel: true,
      strings: {
        title: "내 위치 보기",
        metersUnit: "m",
        feetUnit: "ft",
        popup: "점을 중심으로 {distance}{unit} 안에 있습니다.",
        outsideMapBoundsMsg: "지도 밖에 있는 것 같습니다.",
      },
    })
    .addTo(map);

  const placeInvisibleZoom = 14;

  function removeMarkersOutOfBounds(markers, bounds, forceClear) {
    const toBeRemoved = [];
    const now = Date.now() / 1000;
    const zoom = map.getZoom();
    markers.forEach((marker, id, _) => {
      if (
        !bounds.contains(marker.getLatLng()) ||
        (marker.pokemon &&
          (forceClear || Number(marker.pokemon.despawn) < now)) ||
        (marker.pokemon === undefined && zoom <= placeInvisibleZoom)
      ) {
        if (marker === selectedMarker) {
          return;
        }
        map.removeLayer(marker);
        toBeRemoved.push(id);
      }
    });
    for (const id of toBeRemoved) {
      if (markers.has(id)) {
        markers.delete(id);
      }
    }
  }

  let selectedMarker = null;
  function updatePopupTimestamp() {
    if (selectedMarker == null) {
      return;
    }
    if (selectedMarker.pokemon) {
      $("span.despawn").text(
        selectedMarker.pokemon.getRemainTimeStr(1491960000),
      );
    }
  }

  /* pokemon marker */
  const pokemon_marker_width = 40;
  const pokemon_marker_height = 40;
  const PokemonMarker = L.Icon.extend({
    options: {
      iconSize: [pokemon_marker_width, pokemon_marker_height],
      iconAnchor: [pokemon_marker_width / 2, pokemon_marker_height / 2],
      popupAnchor: [0, -pokemon_marker_height * 0.3],
    },
  });

  const NewMarker = L.divIcon({
    className: "new-marker",
    html: '<div class="new-notification"></div>',
    iconSize: [40, 40],
  });

  const pokemonMarkerTempletes = {};

  const pokemonMarkers = new Map();

  function addPokemons(pokemons, bounds, forceClear, newNotification) {
    const now = Date.now() / 1000;
    $.each(pokemons, (i, pokemonData) => {
      const pokemon = new Pokemon(pokemonData);
      const id = pokemon.id;
      const pokemon_id = pokemon.pokemon_id;
      let pokemonMarker = pokemonMarkerTempletes[pokemon.pokemon_id];
      if (pokemonMarker === undefined) {
        pokemonMarker = new PokemonMarker({
          iconUrl: `static/images/pokemons/${pokemon_id}.png`,
        });
        pokemonMarkerTempletes[pokemon_id] = pokemonMarker;
      }
      const marker = new L.marker(pokemon.getLatLng(), { icon: pokemonMarker });
      marker.pokemon = pokemon;
      pokemon.setMarker(marker);
      marker.bindPopup("");
      marker.setOpacity(pokemon.getOpacity(now));
      marker.addEventListener("click", (e) => {
        const now = Date.now() / 1000;
        marker.setOpacity(pokemon.getOpacity(now));
        selectedMarker = e.target;
        selectedMarker.setPopupContent(
          selectedMarker.pokemon.getPopupContents(),
        );
        // The popup will be open automatically by the default event listener
      });
      marker.addEventListener("dblclick", (e) => {
        // To prevent the map from being moved when a marker is double-clicked
      });
      if (!pokemonMarkers.has(id)) {
        map.addLayer(marker);
        pokemonMarkers.set(id, marker);

        if (newNotification) {
          const newMarker = L.marker(pokemon.getLatLng(), { icon: NewMarker });
          map.addLayer(newMarker);
          setTimeout(() => {
            map.removeLayer(newMarker);
          }, 1000);
        }
        if (i === 0) {
          if (paramId && paramId === pokemon.id) {
            marker.fireEvent("click");
            paramId = null;
            paramLatLng = null;
          } else if (paramLatLng) {
            const pLatLng = pokemon.getLatLng();
            if (
              pLatLng[0] === paramLatLng[0] &&
              pLatLng[1] === paramLatLng[1]
            ) {
              marker.fireEvent("click");
            }
            paramLatLng = null;
          }
        }
      }
    });
  }

  let updatePokemonsFlag = false;
  function updatePokemons(newNotification, forceClear) {
    if (updatePokemonsFlag) {
      return;
    }
    updatePokemonsFlag = true;
    Throbber.showThrobber();
    const bounds = Utils.boundsWithPadding(map.getBounds(), 1);
    const params = {
      min_latitude: bounds._southWest.lat,
      max_latitude: bounds._northEast.lat,
      min_longitude: bounds._southWest.lng,
      max_longitude: bounds._northEast.lng,
      zoom_level: map.getZoom(),
      filters: Filter.getFilters().join(","),
    };
    $.get("pokemons.json", params, (pokemons) => {
      removeMarkersOutOfBounds(pokemonMarkers, bounds, forceClear);
      addPokemons(pokemons, bounds, forceClear, newNotification);
      Throbber.hideThrobber();
      updatePokemonsFlag = false;
    });
    if (paramId !== null) {
      $.get("pokemon.json", { id: paramId }, (pokemons) => {
        addPokemons(pokemons, bounds, forceClear, false, paramId);
      });
    }
  }
  /* pokemon marker end */

  /* place marker */
  const place_marker_width = 15;
  const place_marker_height = 15;
  const PlaceMarker = L.Icon.extend({
    options: {
      iconSize: [place_marker_width, place_marker_height],
      iconAnchor: [place_marker_width / 2, place_marker_height / 2],
    },
  });

  const placeMarkerTempletes = {};

  const placeMarkers = new Map();

  let updatePlacesFlag = false;
  function updatePlaces() {
    if (updatePlacesFlag) {
      return;
    }
    const bounds = Utils.boundsWithPadding(map.getBounds(), 0.5);
    if (map.getZoom() <= placeInvisibleZoom) {
      removeMarkersOutOfBounds(placeMarkers, bounds);
      return;
    }
    Throbber.showThrobber();
    updatePlacesFlag = true;
    const params = {
      min_latitude: bounds._southWest.lat,
      max_latitude: bounds._northEast.lat,
      min_longitude: bounds._southWest.lng,
      max_longitude: bounds._northEast.lng,
    };
    $.get("places.json", params, (places) => {
      removeMarkersOutOfBounds(placeMarkers, bounds);
      if (map.getZoom() <= placeInvisibleZoom) {
        return;
      }
      $.each(places, (i, place) => {
        const id = place.id;
        let placeMarker = placeMarkerTempletes[place.type];
        if (placeMarker === undefined) {
          placeMarker = new PlaceMarker({
            iconUrl: `static/images/places/${place.type}.png`,
          });
          placeMarkerTempletes[place.type] = placeMarker;
        }
        const marker = new L.marker([place.latitude, place.longitude], {
          icon: placeMarker,
        });
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
    const now = Date.now() / 1000;
    const bounds = map.getBounds();
    pokemonMarkers.forEach((marker, id, _) => {
      if (!bounds.contains(marker.getLatLng())) {
        return;
      }
      const opacity = marker.pokemon.getOpacity(now);
      marker.setOpacity(opacity);
    });
  }

  function update(forceClear) {
    updatePokemonsInMap();
    updatePlaces();
    updatePokemons(false, forceClear);
  }

  update();
  let zoom = map.getZoom();
  map.on("moveend", () => {
    const new_zoom = map.getZoom();
    const forceClear = new_zoom < zoom;
    zoom = new_zoom;
    update(forceClear);
  });

  map.on("popupclose", () => {
    const now = Date.now() / 1000;
    if (selectedMarker) {
      selectedMarker.setOpacity(selectedMarker.pokemon.getOpacity(now, true));
    }
    selectedMarker = null;
  });

  setInterval(updatePopupTimestamp, 1000);
  setInterval(() => {
    updatePokemons(true, false);
  }, 60 * 1000);
  setInterval(updatePokemonsInMap, 60 * 1000);
});

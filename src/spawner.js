import classification from "../classification.json";
import movePools from "../data/move-pools.json";
import { hashSeed, mulberry32, randChoice, randInt } from "./prng";

const CYCLE_MINUTES = 30;
const CYCLE_SECONDS = CYCLE_MINUTES * 60;
const MIN_DURATION_MINUTES = 15;
const MAX_DURATION_MINUTES = 25;
const DISGUISE_CHANCE = 0.015;
const MAX_RESULTS = 500;

const PLACE_TYPES = ["pokestop", "gym", "7-eleven", "lotteria", "angel-in-us"];

// classification.json의 문자열을 숫자 Set으로 변환
const classificationSets = classification.map(
  (arr) => new Set(arr.map(Number)),
);

// 스폰포인트별 고정 오프셋 (시간 분산용)
function getSpawnOffset(placeIndex) {
  const rng = mulberry32(hashSeed(placeIndex, 0x500ff5e7));
  return Math.floor(rng() * CYCLE_SECONDS);
}

// 스폰포인트별 지속시간 (15~25분)
function getSpawnDuration(placeIndex, cycleNumber) {
  const rng = mulberry32(hashSeed(placeIndex, cycleNumber + 0xd0aaaa));
  return (
    (MIN_DURATION_MINUTES +
      Math.floor(rng() * (MAX_DURATION_MINUTES - MIN_DURATION_MINUTES + 1))) *
    60
  );
}

// 특정 장소/시간에 포켓몬 생성
export function spawnAt(placeIndex, lat, lng, now) {
  const offset = getSpawnOffset(placeIndex);
  const adjustedTime = now - offset;
  const cycleNumber = Math.floor(adjustedTime / CYCLE_SECONDS);
  const timeInCycle = adjustedTime - cycleNumber * CYCLE_SECONDS;
  const duration = getSpawnDuration(placeIndex, cycleNumber);

  if (timeInCycle >= duration) {
    return null; // 이 사이클에서 이미 소멸
  }

  const seed = hashSeed(placeIndex, cycleNumber);
  const rng = mulberry32(seed);

  const pokemonId = randInt(rng, 1, 252); // 1~251
  const attack = randInt(rng, 0, 16);
  const defence = randInt(rng, 0, 16);
  const stamina = randInt(rng, 0, 16);

  const pool = movePools[pokemonId];
  let move1 = 0;
  let move2 = 0;
  if (pool) {
    move1 = randChoice(rng, pool.fast);
    move2 = randChoice(rng, pool.charge);
  }

  const disguise = rng() < DISGUISE_CHANCE ? "1" : "0";
  const despawn = cycleNumber * CYCLE_SECONDS + offset + duration;

  return {
    id: `${placeIndex}_${cycleNumber}`,
    pokemon_id: pokemonId,
    latitude: lat,
    longitude: lng,
    despawn,
    disguise,
    attack,
    defence,
    stamina,
    move1,
    move2,
  };
}

// 줌 레벨에 해당하는 classification 인덱스
function getClassificationIndex(zoom) {
  const idx = Math.floor(zoom) - 12;
  return Math.min(Math.max(0, idx), 4);
}

// 뷰포트 내 포켓몬 생성
export function generatePokemonsInBounds(places, bounds, zoom, filters, now) {
  if (!places) return [];
  const nowSeconds = now / 1000;
  const classIdx = getClassificationIndex(zoom);
  const visibleSet = classificationSets[classIdx];

  // 필터: 추가로 항상 표시할 포켓몬
  const filterSet = new Set(filters.map(Number));

  const centerLat = (bounds._southWest.lat + bounds._northEast.lat) / 2;
  const centerLng = (bounds._southWest.lng + bounds._northEast.lng) / 2;

  const results = [];

  for (let i = 0; i < places.length; i++) {
    const [lat, lng] = places[i];
    if (
      lat < bounds._southWest.lat ||
      lat > bounds._northEast.lat ||
      lng < bounds._southWest.lng ||
      lng > bounds._northEast.lng
    ) {
      continue;
    }

    const pokemon = spawnAt(i, lat, lng, nowSeconds);
    if (!pokemon) continue;

    if (
      !visibleSet.has(pokemon.pokemon_id) &&
      !filterSet.has(pokemon.pokemon_id)
    ) {
      continue;
    }

    const dLat = lat - centerLat;
    const dLng = lng - centerLng;
    pokemon._dist = dLat * dLat + dLng * dLng;
    results.push(pokemon);
  }

  results.sort((a, b) => a._dist - b._dist);
  return results.slice(0, MAX_RESULTS);
}

// 뷰포트 내 장소 조회
export function getPlacesInBounds(places, bounds) {
  if (!places) return [];
  const centerLat = (bounds._southWest.lat + bounds._northEast.lat) / 2;
  const centerLng = (bounds._southWest.lng + bounds._northEast.lng) / 2;

  const results = [];

  for (let i = 0; i < places.length; i++) {
    const [lat, lng, typeIndex] = places[i];
    if (
      lat < bounds._southWest.lat ||
      lat > bounds._northEast.lat ||
      lng < bounds._southWest.lng ||
      lng > bounds._northEast.lng
    ) {
      continue;
    }

    const dLat = lat - centerLat;
    const dLng = lng - centerLng;
    results.push({
      id: `place_${i}`,
      latitude: lat,
      longitude: lng,
      type: PLACE_TYPES[typeIndex],
      _dist: dLat * dLat + dLng * dLng,
    });
  }

  results.sort((a, b) => a._dist - b._dist);
  return results.slice(0, MAX_RESULTS);
}

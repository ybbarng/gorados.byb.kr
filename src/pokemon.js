var Platform = require('platform');
var platform = Platform.os.family;

var Pokedex = require('./pokedex_korean.json');
var Moves = require('./pokemon_moves.json');

function getIvPerfection(attack, defence, stamina) {
  return (Number(attack) + Number(defence) + Number(stamina)) / 45 * 100;
}

function getIvRank(iv_perfection) {
  var ranks = ['SSS', 'SS', 'S', 'A', 'B', 'C', 'D', 'E'];
  var perfections = [100, 95, 90, 80, 60, 40, 0];
  for (var i = 0; i < perfections.length; i++) {
    if (iv_perfection >= perfections[i]) {
      return ranks[i];
    }
  }
  return 'E';
}

function pad(n) {
  return (n < 10 ? '0' : '') + n;
}

function getMapDom(href, imageSrc, newTap) {
  var newTapStr = '';
  if (newTap) {
    newTapStr = ' target="_blank"';
  }
  return '<a href="' + href + '"' + newTapStr + ' class="map-app-icon-wrapper">' +
    '<image src="' + imageSrc + '" class="map-app-icon">' +
    '</a>';
}

function getKakaoMap(latitude, longitude) {
  var imageSrc = 'static/images/maps/kakao-map.png';
  var href = '';
  var hrefs = {
    desktop: 'http://map.daum.net/?q=' + latitude + ',' + longitude,
    mobile: 'daummaps://route?ep=' + latitude + ',' + longitude + '&by=CAR'
  };
  if (['Android', 'iOS'].indexOf(platform) !== -1) {
    href = hrefs.mobile;
  } else {
    href = hrefs.desktop;
  }
  return getMapDom(href, imageSrc, href === hrefs.desktop);
}

function getGoogleMap(latitude, longitude, label) {
  var imageSrc = 'static/images/maps/google-map.png';
  var hrefs = {
    desktop: 'https://www.google.co.kr/maps/place/' + latitude + ',' + longitude,
    Android: 'geo:?q=' + latitude + ',' + longitude + '(' + label + ')',
    iOS: 'comgooglemaps://?q=' + latitude + ',' + longitude
  };
  var href = hrefs.desktop;
  if (hrefs[platform]) {
    href = hrefs[platform];
  }
  return getMapDom(href, imageSrc, href === hrefs.desktop);
}

function getMapLinks(latitude, longitude, label) {
  var kakaoMap = getKakaoMap(latitude, longitude);
  var googleMap = getGoogleMap(latitude, longitude, label);
  return '<div class="map-apps">' + kakaoMap + googleMap + '</div>';
}

exports.toString = function(pokemon) {
  var name = Pokedex[pokemon['pokemon_id']] || pokemon['pokemon_id'];
  if (pokemon['disguise'] === '1') {
    name = Pokedex['132'] + '(' + name + '(으)로 변신)';
    pokemon['pokemon_id'] = '132';
  }
  var perfection = getIvPerfection(
    pokemon['attack'],
    pokemon['defence'],
    pokemon['stamina']);
  var rank = getIvRank(perfection);
  var perfectionStr = perfection.toFixed(1);
  var move1 = Moves[pokemon['move1']] || pokemon['move1'];
  var move2 = Moves[pokemon['move2']] || pokemon['move2'];

  var delta = Number(pokemon['despawn']) - (Date.now() / 1000);
  var despawnStr = '';
  if (delta > 0) {
    despawnStr = pad(parseInt(delta / 60)) + ':' + pad(parseInt(delta % 60));
  } else {
    despawnStr = '사라졌습니다.';
  }
  return '<h2>' + name + '</h2> ' +
    '<b>개체치</b>: '+ rank + ' (' + perfectionStr + '%: ' + pokemon['attack'] + '/' + pokemon['defence'] + '/' + pokemon['stamina'] + ')<br>' +
    '<b>남은 시간</b>: ' + despawnStr + '<br>' +
    '<b>기술</b>: ' + move1 + '/' + move2 + '<br>' +
    'disguise: ' + pokemon['disguise'] + '<br>' +
    getMapLinks(pokemon['latitude'], pokemon['longitude'], name);
}

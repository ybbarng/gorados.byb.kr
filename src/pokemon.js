var Platform = require('platform');
var platform = Platform.os.family;

var Pokedex = require('./pokedex_korean.json');
var Moves = require('./pokemon_moves.json');

function calculateIvPerfection(attack, defence, stamina) {
  return (Number(attack) + Number(defence) + Number(stamina)) / 45 * 100;
}

function calculateIvRank(iv_perfection) {
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

// Pokemon Class
function Pokemon(pokemon) {
  this.id = pokemon['id'];
  this.name = Pokedex[pokemon['pokemon_id']] || pokemon['pokemon_id'];
  this.pokemon_id = pokemon['pokemon_id'];
  if (pokemon['disguise'] === '1') {
    this.pokemon_id = '132';
    this.name = Pokedex[this.pokemon_id] + '(' + this.name + '(으)로 변신)';
  }
  this.latitude = pokemon['latitude'];
  this.longitude = pokemon['longitude'];
  this.despawn = Number(pokemon['despawn']);
  this.disguise = pokemon['disguise'];
  this.attack = Number(pokemon['attack']);
  this.defence = Number(pokemon['defence']);
  this.stamina = Number(pokemon['stamina']);
  this.move1 = Moves[pokemon['move1']] || pokemon['move1'];
  this.move2 = Moves[pokemon['move2']] || pokemon['move2'];
  this.perfection = calculateIvPerfection(this.attack, this.defence, this.stamina);
  this.perfectionStr = this.perfection.toFixed(1);
  this.rank = calculateIvRank(this.perfection);
}

Pokemon.prototype.setMarker = function(marker) {
  this.marker = marker;
};

Pokemon.prototype.getRemainTime = function(_now) {
  var now = _now || Date.now() / 1000;
  return this.despawn - now;
};

Pokemon.prototype.getRemainTimeStr = function(now) {
  var delta = this.getRemainTime(now);
  var despawnStr = '';
  if (delta > 0) {
    despawnStr = pad(parseInt(delta / 60)) + ':' + pad(parseInt(delta % 60));
  } else {
    despawnStr = '사라졌습니다.';
  }
  return despawnStr;
};

Pokemon.prototype.getOpacity = function(now, dehighlight) {
  if (!dehighlight) {
    if (this.marker && this.marker.getPopup().isOpen()) {
      return 1;
    }
  }
  var diff = this.getRemainTime();
  var opacity = diff / 60 / 30 * 0.5 + 0.5;
  return opacity;
};

Pokemon.prototype.getLatLng = function() {
  return [this.latitude, this.longitude];
};

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

Pokemon.prototype.getPopupContents = function() {
  var despawnStr = this.getRemainTimeStr();
  return '<h2>' + this.name + '</h2> ' +
    '<b>개체치</b>: ' + this.rank + ' (' + this.perfectionStr + '%: ' + this.attack + '/' + this.defence + '/' + this.stamina + ')<br>' +
    '<b>남은 시간</b>: <span class="despawn">' + despawnStr + '</span><br>' +
    '<b>기술</b>: ' + this.move1 + '/' + this.move2 + '<br>' +
    'disguise: ' + this.disguise + '<br>' +
    getMapLinks(this.latitude, this.longitude, this.name);
};

module.exports = Pokemon;

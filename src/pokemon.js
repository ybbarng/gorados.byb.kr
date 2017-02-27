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
  if (n < 10) {
    return '0' + n;
  }
  return '' + n;
}

exports.toString = function(pokemon) {
  var name = Pokedex[pokemon['pokemon_id']] || pokemon['pokemon_id'];
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
    'disguise: ' + pokemon['disguise'] + '<br>';
}

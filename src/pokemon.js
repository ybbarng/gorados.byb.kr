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

exports.toString = function(pokemon) {
  var perfection = getIvPerfection(
    pokemon['attack'],
    pokemon['defence'],
    pokemon['stamina']);
  var rank = getIvRank(perfection);
  var perfectionStr = perfection.toFixed(1);

  var delta = Number(pokemon['despawn']) - (Date.now() / 1000);
  var despawnStr = '';
  if (delta > 0) {
    despawnStr = parseInt(delta / 60) + ':' + parseInt(delta % 60);
  } else {
    despawnStr = '사라졌습니다.';
  }
  return '<b>' + pokemon['pokemon_id'] + '</b> ' + rank + ' (' + perfectionStr + '%: ' + pokemon['attack'] + '/' + pokemon['defence'] + '/' + pokemon['stamina'] + ')<br>' +
    '남은 시간: ' + despawnStr + '<br>' +
    pokemon['move1'] + '/' + pokemon['move2'] + '<br>' +
    'disguise: ' + pokemon['disguise'] + '<br>';
}

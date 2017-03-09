var Pokedex = require('./pokedex_korean.json');

exports.initFilter = function() {
  $('#filter-button a').click(exports.onClickFilterButton);
};

var initialized = false;
exports.onClickFilterButton = function() {
  $('#filters').fadeToggle();
  if (!initialized) {
    initFilters();
  }
};

var filter_max = 251;
function initFilters() {
  var $pokemon_list = $('#filter-list');
  for (var number in Pokedex) {
    if (number * 1 > filter_max) {
      break;
    }
    var $filter = $('<div class="filter">' +
      '<input type="checkbox" id="checkbox_' + number + '" value="' + number + '">' +
      '<label for="checkbox_' + number + '">' +
      '<img src="static/images/pokemons/' + number + '.png' + '" alt="' + Pokedex[number] + '">' +
      Pokedex[number] +
      '</label>' +
      '</div>');
    $pokemon_list.append($filter);
  }
  initialized = true;
}

var Pokedex = require('./pokedex_korean.json');

var onApply = null;
exports.initFilter = function(onApplyHandler) {
  $('#filter-button a').click(onClickFilterButton);
  $('#filter-apply').click(onClickFilterApply);
  onApply = onApplyHandler;
};

var initialized = false;
function onClickFilterButton() {
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
    var $filter = $('<li class="filter">' +
      '<input type="checkbox" id="checkbox_' + number + '" value="' + number + '">' +
      '<label for="checkbox_' + number + '">' +
      '<img src="static/images/pokemons/' + number + '.png' + '" alt="' + Pokedex[number] + '">' +
      number + ': ' + Pokedex[number] +
      '</label>' +
      '</li>');
    $pokemon_list.append($filter);
  }
  $('.filter').on('touchstart', function() {
    $(this).addClass('touch');
  });
  $('.filter').on('touchend', function() {
    $(this).removeClass('touch');
  });
  initialized = true;
}

var filters = [];
function onClickFilterApply() {
  filters = [];
  $('.filter input:checked').each(function() {
    filters.push(this.value);
  });
  if (onApply) {
    onApply();
  }
  $('#filters').fadeOut();
}

exports.getFilters = function() {
  return filters;
};

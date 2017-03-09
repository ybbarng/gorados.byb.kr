exports.initFilter = function() {
  $('#filter-button a').click(exports.showFilters);
};

exports.showFilters = function() {
  $('#filters').fadeToggle();
};

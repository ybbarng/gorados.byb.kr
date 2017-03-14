exports.init = function() {
  $('#type-chart-button a').click(onClickTypeChartButton);
  $('#type-chart').click(onClickTypeChart);
  $('#type-chart-popup').click(onClickTypeChartPopup);
};

function onClickTypeChartButton() {
  $('#type-chart').fadeToggle();
}

function onClickTypeChart() {
  $('#type-chart').fadeOut();
}

function onClickTypeChartPopup(e) {
  e.stopPropagation();
}

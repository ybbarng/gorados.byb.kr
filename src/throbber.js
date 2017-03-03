var nWaits = 0;

exports.showThrobber = function() {
  nWaits += 1;
  var $throbber = $('.throbber');
  if ($throbber.is(':visible')) {
    return;
  }
  $throbber.show();
  $throbber.fadeIn('slow');
}

exports.hideThrobber = function() {
  nWaits -= 1;
  if (nWaits !== 0) {
    return;
  }
  var $throbber = $('.throbber');
  if (!$throbber.is(':visible')) {
    return;
  }
  $throbber.fadeOut('slow', function() {
    $throbber.hide();
  });
}

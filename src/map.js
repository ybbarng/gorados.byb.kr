$(function() {
  var map = new daum.maps.Map($('#map')[0], {
    center: new daum.maps.LatLng(36.2683, 127.6358),
    level: 14
  });

  var clusterer = new daum.maps.MarkerClusterer({
      map: map,
      averageCenter: true,
      minLevel: 10,
      calculator: [13],
      styles:[{
          width: '30px',
          height: '30px',
          background: 'rgba(51, 204, 255, .8)',
          borderRadius: '15px',
          color: '#000',
          textAlign: 'center',
          fontWeight: 'bold',
          lineHeight: '31px'
      }]
  });

  var bounds = map.getBounds();
  var sw = bounds.getSouthWest();
  var ne = bounds.getNorthEast();
  var params = {
    min_latitude: sw.hb,
    min_longitude: sw.gb,
    max_latitude: ne.hb,
    max_longitude: ne.gb
  };

  $.get("data.json", params, function(data) {
    var markers = $(data.data).map(function(i, element) {
      return new daum.maps.Marker({
          position: new daum.maps.LatLng(element.lat, element.lng)
      });
    });
    clusterer.addMarkers(markers);
  });
});

$(function() {
  mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';
  var map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/dark-v9',
      center: [127.6358, 36.2683],
      zoom: 6
  });

  map.on('load', function() {
    map.addSource('portals', {
        type: 'geojson',
        data: 'data.geojson',
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 20
    });

		map.addLayer({
				'id': 'unclustered-pokestops',
				'type': 'symbol',
				'source': 'portals',
				'filter': ['all',
                      ['!has', 'point_count'],
                      ['==', 'icon', 'pokestop']],
				'layout': {
            'icon-image': 'marker-15'
				}
		});

		map.addLayer({
				'id': 'unclustered-gyms',
				'type': 'symbol',
				'source': 'portals',
				'filter': ['all',
                      ['!has', 'point_count'],
                      ['==', 'icon', 'gym']],
				'layout': {
            'icon-image': 'stadium-15'
				}
		});

		// Display the earthquake data in three layers, each filtered to a range of
		// count values. Each range gets a different fill color.
		var layers = [
				[150, '#f28cb1'],
				[20, '#f1f075'],
				[0, '#51bbd6']
		];

		layers.forEach(function (layer, i) {
				map.addLayer({
						'id': 'cluster-' + i,
						'type': 'circle',
						'source': 'portals',
						'paint': {
								'circle-color': layer[1],
								'circle-radius': 16,
                'circle-blur': 0.9,
                'circle-opacity': 0.9
						},
						'filter': i === 0 ?
								['>=', 'point_count', layer[0]] :
								['all',
										['>=', 'point_count', layer[0]],
										['<', 'point_count', layers[i - 1][0]]]
				});
		});

		// Add a layer for the clusters' count labels
		map.addLayer({
				'id': 'cluster-count',
				'type': 'symbol',
				'source': 'portals',
				'layout': {
						'text-field': '{point_count}',
						'text-font': [
								'DIN Offc Pro Medium',
								'Arial Unicode MS Bold'
						],
						'text-size': 12
				}
		});
  });
});

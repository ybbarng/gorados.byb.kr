"""
    data from: http://www2.pokemonsmap.com/map/
"""
import time
import json
import sqlite3

import requests

import jsonify


headers = {
    'User-Agent': 'Mozilla/5.0 (Windows; U; Windows NT 6.0; en-US) AppleWebKit/525.13 (KHTML, like Gecko) Chrome/0.2.149.29 Safari/525.13',
    'content-type': 'application/x-www-form-urlencoded',
    'Host': 'www2.pokemonsmap.com',
    'Referer': 'http://www2.pokemonsmap.com/map/',
}

def get(url, header=None, params=None, encoding='utf-8', print_url=False, cookies=None):
    my_headers = headers
    if header:
        for key in headers:
            my_headers[key] = headers[key]
    res = requests.get(url, headers=my_headers, params=params, cookies=None)
    if print_url:
        print(res.url)
    res.encoding = encoding
    return res.text

test = {
    'lat_start': 37.428388,
    'lat_end': 37.528388,
    'lng_start': 126.764500,
    'lng_end': 126.864500,
}

snu = {
    'lat_start': 37.4612113,
    'lat_end': 37.4683902,
    'lng_start': 126.9494231,
    'lng_end': 126.9620587,
}

seoul = {
    'lat_start': 37.428388,
    'lat_end': 37.701417,
    'lng_start': 126.764500,
    'lng_end': 127.183760
}


url = 'http://www2.pokemonsmap.com/map/scripts/getMarkers.php'
params = {
    'callback': 'jQuery22006645514662215135_1486001171505',
    'cmd': 'sp3',
    '_': 1486001171
}

region = seoul
print(region)

precision = 20
lat_start = int(region['lat_start'] * precision)
lat_end = int(region['lat_end'] * precision) + 1
lng_start = int(region['lng_start'] * precision)
lng_end = int(region['lng_end'] * precision) + 1

print('# of regions: {}'.format((lat_end - lat_start) * (lng_end - lng_start)))

n_portals = []
portals = []
for i in range(lat_start, lat_end):
    for j in range(lng_start, lng_end):
        location = {
            'lat_start': i / precision,
            'lat_end': (i + 1) / precision,
            'lng_start': j / precision,
            'lng_end': (j + 1) / precision,
        }
        for key, value in location.items():
            params[key] = value
        response = get(url, params=params)
        data = jsonify.jsonify(response)
        key = '{}-{}'.format(location['lat_start'], location['lng_start'])
        print(location, len(data))
        n_portals.append((key, len(data)))
        portals += data
        time.sleep(1)

with sqlite3.connect('../data.db') as conn:
    cur = conn.cursor()
    table_name = 'portal'

    cur.execute('''
CREATE TABLE IF NOT EXISTS {0} (
    id TEXT PRIMARY KEY,
    latitude REAL NOT NULL,
    longitude real NOT NULL,
    type TEXT CHECK (type IN ('pokestop', 'gym', '7-eleven', 'lotteria', 'angel-in-us')) NOT NULL
);
'''.format(table_name));
    cur.execute('CREATE INDEX IF NOT EXISTS {0}_latitude_idx ON {0} (latitude);'.format(table_name));
    cur.execute('CREATE INDEX IF NOT EXISTS {0}_latitude_idx ON {0} (longitude);'.format(table_name));

    insert_sql = 'INSERT OR REPLACE INTO {0} (id, latitude, longitude, type) values (?, ?, ?, ?);'.format(table_name);
    for data in portals:
        cur.execute(insert_sql, (data['id'], data['lat'], data['lng'], data['type']))
    cur.execute('SELECT COUNT(*) FROM {0};'.format(table_name));
    print('# of records: {}'.format(cur.fetchall()[0]))

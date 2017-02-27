import time
import json
import sqlite3

import requests

import jsonify


headers = {
    'User-Agent': 'Mozilla/5.0 (Windows; U; Windows NT 6.0; en-US) AppleWebKit/525.13 (KHTML, like Gecko) Chrome/0.2.149.29 Safari/525.13',
    'content-type': 'application/x-www-form-urlencoded'
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


# 'mons': '4,5,6,9,26,58,59,63,65,82,94,103,106,107,108,113,125,130,131,134,137,143,144,145,146,147,148,149,150,151'
# 'mons': '1,2,3,4,5,6,7,8,9,11,12,14,15,16,18,20,22,24,25,26,27,28,30,31,33,34,36,37,38,39,40,44,45,47,49,50,51,52,53,55,56,57,58,59,61,62,63,64,65,66,67,68,70,71,72,73,74,75,76,77,78,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,119,121,122,123,124,125,126,128,130,131,132,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151'
url = 'https://seoulpokemap.com/query2.php'
print(time.time())
params = {
    'since': '0',
    'mons': '1,2,3,4,5,6,7,8,9,11,12,14,15,18,20,22,24,25,26,27,28,30,31,33,34,36,37,38,39,40,44,45,47,49,50,51,52,53,55,56,57,58,59,61,62,63,64,65,66,67,68,70,71,72,73,74,75,76,77,78,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,119,121,122,123,124,125,126,128,130,131,132,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,162,163,164,166,168,169,170,171,172,173,174,175,176,178,179,180,181,182,184,185,186,188,189,190,192,193,195,196,197,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251'
}
headers = {
    'referer': 'https://seoulpokemap.com/?forcerefresh',
    'accept': '*/*',
    'x-requested-with': 'XMLHttpRequest'
}

response = get(url, params=params, header=headers)
pokemons = json.loads(response)
print(len(pokemons['pokemons']))

with sqlite3.connect('../data.db') as conn:
    cur = conn.cursor()
    table_name = 'pokemon'

    cur.execute('''
CREATE TABLE IF NOT EXISTS {0} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pokemon_id INTEGER NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    despawn INTEGER NOT NULL,
    attack INTEGER,
    defence INTEGER,
    stamina INTEGER,
    move1 INTEGER,
    move2 INTEGER
);
'''.format(table_name));
    cur.execute('CREATE INDEX IF NOT EXISTS {0}_pokemon_id_idx ON {0} (pokemon_id);'.format(table_name));
    cur.execute('CREATE INDEX IF NOT EXISTS {0}_latitude_idx ON {0} (latitude);'.format(table_name));
    cur.execute('CREATE INDEX IF NOT EXISTS {0}_latitude_idx ON {0} (longitude);'.format(table_name));
    cur.execute('CREATE INDEX IF NOT EXISTS {0}_despawn_idx ON {0} (despawn);'.format(table_name));

    insert_sql = 'INSERT OR REPLACE INTO {0} (pokemon_id, latitude, longitude, despawn, attack, defence, stamina, move1, move2) values (?, ?, ?, ?, ?, ?, ?, ?, ?);'.format(table_name);
    for data in pokemons['pokemons']:
        cur.execute(insert_sql, (data['pokemon_id'], data['lat'], data['lng'], data['despawn'], data['attack'], data['defence'], data['stamina'], data['move1'], data['move2']))
    cur.execute('SELECT COUNT(*) FROM {0};'.format(table_name));
    print('# of records: {}'.format(cur.fetchall()[0]))

import time
import json
import sqlite3

import cfscrape

from siphash import SipHash

import jsonify
from RepeatedTimer import RepeatedTimer


headers = {
    'User-Agent': 'Mozilla/5.0 (Windows; U; Windows NT 6.0; en-US) AppleWebKit/525.13 (KHTML, like Gecko) Chrome/0.2.149.29 Safari/525.13',
    'content-type': 'application/x-www-form-urlencoded'
}

sip_hash = SipHash()

k = 0xED9884ECA780EC95BC20E29DA4ED95B4


scraper = cfscrape.create_scraper()


def get(url, header=None, params=None, encoding='utf-8', print_url=False, cookies=None):
    if header is None:
        header = {}
    if params is None:
        params = {}
    my_headers = headers
    if header:
        for key in header:
            my_headers[key] = header[key]
    res = scraper.get(url, headers=my_headers, params=params, cookies=None)
    if print_url:
        print(res.url)
    res.encoding = encoding
    return res.text

since_file = 'since_{}.json'
def load_since(name):
    try:
        with open(since_file.format(name)) as f:
            return int(f.read().strip())
    except:
        return 0

def save_since(since, name):
    with open(since_file.format(name), 'w') as f:
        return f.write(since)

# 'mons': '4,5,6,9,26,58,59,63,65,82,94,103,106,107,108,113,125,130,131,134,137,143,144,145,146,147,148,149,150,151'
# 'mons': '1,2,3,4,5,6,7,8,9,11,12,14,15,16,18,20,22,24,25,26,27,28,30,31,33,34,36,37,38,39,40,44,45,47,49,50,51,52,53,55,56,57,58,59,61,62,63,64,65,66,67,68,70,71,72,73,74,75,76,77,78,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,119,121,122,123,124,125,126,128,130,131,132,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151'
urls = {
 'seoul': 'https://seoulpokemap.com/query2.php',
 'busan': 'https://busanpokemap.com/query2.php'
}
def get_pokemons(since, name, url):
    print('Fetching {} pokemons since {}'.format(name, since))
    params = {
        'since': since,
        'mons': '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251'
    }
    headers = {
        'referer': 'https://{}pokemap.com/'.format(name),
        'accept': '*/*',
        'authority': '{}pokemap.com'.format(name),
        'x-requested-with': 'XMLHttpRequest'
    }
    url = url + '?' + '&'.join(k + '=' + str(v) for k, v in params.items())
    response = get(url, header=headers)
    #with open('result.html', 'w') as f:
    #    f.write(response)
    response = json.loads(response)
    since = response['meta']['inserted']
    print('new since: {}'.format(since))
    save_since(str(since), name)
    print('New {} pokemons are collected.'.format(len(response['pokemons'])))
    return response['pokemons']

def save_pokemons(pokemons):
    print('Save pokemons')
    with sqlite3.connect('../data.db') as conn:
        cur = conn.cursor()
        table_name = 'pokemon'

        cur.execute('''
    CREATE TABLE IF NOT EXISTS {0} (
        id TEXT PRIMARY KEY,
        pokemon_id INTEGER NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        despawn INTEGER NOT NULL,
        disguise INTEGER,
        attack INTEGER,
        defence INTEGER,
        stamina INTEGER,
        move1 INTEGER,
        move2 INTEGER
    );
    '''.format(table_name));
        cur.execute('CREATE INDEX IF NOT EXISTS {0}_pokemon_id_idx ON {0} (pokemon_id);'.format(table_name));
        cur.execute('CREATE INDEX IF NOT EXISTS {0}_latitude_idx ON {0} (latitude);'.format(table_name));
        cur.execute('CREATE INDEX IF NOT EXISTS {0}_longitude_idx ON {0} (longitude);'.format(table_name));
        cur.execute('CREATE INDEX IF NOT EXISTS {0}_despawn_idx ON {0} (despawn);'.format(table_name));

        insert_sql = 'INSERT OR REPLACE INTO {0} (id, pokemon_id, latitude, longitude, despawn, disguise, attack, defence, stamina, move1, move2) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);'.format(table_name);
        for pokemon in pokemons:
            p_id = '{:02x}'.format(sip_hash.auth(k, ','.join([pokemon['pokemon_id'], pokemon['lat'], pokemon['lng'], pokemon['despawn']])))
            cur.execute(insert_sql, (p_id, pokemon['pokemon_id'], pokemon['lat'], pokemon['lng'], pokemon['despawn'], pokemon['disguise'], pokemon['attack'], pokemon['defence'], pokemon['stamina'], pokemon['move1'], pokemon['move2']))
        #cur.execute('DELETE FROM {0} WHERE despawn < {1};'.format(table_name, int(time.time())));
        #cur.execute('SELECT COUNT(*) FROM {0};'.format(table_name));
        #print('# of records: {}'.format(cur.fetchall()[0]))
    print('Saved')

def do_work(whole=False, save=False):
    since = 0
    for name, url in urls.items():
        if not whole:
            since = load_since(name)
        pokemons = get_pokemons(since, name, url)
        if save:
            save_pokemons(pokemons)


if __name__ == '__main__':
    save = True
    do_work(True, save)
    rt = RepeatedTimer(-1, 60, do_work, False, save)
    while True:
        text = input('input \'quit\' to shutdown\n')
        if text =='quit':
            rt.stop()
            break
    print('Shutdown...')


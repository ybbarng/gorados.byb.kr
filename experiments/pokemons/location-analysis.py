import time
import json
import sqlite3
from collections import defaultdict

import requests


stages = {}
with open('pokemon-rare.json') as f:
    stages = json.load(f)


locations = defaultdict(lambda: [0, 0, 0])
def callback(pokemon):
    # id, pokemon_id, latitude, longitude, despawn, attack, disguise, attack,
    # defence, stamina, move1, move2
    locations['{},{}'.format(pokemon[2], pokemon[3])][stages[str(pokemon[1])] - 1] += 1

def load_pokemons(callback):
    print('Load pokemons')
    with sqlite3.connect('../data.db') as conn:
        cur = conn.cursor()
        table_name = 'pokemon'

        cur.execute('SELECT * FROM {0};'.format(table_name));
        while True:
            pokemon = cur.fetchone()
            if pokemon is None:
                break
            callback(pokemon)

def run():
    load_pokemons(callback)
    data = []
    for k, v in locations.items():
        data.append((v, tuple(map(float, k.split(',')))))

    data.sort(key=lambda x: -x[0][2])
    with open('location-analysis-rare.json', 'w') as f:
        json.dump(data, f)


if __name__ == '__main__':
    run()
    print('Shutdown...')


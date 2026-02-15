import json

from siphash import SipHash


sip_hash = SipHash()

k = 0x0f0e0d0c0b0a09080706050403020100

with open('id.json') as f:
    ids = json.load(f)

hashes = set()
for id_ in ids:
    hash_ = sip_hash.auth(k, id_)
    print(hash_)
    break
    if hash_ in hashes:
        print('conflict')
    hashes.add(hash_)

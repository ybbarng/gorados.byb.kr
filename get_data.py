import requests

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


url = 'http://www2.pokemonsmap.com/map/scripts/getMarkers.php'
params = {
    'callback': 'jQuery22006645514662215135_1486001171505',
    'cmd': 'sp3',
    'lat_start': 37.428388,
    'lat_end': 37.701417,
    'lng_start': 126.764500,
    'lng_end': 127.183760,
    '_': 1486001171
}
'''
params = {
    'callback': 'jQuery22006645514662215135_1486001171505',
    'cmd': 'sp3',
    'lat_start': 37.4612113,
    'lat_end': 37.4683902,
    'lng_start': 126.9494231,
    'lng_end': 126.9620587,
    '_': 1486001171
}
'''

with open('data.json', 'w') as f:
    f.write(get(url, params=params))


import json

def jsonify(response):
    json_str = response.replace('jQuery22006645514662215135_1486001171505(', '').replace(')', '')
    data = json.loads(json_str)['list']
    print('# of elements: {}'.format(len(data)))
    for element in data:
        element['id'] = '{},{}'.format(element['lat'], element['lng'])
        if element['level'] == '1':
            element['type'] = 'pokestop'
        elif element['level'] == '100':
            element['type'] = 'gym'
        else:
            print('Wrong level: {}'.format(element['level']))
        del element['level']
    return data

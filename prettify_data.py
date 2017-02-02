import json

with open('data_origin.json', 'r') as f:
    f.readline()
    data = f.readline()
    data = data.replace('jQuery22006645514662215135_1486001171505(', '').replace(')', '')
    data = json.loads(data)

with open('data.json', 'w') as f:
    json.dump(data, f, indent='    ')

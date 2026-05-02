import http.client
import json

def post_mock():
    conn = http.client.HTTPConnection('localhost', 8000, timeout=10)
    payload = json.dumps({"name": "quick-run"})
    headers = {'Content-Type': 'application/json'}
    try:
        conn.request('POST', '/api/runs/mock', body=payload, headers=headers)
        resp = conn.getresponse()
        data = resp.read()
        print('Status:', resp.status)
        print('Reason:', resp.reason)
        print('Headers:', resp.getheaders())
        print('Body length:', len(data))
        try:
            print('Body JSON:', json.loads(data.decode('utf-8')))
        except Exception as e:
            print('Body decode error:', e)
            print('Raw body repr:', repr(data))
    except Exception as e:
        print('Request error:', e)

if __name__ == '__main__':
    post_mock()

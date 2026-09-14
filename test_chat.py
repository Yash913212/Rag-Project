import urllib.request
import json
try:
    req = urllib.request.Request("http://127.0.0.1:8000/chat", data=b'{"query":"hello"}', headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as response:
        print(response.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print("Response Body:", e.read().decode())

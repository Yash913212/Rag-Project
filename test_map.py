import requests

try:
    response = requests.get('http://localhost:8000/map')
    print("Status:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print(e)

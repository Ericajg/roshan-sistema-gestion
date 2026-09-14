import requests

url = "http://127.0.0.1:5000/api/servicios"

headers = {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91c3VhcmlvIjoxLCJ1c3VhcmlvIjoicmlraSIsImV4cCI6MTc4OTA0MTY0MH0.wMdd9vMLnGT_PXDn2xrFJWzRQc3odX3IMh_2jRewyA4"
}

respuesta = requests.get(url, headers=headers)

print("STATUS:", respuesta.status_code)
print("BODY:", respuesta.text)
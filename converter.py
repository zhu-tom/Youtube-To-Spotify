import requests
import re

api_key = "AIzaSyBS-qmWRdovYlxNGHL_g-UQOIHGQBXl7nY"

playlist_url = "https://www.youtube.com/playlist?list=PL1CEzmuWnTyPHhnt7cv1seqJG7FkyMHty"
regex = r"list=(.*)&*"
playlist_id = re.search(regex, playlist_url)
if playlist_id != None: 
    playlist_id = playlist_id.group(1)

titles = []
url = f"https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId={playlist_id}&key={api_key}"

result = requests.get(url).json()
for item in result['items']:
    titles.append(item['snippet']['title'])
        
try:
    nextPageToken = result['nextPageToken']
    while True:
        url = f"https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&pageToken={nextPageToken}&playlistId={playlist_id}&key={api_key}"
        result = requests.get(url).json()
        for item in result['items']:
            titles.append(item['snippet']['title'])
        try: 
            nextPageToken = result['nextPageToken']
        except KeyError:
            break
except KeyError:
    pass

print(len(titles))


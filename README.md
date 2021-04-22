
### Installation
```bash
git clone https://github.com/gilphilbert/falk-ns.git
cd falk-ns
npm install
```

Alternatively, build a docker container:
```bash
git clone https://github.com/gilphilbert/falk-ns.git
cd falk-ns
docker build -t falkns
docker run -D -p3000:3000 -v /path/to/your/music:/music -v /path/for/config/data:/app/data falkns:latest
```
The container will not support SSL, it runs purely over HTTP on port 3000. If you're opening this up to the world, I suggest the use of a proxy. I use this one: https://hub.docker.com/r/jwilder/nginx-proxy. It's stateless, just open port 443 from your router to your host and open 443 on the proxy. On the falk-ns container, add:
* VIRTUAL_PROTO = http
* VIRTUAL_PORT = 80
* VIRTUAL_HOST = your.personal.url

### Running
```bash
npm start
```
### Setup
Create the admin password then login. Once you're in, head to http://localhost:3000 and click on "Settings" on the left. Where it says "directories" click on "Add directory" and find the directory you want to add, then click add. Finally, click on "Update database".

### TODO
* Group songs by disc, not just order by track order
* Where are multi-albums?
* Event service
    * Notification when library is updating
* Search
* Better progress bar
* Queue
    * Clear queue
    * Add song to queue (enqeue)
    * Play song next (enqueue)
    * Clear and play album
    * Enqueue whole album
* Playback control
    * Random
    * Repeat
* Playlists
    * Add song to playlist
    * Add album to playlist
    * Create playlist from queue
    * Add queue to playlist
    * Remove song from playlist
    * Remove playlist
    * Auto playlists
        * Most played
        * Most recently added
        * Favorites
* Restore queue after refresh (warning, this will also be browser/tab close/open)
    * Need a localstorage value for "restore playing state"
    * Save:
        * get list, convert playing to a variable (instead of an observable), stringify and store
        * store playing state and seek position (will need to be updated in progress function)
    * Restore:
        * get the json string and parse it
        * convert the "playing" field to an observable -> get the queue position from the song with "playing" set to true
        * repopulate queue
        * set the player seek position
        * if "restore playing state" then start playing if it's true
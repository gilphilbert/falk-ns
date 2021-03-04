
### Installation
```bash
git clone https://github.com/gilphilbert/falk-ns.git
cd falk-ns
npm install
```
Generate some keys for authentication. When asked, do not enter a passphrase, just press [ ENTER ]
```bash
ssh-keygen -t rsa -b 4096 -m PEM -f jwtRS256.key
openssl rsa -in jwtRS256.key -pubout -outform PEM -out jwtRS256.key.pub
```

### Running
```bash
npm start
```
### Setup
Create the admin password then login. Once you're in, head to http://localhost:3000 and click on "Settings" on the left. Where it says "directories" click on "Add directory" and find the directory you want to add, then click add.

### Scanning the database
It's a bit manual at the moment, new button coming soon:
https://localhost:3000/api/scan

### TODO
Lots!
* User authentication
    * Admin account at setup (done) [REQUIRES WARNINGS]
    * Login (done) [REQUIRES WARNINGS]
    * User database
        * Add user
        * Edit user
        * Remove user
    * User-based database entries (use a "users" array per entry with the userIDs in an array)
* Artist art (will need to come from an online source, musicbrainz?)
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
* Home page
* Artist page (header image, etc)
* Package as docker container
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
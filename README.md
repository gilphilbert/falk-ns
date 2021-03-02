
### Installation
```
git clone https://github.com/gilphilbert/falk-ns.git
cd falk-ns
npm install
```

### Running
```
npm start
```

### Scanning the database
It's a bit manual at the moment:
https://localhost:3000/api/scan

### Changing the file location
You'll need to edit `app.js` and add in the correct directory

### TODO
Lots!
* Choose folders to scan
* Rescan existing files
* Play queue management
* User authentication
* User-based database entries (use a "users" array per entry with the userIDs in an array)
* Images, need to be extracted from files - need to decide whether to add art from online, probably yes but later perhaps
* Page titles
* Playback control (just play/pause at the moment) - basically whole bottom bar
* Playlists
* Settings page
* Home page

## General
* Mobile Home controls working (play, pause, skip, repeat, shuffle)
* Search (global / current view)
* Save queue on shutdown
* Home screen
* Queue
* Share mounting

## Playback
* Rearrange playing queue
* Pause issue (restarting in UI)
* Shuffle
* Repeat

## Playlists
* Rearrange playlist
* Auto playlists
 * Most recent

## Library
* Play album button

## Settings
* Change default behavior (settings)

## Database
* Which method of showing artists is reliably faster (bearing in mind complication of extra collection)
* Better handling of files that already exist in DB - don't bother reading the file if it's already present
 --> Use database.getByPath(path) and check to see if there's a result
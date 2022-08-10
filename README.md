# Find Lucy

This short-term project existed to help produce GPX tracklogs [like this](https://theimprobable.blog/find/?4c)
([more examples](https://theimprobable.blog/find/)) showing [Robin](https://theimprobable.blog/)'s journey from
Lands End to John o'Groats during May through July 2021.

## Understand

This is hacky code that was never intended to be shared. Use or adapt at your own risk.

How it works:

1. `schema.sql` creates two tables, `find_expedition` (list of expeditions) and `find` (list of points associated with each).
2. `find-lucy.rb` ran on a cron schedule, pulling the latest GPS position from the tracker and saving it to a MySQL database
3. `feed.php` exposes this as an RSS feed; `location.php` exposes a list of expeditions or, if an expedition is selected, a list of points in that expedition
4. `find.js` uses `location.php` plus LeafletJS to render a pretty map
5. `index.html` loads `find.js`

## Missing

Stuff removed from the live version for this published version:

- Tracker domain name
- DB credentials
- Code to send a low battery text message (find-lucy.rb)
- Mapbox API keys (find.js)
- Some magic code to specifically exclude strings of points from the output tracklogs without having to set the `suppress` field on them
- Some magic code to make it possible for Robin (or me) to upload photos/videos "attached" to points
- Data, media etc.

#!/danq/dot-rvm/gems/ruby-2.6.3@find-luck/wrappers/ruby
require 'bundler/setup'
Bundler.require(:default)
require 'json'
require 'date'

puts "Running at #{Time.now}"

DB = Mysql2::Client.new(host: 'localhost', database: '52reflect', username: '52reflect', password: 'MYSQL PASSWORD GOES HERE')
FROM = (Date.today).to_s
TO = (Date.today+1).to_sf
USER_AGENT = 'Find Lucy/theimprobable.blog'
AUTH_URL = %Q[http://TRACKER DOMAIN GOES HERE:8082/api/server]
API_KEY = 'PERRYSCOPE API KEY GOES HERE'
SESSION_URL = %Q[http://TRACKER DOMAIN GOES HERE:8082/api/session?token=#{API_KEY}]
URL = %Q[http://TRACKER DOMAIN GOES HERE:8082/api/reports/route?deviceId=49&from=#{FROM}T00%3A00%3A00.000Z&to=#{TO}T00%3A00%3A25.798Z]
BATTERY_FILE = 'find-lucy-battery-warning.txt'

battery_warning_sent_today = Date.parse(File.read(BATTERY_FILE).strip) == Date.today

print "Acquiring cookie: "
http = Curl::Easy.perform(AUTH_URL) do |curl|
  curl.headers['User-Agent'] = USER_AGENT
end
COOKIE = http.header_str.split("\r\n").find{|h|h=~/^Set-Cookie: /}.split(/(: |; )/)[2]
puts COOKIE

puts "Getting session..."
http = Curl::Easy.perform(SESSION_URL) do |curl|
  curl.headers['User-Agent'] = USER_AGENT
  curl.headers['Cookie'] = COOKIE
end

http = Curl::Easy.perform(URL) do |curl|
  curl.headers['User-Agent'] = USER_AGENT
  curl.headers['Accept'] = 'application/json'
  curl.headers['Cookie'] = COOKIE
end
json = JSON.parse(http.body_str)

SQL = DB.prepare('INSERT IGNORE INTO find (datetime, latitude, longitude, course, battery) VALUES (?, ?, ?, ?, ?)')
imports = 0
json.each do |pos|
  SQL.execute pos['deviceTime'], pos['latitude'], pos['longitude'], pos['course'], pos['attributes']['batteryLevel']
  imports += 1

  if(!battery_warning_sent_today && ((pos['attributes']['batteryLevel'] || 100) <= 20))
    puts "Battery level is #{pos['attributes']['batteryLevel']}%. Texting Robin."
    # REMOVED: API call was here to send a text message when the tracker's battery was low
    File.open(BATTERY_FILE, 'w'){|f| f.print(Date.today)}
    battery_warning_sent_today = true
  end
end
puts "Imported #{imports} positions."

output = DB.query('SELECT * FROM find WHERE `datetime` > SUBDATE(NOW(), INTERVAL 3 DAY)').to_a
File.open('/danq/52reflect.blog/public/find/location.json', 'w'){|f| f.puts output.to_json }
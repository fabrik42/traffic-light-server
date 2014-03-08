# Traffic Light Server

This is a small node.js server with the purpose to configure and serve a light configuration to a real traffic light, like this one:

![traffic light at the flinc office](http://i.imgur.com/3ZX9R.jpg)

It is meant to be used with a corresponding client to read the light and do something awesome with it.

An example is a [real traffic light controlled with a Raspberry PI](https://github.com/fabrik42/traffic-light-client-raspberry) that fetches the light configuration of this app and displays it on a real traffic light.

## Modes

At the moment two modes for setting the lights are supported:

* `public` changes the traffic light using the web UI or the JSON API.

* `ci` uses [webhooks from TravisCI](http://docs.travis-ci.com/user/notifications/#Webhook-notification) to set the lights.

## Setup

This app ist meant to run on heroku using the RedisToGo add-on for persistence.

Besides, there are two environment variables that need to be set:

* `heroku config:set TRAVIS_CI_SECRET=YOURSECRET` Sets the secret URL for travis CI webhooks.
* `heroku config:set LIGHT_MODE=public` Sets the mode of the traffic light server. Possible values: `public` or `ci`.

## Controlling the traffic light configuration

### Web UI

![web ui screenshot](http://imgur.com/CohDwAd.png)

When in `public` mode, the light configuration can be changed by clicking on the corresponding lights on the UI.

In `ci` mode the web UI is read-only and only shows the current status.

### JSON API

#### GET `/lights`

```json
{
  "mode": "public", // read only (set via heroku config:set LIGHT_MODE=public|ci)
  "red": true,      // boolean
  "yellow": true,   // boolean
  "green": true     // boolean
}
```


#### POST `/lights`

```json
{
  "red": true,      // boolean
  "yellow": true,   // boolean
  "green": true     // boolean
}
```

curl example:

```
curl -i -H "Content-Type: application/json" -X POST -d '{ "yellow" : true, "green" : true, "red" : true }' https://yourapp.herokuapp.com/lights
```

### TravisCI webhooks

Pick and set a random secret for the webhook URL:

```
heroku config:set TRAVIS_CI_SECRET=YOURSECRET
```

Then add the webhook to your `.travis.yml` file:

```yaml
notifications:
  webhooks:
    urls:
      - https://yourapp.herokuapp.com/travis/YOURSECRET
    on_success: always
    on_failure: always
    on_start: true
```

### Change mode

Just change the heroku env variable like this `heroku config:set LIGHT_MODE=public`, heroku will automatically restart your app.

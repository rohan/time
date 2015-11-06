# Time

A task scheduler built on top of meteor.js.

## Installation

```
curl https://install.meteor.com/ | sh # if you haven't installed meteor yet
git clone http://github.com/rohan/time.git
cd time
meteor
```

To get a shell into the app, in a separate window:
```
cd path/to/time
meteor shell
```

Google Calendar API calls won't work yet. You need to create a file in `server/`
called `accounts.js`, and have the following code:

```
ServiceConfiguration.configurations.upsert(
  {service: "google"},
  {$set:
    {
      clientId: YOUR_CLIENT_ID,
      secret: YOUR_CLIENT_SECRET
    }
  }
);
```

You can get `YOUR_CLIENT_ID` and `YOUR_CLIENT_SECRET` by creating a new Google
Developer project.

## Collections

The `Tasks` collection stores all of the tasks. There is no defined schema,
    although this will be fixed later.

The `Calendars` collection stores calendars from Google Calendar. The idea is to
make this a cache of what's returned from the Google API endpoint, but
invalidating the cache is tricky.

The `Projects` collection stores the projects that tasks can fall into. Each
task has a parent project.

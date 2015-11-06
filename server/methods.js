var log = function (str) {
  console.log("[server] " + str);
}

Meteor.methods({
  // takes a task ID, returns the date it should be scheduled
  // returns null if no date found
  // returns the date if date found
  taskSchedule: function(taskId) {
    var task = Tasks.findOne(taskId);
    var now = moment();
    var due = moment(task.date);
    var events = [];

    var calendars = Calendars.find({checked : true}).fetch();
    var cal_length = calendars.length;

    // the calendar we're going to add Taskless events to
    var taskless_calendar_id = Calendars.findOne({summary : "Taskless"}).id;

    // user has to select at least one calendar to draw events from
    // all calendars are selected by default
    if (cal_length == 0) {
      alert("Please select at least one calendar.");
      return null;
    }

    for (var i = 0; i < cal_length; i++) {
      var id = calendars[i].id;
      var request_url = "/calendar/v3/calendars/" + id + "/events";

      var start_date_string = now.toISOString();
      var end_date_string = due.toISOString();

      if (now.isAfter(due)) {
        start_date_string = now.toISOString();
        end_date_string = now.add(7, 'days').toISOString();
      }

      // find all tasks between now and the due date
      var ev = GoogleApi.get(request_url,
        { params : {
          timeMin: start_date_string,
          timeMax: end_date_string,
          orderBy: "startTime",
          singleEvents: true
        }});

      ev = ev.items;
      var ev_length = ev.length;
      for (var j = 0; j < ev_length; j++) {
        var e = ev[j];
        if (e.start == undefined || e.end == undefined) {
          // these are full day events, I think
          log(e.summary);
          break; // don't worry about them
        } else if (e.start.dateTime == undefined || e.end.dateTime == undefined) {
          break;
        }

        var entry = { start : moment(e.start.dateTime), end : moment(e.end.dateTime), name : e.summary };
        events.push(entry);
      }
    }

    // sort increasing in time across all calendars
    // TODO: optimize to sort on insert
    events.sort(function(a,b) {
      return a.start - b.start;
    });

    // add a new event to represent the last time
    events.push({ start : due,
      end : due.getTime() + 1000*60,
      name : "__END__"
    });

    // map gap length to event end date
    var gaps_list = {};

    var length = events.length;
    for (var i = 1; i < length; i++) {
      var gap = events[i].start - events[i-1].end;
      if (gap <= 0) continue; // if the events overlap
      gap /= 1000*60; // convert to minutes
      if (!(gap in gaps_list)) {
        gaps_list[gap] = [];
      }

      gaps_list[gap].push(events[i-1].end);
    }

    var index = Infinity;
    console.log(gaps_list);

    for (var key in gaps_list) {
      if (gaps_list.hasOwnProperty(key)) {
        console.log(key + " " + task.length + " " + index);
        if (parseInt(key) >= task.length && parseInt(key) < index) {
          index = parseInt(key);
          console.log(index);
        }
      }
    }
    // index should be the shortest gap start time
    if (index == Infinity && Object.size(gaps_list) != 0) { // if it can't find a gap big enough AND there are gaps
      // this gets here if gaps_list is empty
      return task.date; // no time found
    }

    var round_minutes = 15;
    var time;
    if (index == Infinity && Object.size(gaps_list) == 0) {
      time = new Date(Math.ceil(nowDate.getTime() / (round_minutes*60*1000)) * (round_minutes*60*1000));
    } else {
      var times = gaps_list[index];
      time = times[0];
    }
    console.log(task.length + " " + index + " " + time);

    if (taskless_calendar_id === null) { // if the taskless calendar doesn't exist, create it
      console.log("getting cal id");
      var id = GoogleApi.post("/calendar/v3/calendars", { "data" : { "summary" : "Taskless" } });
      taskless_calendar_id = id.id;
    }

    request_url = "/calendar/v3/calendars/" + taskless_calendar_id + "/events";
    var end = new Date(time.getTime() + task.length * 60 * 1000);
    
    var result = GoogleApi.post(request_url, {
      data : { 
        summary : task.title, 
        start : { dateTime : time.toISOString() }, 
        end: { dateTime: end.toISOString() } 
      }
    });

    var final_id = result.id;
    var out = Date.create(result.start.dateTime);
    Tasks.update(taskId, {$set : {scheduledDate : out, calendarId: final_id }});
    return out;
  },

  updateCalendars: function() {
    url = "/calendar/v3/users/me/calendarList";
    var calendars = GoogleApi.get(url);

    calendars = calendars.items;
    var cal_length = calendars.length;

    for (var i = 0; i < cal_length; i++) {
      var id = calendars[i].id;
      if (id.indexOf("#") != -1) continue; // contacts calendar is buggy

      var calendar = {
        summary : calendars[i].summary,
        id : calendars[i].id,
        userId : Meteor.user()._id,
        submitted : new Date(),
        checked : true,
      }

      Calendars.update({summary : calendars[i].summary, userId : Meteor.user()._id}, calendar, {upsert: true});
    }

    return true;
  },
})
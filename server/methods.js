var log = function (str) {
  console.log("[server] " + str);
}

Meteor.methods({
  // takes a task ID, returns the date it should be scheduled
  // returns null if no date found
  // returns the date if date found
  taskSchedule: function(taskId, reschedule) {
    var task = Tasks.findOne(taskId);
    var now = moment();

    if (reschedule) {
      var scheduledDate = task.scheduledDate;
      if (scheduledDate !== undefined) {
        now = moment(scheduledDate).add(task.length, 'h');
      }
    }

    log("starting search at " + now.format());

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
          log("detected suspected full-day event: " + e.summary);
          break; // don't worry about them
        } else if (e.start.dateTime == undefined || e.end.dateTime == undefined) {
          break;
        }

        var entry = { start : moment(e.start.dateTime), end : moment(e.end.dateTime), name : e.summary };
        events.push(entry);
      }
    }

    // add bedtimes
    var bedtime_start = moment(now).hour(0).minute(0).second(0);
    var bedtime_end = moment(bedtime_start).add(8, 'h');

    if (now.isBetween(bedtime_start, bedtime_end)) {
      // it's bedtime now, do nothing
    } else {
      if (now.isAfter(bedtime_start)) {
        // increase everything by a day
        bedtime_start.add(1, 'd');
        bedtime_end.add(1, 'd');
      }
    }

    var bedtime_event = {
      start: bedtime_start,
      end: bedtime_end,
      name: "__BEDTIME__"
    };

    while (due.isBefore(bedtime_event.start)) {
      // add bedtime blocks for every day between now and when the event is due
      events.push(bedtime_event);
      bedtime_event.start.add(1, 'd');
      bedtime_event.end.add(1, 'd');
    }

    if (due.isBetween(bedtime_event.start, bedtime_event.end)) {
      // if it's due during bedtime, make this the last one
      bedtime_event.name = "__END__"
      events.push(bedtime_event);
    } else {
      // otherwise, add a new event to represent the due time
      events.push({ start : due,
        end : due.add(1, 'm'),
        name : "__END__"
      });
    }

    // sort increasing in time across all calendars
    events.sort(function(a,b) {
      return a.start - b.start;
    });

    // map gap length to event end dates, sorted by earliest
    var gaps_list = {};

    var length = events.length;
    for (var i = 1; i < length; i++) {
      var gap = events[i].start - events[i-1].end;
      if (gap <= 0) continue; // if the events overlap
      gap /= 1000*60; // convert to minutes
      gap = Math.floor(gap); // round down
      if (!(gap in gaps_list)) {
        gaps_list[gap] = [];
      }

      gaps_list[gap].push(events[i-1].end);
    }

    var smallest_gap = Infinity;
    console.log(gaps_list);

    // search the map
    for (var gap_size in gaps_list) {
      if (gaps_list.hasOwnProperty(gap_size)) {
        console.log(gap_size + " " + task.length + " " + smallest_gap);
        // if the task fits in the gap and is smaller than previous gap size
        if (parseInt(gap_size) >= task.length && parseInt(gap_size) < smallest_gap) {
          smallest_gap = parseInt(gap_size);
          console.log("updated smallest gap size to " + smallest_gap);
        }
      }
    }

    log("size of gap list: " + Object.size(gaps_list));

    if (smallest_gap == Infinity && Object.size(gaps_list) != 0) { // if it can't find a gap big enough AND there are gaps
      return task.date; // no time found
    }

    var round_minutes = 15;
    var time;
    if (smallest_gap == Infinity && Object.size(gaps_list) == 0) {
      // no gaps == no events between now and due date, schedule ASAP
      time = now;
    } else {
      // find the earliest event with smallest_gap free minutes after it
      var times = gaps_list[smallest_gap];
      time = times[0];
    }

    // round time to nearest round_minutes-increment
    time.minute(Math.ceil(time.minute() / round_minutes) * round_minutes);

    if (taskless_calendar_id === null) { // if the taskless calendar doesn't exist, create it
      console.log("getting cal id");
      var id = GoogleApi.post("/calendar/v3/calendars", { "data" : { "summary" : "Taskless" } });
      taskless_calendar_id = id.id;
    }

    request_url = "/calendar/v3/calendars/" + taskless_calendar_id + "/events";
    var end = moment(time).add(task.length, 'h');
    
    var result = GoogleApi.post(request_url, {
      data : { 
        summary : task.name, 
        start : { dateTime : time.toISOString() }, 
        end: { dateTime: end.toISOString() } 
      }
    });

    var final_id = result.id;
    var out = Date.create(result.start.dateTime);
    Tasks.update(taskId, {$set : {scheduledDate : out, calendarId: final_id }});
    return out;
  },

  taskDelete: function (taskId) {
    var id = Tasks.findOne(taskId).calendarId;
    var taskless_calendar_id = Calendars.findOne({summary : "Taskless"}).id;
    var result = GoogleApi.delete("/calendar/v3/calendars/" + taskless_calendar_id + "/events/" + id);
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
        submitted : now,
        checked : true,
      }

      Calendars.update({summary : calendars[i].summary, userId : Meteor.user()._id}, calendar, {upsert: true});
    }

    return true;
  },
})
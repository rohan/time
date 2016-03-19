Template.taskItem.helpers({
  dateFmt: function () {
    var date = moment(this.date);
    return date.format("MMM Do YYYY @ h:mm A");
  },

  schedDateFmt: function () {
    var date = moment(this.scheduledDate);
    return date.format("MMM Do YYYY @ h:mm A");
  },

  pastDue: function () {
    var date = moment(this.date);
    return moment(date).isBefore() // empty argument is current date
  }
})

Template.taskItem.events({
  "click .title-td": function () {
    $("#task-item-" + this._id).hide();
    $("#edit-task-" + this._id).show();
    $("#task-edit-name-" + this._id).focus();
  },

  "click .date-td": function () {
    $("#task-item-" + this._id).hide();
    $("#edit-task-" + this._id).show();
    $("#task-edit-due-date-" + this._id).focus();
  },

  "click #done-button": function (e) {
    e.preventDefault();
    var id = this._id;
    console.log(id);
    Tasks.update({_id: id}, {$set: {done: true}});
    Materialize.toast('Task id ' + id + ' marked as complete!', 4000);
  },

  "click #del-button": function (e) {
    e.preventDefault();
    var id = this._id;
    console.log(id);
    Tasks.remove({_id: id});
    Materialize.toast('Task id ' + id + ' removed!', 4000);
  },

  "click #sched-button": function (e) {
    e.preventDefault();
    var id = this._id;
    console.log(id);
    Tasks.update(id, {$set: {scheduling: true}});
    Meteor.call("taskSchedule", id, false, function (err, res) {
      if (err) {
        console.log("error scheduling task " + id + ": " + err.message);
        Tasks.update(id, {$set: {scheduling: false}});
      } else {
        if (res == this.date) {
          Materialize.toast("Unable to schedule task, due date is too close");
        }
        Materialize.toast("Task id " + id + " scheduled!", 4000);
        Tasks.update(id, {$set: {scheduling: false}});
      }
    });
  },

  "click #resched-button": function (e) {
    e.preventDefault();
    var id = this._id;
    console.log(id);
    
    // remove previous scheduled task
    Meteor.call("taskDelete", id, function (err, res) {
      if (err) {
        console.log("error unscheduling task " + id + ": " + err.message);
      } else {
        Materialize.toast("Task id " + id + " unscheduled!", 4000);
      }
    });

    Tasks.update(id, {$set: {scheduling: true}});
    Meteor.call("taskSchedule", id, true, function (err, res) {
      if (err) {
        console.log("error scheduling task " + id + ": " + err.message);
        Tasks.update(id, {$set: {scheduling: false}});
      } else {
        if (res == this.date) {
          Materialize.toast("Unable to schedule task, due date is too close");
        }
        Materialize.toast("Task id " + id + " scheduled!", 4000);
        Tasks.update(id, {$set: {scheduling: false}});
      }
    });
  },

  "click #unsched-button": function (e) {
    e.preventDefault();
    var id = this._id;
    console.log(id);

    Meteor.call("taskDelete", id, function (err, res) {
      if (err) {
        console.log("error unscheduling task " + id + ": " + err.message);
      } else {
        Tasks.update(id, {$unset : {scheduledDate: ""}});
        Materialize.toast("Task id " + id + " unscheduled!", 4000);
      }
    });
  },
})
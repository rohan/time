Template.taskItem.helpers({
  dateFmt: function () {
    var date = moment(this.date);
    return date.format("MMM Do YYYY");
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
  }
})
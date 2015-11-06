Template.editTask.helpers({
  dateFmt: function () {
    var date = moment(this.date);
    return date.format("YYYY/MM/DD");
  },
})

Template.editTask.rendered = function () {
  $('.datepicker').pickadate({
    selectMonths: true, // Creates a dropdown to control month
    selectYears: 15, // Creates a dropdown of 15 years to control year
    formatSubmit: 'yyyy/mm/dd',
  });
}

Template.editTask.events({
  "submit #edit-form": function (e) {
    e.preventDefault();
    var name = e.target["task-edit-name-" + this._id].value;
    var date_string = $(e.target["task-edit-due-date-" + this._id]).data("value");
    var date = new Date(date_string);

    // IMPORTANT: DATE IS STORED AS DATE OBJECT
    // ANY ACCESS NEEDS TO BE CAST WITH moment()

    Tasks.update({_id: this._id}, {$set: {name: name, date: date, done: false}});
    $("#edit-task-" + this._id).hide();
    $("#task-edit-name-" + this._id).val("");
    $("#task-edit-due-date-" + this._id).val("");
    $("#task-item-" + this._id).show();
  }
})
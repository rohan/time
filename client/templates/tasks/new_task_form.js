Template.newTaskForm.rendered = function () {
  $('.datepicker').pickadate({
    selectMonths: true, // Creates a dropdown to control month
    selectYears: 15 // Creates a dropdown of 15 years to control year
  });
}

Template.newTaskForm.events({
  "click #close-form-button": function (e) {
    e.preventDefault();
    $("#new-task-form").hide();
    $("#task-create-name").val("");
    $("#task-create-due-date").val("");
    $("#task-create-length").val("");
  },

  "submit #new-task": function (e) {
    e.preventDefault();
    var name = e.target["task-create-name"].value;
    var date_string = e.target["task-create-due-date"].value;
    var date = new Date(date_string);
    var length = e.target["task-create-length"].value;

    // IMPORTANT: DATE IS STORED AS DATE OBJECT
    // ANY ACCESS NEEDS TO BE CAST WITH moment()

    Tasks.insert({name: name, date: date, length: length, done: false, order: Tasks.find().count()});
    $("#new-task-form").hide();
    $("#task-create-name").val("");
    $("#task-create-due-date").val("");
    $("#task-create-length").val("");
  }
})
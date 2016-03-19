Template.newTaskForm.rendered = function () {
  $('.datepicker').pickadate({
    selectMonths: true, // Creates a dropdown to control month
    selectYears: 15 // Creates a dropdown of 15 years to control year
  });
  $('.timepicker').pickatime({
    twelvehour: true,
    donetext: 'Done',
    // beforeShow: function() {
    //   activeElement = $(document.activeElement)
    //   activeForm = activeElement.closest('form')[0]

    //   // Remove existing validation errors
    //   activeForm.ClientSideValidations.removeError(activeElement)

    //   // Prevent a validation error occurring when element un-focusses
    //   activeElement.disableClientSideValidations();
    // },
    // afterDone: function() {
    //   activeElement = $(document.activeElement)
    //   $(activeElement).enableClientSideValidations();
    // }
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
    // TODO: add default values
    e.preventDefault();
    var name = e.target["task-create-name"].value;
    var date_string = e.target["task-create-due-date"].value;
    console.log(date_string);
    var time_string = e.target["task-create-due-time"].value;
    console.log(time_string);
    var date = new Date(moment(date_string + " " + time_string, "DD MMM, YYYY hh:mmA"));
    console.log(date.toISOString());
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
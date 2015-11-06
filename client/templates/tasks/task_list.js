Template.taskList.rendered = function () {
  var container = $("#task-grid");
  // container.masonry({
  //   columnWidth: '.col',
  //   itemSelector: '.col'
  // })
}

Template.taskList.events({
  "click #create-task-btn": function (e) {
    e.preventDefault();
    $("#new-task-form").show();
    $("#task-create-name").focus();
  }
})
Router.configure({
  layoutTemplate: "standardLayout",
});

Router.route("home", {
  path: '/',
  yieldTemplates: {
    'taskList': {to: 'tasks', 'data': {'tasks': Tasks.find({}, {sort: {order: 1}})}},
    'projectList': {to: 'projects', 'data': {'projects': Projects.find({}, {sort: {order: 1}})}}
  }
});

var introduction = function() {
  if (!Meteor.user()) {
    if (Meteor.loggingIn()) {
    } else {
      this.layout("blankLayout");
      this.render('welcome');
    }
  } else {
    this.next();
  }
}

Router.onBeforeAction(introduction);
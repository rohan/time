Template.welcome.events({
  "click #login-google": function (e) {
    console.log("let's get logged in");

    // logs in with Google; auth stuff is in server/accounts.js
    Meteor.loginWithGoogle({
      requestPermissions: ['email',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/userinfo.profile'],
      requestOfflineToken: true,
      loginStyle: "popup" // i.e., not redirect
    }, function (err) {
      if (err) {
        console.log(err.reason || "unknown error");
      }
      console.log(Meteor.user().services.google.accessToken); // access token for REST API
    });
  },
})
import { Question } from '/imports/api/questions/questions.js';
import { User, Profile, UserType, MyersBriggs, Answer } from '/imports/api/users/users.js';
import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';

import './opposites.html';

function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}


Template.opposite_responses.onCreated(function () {
    if (this.data.userId) {
        this.userId = this.data.userId;
    } else {
        this.userId = Meteor.userId();
    }

    if (Roles.subscription.ready()) {
        if (!Roles.userIsInRole(Meteor.userId(),'admin',Roles.GLOBAL_GROUP)) {
            FlowRouter.redirect('/notfound');
        }
    }
    this.subscribe('userList');

    this.subscribe('questions.bycategory', 0, {
        onStop: function () {
            console.log("QQ Subscription stopped! ", arguments, this);
        }, onReady: function () {
            console.log("QQ Subscription ready! ", arguments, this);
        },
        sort: {createdAt: -1}
    });

    this.subscribe('questions.bycategory', 1, {
        onStop: function () {
            console.log("QQ Subscription stopped! ", arguments, this);
        }, onReady: function () {
            console.log("QQ Subscription ready! ", arguments, this);
        },
        sort: {createdAt: -1}
    });

    this.subscribe('questions.bycategory', 2, {
        onStop: function () {
            console.log("QQ Subscription stopped! ", arguments, this);
        }, onReady: function () {
            console.log("QQ Subscription ready! ", arguments, this);
        },
        sort: {createdAt: -1}
    });

    this.subscribe('questions.bycategory', 3, {
        onStop: function () {
            console.log("QQ Subscription stopped! ", arguments, this);
        }, onReady: function () {
            console.log("QQ Subscription ready! ", arguments, this);
        },
        sort: {createdAt: -1}
    });

    this.autorun( () => {
        
    });
});


Template.opposite_responses.helpers({
    getSummary() {
        let users = Meteor.users.find({}).fetch();
        users = users.filter((user) => {
            return user.MyProfile.UserType.AnsweredQuestions.length > 0;
        })
        return `Questions answered by ${users.length} users `
    },
    responders() {
        let users = Meteor.users.find({}).fetch();
        let responders = [];
        // if (users.MyProfile.UserType.AnsweredQuestions.length > 0) {
            if (users.length) {
                users.forEach(function (user) {
                    console.log('user: ', user );
                    responders = responders.concat(user.MyProfile);
                }); 
            };
        console.log('users: ', users);
        this.responders = responders;
        return responders;
        
    },
    user() {
        return User.findOne({_id:Template.instance().userId});
    },
    isMinMet() {
        let u = User.findOne({_id:Template.instance().userId});
        if (!u) return false;
        if (u.MyProfile.UserType.AnsweredQuestions.length >= minQuestionsAnswered) {
            return true;
        } else {
            return false;
        }
    },
    opacityByCategory(category, userObj) {
        if (typeof userObj === "undefined") return false;
        var value = userObj.MyProfile.UserType.Personality[userObj.MyProfile.UserType.Personality.getIdentifierById(category)];
        return (Math.abs(value.Value) * 2) / 100;
    },
    // letterByCategory(category) {
    //     if (typeof userObj === "undefined") return false;
    //     let users = Meteor.users.find({}).fetch(); 
    //     var identifier = users.MyProfile.UserType.Personality.getIdentifierById(category);
    //     var value = users.MyProfile.UserType.Personality[identifier].Value;
    //     if (users.MyProfile.UserType.AnsweredQuestions.length >= minQuestionsAnswered) {
    //         return (value === 0 ? "?" : (value < 0 ? identifier.slice(0,1) : identifier.slice(1,2)));
    //     } else {
    //         return "?";
    //     }

    //     //console.log('value: ', value);
        
    // },
    letterByCategory(category, userObj) {
        if (typeof userObj === "undefined") return false;
        var identifier = userObj.MyProfile.UserType.Personality.getIdentifierById(category);
        var value = userObj.MyProfile.UserType.Personality[identifier].Value;
        if (userObj.MyProfile.UserType.AnsweredQuestions.length >= minQuestionsAnswered) {
            return (value === 0 ? "?" : (value < 0 ? identifier.slice(0,1) : identifier.slice(1,2)));
        } else {
            return "?";
        }
    },
    results(category, userObj) {
        let identifier = userObj.MyProfile.UserType.Personality.getIdentifierById(
          category
        );

        let identifierValue =
          userObj.MyProfile.UserType.Personality[identifier].Value;

        let percentageValue =
          userObj.MyProfile.UserType.Personality[
            userObj.MyProfile.UserType.Personality.getIdentifierById(category)
          ];
    
        let percentage = Math.ceil(Math.abs(percentageValue.Value));
    
        if (identifierValue) {
          return 50 + percentage;
        }
    },
    // people() {
    //     let users = Meteor.users.find({});
    //     if (!users.length) {
    //         console.log('yolo');
    //         return [];
    //     }
    //     let person = users.fetch();

    //     console.log('person: ', person);
    //     return person;
    // },
    answers() {
        // const u = User.findOne({_id:Template.instance().userId});
        const users = Meteor.users.find({}).fetch();
        let answers = [];
        if (users.length) {
            users.forEach(function(user) {
                answers = answers.concat(user.MyProfile.UserType.AnsweredQuestions);
            });
        }
        
        answers = answers.filter((answer) => {
            return answer.Value >= -5 && answer.Value <= 5
        })
        this.answers = answers;
        return answers;
    },
    getRightValue(value) {
        return 50 + value;
    },
    getLeftValue(value) {
        return 50 - value;
    },
    getQuestion(questionID) {
        return Question.findOne({ _id: questionID });
    },
    getLeftText(questionID) {
        return Question.findOne({ _id: questionID }).LeftText;
    },
    getRightText(questionID) {
        return Question.findOne({ _id: questionID }).RightText;
    }
});




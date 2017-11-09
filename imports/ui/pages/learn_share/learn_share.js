import { User } from '/imports/api/users/users.js';
import { LearnShareSession } from '/imports/api/learn_share/learn_share.js';
import './learn_share.html';

var itemAddHandler = function (value, $item) {
    $("#btn-pick-first").removeAttr("disabled");
    let participant = {
        id: value,
        name: $item.text().slice(0,-1)
    };
    let id = $item.closest('[data-lssid]').data('lssid');
    let ls = LearnShareSession.findOne( {_id: id} );
    ls.addParticipant(participant);
}
Template.learn_share.onCreated(function () {
    this.lssid = FlowRouter.getParam('lssid');

    this.autorun( () => {
        console.log("autorunning learn_share...");
        this.subscription = this.subscribe('userList', Meteor.userId(), {
            onStop: function () {
                console.log("User List subscription stopped! ", arguments, this);
            },
            onReady: function () {
                console.log("User List subscription ready! ", arguments, this);

                let userList = [];

                User.find().forEach( (user) => {
                    userList.push({
                        text: user.MyProfile.firstName + " " + user.MyProfile.lastName,
                        value: user._id
                    });
                });

                $select = $('#select-participants').selectize({
                    plugins: ['remove_button'],
                    options: userList,
                    onItemAdd: itemAddHandler,
                    onItemRemove: (value, $item) => {
                        let numSelected = $select[0].selectize.items.length;
                        if (numSelected === 0) {
                            $("#btn-pick-first").attr("disabled", true);
                        }
                    }
                });
            }
        });
        console.log(this.subscription);

        this.subscription2 = this.subscribe('learnShareDetails', this.lssid, {
            onStop: function () {
                console.log("LearnShare List subscription stopped! ", arguments, this);
            },
            onReady: function () {
                console.log("LearnShare List subscription ready! ", arguments, this);
                let lssess = LearnShareSession.findOne( {_id: this.params[0]} );
                let selectControl = $("#select-participants")[0].selectize;
                for (let i = 0; i < lssess.participants.length; i++) {
                    selectControl.addItem(lssess.participants[i].id);
                }
                for (let i = 0; i < lssess.presenters.length; i++) {
                    $(".item[data-value="+lssess.presenters[i].id+"]").addClass("picked");
                }
                if ($(".item[data-value]").not(".picked").length === 0) {
                    $("#btn-pick-first").attr("disabled", true);
                }
            }
        });
        console.log(this.subscription2);
    });

});

Template.learn_share.onRendered( () => {
});

Template.learn_share.helpers({
    userList() {
        let u = User.find().fetch();
        return u;
    },
    sessionPresenters() {
        let lssid = Template.instance().lssid;
        return LearnShareSession.findOne( {_id:lssid} ).presenters;
    },
    sessionParticipants() {
        let lssid = Template.instance().lssid;
        return LearnShareSession.findOne( {_id:lssid} ).participants;
    },
    order(idx) {
        return idx + 1;
    },
    lssid() {
        return Template.instance().lssid;
    },
    title() {
        let lssid = Template.instance().lssid;
        return LearnShareSession.findOne( {_id:lssid} ).title;
    }
});

var pickRandom = () => {
    let selectControl = $("#select-participants")[0].selectize;

    let availableItems = [];
    for (let i = 0; i < selectControl.items.length; i++) {
        let $item = $(".item[data-value="+selectControl.items[i]+"]");
        if (!$item.hasClass("picked") && !$item.hasClass("picking")) {
            availableItems.push($item);
        }
    }
    if (availableItems.length === 0) {
        //don't pick the same item twice in a row unless it's the last one
        $item = $(".item.picking[data-value]");
        availableItems.push($(".item.picking[data-value]"));
    }
    if (availableItems.length === 0) {
        //none left to pick
        return;
    }
    var $picking = availableItems[Math.floor(Math.random()*availableItems.length)];
    $("#p-on-deck-info").data("picking", $picking.data("value"));
    $("#p-on-deck-info").html($picking.text().slice(0,-1));
    $picking.addClass("picking");
    return $picking.data("value");
}
Template.learn_share.events({
    'click button#btn-pick-first'(event, instance) {
        $("#p-on-deck").show();
        $("#p-pick-first").hide();

        var pickingId = pickRandom();
    },
    'click button#btn-pick-again'(event, instance) {
        let prevPickingId = $("#p-on-deck-info").data("picking");
        var pickingId = pickRandom();

        if (prevPickingId != pickingId) {
            let $prevPicked = $(".item[data-value="+prevPickingId+"]");
            $prevPicked.removeClass("picking");
        }
    },
    'click button#btn-pick-accept'(event, instance) {
        let pickedId = $("#p-on-deck-info").data("picking");
        let picked = {};
        let $pickedItem = $(".item[data-value="+pickedId+"]");
        picked.id = $pickedItem.data("value");
        picked.name = $pickedItem.text().slice(0,-1);
        $pickedItem.removeClass("picking").addClass("picked");
        $("#p-on-deck-info").data("picking","");
        $("#p-on-deck-info").html("");
        $("#p-on-deck").hide();
        $("#p-pick-first").show();
        if ($(".item[data-value]").not(".picked").length === 0) {
            $("#btn-pick-first").attr("disabled", true);
        }

        let lssid = Template.instance().lssid;
        let lssess = LearnShareSession.findOne( {_id:lssid} );
        lssess.addPresenter(picked);
    }
});

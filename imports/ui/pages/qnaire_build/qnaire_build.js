import { Qnaire,QuestionType } from '/imports/api/qnaire/qnaire.js';
import './qnaire_build.html';
import '../qnaire/slider.js';
import '../qnaire/slider.js';

const BLANK_Q = {
    _id: "",
    label: "",
    text: "",
    qtype: 0
};

function changeLabel(event, instance) {
    let oldLabel = $(event.target).closest("[data-label]").data("label");
    let newLabel = $(event.target).val();
    let qnr = Qnaire.findOne( {_id:instance.qnrid} );
    let dupExists = false;
    console.log("oldLabel: ", oldLabel);
    console.log("newLabel: ", newLabel);
    console.log("qnr: ", qnr);
    console.log("$(event.target).closest...: ", $(event.target).closest("[data-label]"));
    if (newLabel == "") {
        console.log("Data Field Label is required");
        $(event.target).val(oldLabel);
        alert("Data Field Label is required");
    } else {
        qnr.questions.forEach(function(element) { // check for duplicate labels
            if (element.label === newLabel && newLabel !== oldLabel) {
                dupExists = true;
            }
        });
        if (newLabel == $('#q--label').val() && event.target.id != 'q--label') { // check Add New Question label
            console.log($("sparkle", event.target));
            alert(event.target.id);
            alert(newLabel == $('#q--label').val());
            alert($(event.target).id != 'q--label');
            dupExists = true;
        }
        if (dupExists) {
            console.log("Label \"" + newLabel + "\" already exists");
            $(event.target).val(oldLabel);
            alert("Label \"" + newLabel + "\" already exists");
        } else {
            console.log("No duplicate labels");
            $(event.target).closest("[data-label]").data("label", newLabel);
            if (!qnr) return [];
            qnr.updateLabel(oldLabel, $(event.target).val());
        }
    }     
}

Template.qnaire_build.onCreated(function () {
    Session.set("newqList",[]);
    this.qnrid = FlowRouter.getParam('qnaireId');
    console.log("qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq", this.qnrid);
    this.autorun( () => {
        this.subscription = this.subscribe('qnaire', this.qnrid, {
            onStop: function () {
                console.log("Qnaire subscription stopped! ", arguments, this);
            },
            onReady: function () {
                console.log("Qnaire subscription ready! ", arguments, this);
            }
        });
    });
});

var readyRender = new ReactiveVar(true);

Template.qnaire_build.helpers({
    readyRender() {
        console.log("helper:readyRender",readyRender.get());
        return readyRender.get();
    },
    title() {
        let q = Qnaire.findOne( {_id:Template.instance().qnrid} );
        if (!q) return "";
        return q.title;
    },
    description() {
        let q = Qnaire.findOne( {_id:Template.instance().qnrid} );
        if (!q) return "";
        return q.description;
    },
    questions() {
        let q = Qnaire.findOne( {_id:Template.instance().qnrid} );
        if (!q) return [];
        for (let i = 0; i < q.questions.length; i++) {
            q.questions[i].qnrid = Template.instance().qnrid;
        }
        return q.questions;
    },
    perpage() {
        let q = Qnaire.findOne( {_id:Template.instance().qnrid} );
        if (!q) return 0;
        return q.qqPerPage;
    },
    isDefault(question) {
        return (question.template === 'default');
    },
    dynHelp(question) {
        return {q: question};
    },
    shuffleChecked() {
        let q = Qnaire.findOne( {_id:Template.instance().qnrid} );
        if (!q) return "";
        return (q.shuffle ? "checked" : "");
    },
    blankQuestion() {
        return BLANK_Q;
    }
});

Template.qnaire_build.events({
    'click button#create-question'(event, instance) {
        console.log("input-qqlabel: ", $(".input-qqlabel"));

        // check to make sure duplicate label doesn't exist
        let q = Qnaire.findOne( {_id:Template.instance().qnrid} );
        let newLabel = $("#q-"+BLANK_Q.label+"-label").val();
        let dupExists = false; // duplicate exists
        q.questions.forEach(function(element) {
            if (element.label === newLabel) {
                dupExists = true;
            }
        });
        if (newLabel == "") {
            console.log("Data Field Label is required");
            alert("Data Field Label is required");
        }
        else if (dupExists) {
            console.log("Label \"" + newLabel + "\" already exists");
            alert("Label \"" + newLabel + "\" already exists");
        } else {
            console.log("No duplicate labels");

            let tval = QuestionType[$("#q-"+BLANK_Q.label+"-type").val()]; // tval is the question type
            console.log("tval: ", tval);
            console.log(tval,$("#q-"+BLANK_Q.label+"-type").val());
            let respList = [];
            $(".q[data-label="+BLANK_Q.label+"]").find(".response-list-item").each(function(idx, elem) {
                console.log(idx, $(elem).val());
                respList.push($(elem).val());
            });
            console.log("respList: ", respList);
            let newQ = {
                label: $("#q-"+BLANK_Q.label+"-label").val(),
                text: $("#q-"+BLANK_Q.label+"-text").val(),
                qtype: tval,
                template: $("#q-"+BLANK_Q.label+"-tpl").val(),
                list: respList,
                condition: ""
            };
            // let q = Qnaire.findOne( {_id:Template.instance().qnrid} );
            console.log("qnaireQ: ", q);
            if (!q) return [];
            q.addQuestion(newQ);
            $("#q-"+BLANK_Q.label+"-label").val('');
            $("#q-"+BLANK_Q.label+"-text").val('');
            $("#q-"+BLANK_Q.label+"-type").val(QuestionType.getIdentifier(0));
            Session.set("newqList",[]);
        }
    },
    'click button.delete-question'(event, instance) {
        const qnrid = event.target.dataset.qnrid
        const label = event.target.dataset.label
        Meteor.call('qnaire.DeleteQuestion', qnrid, label)
    },
    'change select.q-type'(event, instance) {
        let $seltype = $(event.target);
        console.log("changed",$seltype.val());
        switch ($seltype.val()) {
        case "openend":
        case "display":
            $seltype.closest("div.q").find(".item-list").hide();
            break;
        case "numeric":
        case "single":
        case "multi":
        case "nested":
        default:
            $seltype.closest("div.q").find(".item-list").show();
            break;
        }
        let $qcontainer = $(event.target).closest("[data-label]");
        let qlbl = $qcontainer.data("label");
        if (qlbl !== BLANK_Q.label) {
            let q = Qnaire.findOne( {_id:Template.instance().qnrid} );
            if (!q) return [];
            q.setQtype(qlbl, QuestionType[$seltype.val()]);
        }
    },
    'click button.btn-add-item'(event, instance) {
        // alert("found it");
        let $qcontainer = $(event.target).closest("[data-label]");
        let qlbl = $qcontainer.data("label");
        let $valInput = $qcontainer.find(".add-list-item-label");
        let itemVal = $valInput.val();
        // console.log(":$qcontainer ",$qcontainer );
        // console.log(":qlbl ", qlbl);
        // console.log(":$valInput ", $valInput);
        // console.log(":itemVal ", itemVal);
        // console.log(":BLANK_Q._id ", BLANK_Q._id);

        if (qlbl === BLANK_Q._id) {
            let newqList = Session.get("newqList");
            console.log("newqList: ", newqList);
            newqList.push(itemVal);
            Session.set("newqList", newqList);
            console.log(Session.get("newqList"));
        } else {
            let qnr = Qnaire.findOne( {_id:instance.qnrid} );
            if (!qnr) return [];
            qnr.addListItem(qlbl, itemVal);
        }
        $valInput.val("");
        console.log(qlbl, itemVal);
    },
    'keypress input.add-list-item-label' (event, instance) {
        console.log('keys are happening')
        console.log(event.keyCode)
        if (event.keyCode === 13) {
            let addBtn = $(event.target).next().children('.btn-add-item')
            let answerValue = event.target.value.trim()
            if (answerValue !== undefined && answerValue.length !== 0 && 
                answerValue !== '') 
            {
                addBtn.click()
            } 
        }
    },
    // update qnaires branch
    'keyup input.input-qqtitle':_.debounce(function (event, instance) {
            let qnr = Qnaire.findOne( {_id:instance.qnrid} );
            if (!qnr) return [];
            qnr.updateTitle(qnr.title, $(event.target).val());
    }, 2000),
    'keyup textarea.input-qqdesc':_.debounce(function (event, instance) {
            let qnr = Qnaire.findOne( {_id:instance.qnrid} );
            if (!qnr) return [];
            qnr.updateDesc(qnr.description, $(event.target).val());
    }, 2000),
    'keyup input.input-qqPerPage':_.debounce(function (event, instance) {
            let qnr = Qnaire.findOne( {_id:instance.qnrid} );
            if (!qnr) return [];
            qnr.updateQPP(qnr.qqPerPage, $(event.target).val());
    }, 1000),
    'click input.input-shuffle':_.debounce(function (event, instance) {
            let qnr = Qnaire.findOne( {_id:instance.qnrid} );
            if (!qnr) return [];
            qnr.updateShuffle(qnr.shuffle, $(event.target).val());
    }, 1000),
    // update qnaires branch
    'click button.btn-remove-item'(event, instance) {
        let $qcontainer = $(event.target).closest("div[data-label]");
		let $valIndex = $(event.target).closest("div.input-group").find("input[data-index]").attr("data-index");
        let qlbl = $qcontainer.data("label");
		if ($valIndex == undefined) {
			alert("There was a deletion error");
			console.log(qlbl);
			console.log($valIndex);
		} else if (qlbl === BLANK_Q._id) {
            let newqList = Session.get("newqList");
			newqList.splice($valIndex, 1);
            Session.set("newqList", newqList);
            console.log(Session.get("newqList"));
		} else {
			let qnr = Qnaire.findOne( {_id:instance.qnrid} );
			let lblArr = []
			if (!qnr) return [];
			for (let i = 0; i < qnr.questions.length; i++) {
				lblArr.push(qnr.questions[i].label);
			}
			if ((new Set(lblArr)).size !== lblArr.length) {
				alert("There are duplicate question labels\nPlease make them unique");
			} else {
				qnr.removeListItem(qlbl, $valIndex);
			}
        }
    },
    'keyup textarea.input-qqtext':_.debounce(function (event, instance) {
        console.log("debounced", instance); 
		//if (Roles.userIsInRole(Meteor.userId(), ['admin'], Roles.GLOBAL_GROUP)) {
            let qlabel = $(event.target).closest("[data-label]").data("label");
            let qnr = Qnaire.findOne( {_id:instance.qnrid} );
            if (!qnr) return [];
            qnr.updateText(qlabel, $(event.target).val());
        //}
    }, 2000),
    'keyup input.input-qqlabel':_.debounce(function (event, instance) {
        //if (Roles.userIsInRole(Meteor.userId(), ['admin'], Roles.GLOBAL_GROUP)) {
            changeLabel(event, instance);        
        //}
    }, 2000),
    'change input.input-qqlabel'(event, instance) {
        changeLabel(event, instance);
    },
    'keyup input.input-qqcondition':_.debounce(function (event, instance) {
        //if (Roles.userIsInRole(Meteor.userId(), ['admin'], Roles.GLOBAL_GROUP)) {
            let qlabel = $(event.target).closest("[data-label]").data("label");
            let qnr = Qnaire.findOne( {_id:instance.qnrid} );
            if (!qnr) return [];
            qnr.updateCondition(qlabel, $(event.target).val());
        //}
    }, 2000),
    'keyup input.input-numpp':_.debounce(function (event, instance) {
        //if (Roles.userIsInRole(Meteor.userId(), ['admin'], Roles.GLOBAL_GROUP)) {
            let qlabel = $(event.target).closest("[data-label]").data("label");
            let qnr = Qnaire.findOne( {_id:instance.qnrid} );
            if (!qnr) return [];
            qnr.setPerPage( $(event.target).val() );
        //}
    }, 2000),
    'keyup input.response-list-item':_.debounce(function (event, instance) {
        //if (Roles.userIsInRole(Meteor.userId(), ['admin'], Roles.GLOBAL_GROUP)) {
			let $qcontainer = $(event.target).closest("div[data-label]");
			let $valIndex = $(event.target).closest("div.input-group").find("input[data-index]").attr("data-index");
			let qlbl = $qcontainer.data("label");
			if ($valIndex == undefined) {
				alert("There was a change error");
				console.log(qlbl);
				console.log($valIndex);
			} else if (qlbl === BLANK_Q._id) {
				let newqList = Session.get("newqList");
				newqList.splice($valIndex, 1, $(event.target).val());
				Session.set("newqList", newqList);
				console.log(Session.get("newqList"));
			} else {
				let qlabel = $(event.target).closest("[data-label]").data("label");
				let qnr = Qnaire.findOne( {_id:instance.qnrid} );
				let itemIndex = $(event.target).closest("div.input-group").find("input[data-index]").attr("data-index");
				if (!qnr) return [];
				qnr.updateListItem(qlabel, $(event.target).val(), itemIndex);
				readyRender.set(false);
				Meteor.setTimeout(function() {
					readyRender.set(true);
				},100);
			}
        //}
    }, 2000), 
    'change .q-checkbox'(event, instance) {
        let label = this.question.label
        let qnrid = this.question.qnrid
        let checkedStatus = event.target.checked
        Meteor.call('qnaire.deactivateQuestion', qnrid, label, checkedStatus, function(err, result) {
                (err) ? console.log(err) : console.log(result)
        })
    },
    'change .q-widget' (event, instance) {
        const label = this.question.label
        const qnrid = this.question.qnrid
        const widgetValue = event.target.value.toString()
        const qnr = Qnaire.findOne({ _id: qnrid })
        qnr.updateWidget(label, widgetValue)
    }
});

Template.qinput.helpers({
    respList() {
        if (Template.instance().data.question.label === BLANK_Q._id) {
            return Session.get("newqList");
        } else {
            return Template.instance().data.question.list;
        }
    },
    types() {
        return QuestionType.getIdentifiers();
    },
    templates() {
        let names = ['default'];
        for (name of Object.keys(Template)) {
            if (Template[name] instanceof Template && name.slice(0,2) === "qq") {
                names.push(name);
            }
        }
        return names;
    },
    selectedType(ntype) {
        console.log("((",ntype, this.question.qtype,"))");
        if (ntype === this.question.qtype) {
            return "selected";
        }
        return "";
    },
    selectedTpl(ntpl) {
        console.log("((",ntpl, this.question.template,"))");
        if (ntpl === this.question.template) {
            return "selected";
        }
        return "";
    },
    hideList() {
        console.log("hide list",this.question,QuestionType);
        switch (this.question.qtype) {
        case QuestionType.openend:
        case QuestionType.display:
            return "display:none;";
            break;/*
        case QuestionType.numeric:
        case QuestionType.single:
        case QuestionType.multi:
        case QuestionType.nested:
            return "";
            break;
        default:
            return "style='display:none;'";
            break;*/
        }
    },
    formatLabel() {
        let formattedLabel = this.question.label.toString().trim().replace(/\s+/g, '-').toLowerCase()
        return formattedLabel
    }
});

// on render of the template check if the question has been answered 
// and disable editing as needed 
Template.qinput.rendered = function  checkEdit() {
    let currentQuestion = this.data.question
    if (currentQuestion.canEdit === false) {
        $(this.firstNode).children('.form-group').each(function findInputsForQuestion(index, val) {
            $(val).children(":input").each(function disableInputsForQuestion(index, val) {
                $(this).prop('disabled', true)
            })
        })
        $(this.firstNode.lastElementChild.childNodes[3].children).each(function (index, value) {
            $(this.childNodes[1].firstElementChild).prop('disabled', true)
            $(this.childNodes[1].lastElementChild.children).prop('disabled', true)
        })
        $(this.lastNode).prop('disabled', true)
    }
}

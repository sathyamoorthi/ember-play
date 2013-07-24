App = Ember.Application.create();

//global vars
App.Config = [];
App.Fields = [];
App.category = "";

//settings
Ember.TextSupport.reopen({
  attributeBindings: ["style", "placeHolder"]
});

App.IndexRoute = Ember.Route.extend({
redirect: function() {
    this.transitionTo('category');
}
});

App.ApplicationController = Ember.ObjectController.extend({   

    addCategory: function() {   
        var category = $.trim($("#txtCat").val());        
        if(category === "") return;
                       
        if(!App.Config.findProperty("id", category)) {          
            App.category = category;
            App.Config.pushObject({id: category});
            this.addField();
            $("#txtCat").val("");            
        }
    
        this.transitionToRoute('field', App.Config.findProperty("id", category));
    },
    
    addField: function() {
        if(this.findField("", "")) return;        
        App.Fields.pushObject({id: App.category, desc: '', key: ''});
    },
    
    findField: function(key, desc) {
        return App.Fields.find(function(item, index, enumerable){
            if(item.id === App.category && $.trim(item.key) === key && $.trim(item.desc) === desc) return true;
        })
    } 
});

App.Router.map(function() {
    this.resource('category', function() {
        this.resource('field', { path: ':field_id' });
    });
});

App.CategoryRoute = Ember.Route.extend({
    model: function() {
        return App.Config;
    }
});

App.CategoryController = Ember.ObjectController.extend({
    categoryExists: function() {
        return false;
    }
});

App.FieldController = Ember.ArrayController.extend({
    needs: ["application"],
    
    deleteField: function(key, desc) {
        if(key === "" && desc === "") return;
        this.get('model').removeObject(this.get("controllers.application").findField(key, desc));
    }, 
    
    displayArray: function(){
        return this.get('content').filterProperty('id', this.get('filteringModel.id'));
    }.property('content.@each','filteringModel')   
});


App.FieldRoute = Ember.Route.extend({
    setupController: function(controller, model) {     
        App.category = model.id;
        controller.setProperties({'model': App.Fields, filteringModel: model});
    }
});

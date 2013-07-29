App = Ember.Application.create();

App.Category = Ember.ArrayProxy.create();
App.Fields = Ember.ArrayProxy.create();
App.Removed = []; 
App.currCat = "";

//settings
Ember.TextSupport.reopen({
  attributeBindings: ["style", "placeHolder"]
});

App.ApplicationController = Ember.ObjectController.extend({   

    init: function() {
        this.fetchData();
    },
    
    addCategory: function() {   
        var category = $.trim($("#txtCat").val());        
        if(category === "") return;       
                       
        //if category does not exist.
        if(!App.Category.findProperty("id", category)) {          
            App.currCat = category;
            App.Category.pushObject(Ember.Object.create({id: category}));
            this.addField();
            $("#txtCat").val("");            
        }
    
        this.refreshRoute();
    },  
    
    addField: function() {
        if(this.findField("", "")) return;        
        App.Fields.pushObject(Ember.Object.create({id: App.currCat, desc: '', key: ''}));
    },
    
    findField: function(key, desc) {
        return App.Fields.find(function(item, index, enumerable){
            if(item.id === App.currCat && $.trim(item.key) === key && $.trim(item.desc) === desc) return true;
        })
    },
    
    fetchData: function() {
        var controller = this;
        
        $.ajax({
           url: 'server/core.php/getCategory',      
           dataType: "json",    
           success: function(value) {
               
               //http://stackoverflow.com/questions/17882135/emberjs-how-to-update-object-in-an-array/17882464#17882464
               App.Category.set('content', []);
               App.Fields.set('content', []);
               
               value.config.forEach(function(obj) {
                   App.Category.addObject(Ember.Object.create(obj));
               });

               value.fields.forEach(function(obj) {
                   App.Fields.addObject(Ember.Object.create(obj));
               });               
                  
               controller.refreshRoute();               
           }
        });
    },
    
    refreshRoute: function() {
        
        if(App.currCat === "" && App.Category && App.Category.get('length') > 0) {
            App.currCat = App.Category.objectAt(0).id;               
        }
        
        this.transitionToRoute('field', App.Category.findProperty("id", App.currCat));
    },
        
    saveData: function() {
        var fields = [];
        
        App.Fields.forEach(function(obj){
            fields.push({id: escapeChars(obj.id), key: escapeChars(obj.key), desc: escapeChars(obj.desc)});
        });
        
        $.ajax({
           url: 'server/core.php/saveCategory',
           dataType: 'json',
           type: 'POST',
           data: $.param({fields: fields, removed: App.Removed}),
           success: function(value) {
               App.Removed = [];
               $('#save-alert').addClass('in');
               setTimeout(hideAlert, 2000);
           }
        });
    }
});

App.Router.map(function() {
    this.resource('category', function() {
        this.resource('field', { path: ':field_id' });
    });
});

App.CategoryRoute = Ember.Route.extend({
    
    init: function() {       
        if(App.Category.get('length') === 0)this.transitionTo("");
    },
    
    model: function() {
        return App.Category.get('content');
    }
});

App.CategoryView = Ember.View.extend({
    tagName: 'div',
        
    mouseEnter: function(event) {
        if($(event.currentTarget).hasClass('list-item'))
            $(event.currentTarget).find("i").css("visibility", 'visible');
    },
    
    mouseLeave: function(event) {
        if($(event.currentTarget).hasClass('list-item'))
            $(event.currentTarget).find("i").css("visibility", 'hidden');
    }
});

App.CategoryController = Ember.ObjectController.extend({
    
    needs: ["application"],  
    
    categoryExists: function() {
        return false;
    },
    
    showIcons: function() {
        console.log("mouse over");
    },
    
    hideIcons: function() {
        console.log("mouse leave");
    },
    
    editCategory: function(obj) {
        obj.set('idBeforeEditing', obj.id);
        obj.set('isEditing', true);        
    },
    
    doneEditing: function(obj) {    
        
        if(obj.get("idBeforeEditing") !== obj.get("id")) {
            App.Removed.push(obj.get("idBeforeEditing"));
            
            App.Fields.filterProperty("id", obj.get("idBeforeEditing")).forEach(function(field){
                field.set('id', obj.get("id"));
            });
        }
                
        obj.set('isEditing', false);
    },
    
    removeCategory: function(id) {
        App.Removed.push(id);       
        
        App.currCat = "";
        App.Category.removeObjects(App.Category.filterProperty("id", id));
        App.Fields.removeObjects(App.Fields.filterProperty("id", id));
        this.get("controllers.application").refreshRoute();
    }
});

App.FieldController = Ember.ArrayController.extend({
    needs: ["application"],   
    
    init: function() {       
       if(App.Category.get('length') === 0)this.transitionTo("");
    },
    
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
        App.currCat = model.id;
        controller.setProperties({'model': App.Fields, filteringModel: model});
    }
});

function escapeChars(str) {
    return str.replace(".", "_").replace("$", "");
}

function hideAlert() {
    $("#save-alert").removeClass('in');
}
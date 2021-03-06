Model = function(attributes) {
  _.extend(this, attributes);
  
  // // begin with no errors
  // this._errors = {};
}

Model.prototype = {
  // XXX: this will shadow a member property called clone. Do we need this?
  clone: function() {
    // XXX: todo
    return this;
  },
  
  $persisted: function() {
    return ('_id' in this && this._id !== null);
  },
  
  $update: function(modifier) {
    this.$collection.update(this._id, modifier);
  },
  
  // pass in an id to save with a specific id
  // XXX: probably better just to set an attribute when pulled out of a collection
  $save: function(id) {
    var self = this;
    
    // XXX: what if the id is set? -- answer: we are stuffed.
    var creating = _.isUndefined(this._id)
    
    // XXX: validations?
    
    // XXX: cancel if a before save returns false?
    if (creating) {
      _.each(self.constructor._beforeCreateCallbacks, function(cb) {
        return cb(self);
      });
    }
    _.each(self.constructor._beforeSaveCallbacks, function(cb) {
      return cb(self);
    });
    
    var attributes = {};
    _.each(self, function(value, key) {
      if (key[0] === '$' || key == '_id') return;
      attributes[key] = value;
    });
    
    if (self.$persisted()) {
      self.$update({$set: attributes})
    } else {
      if (id)
        attributes = _.extend(attributes, {_id: id});
      
      self._id = self.$collection.insert(attributes);
    }
    
    if (creating) {
      _.each(self.constructor._afterCreateCallbacks, function(cb) {
        return cb(self);
      });
    }
    _.each(self.constructor._afterSaveCallbacks, function(cb) {
      return cb(self);
    });
    
    return self;
  },
  
  $destroy: function() {
    if (this.$persisted()) {
      this.$collection.remove(this._id);
    }
  },
  
  // use this to store a "un-saved" but reactive version of this
  // document in this client
  $storeAs: function(name) {
    this.$storedName = name;
    Session.set(name, this);
  },
  
  $unstore: function(name) {
    if (this.$storedName)
      Session.set(this.$storedName, null);
  }
}

Model.$getStored = function(name) {
  var data = Session.get(name);
  return data && new this(data);
}

Model.$addMethod = function(name, fn) {
  var self = this;
  var methodName = self.prototype.$collection._name + '/' + name;
  
  var methodDefs = {};
  methodDefs[methodName] = function(id /*, args */) {
    var record = self.prototype.$collection.findOne(id);
    var args = Array.prototype.slice.call(arguments, 1);
    args.unshift(record);
    return fn.apply(this, args);
  };
  
  Meteor.methods(methodDefs);
  
  this.prototype[name] = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift(this._id);
    args.unshift(methodName);
    return Meteor.call.apply(Meteor, args);
  }
}

// XXX: I'm pretty certain there are better ways to do this.
// but it does what I need it to, for now.
//
// problems: 1. can't extend sub-"classes" of Model
// 2. can't call super
Model.extend = function(properties) {
  // special named method 'initialize'
  var init = function() {};
  if (typeof properties.initialize === 'function') {
    init = properties.initialize;
    delete properties.initialize;
  }
    
  var ctor = function(attrs) {
    Model.call(this, attrs);
    init.call(this, attrs);
  }
  
  // 'copy' over instance methods
  ctor.prototype = new Model();
  _.extend(ctor.prototype, properties);
  ctor.prototype.constructor = ctor;
  
  // really copy over class methods / attributes
  for (var key in Model) {
    var value = Model[key];
    if (_.isFunction(value)) {
      ctor[key] = value;
    } else {
      ctor[key] = _.clone(value);
    }
  }
  
  // a function to use for Collection::transform
  ctor.transform = function(attrs) {
    return new ctor(attrs);
  }
  
  return ctor;
}

// XXX: generalise this stuff?
// no-one should ever call before save on the model, but they could;
Model._beforeSaveCallbacks = [];
Model.beforeSave = function(callback) {
  if (_.isFunction(callback))
    this._beforeSaveCallbacks.push(callback);
}

Model._beforeCreateCallbacks = [];
Model.beforeCreate = function(callback) {
  if (_.isFunction(callback))
    this._beforeCreateCallbacks.push(callback);
}

Model._afterSaveCallbacks = [];
Model.afterSave = function(callback) {
  if (_.isFunction(callback))
    this._afterSaveCallbacks.push(callback);
}

Model._afterCreateCallbacks = [];
Model.afterCreate = function(callback) {
  if (_.isFunction(callback))
    this._afterCreateCallbacks.push(callback);
}

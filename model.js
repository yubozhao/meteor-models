Model = function(attributes) {
  _.extend(this, attributes);
  
  // begin with no errors
  this._errors = {};
}

Model.prototype = {
  // XXX: this will shadow a member property called clone. Do we need this?
  clone: function() {
    // XXX: todo
    return this;
  },
  
  // persisted: function() {
  //   return ('_id' in this.attributes && this.attributes._id !== null);
  // },
  // 
  // save: function(update) {
  //   
  //   if (this.persisted()) {
  //     if (_.isUndefined(update))
  //       update = {$set: this.attributes};
  //     
  //     this.constructor._collection.update(this.id, update);
  //   } else {
  //     this.id = this.constructor._collection.insert(this.attributes);
  //   }
  //   
  //   return this;
  // },
  // 
  // update_attributes: function(attrs) {
  //   for (key in attrs) {
  //     this.attributes[key] = attrs[key];
  //   }
  //   return this.save();
  // },
  // 
  // update_attribute: function(key, value) {
  //   var attrs = {};
  //   attrs[key] = value;
  //   return this.update_attributes(attrs);
  // },
  // 
  // destroy: function() {
  //   if (this.persisted()) {
  //     this.constructor._collection.remove(this.id);
  //   }
  // }
}

Model.extend = function(properties) {
  // special named method 'initialize'
  var init = function() {};
  if (typeof properties.initialize === 'function') {
    init = properties.initialize;
    delete properties.initialize;
  }
    
  var ctor = function(attrs) {
    Model.call(this, attrs);
    init();
  }
    
  ctor.prototype = new Model();
  _.extend(ctor.prototype, properties);
  ctor.prototype.constructor = ctor;
    
  return ctor;
}
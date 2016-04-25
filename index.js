'use strict';

/**
 * Different set of tools
 *
 * @company Nanopay inc.
 * @year 2015
 * @author Alex Strutsynskyi cajoy.dev@gmail.com
 */
var $promise = require('bluebird');

var cls = {};
var defaultRemotesList = ['create', 'upsert', 'exists', 'updateAll', 'updateById', 'findById', 'find', 'findOne', 'deleteById', 'count', 'prototype.updateAttributes', 'prototype.updateAttribute', 'createChangeStream'];

cls.polymorph = function (func) {
  return function () {
    if (typeof sync == 'undefined') {
      var sync = func;
      var async = new $promise.promisify(sync);
    }

    var args = [].slice.call(arguments);

    if (typeof args.slice(-1)[0] == 'function') {
      return sync.apply(this, arguments);
    } else {
      return async.apply(this, arguments);
    }
  }
}

cls.extendDocs = function (model, method, doc) {
  if (doc.notes) {
    model.sharedClass.find(method, true).notes = doc.notes;
  }

  if (doc.description) {
    model.sharedClass.find(method, true).description = doc.description;
  }
}

cls.disableAllMethods = function(model, methodsToExpose)
{
    // credit to https://github.com/ericprieto for this function
    
    if(model && model.sharedClass)
    {
        methodsToExpose = methodsToExpose || [];

        var modelName = model.sharedClass.name;
        var methods = model.sharedClass.methods();
        var relationMethods = [];
        var hiddenMethods = [];

        try
        {
            Object.keys(model.definition.settings.relations).forEach(function(relation)
            {
                relationMethods.push({ name: '__findById__' + relation, isStatic: false });
                relationMethods.push({ name: '__destroyById__' + relation, isStatic: false });
                relationMethods.push({ name: '__updateById__' + relation, isStatic: false });
                relationMethods.push({ name: '__exists__' + relation, isStatic: false });
                relationMethods.push({ name: '__link__' + relation, isStatic: false });
                relationMethods.push({ name: '__get__' + relation, isStatic: false });
                relationMethods.push({ name: '__create__' + relation, isStatic: false });
                relationMethods.push({ name: '__update__' + relation, isStatic: false });
                relationMethods.push({ name: '__destroy__' + relation, isStatic: false });
                relationMethods.push({ name: '__unlink__' + relation, isStatic: false });
                relationMethods.push({ name: '__count__' + relation, isStatic: false });
                relationMethods.push({ name: '__delete__' + relation, isStatic: false });
            });
        } catch(err) {}

        methods.concat(relationMethods).forEach(function(method)
        {
            var methodName = method.name;
            if(methodsToExpose.indexOf(methodName) < 0)
            {
                hiddenMethods.push(methodName);
                model.disableRemoteMethod(methodName, method.isStatic);
            }
        });

        if(hiddenMethods.length > 0)
        {
            //console.log('\nRemote methods hidden for', modelName, ':', hiddenMethods.join(', '), '\n');
        }
    }
};

cls.disableRemotes = function (model, disableList) {
  disableList.forEach(function (remote) {
    if (defaultRemotesList.indexOf(remote) !== -1) {
      model.disableRemoteMethod(remote, true);
    }
  })
}

cls.disableExcept = function (model, allowList) {
  defaultRemotesList.forEach(function (defaultRemote) {
    if (allowList.indexOf(defaultRemote) === -1) {
      model.disableRemoteMethod(defaultRemote, true);
    }
  })
}

cls.disableRelationExcept = function (model, relationType, relatedModelName, allowList) {
  var allList = {
    'hasMany': ['create', 'findById', 'delete', 'count', 'destroyById', 'get', 'updateById'],
    'belongsTo': ['get'],
    'hasOne': ['get'],
    'hasManyThrough': ['create', 'findById', 'delete', 'count', 'destroyById', 'get', 'updateById', 'exists', 'link', 'updateById', 'unlink']
  }

  var defaultList = allList[relationType];

  var realtionsList = [];
  var allowListCompiled = [];

  allowList.forEach(function (name) {
    allowListCompiled.push('__' + name + '__' + relatedModelName);
  })

  defaultList.forEach(function (name) {
    realtionsList.push('__' + name + '__' + relatedModelName);
  })

  realtionsList.forEach(function (defaultRemote) {
    if (allowListCompiled.indexOf(defaultRemote) === -1) {
      model.disableRemoteMethod(defaultRemote, false);
    }
  })
}

module.exports = cls;

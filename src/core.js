var entito = (function () {

    var Game = function (canvas, width, height) {
      this.canvas = canvas;
      this.height = height;
      this.width = width;

      this.definedComponentTypes = {};
      this.numComponents = 0;
      this.definedComponentTypeBits = {};

      this.definedSystemTypes = {};
      this.definedAssemblages = {};
      this.scenes = {};
      this.activeScene;
      this.dx = 0.016;
    };

    Game.prototype.start = function() {
      console.log('test');
    };

    Game.prototype.defineComponent = function(componentTypeName, func) {
      if(typeof func === 'undefined') {
        this.definedComponentTypes[componentTypeName] = function () {};
      }
      else {
        this.definedComponentTypes[componentTypeName] = func();
      }
      this.definedComponentTypeBits[componentTypeName] = Math.pow(2, this.numComponents);
      this.numComponents++;
      // console.log(this.definedComponentTypeBits);
    };

    Game.prototype.calcBitMask = function(components) {
      var base = 0;
      for (var i = 0; i < components.length; i++) {
        base = base ^ this.definedComponentTypeBits[components[i]];
      };
      return base;
    };

    Game.prototype.defineSystem = function(systemTypeName, func) {
      this.definedSystemTypes[systemTypeName] = func(this);
    };

    Game.prototype.defineAssemblage = function (assemblageName, func) {};

    Game.prototype.registerScene = function(sceneObject) {
      this.scenes[sceneObject.name] = sceneObject;
      this.activeScene = sceneObject;
    };
    Game.prototype.setActiveScene = function(sceneName) {
      this.activeScene = this.scenes[sceneName];
    };
    Game.prototype.update = function() {
      this.activeScene.update(this.dx);
    };


    var Scene = function (name, game) {
      this.name = name;
      this.game = game;
      this.entityCounter = 0;
      this.livingEntities = [];
      var entitySize = 100;
      // Creates an array of dictionaries, each dictionary will have all the
      // componentTypes as keys, and the instance of that component type
      // currently attached to the entity.
      this.entityComponentTable = Array.apply(null, Array(entitySize)).map(function () {
        return {};
      })
      this.entityBitmasks = Array.apply(null, Array(entitySize)).map(function () {
        return 0;
      });
      this.systems = [];
      this.systemLength = 0;
      this.subscriptions = {};
    };

    Scene.prototype._createComponentBitmaskForEntity = function(entity) {
      // Future Optimization
      // Creates the bitmask for which components are available on this entity
      var base = 0;
      for(var key in this.entityComponentTable[entity]) {
        // console.log(key);
        base = base ^ this.game.definedComponentTypeBits[key];
      }
      this.entityBitmasks[entity] = base;
    };

    Scene.prototype._fireCallbacks = function(component, componentType, callbackType) {
      if(this.subscriptions.hasOwnProperty(componentType)){
        for(var i = 0; i < this.subscriptions[componentType].length ; i++) {
          this.subscriptions[componentType][i][callbackType](component);
        }
      }
    };

    Scene.prototype.subscribe = function (componentType, addCallback, removeCallback) {
      // Allows any system to subscribe to a specific componentType for additions and/or removals
      if(!this.subscriptions.hasOwnProperty(componentType)){
        this.subscriptions[componentType] = [];
      }
      this.subscriptions[componentType].push({add: addCallback, remove: removeCallback});
    };
    Scene.prototype.unsubscribe = function(componentType, addCallback, removeCallback) {

    };


    Scene.prototype.start = function() {};
    Scene.prototype.stop = function() {};
    Scene.prototype.update = function(dx) {
      // go through all of the systems and call their update methods
      for (var i = 0; i < this.systemLength; i++) {
        this.systems[i].system.update(dx);
      };
    };

    Scene.prototype.getAllEntities = function() {
      return this.livingEntities;
    };

    Scene.prototype.createEntity = function(optionalDebugName) {
      this.livingEntities.push(this.entityCounter);
      return this.entityCounter++;
    };
    Scene.prototype.removeEntity = function(entity) {
      // removes the components from this entity
      this.livingEntities.splice(this.livingEntities.indexOf(entity), 1);
    };
    Scene.prototype.createFromAssemblage = function(name, optionalDebugName) {};

    Scene.prototype.attachComponentTo = function (componentType, entity) {
      // Adds a new component of the type specified to the entity
      // Also returns that new component so that it can be chained.
      var component = new this.game.definedComponentTypes[componentType]();
      this.entityComponentTable[entity][componentType] = component;
      this._createComponentBitmaskForEntity(entity);
      this._fireCallbacks(component, componentType, 'add');
      return component;
    };
    Scene.prototype.removeComponentFrom = function (componentType, entity) {
      var component = this.getComponentFromEntity(componentType, entity);
      this._fireCallbacks(component, componentType, 'remove');
      delete this.entityComponentTable[entity][componentType];
      this._createComponentBitmaskForEntity(entity);
    };
    Scene.prototype.addSystem = function (systemName, priority) {
      if(typeof priority !== 'number') {
        priority = 1;
      }
      this.systemLength++;
      this.systems.push({system: this.game.definedSystemTypes[systemName], priority: priority});
      this.systems.sort(function (a, b) {
        if (a.priority > b.priority) {
          return 1;
        }
        if (a.priority < b.priority) {
          return -1;
        }
        return 0;
      });
    };

    Scene.prototype.queryComponents = function (listOfComponents) {
      // Return all entity rows
      var l = this.entityComponentTable.length;
      var entityRow;
      var valid;
      var result = [];
      // Original Solution:
      // for (var i = 0; i < l; i++) {
      //   entityRow = this.entityComponentTable[i];
      //   valid = true;
      //   for (var j = 0; j < listOfComponents.length; j++) {
      //     if(!entityRow.hasOwnProperty(listOfComponents[j])){
      //       valid = false;
      //       break;
      //     }
      //   }
      //   if(valid) {
      //     result.push(entityRow);
      //   }
      // }
      
      // Bitmask Solution:
      var queryBitMask = this.game.calcBitMask(listOfComponents);
      for (var i = 0; i < l ; i++) {
        if((this.entityBitmasks[i] & queryBitMask) === queryBitMask) {
          result.push(this.entityComponentTable[i]);
        }
      }
      return result;
    };

    Scene.prototype.getComponentsFromEntity = function (entity) {
      return this.entityComponentTable[entity];
    };
    Scene.prototype.getComponentFromEntity = function(componentType, entity) {
      return this.entityComponentTable[entity][componentType];
    };



    return {
      Game: Game,
      Scene: Scene,
    };

})();
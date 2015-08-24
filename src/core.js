var entito = (function () {

    var Game = function (canvas, width, height) {
      this.canvas = canvas;
      this.height = height;
      this.width = width;

      this.definedComponentTypes = {};
      this.numComponents = 0;
      this.definedComponentTypeBits = {};
      this.componentPool = {};

      this.definedSystemTypes = {};
      this.definedAssemblages = {};
      this.scenes = {};
      this.activeScene;
      this.dx = 0.016;
      this.subscriptions = {};
    };

    Game.prototype.configurePools = function(size) {
      var componentTypes = Object.keys(this.definedComponentTypes);
      for(var i = 0; i < this.numComponents ; i++) {
        this._constructComponentPool(componentTypes[i], size);
      }
      console.log(name, componentTypes);
    };

    Game.prototype._constructComponentPool = function(componentType, size) {
      // body...
      var game = this;
      this.componentPool[componentType] = Array.apply(null, Array(size)).map(function () {
          return new game.definedComponentTypes[componentType]();
      });
    };

    Game.prototype.makeComponent = function(type) {
      // If there is a component pool and it's not empty then reuse a component
      // otherwise make a new one.
      if(this.componentPool.hasOwnProperty(type)){
        if(this.componentPool[type].length > 0) {
          return this.componentPool[type].pop();
        }
      }
      return new this.definedComponentTypes[type]();;
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
      this.definedComponentTypes[componentTypeName].prototype.type = componentTypeName;
      // 1,2,4,8,16...and so on for the component bit ids that will be used
      // to create bitmasks for a series of components easily
      this.definedComponentTypeBits[componentTypeName] = Math.pow(2, this.numComponents);
      this.numComponents++;
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
    Game.prototype.subscribe = function (componentType, addCallback, removeCallback) {
      // Allows any system to subscribe to a specific componentType for additions and/or removals
      if(!this.subscriptions.hasOwnProperty(componentType)){
        this.subscriptions[componentType] = [];
      }
      this.subscriptions[componentType].push({add: addCallback, remove: removeCallback});
    };
    Game.prototype.unsubscribe = function(componentType, addCallback, removeCallback) {

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
      });
      this.entityBitmasks = Array.apply(null, Array(entitySize)).map(function () {
        return 0;
      });

      this.systems = [];
      this.systemLength = 0;
    };

    Scene.prototype._createComponentBitmaskForEntity = function(entity) {
      // Future Optimization
      // Creates the bitmask for which components are available on this entity
      var base = 0;
      for(var key in this.entityComponentTable[entity]) {
        base = base ^ this.game.definedComponentTypeBits[key];
      }
      this.entityBitmasks[entity] = base;
    };

    Scene.prototype._fireCallbacks = function(component, componentType, callbackType) {
      var subs = this.game.subscriptions;
      if(subs.hasOwnProperty(componentType)){
        for(var i = 0; i < subs[componentType].length ; i++) {
          subs[componentType][i][callbackType](component, this);
        }
      }
    };

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
      // TODO: Pool Entities that are created and then destroyed
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

      // Without component pooling
      // var component = new this.game.definedComponentTypes[componentType]();
      // With component pooling
      var component = this.game.makeComponent(componentType);

      this.entityComponentTable[entity][componentType] = component;
      this._createComponentBitmaskForEntity(entity);
      this._fireCallbacks(component, componentType, 'add');
      return component;
    };

    Scene.prototype._recycleComponent = function(component) {
      // Recycling components should only work if there is a pool created
      // for this component type. Pools are created manually atm, so not all
      // games will use a pool.
      if(this.game.componentPool.hasOwnProperty(component.type)){
        console.log('component before recycle:');
        console.log(component);
        component.constructor();
        this.game.componentPool[component.type].push(component);
        console.log('component after recycle:');
        console.log(component);
      }
    };
    Scene.prototype.removeComponentFrom = function (componentType, entity) {
      // TODO: Recycle components when they get removed
      var component = this.getComponentFromEntity(componentType, entity);
      this._fireCallbacks(component, componentType, 'remove');
      this._recycleComponent(component);
      delete this.entityComponentTable[entity][componentType];
      this._createComponentBitmaskForEntity(entity);
    };
    Scene.prototype.addSystem = function (systemName, priority) {
      var s = this.game.definedSystemTypes[systemName];
      if(typeof priority !== 'number') {
        priority = 1;
      }
      this.systemLength++;
      this.systems.push({system: s, priority: priority});
      // Keep the systems sorted by their priority, lowest priority first
      this.systems.sort(function (a, b) {
        if (a.priority > b.priority) {
          return 1;
        }
        if (a.priority < b.priority) {
          return -1;
        }
        return 0;
      });
      if(typeof s.init === 'function'){
        s.init();
      }
    };

    Scene.prototype.queryComponents = function (listOfComponents) {
      // Return all entity rows
      var l = this.entityComponentTable.length;
      var entityRow;
      var valid;
      // TODO: Remove the new array creation as this will be frequently called
      // Probably can stay if the result for a unique query is cached
      var result = [];

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
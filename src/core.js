var entito = (function () {

    var Game = function (canvas, width, height) {
      this.canvas = canvas;
      this.height = height;
      this.width = width;

      this.definedComponentTypes = {};
      this.definedSystemTypes = {};
      this.definedAssemblages = {};
      this.scenes = {};
      this.activeScene;
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
      this.activeScene.update();
    };


    var Scene = function (name, game) {
      this.name = name;
      this.game = game;
      this.entityCounter = 0;
      this.livingEntities = [];
      this.entityComponentBitmasks = [];
      var entitySize = 100;
      // Creates an array of dictionaries, each dictionary will have all the
      // componentTypes as keys, and the instance of that component type
      // currently attached to the entity.
      this.entityComponentTable = Array.apply(null, Array(entitySize)).map(function () {
        return {};
      })
      this.systems = [];
      // this.pool = new Pool()
    };

    Scene.prototype._createComponentBitmaskForEntity = function(entity) {
      // Future Optimization
      // Creates the bitmask for which components are available on this entity
    };

    Scene.prototype.start = function() {};
    Scene.prototype.stop = function() {};
    Scene.prototype.update = function(dx) {
      // go through all of the systems and call their update methods
      var l = this.systems.length;
      for (var i = 0; i < l; i++) {
        this.systems[i].system.update();
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
      return component;
    };
    Scene.prototype.removeComponentFrom = function (componentType, entity) {
      delete this.entityComponentTable[entity][componentType];
    };
    Scene.prototype.addSystem = function (systemName, priority) {
      this.systems.push({system: this.game.definedSystemTypes[systemName], priority: priority});
    };

    Scene.prototype.queryComponents = function (listOfComponents) {
      // Return all entity rows
      var l = this.entityComponentTable.length;
      var entityRow;
      var valid;
      var result = [];
      for (var i = 0; i < l; i++) {
        entityRow = this.entityComponentTable[i];
        valid = true;
        for (var j = 0; j < listOfComponents.length; j++) {
          if(!entityRow.hasOwnProperty(listOfComponents[j])){
            valid = false;
            break;
          }
        }
        if(valid) {
          result.push(entityRow);
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
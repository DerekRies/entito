describe('Core Functionality', function () {

  var game, scene;
  var canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;

  Object.size = function(obj) {
      var size = 0, key;
      for (key in obj) {
          if (obj.hasOwnProperty(key)) size++;
      }
      return size;
  };

  it('creates a game and adds a scene', function () {
    game = new entito.Game(canvas, 800, 600);
    scene = new entito.Scene('Main Menu', game);
    game.registerScene(scene);
    expect(game.activeScene.name).toBe('Main Menu');
  });

  it('creates an entity', function () {
    var entity = scene.createEntity('player');
    var secondEntity = scene.createEntity();
    expect(entity).toBe(0);
    expect(secondEntity).toBe(1);
  });

  it('defines a component', function () {
    game.defineComponent('transform', function () {
      var transformComponent = function () {
        this.x = 0;
        this.y = 0;
        this.z = 0;
      };
      transformComponent.prototype.set = function(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
      };
      return transformComponent;
    });
    expect(typeof game.definedComponentTypes['transform']).toBe('function');
    game.defineComponent('player')
    expect(Object.size(game.definedComponentTypes)).toBe(2);
  });

  it('should attach a component to an entity and retrieve those components on the entity', function () {
    var entity = scene.createEntity();
    scene.attachComponentTo('transform', entity);
    var components = scene.getComponentsFromEntity(entity);
    expect(Object.size(components)).toBe(1);
    var returnResult = scene.attachComponentTo('player', entity);
    expect(Object.size(components)).toBe(2);
  });

  it('should set component data on an entity', function () {
    var entity = scene.createEntity();
    scene.attachComponentTo('transform', entity)
      .set(100, 100, 1);
    var c = scene.getComponentFromEntity('transform', entity);
    expect(c.x).toBe(100);
    expect(c.y).toBe(100);
    expect(c.z).toBe(1);
  });

  it('should remove a component from an entity', function () {
    var e = scene.createEntity();
    scene.attachComponentTo('transform', e);
    scene.attachComponentTo('player', e);
    expect(Object.size(scene.getComponentsFromEntity(e))).toBe(2);
    scene.removeComponentFrom('player', e);
    expect(Object.size(scene.getComponentsFromEntity(e))).toBe(1);
    var pComponent = scene.getComponentFromEntity('player', e);
    expect(pComponent).toBe(undefined);
  });

  it('should remove an entire entity', function () {
    var allEntities = scene.getAllEntities();
    var initialLength = allEntities.length;
    console.log(allEntities);
    scene.removeEntity(2);
    var secondAllEntities = scene.getAllEntities();
    var secondLength = secondAllEntities.length;
    expect(secondLength).toBe(initialLength - 1);
    expect(secondAllEntities.indexOf(2)).toBe(-1);
  });

  it('should query for entities with matching components', function () {
    var queryScene = new entito.Scene('sandbox for querying', game);
    game.registerScene(queryScene);
    var e = game.activeScene.createEntity();
    var e2 = game.activeScene.createEntity();
    var e3 = game.activeScene.createEntity();
    var e4 = game.activeScene.createEntity();
    game.activeScene.attachComponentTo('transform', e);
    game.activeScene.attachComponentTo('transform', e2);
    game.activeScene.attachComponentTo('transform', e3);
    game.activeScene.attachComponentTo('player', e2);
    var collection = game.activeScene.queryComponents(['transform', 'player']);
    var collection2 = game.activeScene.queryComponents(['transform']);
    var collection3 = game.activeScene.queryComponents(['player']);
    expect(collection.length).toBe(1);
    expect(collection2.length).toBe(3);
    expect(collection3.length).toBe(1);
  });

  it('should create a system and register it with the current scene', function () {
    var c;
    game.defineSystem('GenericSystem', function (game) {
      // this portion is run where it's defined
      return {
        init: function () {
          // this function is called when a scene is started
        },
        update: function (dx) {
          // this function is called every scene update frame
          c = game.activeScene.queryComponents(['transform'])
          for(var i = 0; i < c.length ; i++) {
            console.log(c[i].transform);
          }
        }
      };
    });
    game.activeScene.addSystem('GenericSystem', 0);
    console.log(game.activeScene);
    game.activeScene.update();
    expect(c.length).toBe(3);
  });

  // it('should create appropriate bitmasks for attached (or dependency) components', function () {

  // });

});
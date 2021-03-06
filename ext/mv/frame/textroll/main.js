/**
 * T'MediaArt library for Javascript
 *  - MajVj extension - frame plugin - textroll -
 * @param options options (See MajVj.prototype.create)
 */
MajVj.frame.textroll = function(options) {
  this._api3d = options.mv.create('frame', 'api3d', {
    draw: this._draw.bind(this)
  });
  this.properties = {
    rotate: 0,
    speed: options.speed !== undefined ? options.speed : Math.PI / 100000
  };
  this._box = TmaModelPrimitives.createBox();
  this._data = [];
  this._position = options.position || [ 0, 0, 0 ];
  this._initial_position =
      [ this._position[0], this._position[1], this._position[2] ];
  this._scale = options.scale !== undefined ? options.scale : 1;
  this._rotateBase = options.rotate || 0;
  this._camera = options.camera;
  this._type = options.type;  // "roll" (default), "zoom", "starwars"

  var height = 0;
  var width = 0;
  var i;
  for (i = 0; i < options.texts.length; ++i) {
    var input = options.texts[i];
    var style = options.styles[input.style];
    var texture = options.screen.createStringTexture(input.text, {
      name: style.name,
      size: style.size,
      weight: style.weight,
      fill: style.fill,
      stroke: style.stroke,
      foreground: style.fg,
      background: 'rgba(0, 0, 0, 0)'
    });
    var linespace = texture.height * (style.linespace || 1);
    this._data.push({
      texture: texture,
      linespace: linespace,
      alignment: style.alignment,
      direction: style.direction || 1
    });
    height += linespace;
    if (width < texture.width)
      width = texture.width;
  }
  var base = +height / 2;
  for (i = 0; i < options.texts.length; ++i) {
    var data = this._data[i];
    var h = data.linespace;
    data.y = base - h / 2;
    base -= h;
    if (!data.alignment || data.alignment == 'center')
      data.x = 0;
    else if (data.alignment == 'left')
      data.x = (data.texture.width - width) / 2;
    else if (data.alignment == 'right')
      data.x = (width - data.texture.width) / 2;
  }
};

/**
 * Loads resource asynchronously.
 * @return a Promise object
 */
MajVj.frame.textroll.load = function () {
  return new Promise(function(resolve, reject) {
    resolve();
  });
};

/**
 * Rewinds to the first frame.
 */
MajVj.frame.textroll.prototype.rewind = function () {
  this.properties.rotate = 0;
  this._position[0] = this._initial_position[0];
  this._position[1] = this._initial_position[1];
  this._position[2] = this._initial_position[2];
};

/**
 * Handles screen resize.
 * @param aspect screen aspect ratio
 */
MajVj.frame.textroll.prototype.onresize = function(aspect) {
};

/**
 * Draws a frame.
 * @param delta delta time from the last rendering
 */
MajVj.frame.textroll.prototype.draw = function(delta) {
  if (this._camera) {
    this._api3d.properties.position = this._camera.position();
    this._api3d.properties.orientation = this._camera.orientation();
  }
  return this._api3d.draw(delta);
};

MajVj.frame.textroll.prototype._draw = function(api) {
  if (!this._type || this._type == "roll")
    this._drawRoll(api);
  else if (this._type == "zoom")
    this._drawZoom(api);
  else if (this._type == "starwars")
    this._drawStarwars(api);
};

MajVj.frame.textroll.prototype._drawRoll = function(api) {
  var s = this._scale;
  var b = this._position;
  var rb = this._rotateBase;
  var r = this.properties.rotate;
  this.properties.rotate += this.properties.speed * api.delta;
  for (var i = 0; i < this._data.length; ++i) {
    var data = this._data[i];
    var texture = data.texture;
    this._box.setTexture(texture);
    var p = [ data.x * s + b[0], data.y * s + b[1], b[2] ];
    var rotate = [ [ 0, rb + r * data.direction, 0 ] ];
    api.drawPrimitive(
        this._box, texture.width * s, texture.height * s, 1, p, rotate);
  }
};

MajVj.frame.textroll.prototype._drawZoom = function(api) {
  var s = this._scale;
  var b = this._position;
  this._position[2] += this.properties.speed * api.delta;
  for (var i = 0; i < this._data.length; ++i) {
    var data = this._data[i];
    var texture = data.texture;
    this._box.setTexture(texture);
    var p = [ data.x * s + b[0], data.y * s + b[1], b[2] ];
    api.drawPrimitive(
        this._box, texture.width * s, texture.height * s, 1, p);
  }
};

MajVj.frame.textroll.prototype._drawStarwars = function(api) {
  var s = this._scale;
  var b = this._position;
  var theta = Math.PI / 4;
  var r = [-theta, 0, 0];
  this._position[1] += this.properties.speed * api.delta;
  for (var i = 0; i < this._data.length; ++i) {
    var data = this._data[i];
    var texture = data.texture;
    this._box.setTexture(texture);
    var y = data.y * s + b[1];
    var p = [ data.x * s + b[0], y * Math.cos(theta), b[2] - y * Math.sin(theta) ];
    api.drawPrimitive(
        this._box, texture.width * s, texture.height * s, 1, p, [r]);
  }
};

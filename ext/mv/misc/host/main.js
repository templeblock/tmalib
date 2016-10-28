/**
 * T'MediaArt library for JavaScript
 *  - MajVj extension - misc plugin - host -
 * @param options options (See MajVj.prototype.create)
 */
MajVj.misc.host = function (options) {
    this._type = options.type;
    this._name = options.name;
    this._mv = options.mv;
    this._frame = null;
    this.properties = {
        controls: new Array(128)  // MIDI control change
    };
    MajVj.loadPlugin(this._type, this._name).then(() => {
        this._frame = this._mv.create(this._type, this._name);
    });
};

/**
 * Loads resources asynchronously.
 * @return a Promise object
 */
MajVj.misc.host.load = function () {
    return new Promise(function (resolve, reject) {
        resolve();
    });
};

/**
 * Draws a frame.
 * @param delta delta time from the last rendering
 */
MajVj.misc.host.prototype.draw = function (delta) {
    if (this._frame)
        this._frame.draw(delta);
};

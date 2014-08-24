/**
 * T'MediaArt library for JavaScript
 *  - MajVj extension - frame plugin - nicofarre3d -
 * @param options options (See MajVj.prototype.create)
 */
MajVj.frame.nicofarre3d = function (options) {
    this._screen = options.screen;
    this._width = options.width;
    this._height = options.height;
    this._aspect = options.aspect;
    this._controller = options.controller;
    this._draw = options.draw;
    this._api = {
      clear: this._clear.bind(this),
      color: [1.0, 1.0, 1.0, 1.0],
      delta: 0.0,
      drawBox: this._drawBox.bind(this),
      drawLine: this._drawLine.bind(this),
      fill: this._fill.bind(this),
      gl: this._screen.gl,
      setAlphaMode: this._screen.setAlphaMode,
    };

    this._screenProgram = this._screen.createProgram(
            this._screen.compileShader(Tma3DScreen.VERTEX_SHADER,
                    MajVj.frame.nicofarre3d._vScreenShader),
            this._screen.compileShader(Tma3DScreen.FRAGMENT_SHADER,
                    MajVj.frame.nicofarre3d._fScreenShader));
    this._drawProgram = this._screen.createProgram(
            this._screen.compileShader(Tma3DScreen.VERTEX_SHADER,
                    MajVj.frame.nicofarre3d._vDrawShader),
            this._screen.compileShader(Tma3DScreen.FRAGMENT_SHADER,
                    MajVj.frame.nicofarre3d._fDrawShader));
    this._coords = this._screen.createBuffer([
            // A (right): (40, 760) - (1520, 1040) / (1920, 1080)
            40 / 1920 * 2 - 1, 760 / 1080 * 2 - 1,
            40 / 1920 * 2 - 1, 1040 / 1080 * 2 - 1,
            1520 / 1920 * 2 - 1, 1040 / 1080 * 2 - 1,
            1520 / 1920 * 2 - 1, 760 / 1080 * 2 - 1,
            // B (stage): (40, 120) - (880, 400) / (1920, 1080)
            40 / 1920 * 2 - 1, 120 / 1080 * 2 - 1,
            40 / 1920 * 2 - 1, 400 / 1080 * 2 - 1,
            880 / 1920 * 2 - 1, 400 / 1080 * 2 - 1,
            880 / 1920 * 2 - 1, 120 / 1080 * 2 - 1,
            // C (left): (40, 440) - (1520, 720) / (1920, 1080)
            40 / 1920 * 2 - 1, 440 / 1080 * 2 - 1,
            40 / 1920 * 2 - 1, 720 / 1080 * 2 - 1,
            1520 / 1920 * 2 - 1, 720 / 1080 * 2 - 1,
            1520 / 1920 * 2 - 1, 440 / 1080 * 2 - 1,
            // D (back): (920, 120) - (1760, 400) / (1920, 1080)
            920 / 1920 * 2 - 1, 120 / 1080 * 2 - 1,
            920 / 1920 * 2 - 1, 400 / 1080 * 2 - 1,
            1760 / 1920 * 2 - 1, 400 / 1080 * 2 - 1,
            1760 / 1920 * 2 - 1, 120 / 1080 * 2 - 1,
            // E (stage right): (1560, 760) - (1720, 1040) / (1920, 1080)
            1560 / 1920 * 2 - 1, 760 / 1080 * 2 - 1,
            1560 / 1920 * 2 - 1, 1040 / 1080 * 2 - 1,
            1720 / 1920 * 2 - 1, 1040 / 1080 * 2 - 1,
            1720 / 1920 * 2 - 1, 760 / 1080 * 2 - 1,
            // F (stage left): (1560, 440) - (1720, 720) / (1920, 1080)
            1560 / 1920 * 2 - 1, 440 / 1080 * 2 - 1,
            1560 / 1920 * 2 - 1, 720 / 1080 * 2 - 1,
            1720 / 1920 * 2 - 1, 720 / 1080 * 2 - 1,
            1720 / 1920 * 2 - 1, 440 / 1080 * 2 - 1]);
    this._texCoods = this._screen.createBuffer([
            0, 0, 0, 1, 1, 1, 1, 0,    // A: 1480
            0, 0, 0, 1, 1, 1, 1, 0,    // B: 840
            0, 0, 0, 1, 1, 1, 1, 0,    // C: 1480
            0, 0, 0, 1, 1, 1, 1, 0,    // D: 840
            0, 0, 0, 1, 1, 1, 1, 0,    // E: 160
            0, 0, 0, 1, 1, 1, 1, 0]);  // F: 160
    var scale = this._width / 1920;  // FIXME: check if it works
    var height = 280 * this._height / 1080;
    this._fboRight = this._screen.createFrameBuffer(1480 * scale, height);
    this._fboStage = this._screen.createFrameBuffer(840 * scale, height);
    this._fboLeft = this._screen.createFrameBuffer(1480 * scale, height);
    this._fboBack = this._screen.createFrameBuffer(840 * scale, height);

    var theta0 = Math.atan(1480 / 840) * 180 / Math.PI;
    var theta1 = 180 - theta0 * 2;
    var theta2 = 180 - theta1;
    var scale1 = [840 / 280, 840 / 280, 1];
    var scale2 = [1480 / 280, 1480 / 280, 1];
    this._pMatrixRight = mat4.scale(
            mat4.perspective(theta2, 1480 / 280, 420, 100000), scale2);
    this._pMatrixStage = mat4.scale(
            mat4.perspective(theta1, 840 / 280, 740, 100000), scale1);
    this._pMatrixLeft = mat4.scale(
            mat4.perspective(theta2, 1480 / 280, 420, 100000), scale2);
    this._pMatrixBack = mat4.scale(
            mat4.perspective(theta1, 840 / 280, 740, 100000), scale1);
    this._mvMatrixRight = mat4.rotateY(mat4.identity(), Math.PI / 2);
    this._mvMatrixStage = mat4.identity();
    this._mvMatrixLeft = mat4.rotateY(mat4.identity(), -Math.PI / 2);
    this._mvMatrixBack = mat4.rotateY(mat4.identity(), -Math.PI);
    this._iMatrix = mat4.identity();
    this._matrix = mat4.create();

    this._buffer2 = this._screen.createBuffer(new Array(2 * 3));
    this._bufferICoord = this._screen.createBuffer(
            [-1, -1, 1, -1, 1, 1, 1, 1, 1, 1, -1, 1]);
    this._boxCoord = this._screen.createBuffer(
            [-0.5, -0.5, 0, -0.5, 0.5, 0, 0.5, 0.5, 0, 0.5, -0.5, 0]);
};

// Shader programs.
MajVj.frame.nicofarre3d._vScreenShader = null;
MajVj.frame.nicofarre3d._fScreenShader = null;

/**
 * Loads resources asynchronously.
 * @return a Promise object
 */
MajVj.frame.nicofarre3d.load = function () {
    return new Promise(function (resolve, reject) {
        var name = 'nicofarre3d';
        var path = 'shaders.html';
        Promise.all([
                MajVj.loadShader('frame', name, path, 'v_screen'),
                MajVj.loadShader('frame', name, path, 'f_screen'),
                MajVj.loadShader('frame', name, path, 'v_draw'),
                MajVj.loadShader('frame', name, path, 'f_draw')
        ]).then(function (shaders) {
            MajVj.frame.nicofarre3d._vScreenShader = shaders[0];
            MajVj.frame.nicofarre3d._fScreenShader = shaders[1];
            MajVj.frame.nicofarre3d._vDrawShader = shaders[2];
            MajVj.frame.nicofarre3d._fDrawShader = shaders[3];
            resolve();
        }, function () { reject('nicofarre3d.load fails'); });
    });
};

/**
 * Handles screen resize.
 * @param aspect screen aspect ratio
 */
MajVj.frame.nicofarre3d.prototype.onresize = function (aspect) {
    this._aspect = aspect;
};

/**
 * Draws a frame.
 * @param delta delta time from the last rendering
 */
MajVj.frame.nicofarre3d.prototype.draw = function (delta) {
    this._screen.pushAlphaMode();
    var screen = this._fboRight.bind();

    this._api.delta = delta;
    this._draw(this._api);

    screen.bind();
    this._screen.setAlphaMode(false);
    this._screenProgram.setAttributeArray('aCoord', this._coords, 0, 2, 0);
    this._screenProgram.setAttributeArray('aTexCoord', this._texCoods, 0, 2, 0);
    this._screenProgram.setTexture('uTexture', this._fboRight.texture);
    this._screenProgram.drawArrays(Tma3DScreen.MODE_TRIANGLE_FAN, 0, 4);
    this._screenProgram.setTexture('uTexture', this._fboStage.texture);
    this._screenProgram.drawArrays(Tma3DScreen.MODE_TRIANGLE_FAN, 4, 4);
    this._screenProgram.setTexture('uTexture', this._fboLeft.texture);
    this._screenProgram.drawArrays(Tma3DScreen.MODE_TRIANGLE_FAN, 8, 4);
    this._screenProgram.setTexture('uTexture', this._fboBack.texture);
    this._screenProgram.drawArrays(Tma3DScreen.MODE_TRIANGLE_FAN, 12, 4);

    this._screen.popAlphaMode();
};

/**
 * Sets a controller.
 * @param controller a controller object
 */
MajVj.frame.nicofarre3d.prototype.setController = function (controller) {
    this._controller = controller;
};

// TODO:
//  - drawCube
//  - drawArrays
//  - drawElements

/**
 * Clears all displays.
 * @param flag flag, e.g., gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT
 */
MajVj.frame.nicofarre3d.prototype._clear = function (flag) {
    this._fboRight.bind();
    this._screen.gl.clear(flag);
    this._fboStage.bind();
    this._screen.gl.clear(flag);
    this._fboLeft.bind();
    this._screen.gl.clear(flag);
    this._fboBack.bind();
    this._screen.gl.clear(flag);
};

/**
 * Draws a box to all displays.
 * @param w width
 * @param h height
 * @param p position in [x, y, z]
 * @param r rotation in [z, y, z] in radian.
 */
MajVj.frame.nicofarre3d.prototype._drawBox = function (w, h, p, r) {
    this._drawProgram.setAttributeArray('aCoord', this._boxCoord, 0, 3, 0);
    this._drawProgram.setUniformVector('uColor', this._api.color);

    mat4.translate(this._iMatrix, p, this._matrix);
    if (r) {
      mat4.rotateX(this._matrix, r[0]);
      mat4.rotateY(this._matrix, r[1]);
      mat4.rotateZ(this._matrix, r[2]);
    }
    mat4.scale(this._matrix, [w, h, 1.0]);
    this._drawProgram.setUniformMatrix('uMatrix', this._matrix);

    this._fboRight.bind();
    this._drawProgram.setUniformMatrix('uPMatrix', this._pMatrixRight);
    this._drawProgram.setUniformMatrix('uMVMatrix', this._mvMatrixRight);
    this._drawProgram.drawArrays(Tma3DScreen.MODE_TRIANGLE_FAN, 0, 4);

    this._fboStage.bind();
    this._drawProgram.setUniformMatrix('uPMatrix', this._pMatrixStage);
    this._drawProgram.setUniformMatrix('uMVMatrix', this._mvMatrixStage);
    this._drawProgram.drawArrays(Tma3DScreen.MODE_TRIANGLE_FAN, 0, 4);

    this._fboLeft.bind();
    this._drawProgram.setUniformMatrix('uPMatrix', this._pMatrixLeft);
    this._drawProgram.setUniformMatrix('uMVMatrix', this._mvMatrixLeft);
    this._drawProgram.drawArrays(Tma3DScreen.MODE_TRIANGLE_FAN, 0, 4);

    this._fboBack.bind();
    this._drawProgram.setUniformMatrix('uPMatrix', this._pMatrixBack);
    this._drawProgram.setUniformMatrix('uMVMatrix', this._mvMatrixBack);
    this._drawProgram.drawArrays(Tma3DScreen.MODE_TRIANGLE_FAN, 0, 4);
};

/**
 * Draws a line to all displays.
 * @param sx source x position
 * @param sy source y position
 * @param sz source z position
 * @param dx destination x position
 * @param dy destination y position
 * @param dz destination z position
 */
MajVj.frame.nicofarre3d.prototype._drawLine =
        function (sx, sy, sz, dx, dy, dz) {
    var buffer = this._buffer2.buffer();
    buffer[0] = sx; buffer[1] = sy; buffer[2] = sz;
    buffer[3] = dx; buffer[4] = dy; buffer[5] = dz;
    this._buffer2.update();
    this._drawProgram.setAttributeArray('aCoord', this._buffer2, 0, 3, 0);
    this._drawProgram.setUniformVector('uColor', this._api.color);
    this._drawProgram.setUniformMatrix('uMatrix', this._iMatrix);

    this._fboRight.bind();
    this._drawProgram.setUniformMatrix('uPMatrix', this._pMatrixRight);
    this._drawProgram.setUniformMatrix('uMVMatrix', this._mvMatrixRight);
    this._drawProgram.drawArrays(Tma3DScreen.MODE_LINES, 0, 2);

    this._fboStage.bind();
    this._drawProgram.setUniformMatrix('uPMatrix', this._pMatrixStage);
    this._drawProgram.setUniformMatrix('uMVMatrix', this._mvMatrixStage);
    this._drawProgram.drawArrays(Tma3DScreen.MODE_LINES, 0, 2);

    this._fboLeft.bind();
    this._drawProgram.setUniformMatrix('uPMatrix', this._pMatrixLeft);
    this._drawProgram.setUniformMatrix('uMVMatrix', this._mvMatrixLeft);
    this._drawProgram.drawArrays(Tma3DScreen.MODE_LINES, 0, 2);

    this._fboBack.bind();
    this._drawProgram.setUniformMatrix('uPMatrix', this._pMatrixBack);
    this._drawProgram.setUniformMatrix('uMVMatrix', this._mvMatrixBack);
    this._drawProgram.drawArrays(Tma3DScreen.MODE_LINES, 0, 2);
};

/**
 * Fills display textures.
 * @param color a color in [r, g, b, a]a
 */
MajVj.frame.nicofarre3d.prototype._fill = function (color) {
    var c = color || this._api.color;
    this._drawProgram.setAttributeArray('aCoord', this._bufferICoord, 0, 3, 0);
    this._drawProgram.setUniformVector('uColor', c);
    this._drawProgram.setUniformMatrix('uPMatrix', this._iMatrix);
    this._drawProgram.setUniformMatrix('uMVMatrix', this._iMatrix);
    this._drawProgram.setUniformMatrix('uMatrix', this._iMatrix);
    this._fboRight.bind();
    this._drawProgram.drawArrays(Tma3DScreen.MODE_TRIANGLE_FAN, 0, 4);
    this._fboStage.bind();
    this._drawProgram.drawArrays(Tma3DScreen.MODE_TRIANGLE_FAN, 0, 4);
    this._fboLeft.bind();
    this._drawProgram.drawArrays(Tma3DScreen.MODE_TRIANGLE_FAN, 0, 4);
    this._fboBack.bind();
    this._drawProgram.drawArrays(Tma3DScreen.MODE_TRIANGLE_FAN, 0, 4);
};

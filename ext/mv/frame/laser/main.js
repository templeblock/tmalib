/**
 * T'MediaArt library for JavaScript
 *  - MajVj extension - frame plugin - laser -
 * @param options options (See MajVj.prototype.create)
 */
MajVj.frame.laser = function (options) {
    this._screen = options.screen;
    this._width = options.width;
    this._height = options.height;
    this._zoom = [1.0, 1.0];
    this._draw = options.draw || function (api) {};
    this._hpi = Math.PI / 2;

    this.properties = {};
    this.onresize(options.aspect);

    this._line2dProgram = this._screen.createProgram(
            this._screen.compileShader(Tma3DScreen.VERTEX_SHADER,
                    MajVj.frame.laser._vLine2dShader),
            this._screen.compileShader(Tma3DScreen.FRAGMENT_SHADER,
                    MajVj.frame.laser._fLine2dShader));

    this._coords = this._screen.createBuffer([
        // X     Y     U     V
        -1.0, -1.0,  0.0,  0.0,  // 0
        -1.0,  1.0,  0.0,  0.0,  // 1
         0.0, -1.0,  0.0,  0.0,  // 2
         0.0,  1.0,  0.0,  0.0,  // 3
        -1.0, -1.0, -1.0,  0.0,  // 4
        -1.0,  1.0, -1.0,  0.0,  // 5
         1.0, -1.0,  1.0,  0.0,  // 6
         1.0,  1.0,  1.0,  0.0,  // 7
         0.0, -1.0,  0.0,  0.0,  // 8
         0.0,  1.0,  0.0,  0.0,  // 9
         1.0, -1.0,  0.0,  0.0,  // 10
         1.0,  1.0,  0.0,  0.0,  // 11
    ]);
    this._coords.dimension = 4;
    this._indices = this._screen.createElementBuffer([
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
    ]);
    this._leftSquareIndicesOffset = 0;
    this._centerSquareIndicesOffset = 8;
    this._rightSquareIndicesOffset = 16;
    this._squareIndicesLength = 4;

    this._api = {
        line2d: this._line2d.bind(this),
        color: [ 0.0, 0.0, 1.0, 1.0 ],
        properties: this.properties
    };
};

// Shader programs.
MajVj.frame.laser._vLine2dShader = null;
MajVj.frame.laser._fLine2dShader = null;

/**
 * Loads resources asynchronously.
 * @return a Promise object
 */
MajVj.frame.laser.load = function () {
    return new Promise(function (resolve, reject) {
        var name = 'laser';
        var path = 'shaders.html';
        Promise.all([
                MajVj.loadShader('frame', name, path, 'v_line2d'),
                MajVj.loadShader('frame', name, path, 'f_line2d')
        ]).then(function (results) {
            MajVj.frame.laser._vLine2dShader = results[0];
            MajVj.frame.laser._fLine2dShader = results[1];
            resolve();
        }, function () { reject('laser.load fails'); });
    });
};

/**
 * Handles screen resize.
 * @param aspect screen aspect ratio
 */
MajVj.frame.laser.prototype.onresize = function (aspect) {
    this._aspect = aspect;
    this._zoom = [1.0, 1.0];
    // Ajust to keep 1:1 aspect and to overfill the screen.
    if (this._aspect > 1.0)
        this._zoom[1] = this._aspect;
    else
        this._zoom[0] = 1 / this._aspect;
};

/**
 * Draws a frame.
 * @param delta delta time from the last rendering
 */
MajVj.frame.laser.prototype.draw = function (delta) {
    this._draw(this._api);
};

/**
 * Draws a line to all displays.
 * @param src source position in [x, y] (0 <= x, y <= 1)
 * @param dst destination position in [x, y] (0 <= x, y <= 1)
 * @param width line width
 */
MajVj.frame.laser.prototype._line2d = function (src, dst, width) {
    var vector = vec2.create();
    vec2.subtract(vector, src, dst);
    var distance = vec2.length(vector);
    var position = vec2.create();
    vec2.lerp(position, src, dst, 0.5);

    var matrix = mat2d.identity(mat2d.create());
    mat2d.scale(matrix, matrix, this._zoom);
    mat2d.translate(matrix, matrix, position);
    mat2d.rotate(matrix, matrix, Math.atan2(vector[1], vector[0]));
    mat2d.scale(matrix, matrix, [distance / 2, width / 2]);
    var matrix3 = mat3.fromMat2d(mat3.create(), matrix);

    this._line2dProgram.setAttributeArray(
        'aCoord', this._coords, 0, this._coords.dimension, 0);
    this._line2dProgram.setUniformMatrix('uMatrix', matrix3);
    this._line2dProgram.setUniformVector('uColor', this._api.color);
    this._line2dProgram.setUniformVector('uWidth', [width]);
    this._line2dProgram.drawElements(Tma3DScreen.MODE_TRIANGLE_STRIP,
                                     this._indices,
                                     this._centerSquareIndicesOffset,
                                     this._squareIndicesLength);
    mat2d.identity(matrix);
    mat2d.scale(matrix, matrix, this._zoom);
    mat2d.translate(matrix, matrix, dst);
    mat2d.rotate(matrix, matrix, Math.atan2(vector[1], vector[0]));
    mat2d.scale(matrix, matrix, [width / 2, width / 2]);
    mat3.fromMat2d(matrix3, matrix);
    this._line2dProgram.setUniformMatrix('uMatrix', matrix3);
    this._line2dProgram.drawElements(Tma3DScreen.MODE_TRIANGLE_STRIP,
                                     this._indices,
                                     this._leftSquareIndicesOffset,
                                     this._squareIndicesLength);

    mat2d.identity(matrix);
    mat2d.scale(matrix, matrix, this._zoom);
    mat2d.translate(matrix, matrix, src);
    mat2d.rotate(matrix, matrix, Math.atan2(vector[1], vector[0]));
    mat2d.scale(matrix, matrix, [width / 2, width / 2]);
    mat3.fromMat2d(matrix3, matrix);
    this._line2dProgram.setUniformMatrix('uMatrix', matrix3);
    this._line2dProgram.drawElements(Tma3DScreen.MODE_TRIANGLE_STRIP,
                                     this._indices,
                                     this._rightSquareIndicesOffset,
                                     this._squareIndicesLength);
};

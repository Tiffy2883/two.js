(function() {

  // Localize variables
  var CanvasRenderer = Two[Two.Types.canvas],
    getCurveFromPoints = Two.Utils.getCurveFromPoints,
    mod = Two.Utils.mod,
    multiplyMatrix = Two.Matrix.Multiply,
    matrixDeterminant = Two.Matrix.Determinant,
    decoupleShapes = Two.Utils.decoupleShapes,
    subdivide = Two.Utils.subdivide,
    abs = Math.abs,
    sqrt = Math.sqrt;

  /**
   * CSS Color interpretation from
   * https://github.com/brehaut/color-js/blob/master/color.js
   * Copyright (c) 2008-2010, Andrew Brehaut, Tim Baumann, Matt Wilson
   * All rights reserved.
   */

  // css_colors maps color names onto their hex values
  // these names are defined by W3C
  var css_colors = {aliceblue:'#F0F8FF',antiquewhite:'#FAEBD7',aqua:'#00FFFF',aquamarine:'#7FFFD4',azure:'#F0FFFF',beige:'#F5F5DC',bisque:'#FFE4C4',black:'#000000',blanchedalmond:'#FFEBCD',blue:'#0000FF',blueviolet:'#8A2BE2',brown:'#A52A2A',burlywood:'#DEB887',cadetblue:'#5F9EA0',chartreuse:'#7FFF00',chocolate:'#D2691E',coral:'#FF7F50',cornflowerblue:'#6495ED',cornsilk:'#FFF8DC',crimson:'#DC143C',cyan:'#00FFFF',darkblue:'#00008B',darkcyan:'#008B8B',darkgoldenrod:'#B8860B',darkgray:'#A9A9A9',darkgrey:'#A9A9A9',darkgreen:'#006400',darkkhaki:'#BDB76B',darkmagenta:'#8B008B',darkolivegreen:'#556B2F',darkorange:'#FF8C00',darkorchid:'#9932CC',darkred:'#8B0000',darksalmon:'#E9967A',darkseagreen:'#8FBC8F',darkslateblue:'#483D8B',darkslategray:'#2F4F4F',darkslategrey:'#2F4F4F',darkturquoise:'#00CED1',darkviolet:'#9400D3',deeppink:'#FF1493',deepskyblue:'#00BFFF',dimgray:'#696969',dimgrey:'#696969',dodgerblue:'#1E90FF',firebrick:'#B22222',floralwhite:'#FFFAF0',forestgreen:'#228B22',fuchsia:'#FF00FF',gainsboro:'#DCDCDC',ghostwhite:'#F8F8FF',gold:'#FFD700',goldenrod:'#DAA520',gray:'#808080',grey:'#808080',green:'#008000',greenyellow:'#ADFF2F',honeydew:'#F0FFF0',hotpink:'#FF69B4',indianred:'#CD5C5C',indigo:'#4B0082',ivory:'#FFFFF0',khaki:'#F0E68C',lavender:'#E6E6FA',lavenderblush:'#FFF0F5',lawngreen:'#7CFC00',lemonchiffon:'#FFFACD',lightblue:'#ADD8E6',lightcoral:'#F08080',lightcyan:'#E0FFFF',lightgoldenrodyellow:'#FAFAD2',lightgray:'#D3D3D3',lightgrey:'#D3D3D3',lightgreen:'#90EE90',lightpink:'#FFB6C1',lightsalmon:'#FFA07A',lightseagreen:'#20B2AA',lightskyblue:'#87CEFA',lightslategray:'#778899',lightslategrey:'#778899',lightsteelblue:'#B0C4DE',lightyellow:'#FFFFE0',lime:'#00FF00',limegreen:'#32CD32',linen:'#FAF0E6',magenta:'#FF00FF',maroon:'#800000',mediumaquamarine:'#66CDAA',mediumblue:'#0000CD',mediumorchid:'#BA55D3',mediumpurple:'#9370D8',mediumseagreen:'#3CB371',mediumslateblue:'#7B68EE',mediumspringgreen:'#00FA9A',mediumturquoise:'#48D1CC',mediumvioletred:'#C71585',midnightblue:'#191970',mintcream:'#F5FFFA',mistyrose:'#FFE4E1',moccasin:'#FFE4B5',navajowhite:'#FFDEAD',navy:'#000080',oldlace:'#FDF5E6',olive:'#808000',olivedrab:'#6B8E23',orange:'#FFA500',orangered:'#FF4500',orchid:'#DA70D6',palegoldenrod:'#EEE8AA',palegreen:'#98FB98',paleturquoise:'#AFEEEE',palevioletred:'#D87093',papayawhip:'#FFEFD5',peachpuff:'#FFDAB9',peru:'#CD853F',pink:'#FFC0CB',plum:'#DDA0DD',powderblue:'#B0E0E6',purple:'#800080',red:'#FF0000',rosybrown:'#BC8F8F',royalblue:'#4169E1',saddlebrown:'#8B4513',salmon:'#FA8072',sandybrown:'#F4A460',seagreen:'#2E8B57',seashell:'#FFF5EE',sienna:'#A0522D',silver:'#C0C0C0',skyblue:'#87CEEB',slateblue:'#6A5ACD',slategray:'#708090',slategrey:'#708090',snow:'#FFFAFA',springgreen:'#00FF7F',transparent:'#000',steelblue:'#4682B4',tan:'#D2B48C',teal:'#008080',thistle:'#D8BFD8',tomato:'#FF6347',turquoise:'#40E0D0',violet:'#EE82EE',wheat:'#F5DEB3',white:'#FFFFFF',whitesmoke:'#F5F5F5',yellow:'#FFFF00',yellowgreen:'#9ACD32"'};

  // CSS value regexes, according to http://www.w3.org/TR/css3-values/
  var css_integer = '(?:\\+|-)?\\d+';
  var css_float = '(?:\\+|-)?\\d*\\.\\d+';
  var css_number = '(?:' + css_integer + ')|(?:' + css_float + ')';
  css_integer = '(' + css_integer + ')';
  css_float = '(' + css_float + ')';
  css_number = '(' + css_number + ')';
  var css_percentage = css_number + '%';
  var css_whitespace = '\\s*?';

  // http://www.w3.org/TR/2003/CR-css3-color-20030514/
  var hsl_hsla_regex = new RegExp([
    '^hsl(a?)\\(', css_number, ',', css_percentage, ',', css_percentage, '(,', css_number, ')?\\)$'
  ].join(css_whitespace) );
  var rgb_rgba_integer_regex = new RegExp([
    '^rgb(a?)\\(', css_integer, ',', css_integer, ',', css_integer, '(,', css_number, ')?\\)$'
  ].join(css_whitespace) );
  var rgb_rgba_percentage_regex = new RegExp([
    '^rgb(a?)\\(', css_percentage, ',', css_percentage, ',', css_percentage, '(,', css_number, ')?\\)$'
  ].join(css_whitespace) );
  var remove_comma_regex = /^,\s*/;

  var hslToRgb = function(h, s, l, a) {

    var r, g, b;

    if (s == 0) {
      r = g = b = l; // achromatic
    } else {

      function hue2rgb(p, q, t){
        if(t < 0) t += 1;
        if(t > 1) t -= 1;
        if(t < 1 / 6) return p + (q - p) * 6 * t;
        if(t < 1 / 2) return q;
        if(t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      }

      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
    }

    var alpha = _.isUndefined(a) || _.isNull(a) ? 1.0 : a.replace(remove_comma_regex, '');

    return {
      r: hue2rgb(p, q, h + 1 / 3),
      g: hue2rgb(p, q, h),
      b: hue2rgb(p, q, h - 1 / 3),
      a: alpha
    };
  }

  var stringParsers = [
    // CSS RGB(A) literal
    function(css) {

      css = trim(css);

      var withInteger = match(rgb_rgba_integer_regex, 255);
      if (withInteger) {
        return withInteger;
      }

      return match(rgb_rgba_percentage_regex, 100);

      function match(regex, max_value) {

        var colorGroups = css.match(regex);

        if (!colorGroups || (!!colorGroups[1] + !!colorGroups[5] === 1)) {
          return;
        }

        var alpha = _.isUndefined(colorGroups[5]) ? 1.0 : colorGroups[5].replace(remove_comma_regex, '');

        return {
          r: Math.min(1, Math.max(0, colorGroups[2] / max_value)),
          g: Math.min(1, Math.max(0, colorGroups[3] / max_value)),
          b: Math.min(1, Math.max(0, colorGroups[4] / max_value)),
          a: Math.min(1, Math.max(alpha, 0))
        };

      }

    },

    function(css) {

      var lower = css.toLowerCase();
      if (lower in css_colors) {
        css = css_colors[lower];
      }

      if (!css.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)) {
        return;
      }

      css = css.replace(/^#/, '');
      var bytes = css.length / 3;
      var max = Math.pow(16, bytes) - 1;

      return {
        r: parseInt(css.slice(0, bytes), 16) / max,
        g: parseInt(css.slice(bytes * 1,bytes * 2), 16) / max,
        b: parseInt(css.slice(bytes * 2), 16) / max,
        a: 1.0
      };

    },

    // css HSL(A) literal
    function(css) {

      var colorGroups = trim(css).match(hsl_hsla_regex);

      // if there is an "a" after "hsl", there must be a fourth parameter and the other way round
      if (!colorGroups || (!!colorGroups[1] + !!colorGroups[5] === 1)) {
        return null;
      }

      var h = ((colorGroups[2] % 360 + 360) % 360) / 360;
      var s = Math.max(0, Math.min(parseInt(colorGroups[3], 10) / 100, 1));
      var l = Math.max(0, Math.min(parseInt(colorGroups[4], 10) / 100, 1));

      return hslToRgb(h, s, l, colorGroups[5]);

    }

  ];

  var Group = function(styles) {

    CanvasRenderer.Group.call(this, styles);

  };

  _.extend(Group.prototype, CanvasRenderer.Group.prototype, {

    appendChild: function() {

      CanvasRenderer.Group.prototype.appendChild.apply(this, arguments);

      this.updateMatrix();

      return this;

    },

    updateMatrix: function(parentMatrix) {

      var matrix = parentMatrix || this.parent && this.parent.matrix;

      if (!matrix) {
        return this;
      }

      this._matrix = multiplyMatrix(this.matrix, matrix);

      _.each(this.children, function(child) {
        child.updateMatrix(this._matrix);
      }, this);

      return this;

    },

    render: function(gl, program) {

      // Apply matrices here somehow...

      _.each(this.children, function(child) {
        child.render(gl, program);
      });

    }

  });

  var Element = function(styles) {

    CanvasRenderer.Element.call(this, styles);

  };

  _.extend(Element.prototype, CanvasRenderer.Element.prototype, {

    updateMatrix: function(parentMatrix) {

      var matrix = parentMatrix || this.parent && this.parent.matrix

      if (!matrix) {
        return this;
      }

      this._matrixOld = this._matrix;
      this._matrix = multiplyMatrix(this.matrix, matrix);

      // Also update linewidth
      this._linewidth = this.linewidth * getScale(this._matrix);

      return this;

    },

    render: function(gl, program) {

      if (!this.visible || !this.fillBuffer || !this.strokeBuffer) {
        return this;
      }

      // Temp
      gl.uniform1f(program.id, Math.random());
      gl.uniformMatrix3fv(program.matrixOld, false, this._matrixOld);
      gl.uniformMatrix3fv(program.matrix, false, this._matrix);

      // Fill
      if (this.fill.a > 0 && this.triangleAmount > 0) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.fillBuffer);
        gl.vertexAttribPointer(program.position, 2, gl.FLOAT, false, 0, 0);
        gl.uniform4f(program.color, this.fill.r, this.fill.g, this.fill.b, this.fill.a * this.opacity);
        gl.drawArrays(gl.TRIANGLES, 0, this.triangleAmount);

      }

      // Stroke
      if (this._linewidth <= 0 || this.stroke.a <= 0 || this.vertexAmount < 4) {
        return this;
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, this.strokeBuffer);
      gl.vertexAttribPointer(program.position, 2, gl.FLOAT, false, 0, 0);
      gl.uniform4f(program.color, this.stroke.r, this.stroke.g, this.stroke.b, this.stroke.a * this.opacity);
      gl.lineWidth(this._linewidth);
      gl.drawArrays(gl.LINES, 0, this.vertexAmount);

      return this;

    }

  });

  var webgl = {

    updateBuffer: function(gl, elem, positionLocation) {

      // Handle Fill

      if (_.isObject(elem.fillBuffer)) {
        gl.deleteBuffer(elem.fillBuffer);
      }

      elem.fillBuffer = gl.createBuffer();

      gl.bindBuffer(gl.ARRAY_BUFFER, elem.fillBuffer);
      gl.enableVertexAttribArray(positionLocation);

      gl.bufferData(gl.ARRAY_BUFFER, elem.triangles, gl.STATIC_DRAW);

      // Handle Stroke

      if (_.isObject(elem.strokeBuffer)) {
        gl.deleteBuffer(elem.strokeBuffer);
      }

      elem.strokeBuffer = gl.createBuffer();

      gl.bindBuffer(gl.ARRAY_BUFFER, elem.strokeBuffer);
      gl.enableVertexAttribArray(positionLocation);

      gl.bufferData(gl.ARRAY_BUFFER, elem.vertices, gl.STATIC_DRAW);

    },

    /**
     * Interpret a css color string and return an object of normalized
     * r, g, b color values.
     */
    interpret: function(v) {

      for (var i = 0, l = stringParsers.length; i < l; i++) {
        var color = stringParsers[i](v);
        if (color) {
          return color;
        }
      }

      /**
       * Default to invisible black if can't find a color.
       */
      return {
        r: 0, g: 0, b: 0, a: 0
      };

    },

    /**
     * Takes an array of vertices and converts them into a subdvided array
     * of vertices that express the hull of a given shape accurately for the
     * webgl renderer. It also returns the last index for properly drawing
     * a closed or open stroke.
     */
    extrapolate: function(coords, closed, curved) {

      var points = coords.slice(0);

      if (!curved) {
        return {
          vertices: points,
          last: points.length - 1
        };
      }

      // If curved, then subdivide the path and update the points.

      var curve = getCurveFromPoints(points, true);
      var length = curve.length;
      var last = length - 1;
      var divided = [];
      var finalVertex = curve.length;

      _.each(curve, function(p, i) {
        var q = curve[mod(i + 1, length)];
        var subdivision = subdivide(
          p.x, p.y, p.v.x, p.v.y, q.u.x, q.u.y, q.x, q.y);
        // Calculate index of last "vertex" as well.
        if (i >= last) {
          finalVertex = divided.length - 2;
        }
        divided = divided.concat(subdivision);
      });

      return {
        vertices: divided,
        last: finalVertex
      };

    },

    /**
     * Takes an array of vertices and converts them into an array of
     * triangles and array of outline verts ready to be fed to the webgl
     * renderer.
     */
    tessellate: function(points, closed, curved, finalVertex, reuseTriangles, reuseVertices) {

      var shapes = flatten(decoupleShapes(points));
      var triangles = [], vertices = [], triangleAmount = 0, vertexAmount = 0;

      _.each(shapes, function(coords, i) {

        if (coords.length < 3) {
          return;
        }

        // Tessellate the current set of points.

        var triangulation = new tessellation.SweepContext(_.map(coords, function(c) {
          return new Two.Vector(c.x, c.y);
        }));
        tessellation.sweep.Triangulate(triangulation, true);

        triangleAmount += triangulation.triangles.length * 3 * 2;
        _.each(triangulation.triangles, function(tri, i) {

          var points = tri.points;
          var a = points[0];
          var b = points[1];
          var c = points[2];

          triangles.push(a.x, a.y, b.x, b.y, c.x, c.y);

        });

      });

      var pointLength = points.length;
      vertexAmount = pointLength * 4;
      _.each(points, function(p, i) {
        var q = points[mod(i + 1, pointLength)];
        vertices.push(p.x, p.y, q.x, q.y);
      });

      var triangles_32 = (!!reuseTriangles && triangleAmount <= reuseTriangles.length) ? reuseTriangles : new Two.Array(triangleAmount);
      var vertices_32 = (!!reuseVertices && vertexAmount <= reuseVertices.length) ? reuseVertices : new Two.Array(vertexAmount);

      triangles_32.set(triangles);
      vertices_32.set(vertices);

      return {
        triangles: triangles_32,
        vertices: vertices_32,
        triangleAmount: triangleAmount / 2,
        vertexAmount: closed ? vertexAmount / 2 : finalVertex * 2
      };

    },

    program: {

      create: function(gl, shaders) {

        var program = gl.createProgram();
        _.each(shaders, function(s) {
          gl.attachShader(program, s);
        });

        gl.linkProgram(program);
        var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!linked) {
          error = gl.getProgramInfoLog(program);
          throw new Two.Utils.Error('unable to link program: ' + error);
          gl.deleteProgram(program);
          return null;
        }

        return program;

      }

    },

    shaders: {

      create: function(gl, source, type) {

        var shader = gl.createShader(gl[type]);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!compiled) {
          var error = gl.getShaderInfoLog(shader);
          throw new Two.Utils.Error('unable to compile shader ' + shader + ': ' + error);
          gl.deleteShader(shader);
          return null;
        }

        return shader;

      },

      types: {
        vertex: 'VERTEX_SHADER',
        fragment: 'FRAGMENT_SHADER'
      },

      vertex: [
        'attribute vec2 position;',
        'uniform mat3 matrix;',
        'uniform vec2 resolution;',
        '',
        'void main() {',
        '   vec2 projected = (matrix * vec3(position, 1)).xy;',
        '   vec2 normal = projected / resolution;',
        '   vec2 clipspace = (normal * 2.0) - 1.0;',
        '',
        '   gl_Position = vec4(clipspace * vec2(1.0, -1.0), 0.0, 1.0);',
        '}'
      ].join('\n'),

      mrtVertex: [
        'attribute vec2 position;',
        'uniform mat3 matrix;',
        'uniform mat3 matrixOld;',
        'uniform vec2 resolution;',
        'varying vec2 velocity;',
        '',
        'void main() {',
        '  const float m = 0.5;',
        '  vec2 projected = (matrix * vec3(position, 1)).xy;',
        '  vec2 normal = projected / resolution;',
        '  vec2 clipspace = (normal * 2.0) - 1.0;',
        '  vec2 projectedOld = (matrixOld * vec3(position, 1)).xy;',
        '',
        '  velocity = (projected-projectedOld)/50.0;',
        '  velocity.x = -velocity.x;',
        '  velocity.x = max(min(velocity.x, m), -m)+0.5;',
        '  velocity.y = max(min(velocity.y, m), -m)+0.5;',
        '  gl_Position = vec4(clipspace * vec2(1.0, -1.0), 0.0, 1.0);',
        '}'
      ].join('\n'),

      fragment: [
        'precision mediump float;',
        '',
        'uniform vec4 color;',
        '',
        'void main() {',
        '  gl_FragColor = color;',
        '}'
      ].join('\n'),

      mrtFragment: [
        'precision mediump float;',
        '',
        'uniform vec4 color;',
        'uniform float id;',
        'varying vec2 velocity;',
        '',
        'void main() {',
        '  gl_FragData[0] = color;',
        '  gl_FragData[1] = vec4(velocity, 0.0, 1.0);',
        '  gl_FragData[2] = vec4(id, 0.0 \, 0.0, 1.0);',
        '}'
      ].join('\n'),

      postVertex: [
        'attribute vec2 position;',
        'uniform vec2 targetSize;',
        'uniform vec2 resolution;',
        'varying vec2 uv;',
        '',
        'void main() {',
        '   uv = (position/2.0+vec2(0.5))*resolution/targetSize;',
        '   gl_Position = vec4(position, 0.0, 1.0);',
        '}'
      ].join('\n'),

      postFragment: [
        'precision mediump float;',
        '',
        'uniform sampler2D Sampler0;',
        'uniform sampler2D Sampler1;',
        'uniform sampler2D Sampler2;',
        'varying vec2 uv;',
        '',
        'void main() {',
        '',
        '  const float s = 32.0;',
        '  vec4 color = texture2D(Sampler0, uv);',
        '  vec2 velocity = texture2D(Sampler1, uv).xy - vec2(0.5);',
        '  if (velocity == vec2(0.5)){',
        '    velocity = vec2(0.);',
        '  }',
        '  velocity /= 200.;',
        '  vec2 uv2 = uv - velocity * s/4.;',  
        '  for(float i = 1.; i < s; ++i)',
        '  {',
        '    uv2 += velocity*0.5;',
        '    color += texture2D(Sampler0, uv2);',
        '  }',
        '  gl_FragColor = color / s;',
        '}'
      ].join('\n')

    }

  };

  function makeColorAttachmentArray(gl, lenght) {
    var array = []
    for (var ii = 0; ii < length; ++ii) {
      array.push(gl.COLOR_ATTACHMENT0 + ii);
    }
    return array;
  }

  function makeTextureArray(gl, length, width, height) {

    var attatchments = []
    for (var i = 0; i < length; ++i) {
      attatchments.push(gl.COLOR_ATTACHMENT0 + i);
    }
    gl.mrt.drawBuffersEXT(attatchments);

    var textures = []
    for (var j = 0; j < length; ++j) {
      
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, attatchments[j], gl.TEXTURE_2D, texture, 0);

      textures.push(texture);

    }

    return textures;

  }

  var RenderTarget = function(gl, width, height){
    
    this.width = width;
    this.height = height;

    this.frameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);

    this.texture = makeTextureArray(gl, 3, width, height);

  }

  /**
   * Webgl Renderer inherits from the Canvas 2d Renderer
   * with additional modifications.
   */

  var Renderer = Two[Two.Types.webgl] = function(options) {

    this.domElement = document.createElement('canvas');

    this.elements = [];

    // Everything drawn on the canvas needs to come from the stage.
    this.stage = null;

    // http://games.greggman.com/game/webgl-and-alpha/
    // http://www.khronos.org/registry/webgl/specs/latest/#5.2

    var params = _.defaults(options || {}, {
      antialias: false,
      alpha: true,
      premultipliedAlpha: true,
      stencil: true,
      preserveDrawingBuffer: false,
      motionblur: false
    });

    var gl = this.ctx = this.domElement.getContext('webgl', params)
      || this.domElement.getContext('experimental-webgl', params);
    gl.mrt = gl.getExtension( "EXT_draw_buffers" );

    if (!this.ctx) {
      throw new Two.Utils.Error('unable to create a webgl context. Try using another renderer.');
    }

    if (!params.motionblur || !gl.mrt) {
      
      // Compile Base Shaders to draw in pixel space.
      var vs = webgl.shaders.create(
        this.ctx, webgl.shaders.vertex, webgl.shaders.types.vertex);
      var fs = webgl.shaders.create(
        this.ctx, webgl.shaders.fragment, webgl.shaders.types.fragment);
      this.program = webgl.program.create(gl, [vs, fs]);

    } else {

        var vs = webgl.shaders.create(
          gl, webgl.shaders.mrtVertex, webgl.shaders.types.vertex);
        var fs = webgl.shaders.create(
          gl, webgl.shaders.mrtFragment, webgl.shaders.types.fragment);

        this.program = webgl.program.create(gl, [vs, fs]);
        this.program.matrixOld = gl.getUniformLocation(this.program, 'matrixOld');
        this.program.id = gl.getUniformLocation(this.program, 'id');

        var postVs = webgl.shaders.create(
          this.ctx, webgl.shaders.postVertex, webgl.shaders.types.vertex);
        var postFs = webgl.shaders.create(
          this.ctx, webgl.shaders.postFragment, webgl.shaders.types.fragment);

        this.postProgram = webgl.program.create(gl, [postVs, postFs]);
        this.postProgram.resolution = gl.getUniformLocation(this.postProgram,'resolution');
        this.postProgram.targetSize = gl.getUniformLocation(this.postProgram,'targetSize');
        this.postProgram.position = gl.getAttribLocation(this.postProgram, 'position');
        gl.useProgram(this.postProgram);
        gl.uniform1i(gl.getUniformLocation(this.postProgram,'Sampler0'),0);
        gl.uniform1i(gl.getUniformLocation(this.postProgram,'Sampler1'),1);
        gl.uniform1i(gl.getUniformLocation(this.postProgram,'Sampler2'),2);

        this.renderTarget = new RenderTarget(gl, 4096, 4096);

        this.quad = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1,1,-1,1,1,-1,1,-1,-1,1,-1,-1]), gl.STATIC_DRAW);

    }

    gl.useProgram(this.program);

    // look up where the vertex data needs to go.
    this.program.position = gl.getAttribLocation(this.program, 'position');
    this.program.color = gl.getUniformLocation(this.program, 'color');
    this.program.matrix = gl.getUniformLocation(this.program, 'matrix');
    

    // Copied from Three.js WebGLRenderer
    this.ctx.disable(this.ctx.DEPTH_TEST);

    // Setup some initial statements of the gl context
    this.ctx.enable(this.ctx.BLEND);
    this.ctx.blendEquationSeparate(this.ctx.FUNC_ADD, this.ctx.FUNC_ADD);
    this.ctx.blendFuncSeparate(this.ctx.SRC_ALPHA, this.ctx.ONE_MINUS_SRC_ALPHA,
      this.ctx.ONE, this.ctx.ONE_MINUS_SRC_ALPHA );

  };

  _.extend(Renderer, {

    Group: Group,

    Element: Element,

    getStyles: getStyles,

    setStyles: setStyles

  });

  _.extend(Renderer.prototype, Backbone.Events, CanvasRenderer.prototype, {

    setSize: function(width, height) {

      this.width = width;
      this.height = height;

      CanvasRenderer.prototype.setSize.apply(this, arguments);

      this.ctx.viewport(0, 0, width, height);

      var resolutionLocation = this.ctx.getUniformLocation(
        this.program, 'resolution');
      this.ctx.useProgram(this.program);
      this.ctx.uniform2f(resolutionLocation, width, height);

      return this;

    },

    render: function() {

      if (_.isNull(this.stage)) {
        return this;
      }

      // Draw a green rectangle

      var gl = this.ctx,
        program = this.program;

      gl.useProgram(this.program);

      if (!this.renderTarget) {

        gl.bindFramebuffer(gl.FRAMEBUFFER,null);
        this.stage.render(gl, this.program);

      } else {

        //MRT first pass
        this.ctx.viewport(0, 0, Math.min(this.width,this.renderTarget.width), Math.min(this.height,this.renderTarget.height));
        
        gl.bindFramebuffer(gl.FRAMEBUFFER,this.renderTarget.frameBuffer);
        gl.clearColor(1.0,1.0,1.0,1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        this.stage.render(gl, this.program);
        
        this.ctx.viewport(0, 0, this.width, this.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER,null);

        // POST
        gl.useProgram(this.postProgram);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.renderTarget.texture[0]);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.renderTarget.texture[1]);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.renderTarget.texture[2]);

        gl.uniform2f(this.postProgram.resolution, Math.min(this.width,this.renderTarget.width), Math.min(this.height,this.renderTarget.height));
        gl.uniform2f(this.postProgram.targetSize, this.renderTarget.width, this.renderTarget.height);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
        gl.vertexAttribPointer(this.postProgram.position, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      return this;

    }

  });

  function getStyles(o) {

    var styles = {},
      id = o.id,
      matrix = o._matrix,
      stroke = o.stroke,
      linewidth = o.linewidth,
      fill = o.fill,
      opacity = o.opacity,
      visible = o.visible,
      cap = o.cap,
      join = o.join,
      miter = o.miter,
      curved = o.curved,
      closed = o.closed,
      vertices = o.vertices;

    if (id) {
      styles.id = id;
    }
    if (_.isObject(matrix)) {
      styles.matrix = styles._matrix = matrix.toArray(true);
      styles._matrixOld = styles.matrix;
    }
    if (stroke) {
      styles.stroke = webgl.interpret(stroke); // Interpret color
    }
    if (fill) {
      styles.fill = webgl.interpret(fill); // Interpret color
    }
    if (_.isNumber(opacity)) {
      styles.opacity = opacity;
    }
    if (cap) {
      styles.cap = cap;
    }
    if (join) {
      styles.join = join;
    }
    if (miter) {
      styles.miter = miter;
    }
    if (linewidth) {
      styles.linewidth = linewidth;
      styles._linewidth = linewidth * getScale(styles._matrix);
    }
    if (vertices) {

      var pointData = webgl.extrapolate(vertices, closed, curved)
      var vertices = pointData.vertices;
      var t = webgl.tessellate(vertices, closed, curved, pointData.last);

      styles.triangles = t.triangles;
      styles.vertices = t.vertices;
      styles.vertexAmount = t.vertexAmount;
      styles.triangleAmount = t.triangleAmount;

    }
    styles.visible = !!visible;
    styles.curved = !!curved;
    styles.closed = !!closed;

    return styles;

  }

  function setStyles(elem, property, value, closed, curved) {

    switch (property) {

      case 'matrix':
        property = 'matrix';
        value = value.toArray(true);
        break;
      case 'linewidth':
        property = 'linewidth';
        elem._linewidth = value * getScale(elem._matrix);
        break;
      case 'stroke':
        // interpret color
        value = webgl.interpret(value);
        break;
      case 'fill':
        // interpret color
        value = webgl.interpret(value);
        break;
      case 'vertices':
        property = 'triangles';
        elem.closed = closed;
        elem.curved = curved;

        var pointData = webgl.extrapolate(value, closed, curved);
        var vertices = pointData.vertices;
        var t = webgl.tessellate(vertices, closed, curved, pointData.last, elem.triangles, elem.vertices);

        value = t.triangles;
        elem.vertices = t.vertices;
        elem.vertexAmount = t.vertexAmount;
        elem.triangleAmount = t.triangleAmount;

        break;
    }

    elem[property] = value;

    // Try moving this to switch statement
    if (property === 'triangles') {
      webgl.updateBuffer(this.ctx, elem, this.positionLocation);
    }
    if (property === 'matrix') {
      elem.updateMatrix();
    }

  }

  /**
   * Remove nested arrays and place all arrays as shallow as possible.
   */
  function flatten(array) {

    var result = [];

    _.each(array, function(v) {

      if (_.isArray(v) && _.isArray(v[0])) {
        result = result.concat(flatten(v));
      } else {
        result.push(v);
      }

    });

    return result;

  }

  function getScale(matrix) {

    var a = matrix[0];
    var b = matrix[1];
    var c = matrix[2];
    var d = matrix[3];
    var e = matrix[4];
    var f = matrix[5];

    var v = multiplyMatrix([a, b, c, d, e, f, 0, 0, 1], [1, 0, 1]);
    return sqrt(v.x * v.x + v.y * v.y);

  }

  function trim(str) {
    return str.replace(/^\s+|\s+$/g, '');
  }

})();
module.exports = Rainbow;

function Rainbow(a,b,c,d){
  if (a instanceof Color) {
    return a;
  }
  var hsl, rgb, ansi;
  if (Array.isArray(a)) {
    c = a[2]; b = a[1]; a = a[0];
  } else if (typeof a === 'string') {
    a = a.toLowerCase();
    if (Array.isArray(b)) {
      d = b[2]; c = b[1]; b = b[0];
    }
    if (a === 'hsl') return Color(hsl2ansi(b, c, d));
    if (a === 'rgb') return Color(rgb2ansi(b, c, d));
    if (a === 'ansi') return Color(b);
    if (a[0] === '#') return Color(hex2ansi(a));
  }
  if (isDecimal(b) || isDecimal(c) || between(256, 360, a)) {
    return Color(hsl2ansi(a, b, c));
  } else if (inRGB(a) && inRGB(b) && inRGB(c)) {
    return Color(rgb2ansi(a, b, c));
  } else if (isFinite(a)) {
    return Color(rgb2ansi(a >> 16, a >> 8 & 255, a & 255));
  }
  if (ansi) return Color(ansi);
  throw new Error('No idea what you gave to me');
}

function wrapMethod(method){
  return function(){
    return new ColorSet(method.apply(this, arguments));
  };
}


function ColorSet(a){
  a.__proto__ = ColorSet.prototype;
  return a;
}

ColorSet.prototype = {
  __proto__: Array.prototype,
  constructor: ColorSet,
  hsl: function hsl(){ return this.map(function(c){ return c.hsl() }) },
  rgb: function rgb(){ return this.map(function(c){ return c.rgb() }) },
  ansi: function ansi(){ return this.map(function(c){ return c.ansi() }) },
  filter: function filter(p, cmpr, v){
    var fn;
    var type = (p === 'h' || p ==='s' || p === 'l') ? 'hsl' : 'rgb';
    switch (cmpr) {
     case  '>': fn = function(c){ return c[p]  > v }; break;
     case  '<': fn = function(c){ return c[p]  < v }; break;
     case '==': fn = function(c){ return c[p] == v }; break;
     case '!=': fn = function(c){ return c[p] != v }; break;
    }
    return new ColorSet([].filter.call(this[type](), fn)).ansi();
  },
  unique: function unique(){
    var seenThisTime = {};
    return new ColorSet([].filter.call(this, function(c){
     if (!(c.code in seenThisTime)) {
       return seenThisTime[c.code] = true;
     }
    }));
  },
  chunk: function chunk(size){
    var chunks = this.length / size;
    if (chunks | 0 !== chunks) chunks = chunks | 0 + 1;
    var out = [], arr=this.slice();
    while (chunks--) {
      out.push(this.slice(chunks*size, size*(chunks+1)));
    }
    return out;
  },
  toString: function toString(){
    return this.join('');
  }
};


['map', 'sort', 'concat', 'slice'].forEach(function(n){
  ColorSet.prototype[n] = wrapMethod(Array.prototype[n]);
});

['fg', 'bg', 'ital', 'inv', 'under', 'pad'].forEach(function(n){
  ColorSet.prototype[n] = function(v){
    return this.map(function(item){ return item[n](v) });
  };
});


Rainbow.gradient = function gradient(colors, lengthPer){
  return ColorSet(colors.map(function(color,i){
    return Rainbow(color).gradient(colors[ (i+1) % colors.length ], lengthPer || 15);
  }));
};


Rainbow.spectrum = function spectrum(){
  return Rainbow.gradient([ '#f00', '#ff0', '#0f0', '#0ff', '#00f', '#f0f' ]);
};



function Color(code){
  if (!isFinite(code)) return Rainbow(code);
  function Ansi(str){
    if (this instanceof Ansi) {
      var child = function AnsiChild(str){
        return AnsiChild.escape(str);
      };
      child.__proto__ = Ansi;
      child.code = code;
      return child;
    }
    return Ansi.escape(str);
  }
  Ansi.__proto__ = Color.prototype;
  Ansi.code = code;
  return Ansi;
}


Color.prototype = function(){
  var sets = {};

  sets.rgb = [
    [0x00, 0x00, 0x00], [0xcd, 0x00, 0x00], [0x00, 0xcd, 0x00], [0xcd, 0xcd, 0x00],
    [0x00, 0x00, 0xee], [0xcd, 0x00, 0xcd], [0x00, 0xcd, 0xcd], [0xe5, 0xe5, 0xe5],
    [0x7f, 0x7f, 0x7f], [0xff, 0x00, 0x00], [0x00, 0xff, 0x00], [0xff, 0xff, 0x00],
    [0x5c, 0x5c, 0xff], [0xff, 0x00, 0xff], [0x00, 0xff, 0xff], [0xff, 0xff, 0xff],
  ];

  var r = [0x00, 0x5f, 0x87, 0xaf, 0xd7, 0xff];

  for (var i=0; i < 217; i++) {
    sets.rgb.push([r[(i / 36 % 6) | 0], r[(i / 6 % 6) | 0], r[i % 6]]);
  }

  for (i=0; i < 22; i++){
    r = 8 + i * 10;
    sets.rgb.push([r, r, r]);
  }

  sets.hsl = sets.rgb.map(function(c){ return rgb2hsl(c[0], c[1], c[2]) });

  var limited = sets.rgb.slice(0,16);
  var cache = [];

  function closest(set, val){
    if (typeof set === 'string' && set in sets) set = sets[set];
    return set.reduce(function(n,v,i){
      var d = distance(val, v);
      return d < n[0] ? [d, v, i] : n;
    }, [Infinity]);
  }

  function distance(a,b){
    return sqr(a[0]-b[0]) + sqr(a[1]-b[1]) + sqr(a[2]-b[2]);
  }

  function mapDistance(v){
    v = v.hsl();
    return sets.hsl.slice(16).map(function(c){
      return [c, distance(c, v)];
    }).sort(function(a,b){
      return a[1]-b[1];
    });
  }

  return {
    __proto__: Rainbow.prototype,
    constructor: Color,
    ansi: function ansi(){
      return this;
    },
    rgb: function rgb(){
      return sets.rgb[this.code];
    },
    hsl: function hsl(){
      return sets.hsl[this.code];
    },
    hex: function hex(){
      return rgb2hex(sets.rgb[this.code]);
    },
    basic: function basic(bg){
      if (this.code in cache) return cache[this.code];
      var result = closest(limited, sets.rgb[this.code])[2];
      return cache[this.code] = result + (result > 7 ? 82 : 30) + (bg ? 10 : 0);
    },
    closest: function closest(n, t){
      var maps = mapDistance(this).slice(0, isFinite(n) ? n : 239);
      return new ColorSet(maps.map(function(c){
        return Rainbow('hsl', c[0][0], c[0][1], c[0][2]);
      }));
    },
    gradient: function gradient(c, n){
      var a = this.hsl();
      if (typeof c === 'string') c = Rainbow(c);
      n = (+n || 10)+1;
      c = c.hsl();
      var diff = [ (a[0]-c[0]) / n, (a[1]-c[1]) / n, (a[2]-c[2]) / n ];
      var out = [this];
      while (--n) {
        out[n] = Rainbow('hsl', a[0]-diff[0]*n, a[1]-diff[1]*n, a[2]-diff[2]*n);
      }
      return new ColorSet(out);
    },
    escape: function escape(text){
      var start = [];
      var end = [];
      var type = this.foreground ? '4' : '3';
      start.push(type+'8;5;'+this.code);
      end.push(type+'9');
      if (type !== '4' && this.background) {
        start.push('48;5;'+this.background.code);
        end.push('49');
      }
      if (type !== '3' && this.foreground) {
        start.push('38;5;'+this.foreground.code);
        end.push('39');
      }
      if (this.italic)    start.push('3'),  end.push('23');
      if (this.underline) start.push('4'),  end.push('24');
      if (this.overline)  start.push('21'), end.push('24');
      if (this.inverse)   start.push('7'),  end.push('27');
      function esc(nums){
        return '\33['+ nums.join(';')+'m';
      }
      return esc(start) + space(this.padding) + text + space(this.padding) + esc(end);
    },
    style: function style(styles){
      var out = Object.create(this);
      styles.forEach(function(style){
        out[style] = true;
      });
    },
    child: function child(){
      function AnsiChild(str){ return AnsiChild.escape(str) }
      AnsiChild.__proto__ = this;
      return AnsiChild;
    },
    fg: function foreground(v){ this.foreground = (v instanceof Rainbow ? v : Rainbow(v)); return this },
    bg: function background(v){ this.background = (v instanceof Rainbow ? v : Rainbow(v)); return this },
    ital: function italic(v){ def(this, 'italic', v || !this.italic); return this },
    inv: function inverse(v){ def(this, 'inverse', v || !this.inverse); return this },
    under: function underline(v){ def(this, 'underline',  v || !this.underline); return this },
    pad: function padding(pad){ this.padding = 1 in arguments ? pad : (this.padding+1)%4; return this; },
    toString: function toString(){
      return this.escape(('   '+this.code).slice(-3));
    },
    inspect: function inspect(){ return this.toString() },
  };
}();

function def(o,n,v){ Object.defineProperty(o,n, { configurable: true, writable: true, value: v })  }



function space(n){ return new Array(n+1).join(' ') }

function between(min,max,n){ return n >= min && n <= max }
function inRGB(n){ return between(0,255,n) }
function sqr(n){ return n*n }
function isPercent(n){ return n >= 0 && n <= 0 }
function isDecimal(n){ return n | 0 !== n}
function num(o){ return +o || 0 }
function twodigits(n){ return +n.toFixed(2) || 0 }



//var lines='┏┳━┓'+'┣╋━┫'+'┗┻━┛'+'…'


function hex2rgb(hex){
  hex = '0x' + hex.slice(1).replace(hex.length > 4 ? hex : /./g,'$&$&') | 0;
  return [hex >> 16, hex >> 8 & 255,  hex & 255];
}

function rgb2hex(r,g,b){
  return '#' + ((256 + r << 8 | g) << 8 | b).toString(16).slice(1);
}

function rgb2ansi(r,g,b){
  function d(x){ return (x / 255 * 5 + 0.5) | 0 }
  return d(r) * 36 + d(g) * 6 + d(b) + 16;
}

function rgb2hsl(r,g,b){
  var d=Math.min(r/=255,g/=255,b/=255),e=Math.max(r,g,b),f=e-d,g,h,i=(e+d)/2;
  f?(h=i<.5?f/(e+d):f/(2-e-d),r==e?g=(g-b)/f+(g<b?6:0):g==e?g=(b-r)/f+2:g=(r-g)/f+4,g*=60):h=g=0;
  return [g+.5|0,+h.toFixed(2),+i.toFixed(2)];
}

function hsl2rgb(d,e,f){
  function g(a){ return a>360?a-=360:a<0&&(a+=360),a<60?
   b+(c-b)*a/60:a<180?c:a<240?b+(c-b)*(240-a)/60:b }
  function h(a){ return g(a)*255+.5|0 }
  var b,c;d%=360;d<0&&(d+=360);
  e=e<0?0:e>1?1:e;f=f<0?0:f>1?1:f;
  c=f<=.5?f*(1+e):f+e-f*e;b=2*f-c;
  return [h(d+120), h(d), h(d-120)];
}

function hsl2ansi(h,s,l){
  var hsl = { h: h, s: s, l: l };
  var rgb = hsl2rgb(h,s,l);
  return rgb2ansi(rgb[0], rgb[1], rgb[2]);
}

function hex2ansi(hex){
  var rgb = hex2rgb(hex);
  return rgb2ansi(rgb[0], rgb[1], rgb[2]);
}

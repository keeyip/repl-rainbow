module.exports = Rainbow;

function Rainbow(a,b,c,d){
  if (a instanceof Rainbow) {
    return typeof b === 'string' ? a[b]() : a;
  }
  if (Array.isArray(a)) {
    c = a[2];
    b = a[1];
    a = a[0];
  } else if (typeof a === 'string') {
    a = a.toLowerCase();
    if (a === 'hsl') return HSL(b,c,d);
    if (a === 'rgb') return RGB(b,c,d);
    if (a === 'ansi') return Ansi(b);
    if (a[0] === '#') return RGB(a)
  }
  if (isDecimal(b) || isDecimal(c) || between(256, 360, a)) {
    return HSL(a,b,c);
  }
  if (typeof b === 'undefined' && isFinite(a) && a < 256 && a >= 0) {
    return Ansi(a);
  }
  if (inRGB(a) && inRGB(b) && inRGB(c)) {
    return RGB(a,b,c);
  }
  if (isFinite(a)) {
    return RGB(a >> 16, a >> 8 & 255, a & 255);
  }
}
Rainbow.Ansi = Ansi;
Rainbow.RGB = RGB;
Rainbow.HSL = HSL;


function between(min,max,n){ return n >= min && n <= max }
function inRGB(n){ return between(0,255,n) }

function rgb2hex(r,g,b){
  return '#' + ((256 + r << 8 | g) << 8 | b).toString(16).slice(1);
}

function sqr(n){ return n*n }

function isPercent(n){ return n >= 0 && n <= 0 }
function isDecimal(n){ return n | 0 !== n}

function RGB(r,g,b){
  var unique = r[0]==='#' ? r : rgb2hex(r,g,b);
  if (unique in rgbcache) return rgbcache[unique];
  var rgb = this instanceof RGB ? this : Object.create(RGB.prototype);
  if (typeof r === 'string' && r[0] === '#') {
    r = '0x' + r.slice(1).replace(r.length > 4 ? r : /./g,'$&$&') | 0;
    rgb.r = r >> 16;
    rgb.g = r >> 8 & 255;
    rgb.b = r & 255;
  } else {
    rgb.r = r;
    rgb.g = g;
    rgb.b = b;
  }
  return rgbcache[unique] = rgb;
}

var rgbcache = {};



RGB.prototype = {
  __proto__: Rainbow.prototype,
  constructor: RGB,
  rgb: function rgb(){
    return this;
  },
  hsl: function hsl(){
    var r=this.r,g=this.g,b=this.b;
    var d=Math.min(r/=255,g/=255,b/=255),e=Math.max(r,g,b),f=e-d,g,h,i=(e+d)/2;
    f?(h=i<.5?f/(e+d):f/(2-e-d),r==e?g=(g-b)/f+(g<b?6:0):g==e?g=(b-r)/f+2:g=(r-g)/f+4,g*=60):h=g=0;
    return HSL(g+.5|0,+h.toFixed(2),+i.toFixed(2));
  },
  hex: function hex(){
    return rgb2hex(this.r, this.g, this.b);
  },
  ansi: function ansi(){
    function d(x){ return (x / 255 * 5 + .5) | 0 }
    return Ansi(d(this.r) * 36 + d(this.g) * 6 + d(this.b) + 16);
  },
  closest: function closest(n){
    return this.ansi().closest(n, 'rgb');
  },
  gradient: function gradient(c, n){
    return this.ansi().gradient(c, n, 'rgb');
  },
  toString: function toString(){
    return 'rgb('+[this.r,this.g,this.b]+')';
  },
  get 0(){ return this.r },
  get 1(){ return this.g },
  get 2(){ return this.b },
};

function HSL(h,s,l){
  if (s>1) s /= 100;
  if (l>1) l /= 25;
  var unique = [h,s,l]+'';
  if (unique in hslcache) return hslcache[unique];
  var hsl = this instanceof HSL ? this : Object.create(HSL.prototype);
  hsl.h = h;
  hsl.s = s;
  hsl.l = l;
  return hslcache[unique] = hsl;
}

var hslcache = {};

HSL.prototype = {
  __proto__: Rainbow.prototype,
  constructor: HSL,
  hsl: function hsl(){
   return this;
  },
  rgb: function rgb(){
    function g(a){
      return a>360?a-=360:a<0&&(a+=360),a<60?b+(c-b)*a/60:a<180?c:a<240?b+(c-b)*(240-a)/60:b
    }
    function h(a){ return g(a)*255+.5|0 }
    var b,c,d=this.h,e=this.s,f=this.l;
    d%=360;d<0&&(d+=360);
    e=e<0?0:e>1?1:e;
    f=f<0?0:f>1?1:f;
    c=f<=.5?f*(1+e):f+e-f*e;
    b=2*f-c;
    return RGB(h(d+120), h(d), h(d-120));
  },
  ansi: function ansi(){
    return this.rgb().ansi();
  },
  hex: function hex(){
    return this.rgb().hex();
  },
  closest: function closest(n){
    return this.ansi().closest(n, 'hsl');
  },
  gradient: function gradient(c, n){
    return this.ansi().gradient(c, n, 'hsl');
  },
  toString: function toString(){
    return 'hsl('+[this.h,this.s,this.l]+')';
  },
  get 0(){ return this.h },
  get 1(){ return this.s*100 },
  get 2(){ return this.l*25 },
};

function Ansi(code){
  if (code in ansicache) return ansicache[code];
  var ansi = this instanceof Ansi ? this : Object.create(Ansi.prototype);
  ansi.code = code;
  return ansicache[code] = ansi;
}

var ansicache = {}; 

Ansi.prototype = function(){
  var sets = {};

  sets.rgb = [
    [0x00, 0x00, 0x00], [0xcd, 0x00, 0x00], [0x00, 0xcd, 0x00], [0xcd, 0xcd, 0x00],
    [0x00, 0x00, 0xee], [0xcd, 0x00, 0xcd], [0x00, 0xcd, 0xcd], [0xe5, 0xe5, 0xe5],
    [0x7f, 0x7f, 0x7f], [0xff, 0x00, 0x00], [0x00, 0xff, 0x00], [0xff, 0xff, 0x00],
    [0x5c, 0x5c, 0xff], [0xff, 0x00, 0xff], [0x00, 0xff, 0xff], [0xff, 0xff, 0xff],
  ];

  var r = [0x00, 0x5f, 0x87, 0xaf, 0xd7, 0xff];

  for (var i=0; i < 217; i++) {
    sets.rgb.push([r[(i / 36) % 6 | 0], r[(i / 6) % 6 | 0], r[i % 6]]);
  }

  for (i=0; i < 22; i++){
    r = 8 + i * 10;
    sets.rgb.push([r, r, r]);
  }

  sets.rgb = sets.rgb.map(function(c){ return RGB.apply(null, c) });
  sets.hsl = sets.rgb.map(function(c){ return c.hsl() });

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
    constructor: Ansi,
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
      return sets.rgb[this.code].hex();
    },
    basic: function basic(bg){
      if (this.code in cache) return cache[this.code];
      var result = closest(limited, sets.rgb[this.code])[2];
      return cache[this.code] = result + (result > 7 ? 82 : 30) + (bg ? 10 : 0);
    },
    closest: function closest(n, t){
      t = t || 'ansi';
      return ColorSet.rebase(mapDistance(this.rgb()).slice(0, isFinite(n) ? n : 239).map(function(c){
        return c[0][t]();
      }));
    },
    gradient: function gradient(c, n, type){
      type = type || 'hsl';
      var a = this[type]();
      if (typeof c === 'string') c = Color(c)[type]();
      n = +n || 10;
      n++;
      var diff = [ (a[0]-c[0]) / n, (a[1]-c[1]) / n, (a[2]-c[2]) / n ];
      var out = [];
      while (--n) {
        out[n-1] = closest(type, Color(type, a[0]-diff[0]*n, a[1]-diff[1]*n, a[2]-diff[2]*n))[1];
      }
      return ColorSet.rebase(out);
    },
    escape: function escape(text, bg){
      var s = bg ? 48 : 38;
      return '\33['+s+';5;'+this.code+'m'+text+'\33['+(s+1)+'m';
    },
    toString: function toString(){
      return this.code;
    },
    inspect: function inspect(){
      return this.escape(' '+('   '+this.code).slice(-3)+' ', 'bg');
    },
    get 0(){ return sets.rgb[this.code].r },
    get 1(){ return sets.rgb[this.code].g },
    get 2(){ return sets.rgb[this.code].b },
  };
}();


function ColorSet(items){
  items.forEach(function(item, i){
    if (typeof item === 'string') item = Color(item);
    this[i] = item;
  }, {});
}
ColorSet.rebase = function rebase(array){
  array.__proto__ = ColorSet.prototype;
  return array;
}

ColorSet.prototype = {
  __proto__: Array.prototype,
  constructor: ColorSet,
  hsl: function hsl(){ return this.map(function(c){ return c.hsl() }) },
  rgb: function rgb(){ return this.map(function(c){ return c.rgb() }) },
  ansi: function ansi(){ return this.map(function(c){ return c.ansi() }) },
}

function wrapMethod(method){
  return function(){
    return ColorSet.rebase(method.apply(this, arguments));
  }
}

['map', 'filter', 'sort', 'concat', 'slice'].forEach(function(n){
  ColorSet.prototype[n] = wrapMethod(Array.prototype[n]);
});

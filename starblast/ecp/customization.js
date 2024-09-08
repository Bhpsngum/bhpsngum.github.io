window.initECPSetup = function(initializer){
  let Badge = function() {
    function t(size, query_info, finish, laser, shadow_mode, row, rid, callback) {
      this.row = row || "finish", this.callback = callback, this.shadow_mode = shadow_mode, this.rid = rid, this.size = null != size ? size : 128, this.info = query_info || {}, this.laser = laser || ["simple"], this.finish = finish || ["gold"], this.hue = 0, this.drawMultiple()
    }
    return t.prototype.drawMultiple = function () {
      if (this.callbackCalled) return;
      let rowItems = this.laser, columnItems = this.finish;
      let reversed = this.row === 'laser';
      if (reversed) ([rowItems, columnItems] = [columnItems, rowItems]);
      let mainCanvas = document.createElement("canvas");
      mainCanvas.width = this.size * columnItems.length * 2;
      mainCanvas.height = this.size * rowItems.length + ((rowItems.length - 1) * this.size / 5);
      let checker = {
        elements: 0,
        _this: this,
        done: function () {
          ++this.elements;
          if (!this._this.callbackCalled && this.elements >= rowItems.length * columnItems.length) {
            this._this.callbackCalled = true;
            this._this.callback(mainCanvas, this._this.info, this._this.rid);
          }
        }
      }
      for (let i = 0; i < rowItems.length; ++i) {
        for (let j = 0; j < columnItems.length; ++j) {
          this.laser = reversed ? columnItems[j] : rowItems[i];
          this.finish = reversed ? rowItems[i] : columnItems[j];
          this.drawSingleBadge((canvas) => {
            mainCanvas.getContext('2d').drawImage(canvas, j * this.size * 2, i * this.size * (1 + 1/5));
            checker.done();
          });
        }
      }
    }, t.prototype.drawSingleBadge = function(cb) {
      var e, i, s, n, tmp_canvas, tmp_2d;
      let canvas = document.createElement("canvas");
      n = canvas.width = 2 * this.size, s = canvas.height = this.size, e = canvas.getContext("2d"), e.clearRect(0, 0, canvas.width, canvas.height);
      if ("blank" !== this.info.id) {
        // badge main shape
        e.fillStyle = "#000", e.beginPath(), e.arc(n / 2, s / 2, s / 2, 0, 2 * Math.PI, !0), e.fill(), e.beginPath(), e.moveTo(.05 * n, .25 * s), e.lineTo(.05 * n, .75 * s), e.lineTo(n / 2, .9 * s), e.lineTo(.95 * n, .75 * s), e.lineTo(.95 * n, .25 * s), e.lineTo(n / 2, .1 * s), e.closePath(), e.fill();

        if (this.shadow_mode === "arcs") {
          // prepare temp canvas
          tmp_canvas = document.createElement("canvas"), tmp_canvas.width = n, tmp_canvas.height = s, tmp_2d = tmp_canvas.getContext("2d"),

          // save main shape into temp canvas
          tmp_2d.drawImage(canvas, 0, 0),

          // cut saved shape by badge arc cuts (with a little margin)
          tmp_2d.lineWidth = .073 * s, tmp_2d.globalCompositeOperation = "source-in", tmp_2d.strokeStyle = "#000", tmp_2d.beginPath(), tmp_2d.arc(n / 2, s / 2, .6 * s, 0, 2 * Math.PI, !0), tmp_2d.stroke(),

          // put rear shadow into saved shape
          tmp_2d.globalCompositeOperation = "source-in", tmp_2d.translate(n / 2, s / 2), tmp_2d.scale(n / 2, s / 2), i = tmp_2d.createRadialGradient(0, 0, 0, 0, 0, 1), i.addColorStop(.7, "rgba(0,0,0,1)"), i.addColorStop(1, "rgba(0,0,0,0)"), tmp_2d.fillStyle = i, tmp_2d.fillRect(-1, -1, 2, 2)
        }

        // badge arc cuts
        e.lineWidth = .07 * s, e.globalCompositeOperation = "destination-out", e.strokeStyle = "#000", e.beginPath(), e.arc(n / 2, s / 2, .6 * s, 0, 2 * Math.PI, !0), e.stroke(),

        // badge filling - material, icon, laser
        this.drawMaterial(e, n, s);
        let laser = this.laser;
        this.drawIcon(e, n, s, function () {
          this.drawLaser(e, n, s, laser);

          // badge material shadow
          e.globalCompositeOperation = "source-atop", e.save(), e.translate(n / 2, s / 2), e.scale(n / 2, s / 2), i = e.createRadialGradient(0, 0, 0, 0, 0, 1), i.addColorStop(0, "rgba(255,255,255,.2)"), i.addColorStop(1, "rgba(0,0,0,.2)"), e.fillStyle = i, e.fillRect(-1, -1, 2, 2), e.restore(),

          // badge icon shadow
          e.globalCompositeOperation = "source-over", i = e.createRadialGradient(n / 2 - .25 * s, s / 2 - .25 * s, 0, n / 2, s / 2, .45 * s), i.addColorStop(0, "rgba(0,0,0,0)"), i.addColorStop(.5, "rgba(0,0,0,0)"), i.addColorStop(1, "rgba(0,0,0,.5)"), e.fillStyle = i, e.beginPath(), e.arc(n / 2, s / 2, .45 * s, 0, 2 * Math.PI, !0), e.fill();

          switch (this.shadow_mode) {
            case "arcs":
              // restore saved rear shadow (within badge arc cuts only)
              e.globalCompositeOperation = "destination-over";
              e.drawImage(tmp_canvas, 0, 0);
              break;
            case "none":
              break;
            default:
              // rear shadow (around & behind the badge)
              e.globalCompositeOperation = "destination-over", e.translate(n / 2, s / 2), e.scale(n / 2, s / 2), i = e.createRadialGradient(0, 0, 0, 0, 0, 1), i.addColorStop(.7, "rgba(0,0,0,1)"), i.addColorStop(1, "rgba(0,0,0,0)"), e.fillStyle = i, e.fillRect(-1, -1, 2, 2);
          }

          cb(canvas);
        }.bind(this));
      }
      else cb(canvas);
    }, t.prototype.drawMaterial = function(t, e, i) {
      var s, l, n, a, o, r, h, O, u, d, c;
      switch (this.finish) {
        case "x27":
          l = t.createLinearGradient(0, 0, 0, i), l.addColorStop(0, "hsla(220,100%,30%)"), l.addColorStop(.5, "hsla(200,100%,70%)"), l.addColorStop(.5, "hsla(220,100%,40%)"), l.addColorStop(1, "hsla(200,100%,70%)");
          break;
        case "alloy":
          l = t.createLinearGradient(0, 0, 0, i), l.addColorStop(0, "#68A"), l.addColorStop(.5, "#FFF"), l.addColorStop(.5, "#765"), l.addColorStop(1, "#CCC");
          break;
        case "fullcolor":
          l = t.createLinearGradient(0, 0, 0, i), l.addColorStop(0, "hsl(" + this.hue + ",90%,50%)"), l.addColorStop(.5, "hsl(" + this.hue + ",90%,70%)"), l.addColorStop(.5, "hsl(" + this.hue + ",90%,30%)"), l.addColorStop(1, "hsl(" + this.hue + ",90%,60%)");
          break;
        case "titanium":
          l = t.createLinearGradient(0, 0, 0, i), l.addColorStop(0, "#444"), l.addColorStop(.5, "#AAA"), l.addColorStop(.5, "#444"), l.addColorStop(1, "#111");
          break;
        case "gold":
          l = t.createLinearGradient(0, 0, 0, i), l.addColorStop(0, "hsl(40,100%,50%)"), l.addColorStop(.5, "hsl(40,100%,80%)"), l.addColorStop(.5, "hsl(20,100%,30%)"), l.addColorStop(1, "hsl(40,100%,50%)");
          break;
        case "carbon":
          for (l = t.createLinearGradient(0, 0, 0, i), O = Math.min(10, this.size / 10), a = o = 0, u = O - 1; o <= u; a = o += 1) l.addColorStop(a / O, "#000"), l.addColorStop((a + 1) / O, "#888");
          for (n = t.createLinearGradient(0, 0, 0, i), n.addColorStop(0, "#333"), n.addColorStop(.1, "#888"), a = r = 0, d = O - 1; r <= d; a = r += 1) n.addColorStop((a + .5) / O, "#000"), n.addColorStop(Math.min(1, (a + 1.5) / O), "#888");
          break;
        default:
          l = t.createLinearGradient(0, 0, 0, i), l.addColorStop(0, "#EEE"), l.addColorStop(1, "#666")
      }
      if (t.globalCompositeOperation = "source-atop", t.fillStyle = l, "carbon" === this.finish) {
        for (a = h = 0, c = 4 * O - 1; h <= c; a = h += 1) t.fillStyle = a % 2 == 0 ? l : n, t.fillRect(a * e / (4 * O), 0, e / (4 * O), i);
        l = t.createLinearGradient(0, 0, 0, i), l.addColorStop(.3, "rgba(0,0,0,.5)"), l.addColorStop(.5, "rgba(0,0,0,0)"), l.addColorStop(.7, "rgba(0,0,0,.5)"), t.fillStyle = l, t.fillRect(0, 0, e, i)
      } else t.fillStyle = l, t.fillRect(0, 0, e, i);
      return t.globalCompositeOperation = "source-over"
    }, t.prototype.drawLaser = function(t, e, i, laser) {
      var s, n, l, a, o, r, h, u, d, c, p, I;
      for (t.save(), t.translate(.12 * e, i / 2), I = l0OlO.getShape(parseInt(laser)), n = 0, a = I.length; n < a; n++) {
        for (p = I[n], t.beginPath(), s = t.createRadialGradient(0, 0, 0, 0, 0, i / 6), s.addColorStop(0, "hsl(50,100%,100%)"), s.addColorStop(1, "hsl(50,80%,40%)"), t.fillStyle = s, t.strokeStyle = "rgba(0,0,0,.8)", t.lineWidth = i / 24, l = 0, o = p.length; l < o; l++) c = p[l], t.lineTo(c[1] * i / 10, c[0] * i / 9);
        t.closePath(), t.stroke(), t.fill()
      }
      for (t.restore(), t.save(), t.translate(.88 * e, i / 2), I = l0OlO.getShape(parseInt(laser)), u = 0, r = I.length; u < r; u++) {
        for (p = I[u], t.beginPath(), s = t.createRadialGradient(0, 0, 0, 0, 0, i / 6), s.addColorStop(0, "hsl(50,100%,100%)"), s.addColorStop(1, "hsl(50,80%,40%)"), t.fillStyle = s, t.strokeStyle = "rgba(0,0,0,.8)", t.lineWidth = i / 24, d = 0, h = p.length; d < h; d++) c = p[d], t.lineTo(c[1] * i / 10, c[0] * i / 9);
        t.closePath(), t.stroke(), t.fill()
      }
      return t.restore()
    }, t.prototype.drawBadge = function (t, e, i) {
      let s, n;
      s = document.createElement("canvas"), s.width = i, s.height = i, n = s.getContext("2d"), n.fillStyle = "#FFF", n.beginPath(), n.arc(i / 2, i / 2, .45 * i, 0, 2 * Math.PI, !0), n.fill(), n.globalCompositeOperation = "source-in", n.drawImage(this.icon_src, .05 * i, .05 * i, .9 * i, .9 * i), t.drawImage(s, e / 2 - .5 * i, i / 2 - .5 * i, i, i);
    }, t.prototype.drawIcon = function(t, e, i, cb) {
      var l, a, o, r, h, u, d, c, p;
      if (d = Math.round(i / 2.2), this.info.url) {
        if (null == this.icon_src) {
          this.icon_src = new Image, this.icon_src.crossOrigin = "Anonymous", this.icon_src.src = this.info.url;
        }
        if (!this.icon_src.complete) {
          this.icon_src.addEventListener("load", function(x) {
            return function() {
              return x.drawBadge(t, e, i), cb();
            }
          }(this));
        }
        else try {
          this.drawBadge(t, e, i);
          cb();
        } catch (t) {
          t
        }
      } else {
        let deco = this.info.decoration || {};
        t.font = d + "pt SBGlyphs", t.textBaseline = "middle", t.textAlign = "center", t.fillStyle = deco.fill;
        t.beginPath(), t.arc(e / 2, i / 2, .45 * i, 0, 2 * Math.PI, !0), t.fill();
        t.fillStyle = deco.stroke;
        if (deco.custom) {
          for (u = deco.custom, l = .7 * i / 11, a = r = 0; r <= 10; a = r += 1)
            for (o = h = 0; h <= 7; o = h += 1) c = e / 2 + l * (a - 5), p = i / 2 + l * (o - 4), 1 === u[o][a] && t.fillRect(c - .4 * l, p - .4 * l, .8 * l, .8 * l);
        }
        else {
          t.fillText(eval('"\\u{'+deco.unicode.toString(16)+'}"'), e / 2, i / 2)
        }
        cb();
      }
    }, t
  }(), l0OlO = function() {
    function t() {}
    return t.createTexture = function() {
      var e, i, s, n, l, a, o, r;
      for (e = document.createElement("canvas"), e.width = 2048, e.height = 1024, this.shapes = [], this.shapes.push(t.shape1()), this.shapes.push(t.shape2()), this.shapes.push(t.shape3()), this.shapes.push(t.shape4()), this.shapes.push(t.shape5()), this.shapes.push(t.shape6()), this.shapes.push(t.shape7()), i = e.getContext("2d"), i.translate(0, e.height), i.scale(e.width / 8, -e.width / 8), i.translate(.5, .5), i.scale(.5, .5), n = [.5, .1, .04, .1, .5], o = this.shapes, s = l = 0, a = o.length; l < a; s = ++l) r = o[s], i.save(), i.translate(s % 5 * 3, 3 * Math.floor(s / 5)), this.drawGradient(i, n[s], s), this.drawLaser(i, r), i.restore();
      return e
    }, t.drawGradient = function(t, e, i) {
      var s;
      if (null == e && (e = .5), null == i && (i = 0), s = t.createRadialGradient(0, 0, 0, 0, 0, 1), s.addColorStop(0, "hsla(10,100%,100%," + e + ")"), s.addColorStop(1, "hsla(10,100%,100%,0)"), t.fillStyle = s, t.fillRect(-1, -1, 2, 2), 1 === i) return t.fillStyle = "#000", t.fillRect(-1, -.025, 2, .05)
    }, t.getShape = function(t) {
        return (this['shape' + ++t] || this.shape1).call(this)
    }, t.shape1 = function() {
      var t, e, i, s, n, l;
      for (s = [], e = i = 0; i <= 20; e = i += 1) t = e / 20 * Math.PI * 2, n = Math.cos(t), l = Math.sin(t), n = n < 0 ? -Math.sqrt(-n) : Math.sqrt(n), l = l < 0 ? -Math.sqrt(-l) : Math.sqrt(l), s.push([n, l / 3]);
      return [s]
    }, t.shape2 = function() {
      var t, e, i, s, n, l, a, o;
      for ([], n = [], e = i = 0; i <= 20; e = i += 1) t = e / 20 * Math.PI * 2, a = Math.cos(t), o = Math.sin(t), a = a < 0 ? -Math.sqrt(-a) : Math.sqrt(a), o = o < 0 ? -1 : Math.sqrt(o), n.push([1.4 * a, .2 + o / 10]);
      for (l = [], e = s = 0; s <= 20; e = s += 1) t = e / 20 * Math.PI * 2, a = Math.cos(t), o = Math.sin(t), a = a < 0 ? -Math.sqrt(-a) : Math.sqrt(a), o = o < 0 ? -Math.sqrt(-o) : 1, l.push([1.4 * a, o / 10 - .2]);
      return [n, l]
    }, t.shape3 = function() {
      return [
        [
          [2, 0],
          [1, .1],
          [.55, .8],
          [.35, -.1],
          [.05, .8],
          [-.25, -.1],
          [-.55, .8],
          [-1, .1],
          [-2, 0],
          [-1, -.1],
          [-.85, -.8],
          [-.55, .1],
          [-.25, -.8],
          [.05, .1],
          [.35, -.8],
          [.55, .1],
          [.75, -.8],
          [1, -.1],
          [2, 0]
        ]
      ]
    }, t.shape4 = function() {
      return [
        [
          [1.4, -.6],
          [1.1, -.6],
          [1.1, .6],
          [1.4, .6]
        ],
        [
          [.55, -.6],
          [.25, -.6],
          [.25, .6],
          [.55, .6]
        ],
        [
          [-.55, -.6],
          [-.25, -.6],
          [-.25, .6],
          [-.55, .6]
        ],
        [
          [-1.4, -.6],
          [-1.1, -.6],
          [-1.1, .6],
          [-1.4, .6]
        ]
      ]
    }, t.shape5 = function() {
      var t, e, i, s, n, l, a, o;
      for (l = [], t = [0, 70, 90, 110, 180, 250, 270, 290, 360], s = [1, 1, .7, 1, 1, 1, .7, 1, 1], e = i = 0, n = s.length - 1; i <= n; e = i += 1) a = Math.cos(t[e] * Math.PI / 180) * s[e], o = Math.sin(t[e] * Math.PI / 180) * s[e], l.push([a, o / 2]);
      return [l]
    }, t.shape6 = function() {
      return [
        [
          [2, .4],
          [2, -.4],
          [-2, -.4],
          [-2, .4]
        ],
        [
          [.4, 2],
          [.4, -2],
          [-.4, -2],
          [-.4, 2]
        ]
      ]
    }, t.shape7 = function() {
      var t, e, i, s, n, l;
      for (s = [], e = i = 0; i <= 20; e = i += 1) t = e / 20 * Math.PI * 2, n = Math.cos(t), l = Math.sin(t), s.push([n, l]);
      return [s]
    }, t.drawLaser = function(t, e) {
      var i, s, n, l, a, o, r, h;
      for (i = t.createRadialGradient(0, 0, 0, 0, 0, .3), i.addColorStop(0, "rgba(255,255,255,1)"), i.addColorStop(1, "rgba(255,255,255,.5)"), t.fillStyle = i, r = [], s = 0, l = e.length; s < l; s++) {
        for (h = e[s], t.beginPath(), n = 0, a = h.length; n < a; n++) o = h[n], t.lineTo(.3 * o[0], .3 * o[1]);
        t.closePath(), r.push(t.fill())
      }
      return r
    }, t
  }();
  initializer.loadBadge = function(size, query_info, finish, laser, shadow_mode, row, rid, callback) {
    new Badge(size, query_info, finish, laser, shadow_mode, row, rid, callback)
  }
  initializer.loadIcon = function(size, query_info, rid, callback) {
    callback = "function" == typeof callback ? callback : function(){}
    let ecp_canvas = document.createElement("canvas");
    let c2d = ecp_canvas.getContext("2d");
    if (query_info.url) {
      let img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = query_info.url;
      img.onload = function() {
        if (rid == this.id - 1) {
          osize = img.width;
          ecp_canvas.width = size;
          ecp_canvas.height = size;
          c2d.drawImage(img, 0, 0, ecp_canvas.width, ecp_canvas.height);
          callback(ecp_canvas, query_info, rid);
        }
      }.bind(this)
    }
    else {
      ecp_canvas.width = size;
      ecp_canvas.height = size;
      let deco = query_info.decoration;
      if (deco) {
        c2d.fillStyle = deco.fill;
        c2d.fillRect(0,0, ecp_canvas.width, ecp_canvas.height);
        c2d.textAlign = "center";
        c2d.textBaseline = "middle";
        c2d.fillStyle = deco.stroke;
        if (deco.custom) {
          for (u = deco.custom, l = .7 * ecp_canvas.height / 11, a = r = 0; r <= 10; a = r += 1)
          for (o = h = 0; h <= 7; o = h += 1) c = ecp_canvas.width / 2 + l * (a - 5), p = ecp_canvas.height / 2 + l * (o - 4), 1 === u[o][a] && c2d.fillRect(c - .4 * l, p - .4 * l, .8 * l, .8 * l);
        }
        else {
          c2d.font = (ecp_canvas.width/2) + "pt 'SBGlyphs'";
          c2d.fillText(eval('"\\u{'+deco.unicode.toString(16)+'}"'), ecp_canvas.height/2, ecp_canvas.width/2);
        }
        c2d.stroke();
      }
      callback(ecp_canvas, query_info, rid);
    }
  }
  return initializer
}

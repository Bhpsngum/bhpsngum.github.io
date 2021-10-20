/* WARNING
This is NOT a snippet script designed for Modding, therefore it won't work in Modding, you can skip this script and go exploring others :)
*/

;(function(){
  let oldAdd = this.StationModules.prototype.add, names = ["bodies", "wings", "tori"], parse = function(obj) {
    let data = Object.assign({}, obj), newValue = {};
    for (let key in data) {
      let newV = data[key];
      if ("object" == typeof newV) {
        delete newV.laser;
        delete newV.propeller;
        newValue[key] = newV
      }
    }
    return newValue
  }, generateT = function(modul, args) {
    let res = {};
    if ("function" == typeof modul.generate) Object.assign(res, modul.generate.apply(modul, args));
    let newRes = {};
    newRes.rotate = !!res.rotate;
    newRes.size = Math.max(res.size, 1) || 1;
    for (let name of names) newRes[name] = parse(res[name]);
    return newRes
  };
  this.StationModules.prototype.add = function (modul) {
    modul = Object.assign({}, modul);
    let type = modul.type, id = modul.id, revertDirection = !!modul.revertDirection, generate = function() {
      return generateT(modul, arguments)
    }, modl = this.modules.find(v => v && v.type === type && v.id === id);
    if (modl) Object.assign(modl, {
      generate: generate,
      revertDirection: revertDirection
    });
    else oldAdd.call(this, modl = {
      type: type,
      id: id,
      revertDirection: revertDirection,
      generate: generate
    });
    return modl
  }
  let OI011 = function() {
    function t(t) {
      this.seed = null != t ? t : Math.random(), this.seed < 1 && (this.seed *= 1 << 30), this.a = 13971, this.b = 12345, this.size = 1 << 30, this.OO01l = this.size - 1, this.ll01l = 1 / this.size, this.I0II0(), this.I0II0(), this.I0II0()
    }
    return t.prototype.next = function() {
      return this.seed = this.seed * this.a + this.b & this.OO01l, this.seed * this.ll01l
    }, t.prototype.Oll11 = function(t, e) {
      return null != e ? Math.floor(Math.pow(this.next(), e) * t) : Math.floor(this.next() * t)
    }, t.prototype.I0II0 = function() {
      return this.seed = this.seed * this.a + this.b & this.OO01l
    }, t.prototype.feed = function(t) {
      return this.seed = this.seed * this.a * t + this.b & this.OO01l
    }, t
  }(), STATION_MODULES = new this.StationModules; STATION_MODULES.add({
        type: "deposit",
        id: "d1",
        generate: function(t) {
          return {
            type: "deposit",
            size: .5,
            tori: {
              main: {
                radius: 60,
                segments: 16,
                section_segments: 8,
                offset: {
                  x: 0,
                  y: -40,
                  z: 0
                },
                position: {
                  x: [0],
                  y: [0],
                  z: [0]
                },
                width: [10],
                height: [10],
                texture: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 63, 63, 2]
              },
              main2: {
                radius: 60,
                segments: 16,
                section_segments: 8,
                offset: {
                  x: 0,
                  y: -70,
                  z: 0
                },
                position: {
                  x: [0],
                  y: [0],
                  z: [0]
                },
                width: [10],
                height: [10],
                texture: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 63, 2, 2, 63, 2]
              }
            },
            bodies: {
              hook: {
                section_segments: 16,
                offset: {
                  x: 0,
                  y: 0,
                  z: 0
                },
                position: {
                  x: [0, 0, 0],
                  y: [-130, -120, -55]
                },
                width: [0, 10, 12],
                height: [0, 10, 12],
                texture: [6, 12]
              },
              deposit: {
                section_segments: [40, 45, 50, 130, 135, 140, 220, 225, 230, 310, 315, 320],
                offset: {
                  x: 0,
                  y: 0,
                  z: 0
                },
                position: {
                  x: [0, 0, 0, 0, 0, 0, 0, 0],
                  y: [-90, -100, -90, 70, 85, 85, 0, -10]
                },
                width: [0, 95, 100, 100, 100, 90, 90, 0],
                height: [0, 45, 50, 50, 50, 40, 30, 0],
                texture: [1, 4, 2, 4, 63, 10, 12]
              },
              sidewalls: {
                section_segments: 12,
                offset: {
                  x: 80,
                  y: -20,
                  z: 0
                },
                position: {
                  x: [0, 0, 0, 0, 0, 0, 0],
                  y: [-55, -50, -20, 0, 20, 45, 50]
                },
                width: [0, 15, 15, 10, 10, 5, 0],
                height: [0, 15, 15, 10, 10, 5, 0],
                angle: 0,
                propeller: !1,
                texture: [4, 4, 10, 4, 63, 4]
              },
              antenna: {
                vertical: !0,
                section_segments: [40, 45, 50, 130, 135, 140, 220, 225, 230, 310, 315, 320],
                offset: {
                  x: 0,
                  y: 90,
                  z: -20
                },
                position: {
                  x: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                  y: [-50, -45, -20, -19, 20, 21, 30, 60]
                },
                width: [50, 30, 30, 12, 12, 3, 3, 0],
                height: [50, 30, 30, 12, 12, 3, 3, 0],
                texture: [3, [15], 4, 16, 63, 6, 10]
              }
            }
          }
        }
      }), STATION_MODULES.add({
        type: "deposit",
        id: "d2",
        generate: function(t) {
          var e, i, s, n, l, a;
          for (a = new OI011(t), 1 + a.Oll11(4), e = {
              type: "deposit",
              size: .5,
              bodies: {
                hook: {
                  section_segments: 16,
                  offset: {
                    x: 0,
                    y: 0,
                    z: 0
                  },
                  position: {
                    x: [0, 0, 0],
                    y: [-130, -120, -55]
                  },
                  width: [0, 10, 12],
                  height: [0, 10, 12],
                  texture: [6, 12]
                },
                deposit: {
                  section_segments: [40, 45, 50, 130, 135, 140, 220, 225, 230, 310, 315, 320],
                  offset: {
                    x: 0,
                    y: 0,
                    z: 0
                  },
                  position: {
                    x: [0, 0, 0, 0, 0, 0, 0, 0],
                    y: [-90, -100, -90, 70, 85, 85, 0, -10]
                  },
                  width: [0, 95, 100, 100, 100, 90, 90, 0],
                  height: [0, 45, 50, 50, 50, 40, 30, 0],
                  texture: [1, 4, 1, 4, 63, 1, 12]
                },
                antenna: {
                  vertical: !0,
                  section_segments: [40, 45, 50, 130, 135, 140, 220, 225, 230, 310, 315, 320],
                  offset: {
                    x: 0,
                    y: 90,
                    z: 10
                  },
                  position: {
                    x: [0, 0, 0, 0, 0, 0, 0, 0],
                    y: [-50, -45, -20, -19, 20, 21, 30, 60]
                  },
                  width: [20, 10, 10, 8, 8, 3, 3, 0],
                  height: [20, 10, 10, 8, 8, 3, 3, 0],
                  texture: [3, 10, 1, 12, 63, 6, 10]
                },
                sidewalls: {
                  section_segments: 12,
                  offset: {
                    x: 80,
                    y: 10,
                    z: 0
                  },
                  position: {
                    x: [0, 0, 0, 0, 0, 0, 0],
                    y: [-55, -50, -20, 0, 20, 45, 50]
                  },
                  width: [0, 15, 15, 10, 10, 5, 0],
                  height: [0, 15, 15, 10, 10, 5, 0],
                  angle: 0,
                  propeller: !1,
                  texture: [4, 4, 10, 4, 63, 4]
                }
              }
            }, i = n = 0; n <= 40; i = n += 20)
            for (s = l = -40; l <= 40; s = l += 20) a.Oll11(50), e.bodies["body" + i + s] = {
              section_segments: [40, 45, 50, 130, 135, 140, 220, 225, 230, 310, 315, 320],
              offset: {
                x: 1.2 * i,
                y: 1.6 * s - 12,
                z: 38
              },
              position: {
                x: [0, 0, 0, 0, 0],
                y: [-7, -5, 10, 12]
              },
              width: [0, 8, 8, 0],
              height: [0, 8, 8, 0],
              texture: [12, a.next() < .3 ? 63 : 1 + a.Oll11(4), 12]
            };
          return e
        }
      }), STATION_MODULES.add({
        type: "spawning",
        id: "sp1",
        generate: function(t) {
          var e, i, s, n, l;
          for (n = new OI011(t), e = 1 + n.Oll11(3), l = {
              type: "spawn",
              rotate: !0,
              size: .5,
              tori: [],
              bodies: {
                sphere: {
                  section_segments: 8,
                  offset: {
                    x: 0,
                    y: 0,
                    z: 0
                  },
                  position: {
                    x: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    y: [-160, -150, -100, -85, -70, -50, -20, 20, 50, 70, -50, -50]
                  },
                  width: [0, 20, 20, 40, 70, 90, 100, 100, 90, 60, 30, 0],
                  height: [0, 20, 20, 40, 70, 90, 100, 100, 90, 60, 30, 0],
                  texture: [6, 1, e, e, e, e, e, e, 1, 11, 12]
                }
              },
              wings: {
                sidejoin: {
                  offset: {
                    x: 65,
                    y: 0,
                    z: 65
                  },
                  doubleside: !0,
                  length: [100],
                  width: [50, 20],
                  angle: [45],
                  position: [0, 0],
                  texture: [63],
                  bump: {
                    position: 0,
                    size: 30
                  }
                },
                sidejoin2: {
                  offset: {
                    x: 65,
                    y: 0,
                    z: -65
                  },
                  doubleside: !0,
                  length: [100],
                  width: [50, 20],
                  angle: [-45],
                  position: [0, 0],
                  texture: [63],
                  bump: {
                    position: 0,
                    size: 30
                  }
                },
                sidejoin3: {
                  offset: {
                    x: 90,
                    y: 0,
                    z: 0
                  },
                  doubleside: !0,
                  length: [100],
                  width: [50, 20],
                  angle: [0],
                  position: [0, 0],
                  texture: [63],
                  bump: {
                    position: 10,
                    size: 30
                  }
                },
                topjoin: {
                  offset: {
                    x: 0,
                    y: 0,
                    z: 95
                  },
                  doubleside: !0,
                  length: [100],
                  width: [50, 20],
                  angle: [90],
                  position: [0, 0],
                  texture: [63],
                  bump: {
                    position: 10,
                    size: 30
                  }
                },
                bottomjoin: {
                  offset: {
                    x: 0,
                    y: 0,
                    z: -95
                  },
                  doubleside: !0,
                  length: [100],
                  width: [50, 20],
                  angle: [-90],
                  position: [0, 0],
                  texture: [63],
                  bump: {
                    position: 10,
                    size: 30
                  }
                }
              }
            }, i = s = -4; s <= 0; i = ++s) l.tori["circle" + i] = {
            radius: 200 + 20 * i,
            segments: 16,
            section_segments: 8,
            offset: {
              x: 0,
              y: 25 * i,
              z: 0
            },
            position: {
              x: [0],
              y: [0],
              z: [0]
            },
            width: [15],
            height: [10],
            texture: function() {
              var t, e;
              for (e = [], i = t = 0; t <= 16; i = ++t) e.push([n.next() < .3 ? 8 : 3]);
              return e
            }()
          };
          return l
        }
      }), STATION_MODULES.add({
        type: "spawning",
        id: "sp2",
        generate: function(t) {
          var e, i, s;
          return s = new OI011(t), e = 1 + s.Oll11(3), {
            type: "spawning",
            rotate: !0,
            size: .5,
            tori: {
              main: {
                radius: 200,
                segments: 42,
                section_segments: 8,
                offset: {
                  x: 0,
                  y: 0,
                  z: 0
                },
                position: {
                  x: [0],
                  y: [0],
                  z: [0]
                },
                width: [30],
                height: [15],
                texture: function() {
                  var t, e;
                  for (e = [], i = t = 0; t <= 42; i = ++t) e.push([i % 7 == 0 ? 10 : 1]);
                  return e
                }()
              }
            },
            bodies: {
              sphere: {
                section_segments: 8,
                offset: {
                  x: 0,
                  y: 0,
                  z: 0
                },
                position: {
                  x: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                  y: [-160, -150, -100, -85, -70, -50, -20, 20, 50, 70, -50, -50]
                },
                width: [0, 20, 20, 40, 70, 90, 100, 100, 90, 60, 30, 0],
                height: [0, 20, 20, 40, 70, 90, 100, 100, 90, 60, 30, 0],
                texture: [6, 1, e, e, e, e, e, e, 1, 11, 12]
              }
            },
            wings: {
              topjoin: {
                offset: {
                  x: 45,
                  y: 0,
                  z: 80
                },
                doubleside: !0,
                length: [100],
                width: [50, 20],
                angle: [60],
                position: [0, 0],
                texture: [63],
                bump: {
                  position: 0,
                  size: 30
                }
              },
              sidejoin: {
                offset: {
                  x: 90,
                  y: 0,
                  z: 0
                },
                doubleside: !0,
                length: [100],
                width: [50, 20],
                angle: [0],
                position: [0, 0],
                texture: [63],
                bump: {
                  position: 10,
                  size: 30
                }
              },
              bottomjoin: {
                offset: {
                  x: 45,
                  y: 0,
                  z: -80
                },
                doubleside: !0,
                length: [100],
                width: [50, 20],
                angle: [-60],
                position: [0, 0],
                texture: [63],
                bump: {
                  position: 0,
                  size: 30
                }
              }
            }
          }
        }
      }), STATION_MODULES.add({
        type: "spawning",
        id: "sp3",
        generate: function(t) {
          var e, i, s;
          return s = new OI011(t), e = 1 + s.Oll11(4), {
            type: "spawning",
            rotate: !0,
            size: .5,
            tori: {
              main: {
                radius: 100,
                segments: 12,
                section_segments: 8,
                offset: {
                  x: 0,
                  y: 0,
                  z: 0
                },
                position: {
                  x: [0],
                  y: [0],
                  z: [0]
                },
                width: [30],
                height: [15],
                texture: function() {
                  var t, s;
                  for (s = [], i = t = 0; t <= 20; i = ++t) s.push(i % 2 == 0 ? 10 : e);
                  return s
                }()
              }
            },
            bodies: {
              sphere: {
                section_segments: 8,
                offset: {
                  x: 0,
                  y: 0,
                  z: 0
                },
                position: {
                  x: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                  y: [-160, -150, -100, -85, -70, -50, -20, 20, 50, 70, -50, -50]
                },
                width: [0, 30, 30, 40, 70, 90, 100, 100, 90, 60, 30, 0],
                height: [0, 30, 30, 40, 70, 90, 100, 100, 90, 60, 30, 0],
                texture: [6, 12, e, e, e, e, e, e, 1, 11, 12]
              }
            }
          }
        }
      }), STATION_MODULES.add({
        type: "structure",
        hook: "NESW",
        id: "st1",
        generate: function(t) {
          var e, i, s, n, l, a;
          for (l = new OI011(t), i = 1 + l.Oll11(4), e = {
              type: "structure",
              size: .5,
              tori: {
                main: {
                  radius: 80,
                  segments: 20,
                  section_segments: 8,
                  offset: {
                    x: 0,
                    y: 0,
                    z: 0
                  },
                  position: {
                    x: [0],
                    y: [0],
                    z: [0]
                  },
                  width: [20],
                  height: [10],
                  texture: function() {
                    var t, e;
                    for (e = [], s = t = 0; t <= 20; s = ++t) e.push([(s - 2) % 5 == 0 ? 10 : i]);
                    return e
                  }()
                }
              },
              bodies: []
            }, s = n = 0; n <= 90; s = n += 90) a = l.Oll11(40), e.bodies["body" + s] = {
            angle: s,
            section_segments: 12,
            offset: {
              x: 0,
              y: 0,
              z: 0
            },
            position: {
              x: [0, 0, 0, 0, 0, 0, 0, 0, 0],
              y: [-130, -120, -55 - a, -40 - a, 40 + a, 55 + a, 120, 130]
            },
            width: [0, 15, 16, 40 + i, 40 + i, 12, 10, 0],
            height: [0, 15, 16, 40 + i, 40 + i, 12, 10, 0],
            texture: [6, 12, 10, i, 10, 4, 6]
          };
          return e
        }
      }), STATION_MODULES.add({
        type: "structure",
        hook: "NS",
        id: "st2",
        generate: function(t) {
          var e, i, s, n, l, a, o;
          for (l = new OI011(t), a = l.Oll11(20), i = 1 + l.Oll11(4), o = l.Oll11(20), e = {
              type: "structure",
              rotate: !0,
              size: .5,
              tori: [],
              bodies: {
                main: {
                  section_segments: 16,
                  offset: {
                    x: 0,
                    y: 0,
                    z: 0
                  },
                  position: {
                    x: [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    y: [-130, -120, -55 - o, -40 - o, 40 + o, 55 + o, 120, 130]
                  },
                  width: [0, 15, 16, 40, 40, 12, 10, 0],
                  height: [0, 15, 16, 40, 40, 12, 10, 0],
                  texture: [6, 12, 10, 11, 1, 4, 6]
                }
              }
            }, s = n = -4; n <= 4; s = n += 2) e.tori["circle" + s] = {
            segments: 4 + o,
            radius: 100 - Math.abs(s * a),
            section_segments: 8,
            offset: {
              x: 0,
              y: 20 * s,
              z: 0
            },
            position: {
              x: [0],
              y: [0],
              z: [0]
            },
            width: [10],
            height: [o + 3],
            texture: function() {
              var t, e;
              for (e = [], s = t = 0; t <= 40; s = ++t) e.push([(s - 2) % 5 == 0 ? 10 : i]);
              return e
            }()
          };
          return e
        }
      }), STATION_MODULES.add({
        type: "structure",
        hook: "NS",
        id: "st3",
        generate: function(t) {
          return {
            type: "structure",
            rotate: 2 * (new OI011(t).next() - .5),
            size: .5,
            bodies: {
              main: {
                section_segments: 16,
                offset: {
                  x: 0,
                  y: 0,
                  z: 0
                },
                position: {
                  x: [0, 0, 0, 0, 0, 0, 0, 0, 0],
                  y: [-130, -120, -75, -60, 60, 75, 120, 130]
                },
                width: [0, 15, 16, 40, 40, 12, 10, 0],
                height: [0, 15, 16, 40, 40, 12, 10, 0],
                texture: [6, 12, 10, 11, 1, 4, 6]
              }
            }
          }
        }
      }), STATION_MODULES.add({
        type: "structure",
        hook: "NS",
        id: "st4",
        generate: function(t) {
          var e;
          return {
            type: "structure",
            size: .5,
            tori: {
              main: {
                radius: 100,
                segments: 20,
                section_segments: 8,
                offset: {
                  x: 0,
                  y: 0,
                  z: 0
                },
                position: {
                  x: [0],
                  y: [0],
                  z: [0]
                },
                width: [20],
                height: [10],
                texture: function() {
                  var t, i;
                  for (i = [], e = t = 0; t <= 20; e = ++t) i.push([(e - 2) % 5 == 0 ? 10 : 1]);
                  return i
                }()
              }
            },
            bodies: {
              bumpers: {
                section_segments: [40, 45, 50, 130, 135, 140, 220, 225, 230, 310, 315, 320],
                offset: {
                  x: 97,
                  y: 0,
                  z: 0
                },
                position: {
                  x: [0, 0, 0, 0, 0, 0, 0, 0],
                  y: [-100, -55, -30, -20, 20, 30, 90, 100]
                },
                width: [0, 12, 2, 20, 20, 2, 2, 0],
                height: [0, 12, 5, 30, 30, 5, 2, 0],
                texture: [4, 4, 1, 10, 1, 1, 1]
              },
              main: {
                section_segments: 15,
                offset: {
                  x: 0,
                  y: 0,
                  z: 0
                },
                position: {
                  x: [0, 0, 0, 0, 0, 0, 0, 0, 0],
                  y: [-110, -100, -55, -40, 40, 55, 110, 120]
                },
                width: [0, 20, 20, 50, 50, 12, 10, 0],
                height: [0, 20, 20, 30, 30, 12, 10, 0],
                texture: [6, 15, 10, 11, 10, 4, 6]
              }
            },
            wings: {
              topjoin: {
                offset: {
                  x: 0,
                  y: -3,
                  z: 0
                },
                doubleside: !0,
                length: [100],
                width: [20, 20],
                angle: [45],
                position: [0, 0, 0, 50],
                texture: [1],
                bump: {
                  position: 10,
                  size: 30
                }
              },
              bottomjoin: {
                offset: {
                  x: 0,
                  y: -3,
                  z: 0
                },
                doubleside: !0,
                length: [100],
                width: [20, 20],
                angle: [-45],
                position: [0, 0, 0, 50],
                texture: [1],
                bump: {
                  position: -10,
                  size: 30
                }
              }
            }
          }
        }
      }), STATION_MODULES.add({
        type: "structure",
        hook: "N",
        id: "st5",
        generate: function(t) {
          var e, i, s;
          return s = new OI011(t), e = 1 + s.Oll11(4), {
            type: "structure",
            size: .5,
            tori: {
              main: {
                radius: 70,
                segments: 20,
                section_segments: 8,
                offset: {
                  x: 0,
                  y: 0,
                  z: 0
                },
                position: {
                  x: [0],
                  y: [0],
                  z: [0]
                },
                width: [20],
                height: [10],
                texture: function() {
                  var t, s;
                  for (s = [], i = t = 0; t <= 20; i = ++t) s.push([(i - 2) % 5 == 0 ? 10 : e]);
                  return s
                }()
              }
            },
            bodies: {
              main: {
                angle: 0,
                section_segments: 12,
                offset: {
                  x: 0,
                  y: 0,
                  z: 0
                },
                position: {
                  x: [0, 0, 0, 0, 0, 0, 0, 0, 0],
                  y: [-130, -120, -55, -40, 40, 55]
                },
                width: [0, 15, 16, 40 + e, 40 + e, 0],
                height: [0, 15, 16, 40 + e, 40 + e, 0],
                texture: [6, 12, 10, e, 10, 4, 6]
              }
            }
          }
        }
      }), STATION_MODULES.add({
        type: "structure",
        hook: "NE",
        id: "st6",
        generate: function(t) {
          var e, i;
          return i = new OI011(t), e = 1 + i.Oll11(4), {
            type: "structure",
            size: .5,
            bodies: {
              main: {
                angle: 0,
                section_segments: 12,
                offset: {
                  x: 0,
                  y: 0,
                  z: 0
                },
                position: {
                  x: [0, 0, 0, 0, 0, 0, 0, 0, 0],
                  y: [-130, -120, -100, -40, 20, 30]
                },
                width: [0, 15, 16, 40, 20, 0],
                height: [0, 15, 16, 40, 20, 0],
                texture: [6, 12, 8, e, 10, 4, 6]
              },
              angle: {
                angle: -90,
                section_segments: 12,
                offset: {
                  x: 0,
                  y: 0,
                  z: 0
                },
                position: {
                  x: [0, 0, 0, 0, 0, 0, 0, 0, 0],
                  y: [-130, -120, -55, -40, 40, 55]
                },
                width: [0, 15, 16, 40, 40, 0],
                height: [0, 15, 16, 40, 40, 0],
                texture: [6, 12, 10, e, 10, 4, 6]
              }
            }
          }
        }
      }), STATION_MODULES.add({
        type: "structure",
        hook: "NES",
        id: "st7",
        generate: function(t) {
          var e, i;
          return i = new OI011(t), e = 1 + i.Oll11(4), {
            type: "structure",
            size: .5,
            bodies: {
              main: {
                angle: 0,
                section_segments: 12,
                offset: {
                  x: 0,
                  y: 0,
                  z: 0
                },
                position: {
                  x: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                  y: [-130, -120, -100, -40, 0, 40, 100, 120, 130]
                },
                width: [0, 15, 16, 40, 20, 40, 12, 10, 0],
                height: [0, 15, 16, 40, 20, 40, 12, 10, 0],
                texture: [6, 12, 8, e, e, 8, 12, 6]
              },
              angle: {
                angle: -90,
                section_segments: 12,
                offset: {
                  x: 0,
                  y: 0,
                  z: 0
                },
                position: {
                  x: [0, 0, 0, 0, 0, 0, 0, 0, 0],
                  y: [-130, -120, -55, -40, 40, 55]
                },
                width: [0, 15, 16, 40, 40, 0],
                height: [0, 15, 16, 40, 40, 0],
                texture: [6, 12, 10, e, 10, 4, 6]
              }
            }
          }
        }
      }), STATION_MODULES.add({
        type: "structure",
        hook: "N",
        id: "st8",
        generate: function(t) {
          var e, i;
          return i = new OI011(t), e = 1 + i.Oll11(4), {
            type: "structure",
            rotate: 30 * (new OI011(t).next() - .5),
            transparent: !0,
            size: .5,
            bodies: {
              main: {
                angle: 0,
                section_segments: 12,
                offset: {
                  x: 0,
                  y: 0,
                  z: 0
                },
                position: {
                  x: [0, 0, 0, 0, 0, 0, 0, 0, 0],
                  y: [-130, -120, -55, -40, 40, 55]
                },
                width: [0, 15, 16, 40 + e, 40 + e, 0],
                height: [0, 15, 16, 40 + e, 40 + e, 0],
                texture: [6, 12, 10, e, 10, 4, 6]
              }
            },
            wings: {
              topsolarpanel: {
                noshape: !0,
                doubleside: !0,
                offset: {
                  x: 0,
                  y: 0,
                  z: 0
                },
                length: [60, 60, 60, 60],
                width: [70, 70, 65, 60, 55],
                angle: [90, 90, 90, 90, 90],
                position: [0, 0, 0, 0, 0],
                texture: [14],
                bump: {
                  position: 0,
                  size: 5
                }
              },
              solarpanels: {
                noshape: !0,
                doubleside: !0,
                offset: {
                  x: 0,
                  y: 0,
                  z: 0
                },
                length: [60, 60, 60, 60],
                width: [70, 70, 65, 60, 55],
                angle: [-30, -30, -30, -30, -30],
                position: [0, 0, 0, 0, 0],
                texture: [14],
                bump: {
                  position: 0,
                  size: 5
                }
              }
            }
          }
        }
      }), STATION_MODULES.add({
        type: "structure",
        hook: "NS",
        id: "st9",
        generate: function(t) {
          return {
            type: "structure",
            rotate: 2 * (new OI011(t).next() - .5),
            size: .5,
            bodies: {
              main: {
                section_segments: 16,
                offset: {
                  x: 0,
                  y: 0,
                  z: 0
                },
                position: {
                  x: [0, 0, 0, 0, 0, 0, 0, 0, 0],
                  y: [-130, -120, -75, -70, 70, 75, 120, 130]
                },
                width: [0, 15, 16, 40, 40, 12, 10, 0],
                height: [0, 15, 16, 40, 40, 12, 10, 0],
                texture: [6, 12, 10, 11, 1, 4, 6]
              }
            },
            wings: {
              topsolarpanel: {
                noshape: !0,
                doubleside: !0,
                offset: {
                  x: 0,
                  y: 0,
                  z: 0
                },
                length: [60, 60, 60, 60],
                width: [70, 70, 65, 60, 55],
                angle: [90, 90, 90, 90, 90],
                position: [0, 0, 0, 0, 0],
                texture: [14],
                bump: {
                  position: 0,
                  size: 5
                }
              },
              solarpanels: {
                noshape: !0,
                doubleside: !0,
                offset: {
                  x: 0,
                  y: 0,
                  z: 0
                },
                length: [60, 60, 60, 60],
                width: [70, 70, 65, 60, 55],
                angle: [-30, -30, -30, -30, -30],
                position: [0, 0, 0, 0, 0],
                texture: [14],
                bump: {
                  position: 0,
                  size: 5
                }
              }
            }
          }
        }
      });
  let SM = this.StationModel, __proto__ =  SM.prototype, repl = function(func, ind, noEval, exc, flags){
    let res = "("+String(func).replace(new RegExp('(['+(exc?"^":"")+ind+']\\s*)((\\w+)\\.dir)', flags || ""), "$1(!!STATION_MODULES.types_by_id[$3.type].revertDirection*2+$2)")+")";
    return noEval ? res : eval(res)
  };
  SM = eval(repl(SM, "*", true).replace(/((\w+)\.dir\s*=\s*(\w+).dir)/, "$1,$2.revertDirection=$3.revertDirection"));
  __proto__.constructor = SM;
  SM.prototype = __proto__;
  this.StationModel = SM;
  let y = TeamBoard.prototype, key = Object.keys(y).find(v => y[v] && String(y[v]).includes("STATION_MODULES")), t = function(t, e) { return this.module.exports.translate(t, e) }.bind(this);
  y[key] = repl(y[key], '=');
  let carpet = StationModuleModel.prototype.updateCarpet;
  StationModuleModel.prototype.updateCarpet = eval("("+String(carpet).replace(/(\.rotation.x\s*=\s*)-/, "$1((this.revertDirection)?1:-1)*")+")");
  this.CustomStationModules = {
    list: STATION_MODULES,
    update: function () {
      let data = Object.values(this.module.exports.settings).find(v => v && v.mode), mode = data.mode;
      if (mode.id != 'team') return;
      let smodel = mode.teams[0].station_model, rev = Object.keys(smodel).find(k => smodel[k] && smodel[k].type == "Group"), add;
      for (let i in data) {
        if (data[i].seed) {
          for (let j in data[i]) {
            if (Array.isArray(data[i][j].stations)) {
              add = data[i][j];
              break;
            }
          }
          break;
        }
      }
      for (let team of mode.teams) team.station_model[rev].remove(...team.station_model.modules.map(i => i[rev]))
      add.stations = [];
      for (let team of mode.teams) {
        team.station_model = new StationModel(team.station_desc, team);
        add.addStation(team.station_model);
      }
      this.StationModuleModel.images_buffer = [];
    }.bind(this)
  }
}).call(window);

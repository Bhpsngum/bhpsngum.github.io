addServiceWorker("sw.js");
window.addEventListener("load", function(){
	$("#init").css("font-family", "SBGlyphs");
	let it = setInterval(function () {
		if (document.fonts.check("12px 'SBGlyphs'")) {
			var updateSizeNeeded, presets = [
				{value: "preview", size: 112},
				{value: "event", size: 34},
				{value: "leaderboard", size: function () {
					// take current window resolution
					let width = window.innerWidth, height = window.innerHeight, mobile_app = Math.max(width, height) < 800 && ("ontouchstart" in window);
					// calculate game screen resolution
					let screen_ratio = mobile_app ? 2 : 16 / 9;
					width = Math.round(Math.min(height * screen_ratio, width));
					// calculate scoreboard resolution
					width = width * 0.2; // 20% screen width
					height = height * 0.52; // 52% screen height
					// calculate icon ratio
					let ratio = 10 / 11;
					let icon_ratio = Math.min(Math.min(width, height) / ratio, Math.max(width, height));
					// finalize the result
					return Math.round(0.08 * icon_ratio)
				}},
				{value: "custom"}
			], finishes = [
				{value: "zinc"},
				{value: "alloy"},
				{value: "titanium"},
				{value: "gold"},
				{value: "carbon"},
				{value: "fullcolor"},
				{value: "x27", name: "Electric Blue"}
			], shadow_modes = [
				{value: "original"},
				{value: "arcs"},
				{value: "none"}
			], lasers = ["Single", "Double", "Lightning", "Digital", "Alien", "Healing 1", "Healing 2"], ECP = window.initECPSetup({id: 0}), ecp_data, last_info, query_index, osize, current_id = 0, resolution, size, title = " - Starblast ECP Icon Viewer", names = {
				ecp: { long: "Elite Commander Pass", short: "ECP" },
				sucp: { long: "shared Unique Commander Pass", short: "sUCP" },
				ucp: { long: "Unique Commander Pass", short: "UCP" }
			}, URLParser = {
				current: {},
				params: ["name", "badge", "size", "preset", "multi", "laser", "finish", "badge", "shadow", "forced", "variation"],
				qualifiers: {
					size: function (data) { return Math.max(0, data) || 0 },
					badge: function (data) {return data === "true" || data === "" || data === true},
					forced: function (data) {return data === "" || data === "true"},
					multi: function (data) {return data === "" || data === "true" || data === true },
					name: function (data) {return String(data).toLowerCase().replace(/[^0-9a-z_\-]/g, "")}
				},
				type: {
					badge: "boolean",
					forced: "boolean",
					multi: "boolean",
					finish: "multi",
					laser: "multi"
				},
				aliases: {
					multi: "gallery",
					variation: "row"
				},
				data: {
					get name () { return ecp_data },
					preset: presets,
					finish: finishes,
					shadow: shadow_modes,
					variation: [{ name: "Finish", value: "finish" }, { name: "Laser", value: "laser" }],
					laser: lasers.reduce((a,b,i)=>(a.push({name: b, value: i.toString()}),a),[])
				},
				locals: {
					finish: 'ecp-finish',
					laser: 'ecp-laser',
					size: 'ecp-res',
					shadow: 'ecp-shadow',
					badge: 'loadBadge',
					preset: 'ecp-res-option',
					multi: 'multi-badges-mode',
					variation: 'row-variation'
				},
				customElements: {
					finish: function (element, _this) {
						let res = ((_this.current.finish || {}).data || {}).value || [];
						for (let finish of _this.data.finish) {
							let index = res.indexOf(finish.value);
							if ($(`#finish-choose > #${finish.value}`).is(":checked")) {
								if (index < 0) res.push(finish.value);
							}
							else {
								if (index >= 0) res.splice(index, 1);
							}
						}

						return res;
					},
					laser: function (element, _this) {
						let res = ((_this.current.laser || {}).data || {}).value || [];
						for (let laser of _this.data.laser) {
							let index = res.indexOf(laser.value);
							if ($(`#laser-choose > #${laser.value}`).is(":checked")) {
								if (index < 0) res.push(laser.value);
							}
							else {
								if (index >= 0) res.splice(index, 1);
							}
						}

						return res;
					}
				},
				elements: {
					badge: "loadBadge",
					finish: "finish-choose",
					laser: "laser-choose",
					size: "custom-res",
					shadow: "shadow-mode",
					preset: "res-option",
					multi: "multi-mode",
					variation: "row-variation"
				},
				getSingle: function (field, init) {
					let value = null, exists = true, type = this.type[field];
					if (init) {
						value = this.query.get(this.aliases[field] || field);
						if (value == null) {
							exists = false;
							if (this.locals[field] != null) value = localData.getItem(this.locals[field])
							if (type === "multi") {
								try {
									value = JSON.parse(value);
								} catch (e) {}
								if (!Array.isArray(value)) value = [];
							}
						}
						else if (type === "multi") value = [...new Set(value.split(" "))];
					}
					else {
						if (this.elements[field] == null) return;
						let el = $("#" + this.elements[field]);
						if ("function" == typeof this.customElements[field]) value = this.customElements[field](el, this);
						else if (type === "boolean") value = el.is(":checked");
						else value = el.val();
					}

					if ("function" == typeof this.qualifiers[field]) value = this.qualifiers[field](value);
					else if (type !== "multi") value = String(value);

					let found, pool = this.data[field];
					if (pool != null) {
						if (type === "multi") {
							value = value.filter(e => pool.find(v => v.value == e));
							found = value.length > 1 ? -1 : Math.max(pool.findIndex(v => value[0] == v.value), 0);
						}
						else {
							found = Math.max(pool.findIndex(v => value == v.value), 0);
						}
						found = {
							exists,
							index: found,
							default: found === 0,
							data: type === "multi" ? { value: (found !== -1 ? [pool[found].value] : value) } : pool[found]
						}
					}
					else found = {
						exists,
						default: false,
						data: { value }
					}

					this.current[field] = found;
				},
				getQuery: function (init) {
					this.query = new URLSearchParams(document.location.search);
					for (let i of this.params) this.getSingle(i, init);

					// force-load overwrites local options
					if (init && this.value('forced')) {
						for (let i of this.params) {
							let v = this.current[i];
							if (!v.exists && this.data[i] != null && v.index !== 0) {
								v.exists = false;
								v.index = 0;
								v.default = true;
								v.data = this.data[i][0];
							}
						}
						if (!this.current.badge.exists) this.current.badge.data.value = false;
					}

					// size-preset special treatment
					if (init && !this.current.preset.exists && this.current.size.exists) {
						let bestfit = this.data.preset.findIndex(v => v.size === this.value('size'));
						if (bestfit < 0) bestfit = this.data.preset.length - 1; // custom
						this.current.preset.index = bestfit;
						this.current.preset.data = this.data.preset[bestfit];
						this.current.preset.default = bestfit === 0;
					}
					let def_size = this.current.preset.data.value != "custom";
					this.current.size = {
						exists: this.current.size.exists,
						default: def_size,
						data: {
							value: def_size ? ("function" == typeof this.current.preset.data.size ? this.current.preset.data.size() : this.current.preset.data.size) : this.current.size.data.value
						}
					}

					// name will be never defaults and forced must be hidden after
					if (init) {
						this.current.name.default = false;
						this.current.forced.default = true;
					}

					return this;
				},
				value: function (field) {
					let v = this.current[field];
					if (v == null) return null;
					return v.data.value;
				},
				save: function () {
					// special treatments for some elements
					for (let id of ["custom-res", "apply-res"]) $("#"+id).attr('disabled', !!this.current.preset.data.size);
					for (let id of ["customization", "shadow-mode"]) $("#"+id).attr('disabled', !this.current.badge.data.value);
					$("#row-variation").attr('disabled', !this.current.multi.data.value);

					// reselect customization table
					if (!this.current.multi.data.value) {
						for (let i of ["finish", "laser"]) this.current[i].data.value = this.current[i].data.value.slice(-1);
					}

					for (let i of ["finish", "laser"]) {
						for (let j of this.data[i]) $(`#${this.elements[i]} > #${j.value}`).prop("checked", false);
					}

					for (let i of ["finish", "laser"]) {
						for (let j of this.current[i].data.value) $(`#${this.elements[i]} > #${j}`).prop("checked", true);
					}

					for (let i of this.params) {
						if (this.current[i] == null) continue;
						let value = this.current[i].data.value;
						if (this.locals[i] != null) localData.setItem(this.locals[i], value);
						let el = $("#" + this.elements[i]);
						if (this.type[i] == "boolean") el.prop("checked", value);
						else el.val(value);
					}

					this.export();
				},
				export: function () {
					let params = [];
					for (let name in this.current) {
						let val = this.current[name], type = this.type[name];
						let fName = this.aliases[name] || name;
						if (val.default) continue;
						let pValue = val.data.value;
						if ("boolean" === type) {
							if (!pValue) continue;
							else pValue = fName;
						}
						else if ("multi" === type) {
							pValue = fName + '=' + pValue.map(encodeURIComponent).join("+");
						}
						else pValue = fName + '=' + encodeURIComponent(pValue);

						params.push(pValue);
					}

					params = '?' + params.join('&');
					if (params != document.location.search) window.history.pushState({path: 'url'}, '', window.location.protocol + "//" + window.location.host + window.location.pathname + (params || ""))
				}
			}, updateIcon = function(canvas) {
				let imgURL;
				if (!canvas) imgURL = 'icon.png';
				else if (canvas.width === canvas.height) imgURL = canvas.toDataURL();
				else {
					let iconCanvas = document.createElement("canvas"), height = canvas.height, width = canvas.width, dif = (width - height) / 2, size = Math.max(width, height), x = 0, y = 0;
					iconCanvas.width = iconCanvas.height = size;
					if (dif < 0) x = -dif;
					else y = dif;
					iconCanvas.getContext('2d').drawImage(canvas, x, y, width, height);
					imgURL = iconCanvas.toDataURL()
				}
				$("link[rel='icon']").attr("href", imgURL)
			}, fetch = function(init) {
				$.getJSON("ecp.json").then(function(data) {
					refresh(data, init)
				}).catch(function(e) {
					let fail = false, offline_data;
					try {offline_data = JSON.parse(localData.getItem("ecp-data"))}
					catch (e) {fail = true};
					(fail || !init) && alert("Fetch failed!");
					if (!fail) refresh(offline_data, init);
				})
			}, refresh = function (data, init) {
				// store for offline use
				localData.setItem("ecp-data", JSON.stringify(data));
				// parse to a data array with attribute 'type'
				ecp_data = [];
				for (let i in data) [].push.apply(ecp_data, data[i].map(function(e) {
					e.type = i;
					e.value = e.id;
					if (e.url) e.url = (e.active ? "https://starblast.io/ecp/": "./archives/") + e.url;
					return e
				}));
                // load index chooser option
                let chooser = $("#index > #index-selector");
                chooser.html("<option disabled>Choose badge</option>" + ecp_data.map((e, i) => `<option value="${i}">[${names[e.type].short}] ${e.name}</option>`));
                chooser.on("change", function () {
                    apply(+chooser.val());
                });
				// load finish and laser options
				$("#finish-choose").html(finishes.map(i => `<input type="checkbox" id="${i.value}"><label for="${i.value}">${i.name || (i.value[0].toUpperCase() + i.value.slice(1))}</label>`).join("<br>"));
				$("#shadow-mode").append(shadow_modes.map(i => "<option value='"+i.value+"'>"+(i.name || (i.value[0].toUpperCase()+i.value.slice(1)))+"</option>").join(""));
				$("#res-option").append(presets.map(i => "<option value='"+i.value+"'>"+i.value[0].toUpperCase()+i.value.slice(1)+"</option>").join(""))
				$("#laser-choose").html(lasers.map((i,j) => `<input type="checkbox" id="${j}"><label for="${j}">${i}</label>`).join("<br>"));
				// change events
				for (let id of [
					"loadBadge",
					"finish-choose input",
					"laser-choose input",
					"row-variation",
					"res-option",
					"shadow-mode",
					"multi-mode"
				]) $("#"+id).each(function() { $(this).on("change", function() {applySize()}) });
				// find the ecp info of the searching name
				// display the ecp info
				URLParser.getQuery(init);
				apply(URLParser.current.name.index, init)
			}, apply = function (index, init) {
				query_index = index;
				let query_info = ecp_data[index] || ecp_data[index = 0];
				URLParser.current.name.data = query_info;
				URLParser.current.name.index = index;
				URLParser.current.name.default = false;
                $("#index > #index-selector").val(index);
				last_info = query_info;
				// load the ecp info to the screen
				$("#index > #index-content").html("<p id='indexInput' contenteditable='true'>" + (query_index+1) + "</p><p>/" + ecp_data.length);
                $("#index > #index-selector").css("display", "");
				$("#indexInput").on("blur", function(){ $("#indexInput").text(query_index + 1)});
				updateInfo(query_info, init);
			}, updateInfo = function (query_info, init) {
				$("#name").html(query_info.name);
				$("#date").html("");
				$("#badge-showcase").attr('src', "loading.gif");
				updateIcon();
				$("#hidden-name").val($("#custom-name").val() || $("#name").html()).change();
				let ecp_type = names[query_info.type];
				$("#type").html("<a style='text-decoration: none;cursor: pointer' href='" + (ecp_type ? `https://starblastio.fandom.com/wiki/${ecp_type.short}' target='_blank'>${ecp_type.long} (${ecp_type.short})` : "javascript:void(0);'>Unknown")+"</a>");
				// load the ecp image
				applySize(init)
			}, applySize = function(init) {
				URLParser.getQuery(init).save();
				let request_id = ECP.id++;
				$("#download").attr("disabled", true);
				let query_info = last_info;

				if (URLParser.value('badge')) ECP.loadBadge(URLParser.value('size'), query_info, URLParser.value('finish'), URLParser.value('laser'), URLParser.value('shadow'), URLParser.value('variation'), request_id, loadImage);
				else ECP.loadIcon(URLParser.value('size'), query_info, request_id, loadImage)
			}, loadImage = function (canvas, info, request_id) {
				if (request_id == ECP.id - 1) {
					if (!info.url) $("#date").html("Built-in");
					else if (info.custom) $("#date").html("Custom upload");
					else {
						var xhr = $.ajax({
							type: 'HEAD',
							url: info.url,
							success: function(msg) {
								if (request_id == ECP.id - 1) {
									var filetime = xhr.getResponseHeader('Last-Modified');
									$("#date").html("Last updated: " + new Date(filetime).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}));
								}
							}
						})
					}
					updateIcon(canvas);
					let link = canvas.toDataURL();
					$("#download-template").attr({
						href: link,
						download: info.id
					});
					$("#badge-showcase").attr('src', link);
					$("#download").attr("disabled", false);
				}
			}, loadCustom = function(url) {
				URLParser.current.name.default = true;
				$("#index > #index-content").html("Unlisted");
                $("#index > #index-selector").css("display", "none");
				last_info = {
					id: "custom",
					url: url,
					name: '<input type="text" class="inline-input" id="custom-name" onchange="$(\'#hidden-name\').val(this.value).change()" placeholder="Custom icon name" value="Your custom icon">',
					type: "ecp",
					custom: "true"
				}
				query_index = null;
				updateInfo(last_info);
			}, customModal = $("#customization-modal");
			$("#customization").on("click", () => customModal.css("display", "block"));
			$("#customization-modal > #modal-bg").on("click", () => customModal.css("display", "none"));
			$(window).on("resize", function(){
				if (updateSizeNeeded) applySize()
			});
			$("#apply-res").on("click", function() {
				applySize()
			});
			$("#url-import").on("click", function() {
				let url = prompt("Insert your image URL here:");
				if (url) loadCustom(url)
			});
			$("#file-import").on("change", function(e){
				if (e.target.files && e.target.files[0]) {
					let file=e.target.files[0];
					if (file.type.match("image/")) {
						var reader = new FileReader();
						reader.onload = function (e) {
							loadCustom(e.target.result);
						}
						reader.readAsDataURL(file);
					}
					else alert("Invalid file format!");
					$("#file-import").val("");
				}
			});
			$("#warning").on("click", function(){
				alert("Sometimes the execution of scripts on pages using Starblast data in other tabs (main site, modding, shipeditor, standalone, serverlists, etc.) can block the fetching process on this page.\nPlease close those tabs and then hard-reload this page to try again.\nIf the above method doesn't work, restart the browser and retry.")
			});
			$("#hidden-name").on("change", function() {
				$("title").text(($("#hidden-name").val() || "Your custom icon") + title)
			})
			var nav_key_actions = {
				prev: {
					handler: function() {
						apply((query_index>0?query_index:ecp_data.length)-1)
					},
					keyCode: 37
				},
				next: {
					handler: function() {
						apply(++query_index<ecp_data.length?query_index:0)
					},
					keyCode: 39
				},
				hideinfo: {
					handler: function() {
						$("#infobox").css("display", "none");
						$("#showinfo").css("display", "");
					},
					keyCode: 38
				},
				showinfo: {
					handler: function() {
						$("#infobox").css("display", "");
						$("#showinfo").css("display", "none");
					},
					keyCode: 40
				}
			}
			for (let i in nav_key_actions) {
				$("#" + i).on("click", nav_key_actions[i].handler);
			}
			$("#download").on("click", function() {
				$("#download-template")[0].click()
			});
			var focusIDs = [
				{id: 'custom-res', handler: applySize},
				{id: 'indexInput', handler: function (){ apply(Math.trunc(Math.min(Math.max(parseInt($("#"+this.id).text()), 1), ecp_data.length)) - 1 || 0)}},
				{id: 'custom-name', handler: function () {}},
				{id: 'res-option', handler: function () {}},
				{id: 'finish-choose', handler: function () {}},
				{id: 'laser-choose', handler: function () {}},
			];
			$(document).on('keydown', function (event) {
				let focusID = focusIDs.find(id => $("#"+id.id).is(":focus"));
				if (focusID) {
					switch (event.keyCode) {
						case 13: // Enter
							focusID.handler();
							break;
					}
				}
				else switch (event.keyCode) {
					default:
						let handler = (Object.values(nav_key_actions).find(action => action.keyCode == event.keyCode)||{}).handler;
						if (typeof handler == "function") handler();
				}
			});
			fetch(true);
			$("#init").css("display", "none");
			clearInterval(it);
		}
		window.URLParser = URLParser;
	}, 500);
	addToolPage(null,"1%","1%",null,null,null,null,$("#infobox")[0])
});

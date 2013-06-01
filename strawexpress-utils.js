/*
 * StrawExpress-Utils
 * Base Webapp-oriented Framework, along with StrawNode
 * Extra Toolkit #1
 * 
 * V 1.0.0
 * 
 * Dependancies : 
 * 	StrawExpress
 * 
 * author saz aka True
 * 
 * licensed under GNU GPL-General Public License
 * copyright sazaam[(at)gmail.com]
 * 2011-2013
 * 
 */

'use strict' ;

(function(name, definition){
	
	if ('function' === typeof define){ // AMD
		define(definition) ;
	} else if ('undefined' !== typeof module && module.exports) { // Node.js
		module.exports = ('function' === typeof definition) ? definition() : definition ;
	} else {
		if(definition !== undefined) this[name] = ('function' === typeof definition) ? definition() : definition ;
	}
	
})('strawexpress-utils', Pkg.write('org.libspark.straw', function(){
	
	/* KOMPAT */
	var Kompat = Type.define({
		pkg:'detect::Kompat',
		statics : {
			kompat:null,
			namespaces:{
				ie: /MSIE [\d.]+/i,
				chr : /Chrome.[\d.]+/i,
				ff : /Firefox.[\d.]+/i,
				safmob: /[\d.]+ Mobile Safari/i,
				saf : /[\d.]+ Safari/i,
				op : /Opera/i
			},
			workspaces:{
				win: /WINDOWS(?= NT ([\d.]+))/i,
				ios : /iP[ao]d|iPhone/i,
				mac : /Mac OS/,
				chr : /CrOS/,
				android : /Android/,
				blackberry : /BlackBerry(?= ([\d.]+))/i ,
				linux : /Linux/
			},
			getName: function(){return Kompat.kompat.name},
			getVersion: function(){return Kompat.kompat.version},
			getOs: function(){return Kompat.kompat.os},
			getOsVersion: function(){return Kompat.kompat.osversion},
			initialize:function(){
				var ctor = this ;
				var kompat = new ctor() ;
				var ua = navigator.userAgent ;
				var arr, p, version, name, os, osversion, ns, x, y;
				var namespaces = ctor.namespaces ;
				for(var s in namespaces){
					x = namespaces[s] ;
					if(arr = x.exec(ua)){
						p = arr[0].replace('/', ' ') ;
						version = p.replace(/[ A-Z]*/gi, '') ;
						if(version === ''){
							var vtest = /Version\/([\d.]+$)/ ;
							if(vtest.test(ua)){
								ua.replace(vtest, function($1, $2, $3){
									version = $2 ;
								});
							}else version = "unknown" ;
						}
						name = p.replace(version, '').replace(' ', '') ;
						ns = s ;
						break ;
					}
				}
				kompat.ns = ns ;
				kompat.name = name ;
				kompat.version = version ;
				var workspaces = ctor.workspaces ;
				for(var w in workspaces){
					y = workspaces[w] ;
					if(y.test(ua)){
						ua.replace(y, function($1, $2, $3){
							if($2) osversion = $2 ;
							os = $1 ;
						});
						break;
					}
				}
				if(!os) os = "unknown" ;
				if(!osversion) osversion = "unknown" ;
				kompat.os = os ;
				kompat.osversion = osversion ;
				ctor[os] = ctor[w] = true ;
				ctor[ns] = ctor[name] = true ;
				var locals = name + ' ' + w + ' ' + 'version_' + version.replace(/[.]/g, '-') + ' ' ;

				document.documentElement.className = document.documentElement.className === '' ? locals : document.documentElement.className +' '+ locals ;
				return this ;
			}
		}
	}) ;
	
	/* XLOADER */
	var XLoader = Type.define(function(){
		var d = document;
		var brows, head,
		pending = {},
		pCnt = 0,
		q = {css: [], js: []},
		sheets = d.styleSheets ;
		
		return {
			pkg:'load::XLoader',
			statics : {
				fileSupport:{
					'javascript':/[.]js$/i,
					'css':/[.]css$/i
				},
				detectFileExt:function(ns){
					var o = XLoader.fileSupport ;
					for(var s in o){
						if(o[s].test(ns)) return s ;
					}
					throw new Error('extension is not supported for loading...') ;
				},
				loadjscssfile:function(ns, callback){
					var file = XLoader.createjscssfile(ns) ;
					document.getElementsByTagName("head")[0].appendChild(file) ;

					switch(file.getAttribute('ext')){
						case 'css':
							if(Kompat.MSIE){
								file.attachEvent("onreadystatechange", function nnn(e){
									file.detachEvent(e.type, nnn) ;
									var el = e ;
									e.target = e.srcElement;
									callback(e);
								}) ;
							}else if(Kompat.Chrome || Kompat.Safari){

							}else if (Kompat.Firefox){

							}
						break;
						case 'javascript':
							if(Kompat.MSIE){
								file.attachEvent("onreadystatechange", function nnn(e){
								file.detachEvent(e.type, nnn) ;
								var el = e ;
								e.target = e.srcElement;
								callback(e);
								}) ;
							}else{
								file.onload = callback ;
							}
						break;
					}
					return file ;
				},
				createjscssfile:function(ns){
					var ext = XLoader.detectFileExt(ns) ;
					var file ;
					if (ext == 'javascript'){
					file = document.createElement('script') ;
					file.setAttribute("type","text/javascript") ;
					file.setAttribute("src", ns) ;
					}
					else if (ext == "css"){
					file = document.createElement("link") ;
					file.setAttribute("rel", "stylesheet") ;
					file.setAttribute("type", "text/css") ;
					file.setAttribute("href", ns) ;
					}
					file.setAttribute('ext', ext) ;
					return file ;
				},
				createNode:function(name, ats) {
					var n = d.createElement(name), a ;
					for (a in ats) {
						if (ats.hasOwnProperty(a)) {
							n.setAttribute(a, ats[a]) ;
						}
					}
					return n ;
				},
				finish:function(t) {
					var p = pending[t], cb, urls ;
					if (p) {
						cb = p.callback ;
						urls = p.urls ;

						urls.shift() ;
						pCnt = 0 ;

						if (!urls.length) {
							cb && cb.call(p.context, p.obj) ;
							pending[t] = null ;
							q[t].length && this.load(t) ;
						}
					}
				},
				getBrows:function () {
					if (brows) return ;

					var ua = navigator.userAgent ;

					brows = {
						async: d.createElement('script').async === true
					} ;
					
					(brows.webkit = /AppleWebKit\//.test(ua))
					|| (brows.ie = /MSIE/.test(ua))
					|| (brows.opera = /Opera/.test(ua))
					|| (brows.gecko = /Gecko\//.test(ua))
					|| (brows.unknown = true) ;
				},
				load:function(t, urls, cb, obj, context) {
					var _finish = function () { 
						XLoader.finish(t) ;
					},
					isCSS = t === 'css' ,i, l, n, p, pendingUrls, u ;

					XLoader.getBrows() ;

					if (urls) {
						urls = typeof urls === 'string' ? [urls] : urls.concat() ;
						if (isCSS || brows.async || brows.gecko || brows.opera) {
							q[t].push({
								urls    : urls,
								callback: cb,
								obj     : obj,
								context : context
							}) ;
						} else {
							for (i = 0, l = urls.length; i < l; ++i) {
								q[t].push({
									urls    : [urls[i]],
									callback: i === l - 1 ? cb : null,
									obj     : obj,
									context : context
								});
							}
						}
					}

					if (pending[t] || !(p = pending[t] = q[t].shift())) return ;

					head || (head = d.head || d.getElementsByTagName('head')[0]) ;
					pendingUrls = p.urls ;

					for (i = 0, l = pendingUrls.length ; i < l ; ++i) {
						u = pendingUrls[i] ;

						if (isCSS) {
							n = brows.gecko ? XLoader.createNode('style') : XLoader.createNode('link', {
								href: u,
								rel : 'stylesheet'
							}) ;
						} else {
							n = XLoader.createNode('script', {src: u}) ;
							n.async = false ;
						}

						n.className = 'xload' ;
						n.setAttribute('charset', 'utf-8') ;
						n.setAttribute('source', u) ;
						
						if (brows.ie && !isCSS) {
							n.onreadystatechange = function() {
								if (/loaded|complete/.test(n.readyState)) {
									n.onreadystatechange = null ;
									_finish() ;
								}
							}
						} else if (isCSS && (brows.gecko || brows.webkit)) {
							if (brows.webkit) {
								p.urls[i] = n.href ;
								XLoader.pWebKit() ;
							} else {
								n.innerHTML = '@import "' + u + '";' ;
								XLoader.pGecko(n) ;
							}
						} else {
							n.onload = n.onerror = _finish ;
						}
						head.appendChild(n) ;
					}
				},
				pGecko: function (n) {
					try {
						n.sheet.cssRules;
					} catch (ex) {
						pCnt += 1;
						
						if (pCnt < 200) {
							setTimeout(function () { XLoader.pGecko(n); }, 50);
						} else {
							XLoader.finish('css');
						}
						return;
					}
					XLoader.finish('css');
				},
				pWebKit: function() {
					var css = pending.css, i;

					if (css) {
						i = sheets.length;
						while (i && --i) {
							if (sheets[i].href === css.urls[0]) {
								XLoader.finish('css');
								break;
							}
						}

						pCnt += 1;

						if (css) {
							if (pCnt < 50) {
								setTimeout(XLoader.pWebKit, 50);
							} else {
								XLoader.finish('css');
							}
						}
					}
				},
				css: function (urls, callback, obj, context) {
					XLoader.load('css', urls, callback, obj, context);
				},
				js: function (urls, callback, obj, context) {
					XLoader.load('js', urls, callback, obj, context);
				}
			}
		} // END OF OBJECT
	}) ;
	
	var EventEnhancer = Type.define({
		domain:Type.appdomain,
		pkg:'events',
		constructor:EventEnhancer = function EventEnhancer()
		{
			EventEnhancer.initEvents() ;
			return this ;
		},
		statics:{
			initEvents:function(){
				var ww = $(window) ;
				//////// RESIZE
				var resizestarted = false ;
				var resizemoved = false ;
				var restartuid ;
				var resizeclosure ;
				
				ww.bind('resize', resizeclosure = function(e){
					var dur = resizemoved == true ? 600 : 100 ;
					if(restartuid !== undefined) clearTimeout(restartuid) ;
					if(resizestarted == false){
						ww.trigger('resizestart') ;
						resizestarted = true ;
					}else{
						resizemoved = true ;
						ww.trigger('resizemove') ;
					}
					restartuid = setTimeout(function(){
						restartuid = undefined ;
						resizestarted = false ;
						resizemoved = false ;
						ww.trigger('resizeend') ;
					}, dur) ;
				})
			
				
				
				
				//////// TOUCH
				var isMob = this.isMobileDevice = /(Ip(hone|od|ad))|Android|BlackBerry/gi.test(navigator.userAgent) ;
				
				this.OSMoving = false ;
				
				var touchstarted = false ;
				var touchmoved = false ;
				var hastodo = false ;
				var touchuid ;
				var stx, sty , xx = 0, yy = 0, distX, distY, way ;
				
				var touchupclosure , touchdownclosure, touchmoveclosure ;
				
				var range = 150 ;
				var noactionrange = 25 ;
				
				if(isMob){
					
					document.addEventListener('touchstart', touchdownclosure = function(e){
						
						e.stopPropagation() ;
						e.stopImmediatePropagation() ;
						
						ww.trigger({
							type:"OStouchstart",
							originalEv:e
						}) ;
						
						var l = e.touches.length ;
						
						if(l == 1){
							
							document.addEventListener('touchmove', touchmoveclosure = function(ev){
								var l = ev.touches.length ;
								
								if(l == 1){
									ev.preventDefault() ;
									var tch = ev.touches[0] ;
									
									
									
									if(!touchmoved){
										stx = tch.pageX ;
										sty = tch.pageY ;
										distX = 0 ;
										distY = 0;
										hastodo = true ;
										ww.trigger({
											type:"OStouchmovestart",
											originalEv:ev
										}) ;
										EventEnhancer.OSMoving = true ;
									}else{
										ww.trigger({
											type:"OStouchmove",
											originalEv:ev
										}) ;
										distX = stx - tch.pageX ;
										distY = sty - tch.pageY;
										xx = Math.max(distX, tch.pageX - stx) ;
										yy = Math.max(distY, tch.pageY - sty) ;
										way = (xx > yy) ? 'x' : 'y' ;
										if(xx > range || yy > range){
											if(way == 'x') 
												ww.trigger(
												{
													type:"OStouchmoveX",
													distance:distX,
													originalEv:ev
												}) ;
											else 
												ww.trigger(
												{
													type:"OStouchmoveY",
													distance:distY,
													originalEv:ev
												}) ;
											hastodo = false ;
											stx = tch.pageX ;
											sty = tch.pageY ;
										}
									}
									touchmoved = true ;
								}
								
							}, false ) ;
							
							
							document.addEventListener('touchend', touchupclosure = function(ev){
								var l = ev.touches.length ;
								
								if(l == 0){
									ww.trigger({
											type:"OStouchend",
											originalEv:ev
									}) ;
									document.removeEventListener('touchend', touchupclosure) ;
									document.removeEventListener('touchmove', touchmoveclosure) ;
									
									if(touchmoved){
										ww.trigger({
											type:"OStouchmoveend",
											originalEv:ev
										}) ;
										
										if(hastodo){
											if(way == 'x'){
												if(xx > noactionrange && distX !== 0){
													ww.trigger(
														{
														type:"OStouchmoveX",
														distance:distX,
														originalEv:ev
													}) ;
												}							
											}else{
												if(yy > noactionrange && distY !== 0){
													ww.trigger(
													{
														type:"OStouchmoveY",
														distance:distY,
														originalEv:ev
													}) ;
												}
											}
											hastodo = false ;
										}
										EventEnhancer.OSMoving = false ;
										touchmoved = false ;
									}
									
								}
								
								
							}, false ) ;
						}
						
						
					}, false ) ;
					
					
				}else{
					
					ww.bind('mousedown', touchdownclosure = function(e){
						
						e.preventDefault() ;
						e.stopPropagation() ;
						e.stopImmediatePropagation() ;
						
						if (e.which === 3) return ;

						ww.trigger({
							type:"OStouchstart",
							originalEv:e
						}) ;
						ww.bind('mousemove', touchmoveclosure = function(ev){
							
							if(!touchmoved){
								stx = ev.pageX ;
								sty = ev.pageY ;
								distX = 0 ;
								distY = 0;
								hastodo = true ;
								ww.trigger({
									type:"OStouchmovestart",
									originalEv:ev
								}) ;
								EventEnhancer.OSMoving = true ;
							}else{
								ww.trigger({
									type:"OStouchmove",
									originalEv:ev
								}) ;
								distX = stx - ev.pageX ;
								distY = sty - ev.pageY;
								xx = Math.max(distX, ev.pageX - stx) ;
								yy = Math.max(distY, ev.pageY - sty) ;
								way = (xx > yy) ? 'x' : 'y' ;
								if(xx > range || yy > range){
									if(way == 'x') 
										ww.trigger(
										{
											type:"OStouchmoveX",
											distance:distX,
											originalEv:ev
										}) ;
									else 
										ww.trigger(
										{
											type:"OStouchmoveY",
											distance:distY,
											originalEv:ev
										}) ;
									hastodo = false ;
									stx = ev.pageX ;
									sty = ev.pageY ;
								}
							}
							touchmoved = true ;
						})
						ww.bind('mouseup', touchupclosure = function(ev){
							ev.preventDefault() ;
							ev.stopPropagation() ;
							ev.stopImmediatePropagation() ;
							
							
							
							ww.unbind('mouseup', touchupclosure) ;
							ww.unbind('mousemove', touchmoveclosure) ;
							
							if(touchmoved){
								ww.trigger({
									type:"OStouchmoveend",
									originalEv:ev
								}) ;
								if(hastodo){
									if(way == 'x'){
										if(xx > noactionrange && distX !== 0){
											ww.trigger(
											{
												type:"OStouchmoveX",
												distance:distX,
												originalEv:ev
											}) ;
										}							
									}else{
										if(yy > noactionrange && distY !== 0){
											ww.trigger(
											{
												type:"OStouchmoveY",
												distance:distY,
												originalEv:ev
											}) ;
										}
									}
									hastodo = false ;
								}
								EventEnhancer.OSMoving = false ;
								touchmoved = false ;
							}
							
							setTimeout(function(){ww.trigger({
								type:"OStouchend",
								originalEv:ev
							})}, 30) ;
						})
					})
					
				}
			},
			initialize:function(){
				this.instance = new (this)() ;
			}
		}
	}) ;
	
	/* LOOP */
	var Loop = Type.define({
		pkg:'collection',
		domain:Type.appdomain,
		constructor:Loop = function Loop(){
			var loopables = this.loopables =  [] ;
			var playhead = this.playhead = -1 ;
			
			return this ;
		},
		add:function(c){
			var loopables = this.loopables ;
			var what = Object.prototype.toString ;
			if(c[0] !== undefined && c[0] instanceof CommandQueue){
				
				var l = c.length ;
				
				for(var i = 0 ; i < l ; i++){
					loopables[loopables.length] = c[i] ;
				}
			}else{
				loopables[loopables.length] = c ;
			}
		},
		launch:function(n, force){
			var lp = this;
			var loopables = lp.loopables, playhead = lp.playhead ;
			
			if(loopables[n] === undefined) throw 'error finding the right commandqueue';
			if(n == lp.playhead && force !== true) return ;
			
			lp.index = n ;
			var cq = loopables[n] ;
			
			
			$(cq).bind('$', function rrr(e){
				$(cq).unbind('$', rrr) ;
				lp.playhead = n ;
				cq = cq.reset() ;
			}) ;
			
			return cq.execute() ;
		},
		prev:function(){
			return this.launch(this.getPrevIndex()) ;
		},
		getPrevIndex:function(num) {// enter as -1, -2, -3
			var lp = this;
			var l = lp.loopables.length ;
			var n = num !== undefined ? lp.playhead + num : lp.playhead - 1 ;
			
			if(n < 0) n = n + l ;
			return n ;
		},
		next:function(){
			return this.launch(this.getNextIndex()) ;
		},
		getNextIndex:function(num){
			var lp = this;
			var l = lp.loopables.length ;
			var n = num !== undefined ? lp.playhead + num : lp.playhead + 1 ;
			
			if(n > l - 1) n = n - l ;
			return n ;
		}
	}) ;
	
	/* CYCLIC */
	var Cyclic = Type.define({
		pkg:'collection',
		domain:Type.appdomain,
		constructor:Cyclic = function Cyclic(arr){
			var cy = this ;
			var commands = cy.commands = [] ;
			cy.index = -1 ;
			cy.looping = true ;
			cy.deferred = false ;
			
			
			if(!! arr && arr.length > 0){
				this.add.apply(this, arr) ;
			}
			return this ;
		},
		add:function(){
		   var cy = this ;
		   var commands = cy.commands ;
		   var args = [].slice.call(arguments) ;
		   var len = args.length ;
		   for(var i = 0 ; i < len ; i++){
			  var arg = args[i] ;
			  if(arg[0] !== undefined && arg[0] instanceof Command){
				 l = cy.push.apply(cy, arg) ;
			  }else{
				 l = cy.push.apply(cy, [arg]) ;
			  }
		   }
		   return l ;
		},
		remove:function(){
		   var cy = this ;
		   var commands = cy.commands ;
		   var args = [].slice.call(arguments) ;
		   var len = args.length ;
		   for(var i = 0 ; i < len ; i++){
			  var arg = args[i] ;
			  if(isNaN(arg) && arg instanceof Command){
				 var n = cy.indexOf(arg) ;
				 cy.splice(n, 1) ;
			  }else{
				 cy.splice(arg, 1) ;
			  }
		   }
		   var l = commands.length ;
		   return l ;
		},
		indexOf:function(el){
		   var cy = this ;
		   var commands = cy.commands ;
		   
		   if(Array.prototype['indexOf'] !== undefined){
			  return commands.indexOf(el) ;
		   }else{
			  var l = commands.length ;
			  for(var i = 0 ; i < l ; i++){
				 if(commands[i] === el) return i ;
			  }
		   }
		   return -1 ;
		},
		splice:function(){
		   var cy = this ;
		   var commands = cy.commands ;
		   var r = commands.splice.apply(commands, [].slice.call(arguments)) ;
		   var l = commands.length ;
		   var div = 1/l ;
		   cy.unit = {index:div, deg:div * 360, rad:div * Math.PI * 2} ;
		   return r ;
		},
		push:function(){
		   var cy = this ;
		   var commands = cy.commands ;
		   var l = commands.push.apply(commands, [].slice.call(arguments)) ;
		   var div = 1/l ;
		   cy.unit = {index:div, deg:div * 360, rad:div * Math.PI * 2} ;
		   return l ;
		},
		unshift:function(){
		   var cy = this ;
		   var commands = cy.commands ;
		   var l = commands.unshift.apply(commands, [].slice.call(arguments)) ;
		   var div = 1/l ;
		   cy.unit = {index:div, deg:div * 360, rad:div * Math.PI * 2} ;
		   return l ;
		},
		pop:function(){
		   var cy = this ;
		   var commands = cy.commands ;
		   var command = commands.pop() ;
		   var l = commands.length ;
		   var div = 1/l ;
		   cy.unit = {index:div, deg:div * 360, rad:div * Math.PI * 2} ;
		   return command ;
		},
		shift:function(){
		   var cy = this ;
		   var commands = cy.commands ;
		   var command = commands.shift() ;
		   var l = commands.length ;
		   var div = 1/l ;
		   cy.unit = {index:div, deg:div * 360, rad:div * Math.PI * 2} ;
		   return command ;
		},
		getPrev:function(n){
		   var cy = this ;
		   if(n === undefined) n = 1 ;
		   
		   n = -n ;
		   
		   var neo = (cy.index * cy.unit.rad) + (n * cy.unit.rad) ;
		   
		   if(cy.looping !== true){
				if(cy.index <= 0)
					return {index:-1} ;
		   }else{
				neo = neo % (Math.PI * 2) ;
		   }
		   
		   var s = this.seek(neo) ;
		   s.dif = n ;
		   return s ;
		},
		prev:function(n){
		   var cy = this ;
		   
		   cy.ascend = !Boolean(n === undefined || n > 0) ;
		   
		   var item = cy.getPrev(n) ;
		   var ind = item.index ;
		   
		   if(ind == -1) {
				return false ;
		   }
		   
		   cy.increment = item.dif ;
		   var c = cy.commands[ind].execute() ;
		   
		   cy.index = ind ;
		   return c ;
		},
		getNext:function(n){
		   var cy = this ;
		   
		   if(n === undefined) n = 1 ;
				  
		   var neo = (cy.index * cy.unit.rad) + (n * cy.unit.rad) ;
		   
		   var l = cy.commands.length ;
		   if(cy.looping !== true){
				if(cy.index >= l - 1)
					return {index:-1} ;
			}else{
				neo = neo % (Math.PI * 2) ;
		   }
		   var s = this.seek(neo) ;
		   s.dif = n ;
		   return s ;
		},
		next:function(n){
		   var cy = this ;
		   
		   cy.ascend = Boolean(n === undefined || n > 0) ;
		   
		   var item = cy.getNext(n) ;
		   var ind = item.index ;
		   
		   if(ind == -1) {
				return false ;
		   }
		   
		   cy.increment = item.dif ;
		   var c = cy.commands[ind].execute() ;
		   cy.index = ind ;
		   return c ;
		},
		seek:function(rad){ // relative deg (degree) as relative position index in Array
		   var cy = this ;
		   var rad, ind ; 
		   var pi2 = Math.PI * 2 ;
		   var l = cy.commands.length ;
		   
		   if(rad < 0 ){
			  rad = pi2 + rad ;
		   }
		   if(rad > pi2 || pi2 - rad < cy.unit.rad / 2 ){
			  rad = 0 ;
		   }
		   
		   ind = (rad % pi2) / Math.PI / 2 * l ; // ind is the exact SAFE position in Array, without notions of numerous circles
		   
		   return {index: Math.round(ind), rad: rad} ;
		},
		size:function(){
			var cy = this ;
			return cy.commands.length ;
		},
		launch:function(ind){
			var cy =  this ;
			return cy.next(ind - cy.index) ;
		}
	}) ;
	
	
})) ;
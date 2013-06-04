/*
 * StrawExpress
 * Base Webapp-oriented Framework, along with StrawNode
 * 
 * V 1.0.0
 * 
 * Dependancies : 
 * 	jQuery 1.6.1+ (event handling)
 * 	jquery-ba-hashchange (cross-browser hashchange event)
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
	
})('strawexpress-address', Pkg.write('org.libspark.straw', function(){
	
	
	require('jquery-1.8.1.min.js') ;
	require('jquery.ba-hashchange.min.js') ;
	
	var weretested = false ;
	
	var Address = Type.define({
		pkg:'net',
		domain:Type.appdomain,
		statics:{
			address_re:/^((?:(https?|ftp):)\/\/(([\w\d.-]+)(?::(\d+))?))?(?:([^#?]+)(#[^?]+)?)?([?].+)?$/i
		},
		constructor:Address = function Address(str){
			var u = this ;
			u.absolute = str ;
			
			str.replace(Address.address_re, function(){
				var $$ = ArrayUtil.argsToArray(arguments) ;
				
				u.base = $$[1] || '' ;
				u.protocol = $$[2] || '' ;
				u.host = $$[3] || '' ;
				u.hostname = $$[4] || '' ;
				u.port = $$[5] || '' ;
				u.path = $$[6] || '' ;

				u.hash = $$[7] || '' ;
				u.qs = $$[8] || '' ;
				u.loc = '' ;
				
				var loc_re = /\/([a-z]{2})(?=\/|$)/ ;
				
				if(loc_re.test(u.path))
					u.path = u.path.replace(loc_re, function(){
						u.loc = arguments[1] ;
						return '' ;
					}) ;
				else if(loc_re.test(u.hash))
					u.hash = u.hash.replace(loc_re, function(){
						u.loc = arguments[1];
						return '' ;
					}) ;
				
				u.abshash = u.hash ;
				u.hash = u.hash.replace(StringUtil.HASH, '') ;
				
				return '' ;
			}) ;
		},
		toString:function toString(){
			return this.absolute ;
		}
	}) ;
	
	var HierarchyChanger = Type.define({
		pkg:'hierarchy',
		domain:Type.appdomain,
		statics:{
			DEFAULT_PREFIX:StringUtil.HASH,
			SEPARATOR:Step.SEPARATOR,
			__re_multipleseparator:new RegExp('('+Step.SEPARATOR+'){2,}'),
			__re_qs:PathUtil.qs_re,
			__re_path:PathUtil.path_re,
			__re_endSlash:PathUtil.endslash_re,
			__re_startSlash:PathUtil.startslash_re,
			__re_hash:PathUtil.hash_re,
			__re_abs_hash:PathUtil.abs_hash_re
		},
		hierarchy:undefined,
		__value:StringUtil.EMPTY,
		__currentPath:StringUtil.EMPTY,
		__home:StringUtil.EMPTY,
		__temporaryPath:StringUtil.EMPTY,
		
		constructor:HierarchyChanger = function HierarchyChanger(){
			// trace(this)
		},
		setHierarchy:function setHierarchy(val){ this.hierarchy = val },
		getHierarchy:function getHierarchy(){ return this.hierarchy },
		setHome:function setHome(val){ this.__home = PathUtil.trimlast(val) },
		getHome:function getHome(){ return this.__home = PathUtil.trimlast(__home) },
		getValue:function getValue(){ return this.__value },
		setValue:function setValue(val){ this.hierarchy.redistribute(this.__value = val) },
		getCurrentPath:function getCurrentPath(){ return this.__currentPath = PathUtil.trimlast(this.__currentPath) },
		setCurrentPath:function setCurrentPath(val){ this.__currentPath = PathUtil.trimlast(val) },
		getTemporaryPath:function getTemporaryPath(){ return (this.__temporaryPath !== undefined) ? this.__temporaryPath = PathUtil.trimlast(this.__temporaryPath) : undefined },
		setTemporaryPath:function setTemporaryPath(val){ this.__temporaryPath = PathUtil.trimlast(val) }
	}) ;
	
	var Hierarchy = Type.define({
		pkg:'hierarchy',
		domain:Type.appdomain,
		idTimeoutFocus:-1 ,
		idTimeoutFocusParent:-1 ,
		root:undefined , // Step
		currentStep:undefined , // Step
		changer:undefined ,// HierarchyChanger;
		exPath:'',
		command:undefined ,// Command;
		// CTOR
		constructor:Hierarchy = function Hierarchy(){
			//
		},
		setAncestor:function setAncestor(s, changer){
			var hh = this ;
			hh.root = s ;
			hh.root.registerAsAncestor() ;
			hh.root.linkHierarchy(this) ;
			
			hh.currentStep = hh.root ;
			
			hh.changer = changer || new HierarchyChanger() ;
			hh.changer.hierarchy = hh ;
			
			return s ;
		},
		add:function add(step, at){
			return Type.of(at, 'string') ?  this.getDeep(at).add(step) : this.root.add(step) ;
		},
		remove:function remove(id, at){
			return Type.of(at, 'string') ? this.getDeep(at).remove(id) : this.root.remove(id) ;
		},
		getDeep:function getDeep(path){
			var h = Step.hierarchies[this.root.id] ;
			return (path === this.root.id) ? this.root : h[HierarchyChanger.__re_startSlash.test(path)? path : HierarchyChanger.SEPARATOR + path] ;
		},
		getDeepAt:function getDeepAt(referenceHierarchy, path){
			return Step.hierarchies[referenceHierarchy][path] ;
		},
		getTop:function getTop(tg, rt){
			while(tg.parentStep){
				if(tg.parentStep == (rt || Express.app.get('unique').getInstance())) return tg ;
				tg = tg.parentStep ;
			}
			return tg ;
		},
		redistribute:function redistribute(value){
			var hh = this ;
			if (hh.isStillRunning()) {
				hh.changer.setTemporaryPath(value) ;
				trace('>> still running...')
			}else {
				hh.changer.setTemporaryPath(undefined) ;
				hh.launchDeep(value) ;
			}
		},
		launchDeep:function launchDeep(path){
			var hh = this ;
			// trace('********************')
			// trace('LAUNCHING DEEP : "' + path+'"')
			// trace('********************')
			hh.command = new CommandQueue(hh.formulate(path)) ;
			var current = hh.currentStep ;
			hh.command.bind('$', hh.onCommandComplete) ;
			
			if(Type.is(current, Unique)) hh.command.execute() ; // cast Unique in that case
			else{
				var foc_clear ;
				current.bind('focus_clear', foc_clear = function(e){
					current.unbind('focus_clear', foc_clear) ;
					hh.command.execute() ;
				}) ;
				current.dispatchFocusOut() ;
			}
		},
		onCommandComplete:function onCommandComplete(e){
			var hh = AddressHierarchy.instance ;
			hh.clear() ;
			if(Type.of(hh.root.addressComplete, "function"))
			hh.root.addressComplete(e) ;
		},
		clear:function clear(){
			var hh = this ;
			if(Type.is(hh.command, Command)) {
				hh.command.unbind('$', hh.onCommandComplete) ;
				hh.command = hh.command.destroy() ;
			}
		},
		getLocaleReload:function getLocaleReload(){
			var hh = this ;
			if(Type.is(hh.currentStep, Express.app.get('unique')))
				AddressHierarchy.localereload = false ;
			if(AddressHierarchy.localereload){
				return false ;
			}
			return true ;
		},
		formulate:function formulate(path){
			var hh = this ;
			
			if(!!!hh.command) hh.changer.setTemporaryPath(path) ;
			
			var current = hh.currentStep ;
			var currentpath = hh.changer.getCurrentPath() ;
			var temppath = hh.changer.getTemporaryPath() ;
			var tempreg = new RegExp('^'+currentpath+'\/?') ;
			var remainpath = temppath.replace(tempreg, '') ;
			
			
			// trace('FORMULATING : "'+ path + '"'
				 // + ' \n CURRENT : "' + currentpath + '"'
				 // + ' \n TEMP : "' + temppath + '"'
				 // + ' \n REMAINS : "' + remainpath + '"') ;
			
			if(tempreg.test(temppath) && hh.getLocaleReload()){
			
			
				// in case current is an hacked step containing default step
				if(PathUtil.endslash(path)){
					hh.state = hh.state ;
					return hh.createCommandOpen(path) ;
				}
				// in case current is an non-end default step
				if(current.id == ''){
					hh.state = 'idle' ;
					return hh.createCommandClose(current.path) ;
				}
				
				var l = current.getLength() ;
				
				
				while(l--){
					var regexp ;
					var child = current.getChild(l) ;
					
					if (!!child.regexp){
						
						regexp = child.regexp ;
						
						if(regexp.test(remainpath)){
							
							var chunk ;
							remainpath.replace(regexp, function(){
								chunk = arguments[0] ;
								return '' ;
							}) ;
							var def = PathUtil.ensurelast(current.path) + chunk ;
							if(!!!hh.getDeep(def)){
								Express.app.get(chunk, child.handler) ;
								var resp = hh.getDeep(def) ;
								resp.regexp = child.regexp ;
								resp.userData = child.userData ;
							}
							
							hh.state = 'descending' ;
							return hh.createCommandOpen(def) ;
							
						}
						
					}else{
						regexp = new RegExp('^'+child.id) ;
						if(regexp.test(remainpath)){
							hh.state = 'descending' ;
							return hh.createCommandOpen(child.path) ;
						}
					}
				}
			}
			
			// if still didnt find shit, close the current
			hh.state = 'ascending' ;
			return hh.createCommandClose(current.path) ;
			
			// handle errors in step finding
			// hh.clear() ;
			// throw new Error('No step was actually found with path ' + (path == '' ? '(an empty string)' : path) + ' in ' + hh.getCurrentStep()) ;
			
		},
		checkRunning:function checkRunning(path){
			var hh = this ;
			if(hh.isStillRunning()){
				hh.command.add(hh.formulate(path)) ;
			}else{
				hh.redistribute(path) ;
			}
		},
		createCommandOpen:function createCommandOpen(path){
			var c = new Command(this, this.openCommand) ;
			c.params = [path, c] ;
			return c ;
		},
		openCommand:function openCommand(path, c){
			
			var hh = c.context ;
			var st_open ;
			
			var st = hh.getDeep(path) ;
			
			clearTimeout(hh.idTimeoutFocus) ;
			
			
			st.bind('step_open', st_open = function(e){
				
				st.unbind('step_open', st_open) ;
				hh.changer.setCurrentPath(PathUtil.trimfirst(st.path)) ;
				
				hh.currentStep = st ;
				hh.currentStep.state = Step.STATE_OPENED ;
				
				hh.treatSequence(function(){
					c.dispatchComplete() ;
				}) ;
				
			}) ;
			
			st.parentStep.play(st.id) ;
			
			return st ;
		},
		createCommandClose:function createCommandClose(path){
			var c = new Command(this, this.closeCommand) ;
			c.params = [path, c] ;
			return c ;
		},
		closeCommand:function closeCommand(path, c){
			var hh = c.context ;
			var st = hh.getDeep(path) ;
			var st_close ;
			
			// clearTimeout(hh.idTimeoutFocusParent) ; later we will need this
			
			st.bind('step_close', st_close = function(e){
				st.unbind('step_close', st_close) ;
				st.state = Step.STATE_CLOSED ;
				
				hh.changer.setCurrentPath(PathUtil.trimfirst(st.parentStep.path)) ;
				
				hh.currentStep = st.parentStep ;
				
				hh.treatSequence(function(){
					if(Express.app.get('liveautoremove') == true)
					if( !! st.regexp){
						if(/[^\w]/.test(st.regexp.source))
						Express.app.removeResponse(st) ;
					}
					c.dispatchComplete() ;
				}) ;
				
				
			})  
			
			st.parentStep.kill() ;
			
			return st ;
		},
		treatSequence:function treatSequence(closure){
			var hh = this ;
			
			var current = hh.currentStep ;
			var currentpath = hh.changer.getCurrentPath() ;
			var temppath = hh.changer.getTemporaryPath() ;
			var remainpath = temppath.replace(new RegExp('^'+currentpath+'\/?'), '') ;
			
			if(remainpath == ''){
				if(current.defaultStep){
					
					hh.checkRunning(current.defaultStep.path) ;
					
				}else{
					hh.idTimeoutFocus = setTimeout(function() {
						current.dispatchFocusIn() ;
					}, 20) ;
				}
			}else{
				hh.checkRunning(temppath) ;
			}
			
			if(!!closure) closure() ;
		},
		isStillRunning:function isStillRunning(){ return Type.is(this.command, Command)},
		getRoot:function getRoot(){ return this.root },
		getCurrentStep:function getCurrentStep(){ return this.currentStep },
		getChanger:function getChanger(){ return this.changer },
		getCommand:function getCommand(){ return this.command }
	}) ;
	
	var AddressHierarchy = Type.define({
		pkg:'hierarchy',
		inherits:Hierarchy,
		domain:Type.appdomain,
		statics:{
			parameters:{
				home:'',
				base:location.protocol + '//'+ location.host + location.pathname ,
				useLocale:true
			},
			baseAddress:new Address(location.href),
			unique:undefined,
			localereload:false,
			isReady:function isReady(){
				var address = AddressHierarchy.baseAddress ;
				var base = address.base + address.path ;
				return base == AddressHierarchy.parameters.base ;
			},
			create:function create(uniqueclass){
				if(!!! Express.app.get('unique')) Express.app.set('unique', uniqueclass || Unique) ;
				return AddressHierarchy.hierarchy = new AddressHierarchy(Express.app.get('unique')) ;
			},
			setup:function setup(params){
				for(var s in params)
					AddressHierarchy.parameters[s] = params[s] ;
				return AddressHierarchy ;
			}
		},
		hierarchy:undefined,
		constructor:AddressHierarchy = function AddressHierarchy(s){
			AddressHierarchy.base.call(this) ;
			this.changer = new AddressChanger() ;
			AddressHierarchy.instance = this ;
			this.initAddress(s) ;
		},
		sliceLocale:function sliceLocale(value){
			var changer = this.changer ,
			startSlash = HierarchyChanger.__re_startSlash ,
			endSlash = HierarchyChanger.__re_endSlash ,
			path = '' ,
			lang = '' ;
			
			path = value.replace(/^[a-z]{2}\//i, function($0, $1){
				lang = $1 ;
				return '' ;
			}) ;
			
			return PathUtil.trimall(path) ;
		},
		initAddress:function initAddress(s){
			this.changer.enable(location, this, s) ;// supposed to init the SWFAddress-like Stuff
			trace('JSADDRESS inited @'+ AddressHierarchy.parameters.base+' > with hash > '+location.hash) ;
		},
		redistribute:function redistribute(value){
			var hh = this ;
			value = hh.sliceLocale(value) ;
			AddressHierarchy.factory.redistribute.apply(this, [value]) ;
		},
		headTo:function headTo(seek){
			this.changer.setValue(PathUtil.ensureall(this.changer.locale + seek)) ;
		}
	}) ;
	
	var AddressChanger = Type.define({
		pkg:'hierarchy',
		inherits:HierarchyChanger,
		domain:Type.appdomain,
		statics:{
			hashEnable:function hashEnable(href){
				return '#' + href.replace(new RegExp(window.location.protocol + '//' + window.location.host), '').replace(/\/*$/,'/').replace(/^\/*/,'/').replace(/\/\/+/, '/') ;
			},
			hasMultipleSeparators:function hasMultipleSeparators(str){
				return (!!str) ? HierarchyChanger.__re_multipleseparator.test(str) : str ;
			},
			removeMultipleSeparators:function removeMultipleSeparators(str){
				return (!!str) ? str.replace(HierarchyChanger.__re_multipleseparator, StringUtil.SLASH) : str ;
			}
		},
		roottitle:document.title,
		skipHashChange:false,
		constructor:AddressChanger = function AddressChanger(s){
			AddressChanger.base.call(this) ;
		},
		enable:function enable(loc, hierarchy, uniqueClass){
			var ch = this ;
			var hh = ch.hierarchy = hierarchy ;
			
			var separator = HierarchyChanger.SEPARATOR ,
			abshashReg = HierarchyChanger.__re_abs_hash ,
			startSlashReg = HierarchyChanger.__re_startSlash ,
			endSlashReg = HierarchyChanger.__re_endSlash ,
			initLocale = document.documentElement.getAttribute('lang'),
			// base location object stuff
			href =  loc.href , // -> http://dark:13002/#/fr/unsubscribe/
			protocol =  loc.protocol , // -> http:
			hostname =  loc.hostname , // -> dark
			port =  loc.port , // -> 13002
			host =  loc.host , // -> dark:13002
			pathname =  loc.pathname , // -> /
			hash = loc.hash , // -> #/fr/unsubscribe/
			search = loc.search ; // -> (empty string)
			
			var a = new Address(href) ;
			var home = AddressHierarchy.parameters.home ;
			
			if(!abshashReg.test(a.absolute)) { // means it never has been hashchanged, so need to reset hash...
				
				weretested = true ;
				ch.locale = (a.loc != '' ? a.loc : initLocale ) ;
				
				// resetting AJAX via Hash
				
				if(a.path === '/' && a.loc === '') {
					var p = '#' + separator + ch.locale + a.path + a.qs ;
					location.hash = p ;
					// window.location.reload() ;
				}else{
					loc.href = a.path + '#' + separator + ch.locale + a.hash + a.qs ;
				}
			}
			
			ch.locale = ch.locale || a.loc ;
			
			if(ch.locale == '') ch.locale = initLocale ;
			
			hh.setAncestor(uniqueClass.getInstance(), ch) ;
			
			// INIT HASHCHANGE EVENT WHETHER ITS THE FIRST OR SECOND TIME CALLED
			// (in case there was nothing in url, home page was requested, hashchange wont trigger a page reload anyway)
			$(window).bind('hashchange', function(e){ 
				trace('JSADDRESS hashchange', location.hash) ;
				
				var address = a.base + a.path + location.hash ;
				var add = new Address(address) ;
				var h = add.hash ;
				var loc = '' ;
				
				
				if(AddressHierarchy.parameters.useLocale){
					// if Locale is missing
					if(add.loc == '') {
					   return ch.setValue(separator + ch.locale + h + add.qs) ;
					}
					
					// locale must have changed, reload with appropriate content
					if(add.loc !== ch.locale){
						ch.locale = add.loc ;
						// AddressHierarchy.localereload = true ;
					}
					loc = separator + add.loc ;
				}
				
				// if multiple unnecessary separators
				if(AddressChanger.hasMultipleSeparators(h))
					return ch.setValue(loc + AddressChanger.removeMultipleSeparators(h)) ;
				
				// if path is absent // hack for index VERY special case, we don't want to reload with same path ??!!
				if(h == '/' && home != '') 
					return ch.setValue(loc + h + (home == '' ?  home : home + separator) + add.qs) ;
				
				// if last slash is missing
				if(!endSlashReg.test(h)) 
					return ch.setValue(loc + add.hash + separator + add.qs) ;
				
				// trace('WILL REDISTRIBUTE')
				ch.setValue(loc + add.hash) ;
				hh.redistribute(add.hash) ;
				
				return ;
			})
			
			// OPENS UNIQUE STEP FOR REAL, THEN SET THE FIRST HASCHANGE
			var uniquehandler ;
			hh.root.bind('step_open', uniquehandler = function(e){
				hh.root.unbind('step_open', uniquehandler) ;
					if(!!window.opera) weretested = false ;
					if(weretested === false ){
						var str = location.hash.replace('#/', '').replace(ch.locale, '') ;
						// first hack when no home step at all
						if(str == '/' && ch.getValue() == '' && AddressHierarchy.parameters.home == '' && Unique.getInstance().getChild('') === undefined)
							return ; 
						else
							$(window).trigger('hashchange') ;
					}
			}) ;
			
			hh.root.open() ;
			return true ;
		},
		setValue:function setValue(newVal){
			location.hash = this.__value = newVal ;
		},
		setStepValue:function setStepValue(step){
			
			var loc = '' ;
			if(AddressHierarchy.parameters.useLocale){
				loc = '/' + this.locale ;
			}
			this.setValue('#' + loc + step.path + '/') ;
		},
		setTitle:function setTitle(title){
			document.title = this.roottitle + '  ' + title ;
		}
	}) ;
	
})) ;
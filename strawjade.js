/*
 * StrawJade
 * Jade Parser for Front-end Javascript
 * 
 * V 0.9.0
 * 
 * Dependancies : 
 * 	none
 * 
 * An utility inspired by infamous Jade templating language / renderer for Node.js (https://github.com/visionmedia/jade)
 * aiming to provide ability to simulate Jade without Jade (and Node).
 * 
 * author saz aka True
 * 
 * licensed under GNU GPL-General Public License
 * copyright sazaam[(at)gmail.com]
 * 2012-2013
 * 
 */

'use strict' ;

var Jade = window.Jade = (function(){
	var bank = [
		function () {return new XMLHttpRequest()},
		function () {return new ActiveXObject("Msxml2.XMLHTTP")},
		function () {return new ActiveXObject("Msxml3.XMLHTTP")},
		function () {return new ActiveXObject("Microsoft.XMLHTTP")}
	] ;
	
	var generateXHR = function () {
		var xhttp = false;
		var l = bank.length ;
		for (var i = 0 ; i < l ; i++) {
			try {
			   xhttp = bank[i]();
			}
			catch (e) {
			   continue;
			}
			break;
		}
		return xhttp;
	} ;
	
	var Jade = function Jade(url, complete, postData){
		var r = generateXHR() ;
		if (!r) return ;
		this.request = r ;
		this.url = url ;
		this.complete = complete ;
		this.userData = {
			post_data:postData,
			post_method:postData ? "POST" : "GET",
			ua_header:{ua:'User-Agent',ns:'XMLHTTP/1.0'},
			post_data_header: postData !== undefined ? {content_type:'Content-type',ns:'application/x-www-form-urlencoded'} : undefined 
		} ;	
	} ;
	
	Jade.prototype.destroy = function destroy(){
		var ud = this.userData ;
		for(var n in ud){
			delete ud[n] ;
		}
		for(var s in this){
			delete this[s] ;
		}
		return undefined ;
	}
	
	Jade.prototype.load = function load(url, async, force){
		var r = this.request ;
		var th = this ;
		var ud = this.userData ;
		var complete = this.complete ;
		
		
		var loc = url || this.url ;
		
		if(loc in Jade.cache){
			this.response = Jade.cache[loc] ;
			if(async && !!th.complete) th.complete(r, th) ;
			return this ;
		}
		
		if(async === false){
			ud['post_method'] = 'GET' ;
			r.open(ud['post_method'], loc, false) ;                             
			r.send(null) ;
			this.response = Jade.cache[loc] = this.request.responseText ;
			if(!!th.complete) th.complete(r, th) ;
			return this ;   
		}else{
			r.open(ud['post_method'] , loc, async || true) ;
			if (ud['post_data_header'] !== undefined) r.setRequestHeader(ud['post_data_header']['content_type'],ud['post_data_header']['ns']) ;
				r.onreadystatechange = function () {
				if (r.readyState != 4) return;
				if (r.status != 200 && r.status != 304) {
				return ;
				}
				this.response = Jade.cache[loc] = this.request.responseText ;
				if(!!th.complete) th.complete(r, th) ;
			}
			if (r.readyState == 4) return ;
			r.send(ud['postData']) ;
			return this ;
		}
	} ;
	
	Jade.prototype.parse = function parse(locals, text){
		// DECRIPTOR'S SETTINGS
		var parents = [] ;
		var parent, node ;
		var top = parent = parents[0] = {children:[], index:0} ;
		var parentIndex, oldParentIndex = 0;
		
		
		var all = text || this.response,
		
		// DECLARING ALL STATICS REGEXPS
		multiline_r = /^(\t+)*[^\r]+$/mg, 
		// multiline_r = /^(\t+).+$\n?/gm,
		multitabs_r = /\t+/,
		line_r = /^.+$\n?/m,
		tcs_r = /^(\t+)*(.+)\n?/,
		allcomments_r = /^(\t+)*(\/\/)/im,
		comments_r = /^(\t+)*(\/\/)/i,
		include_r = /^(\t+)*(include) ([0-9a-z\/.]+)$/im,
		allincludes_r = /^(\t+)*(include) ([0-9a-z\/.]+)$/gim,
		ext_r = /[.](a-z0-9)+$/,
		vars_r = /^((var )?\b\w+\b) =(?!=) */i,
		livecode_r = /^- /,
		tag_r = /^[0-6a-z]+/,
		css_r = /^(([#.])([0-9a-z-]+))+?/i,
		args_r = /^\((.*?)\)(?= |!?= | |$)/i,
		someassignment_r = /(.+)(?= *= *)/,
		assignment_r = / *= */,
		colon_r = /^: /,
		space_r = /^ /,
		pipe_r = /^\| /,
		equal_r = /^= /,
		notequal_r = /^!= /,
		singlequote_r = /'/g,
		doublequote_r = /"/g,
		blank_r = /^(\t+)*(\n|$)/gm,
		expr_r = /(#|\!)\{([^\}]+)\}/gi,
		crlf_r = /(\r\n)/g,
		ccc_r = /(\r)/mg,
		end_r = /\n$/,
		
		// DECLARING ALL STATICS STRINGS
		TAB = '\t',
		NL = '\n',
		NLTAB = '\n\t',
		RTAB = '\r\t',
		EMPTY = '' ;
		
		// HACKING ISSUE OF MISSING-ANY-TABS SPECIAL CASE
		all = TAB + all.replace(ccc_r, RTAB) ;
		// REMOVING ANY BLANK LINES
		all = all.replace(blank_r, EMPTY) ;
		
		//includes
		if(allincludes_r.test(all)){
			all = all.replace(allincludes_r, function parseForIncludes(){
				var ttt = arguments[1] ;
				var path = arguments[3] ;
				if(!ext_r.test(path)){
					path = path + '.jade' ;
				}
				var msg = new Jade(path).load(undefined, false).response ;
				msg = msg.replace(multiline_r, function(){
					return ttt + arguments[0] ;
				}) ;
				
				msg = msg ;
				while(include_r.test(msg)){
					msg = msg.replace(include_r, parseForIncludes) ;
				}
				return msg ;
			})
		}
		
		while(allcomments_r.test(all)){
			all.replace(allcomments_r, function(){
				
				var ttt = (arguments[1] || '').length ;
				var commentblock_r = new RegExp('(?:\\n\\t{1,'+(ttt)+'}(?!\\t))', 'm') ;
				var sub = all.substr(arguments[arguments.length - 2]) ;
				var spl = sub.split(commentblock_r) ;
				var code = !! spl[1] ? spl[0] + NL : spl[0] ;
				all = all.replace(code, EMPTY) ;
			}) ;
		}
		
		// EVALUATING LITTERAL FUNCTION
		var live = Jade.live = function live(str){
			var STR = EMPTY ;
			str = str.replace(expr_r, function(){
				var dec = arguments[1] ;
				var sss ;
				if(dec == '#'){
					sss = arguments[2] ;
					return "'+(" + sss + ")+'" ;
				}else{
					sss = arguments[2] ;
					return "'+Jade.esc(" + sss + ")+'" ;
				}
			}) ;
			
			
			STR = "return (function(){with(this){ return (" + str + ")}}).call(this) ;" ;
			
			return new Function(STR).call(locals) ;
		}
		
		
		var start = "(function(){Jade.evalstr = '' ;" ;
		var end = "return Jade.evalstr ;}).call(this)" ;
		var ind = 0 ;
		var buff = all.replace(multiline_r, function(){
			
			var mm = arguments[0].match(tcs_r) ;
			var ttabs = mm[1] ;
			
			var lline = mm[2] ;
			var tt = ttabs.substr(ttabs.length-ind, ttabs.length) ;
			
			if(livecode_r.test(lline)){
				
				// tracking nested tabindex
				var isStartNestedDecl = /\{ *$/i.test(lline) ;
				var isEndNestedDecl = /\} *$/i.test(lline) ;
				
				if(isStartNestedDecl && isEndNestedDecl) {
					ind++ ;
				}else if(isStartNestedDecl){
					ind++ ;
				}else if(isEndNestedDecl){
					while(ind > tt.length -1){
						ind --
					}
				}
				
				return lline.replace(livecode_r, EMPTY).replace(multitabs_r, EMPTY) + NL ;
			}else{
				
				var ll = lline.replace(tag_r, EMPTY);
				while(css_r.test(ll)) ll = ll.replace(css_r, EMPTY) ;
				while(args_r.test(ll)) ll = ll.replace(args_r, EMPTY) ;
				var rest = lline.replace(ll, EMPTY) ;
				
				if(equal_r.test(ll)){
					ll = ll.replace(equal_r, EMPTY) ;
					ll = rest + ' #{'+ ll + '}' ;
					return "Jade.evalstr +='"+ ttabs.substr(ind) + ll.replace(singlequote_r, '"' ) + "' + '\\n';\n" ;
				}else if(notequal_r.test(ll)){
					ll = ll.replace(notequal_r, EMPTY) ;
					ll = rest + ' !{'+ ll + '}' ;
					return "Jade.evalstr +='"+ ttabs.substr(ind) + ll.replace(singlequote_r, '"' ) + "' + '\\n';\n" ;
				}else
				return "Jade.evalstr +='"+ ttabs.substr(ind) + lline.replace(singlequote_r, "\\'" ) + "' + '\\n';\n" ;
			}
			
		}) ;
		var evalstr = start + buff + end ;
		
		all = live(evalstr) ;
		
		var rightContext = all ;
		// MAIN LINE FIND/REPLACE LOOP
		while(line_r.test(all))
		all.replace(line_r, function(){
			
			var future = EMPTY, tabs, cont ;
			var proper = all.replace(line_r, EMPTY) ;
			// seperate tabs from actual content of line
			var m = arguments[0].match(tcs_r) ;
			
			if(m !== null) {
				var line = m[0] ;
				tabs = m[1] ;
				cont = m[2] ;
				var original = cont ;
				var nnn = tabs.length ;
				
				if(cont != EMPTY){
					
					// starting HTML description
					var o = {children:[]} ;
					
					cont = cont.replace(tag_r, function(){
						o['tag'] = arguments[0] ;
						return EMPTY ;
					}) ;
					
					while(css_r.test(cont)){
						cont = cont.replace(css_r, function(){
							var sel = arguments[2] ;
							switch(sel){
								case '.' :
									o['class'] = (!!o['class'] ? o['class'] + ' ' : EMPTY ) + arguments[3] ;
								break;
								case '#' :
									o['id'] = arguments[3] ;
								break;
							}
							return '' ;
						}) ;
					}
					
					if(args_r.test(cont)){
						cont = cont.replace(args_r, function(){
							var args = arguments[1].split(',') ;
							var len = args.length ;
							for(var i = 0 ; i < len ; i++){
								var arg = args[i].replace(space_r, EMPTY) ;
								var name ;
								var val = arg.replace(someassignment_r, function(){
									name = arguments[0] ;
									return EMPTY ;
								}).replace(assignment_r, EMPTY) ;
								o[name] = live(val) ;
							}
							return EMPTY ;
						}) ;
					}
					
					if(colon_r.test(cont)){
						future = tabs + TAB + cont.replace(colon_r, EMPTY) + NL ;
						cont = EMPTY ;
					}
					
					if(space_r.test(cont)){
						cont = cont.replace(space_r, EMPTY) ;
						o['html'] = cont ;
						cont = EMPTY ;
					}
					if(pipe_r.test(cont)){
						cont = cont.replace(pipe_r, EMPTY) ;
						o['html'] = cont ;
						o.nodeless = true ;
						cont = EMPTY ;
					}
					
					if(equal_r.test(cont)){
						cont = cont.replace(equal_r, EMPTY) ;
						o['html'] = live(cont) ;
						cont = EMPTY ;
					}
					
					if(notequal_r.test(cont)){
						cont = cont.replace(notequal_r, EMPTY) ;
						o['html'] = Jade.HTMLesc(live(cont)) ;
						cont = EMPTY ;
					}
					
					parentIndex = nnn - 1 ;
					if(parentIndex > oldParentIndex ){
						parent = node || top ;
						parents[parents.length] = parent ;
					}else if(parentIndex < oldParentIndex){
						while(parentIndex < oldParentIndex){
							parent = parents[parentIndex] ;
							parents = parents.slice(0, -1) ;
							oldParentIndex -- ;
						}
					}
					// why is IE weird on this?
					// if(!!parent){
						parent.children = parent.children || [] ;
						parent.children[parent.children.length] = o ;
						node = o ;
						node.parent = parent ;
						node.index = parent.index + 1 ;
						oldParentIndex = parentIndex ;
					// }
				}
				
			} ;
			
			// don't touch, rightcontext MUST remove line WITH trailing '\n'
			rightContext = proper ;
			// don't touch, permits the rewriting of the tested string
			all = future + rightContext ;
			return EMPTY ;
		})
		Jade.evalstr = '' ;
		
		return (this.descriptor = top) ;
	} ;
	
	Jade.prototype.render = function render(locals, text){
		
		var obj = this.parse(locals, text) ;
		var excludes = {'html':1, 'tag':1, 'children':1, 'parent':1, 'index':1} ;
		return (function createChild(oo, pdiv){
			var ch = oo.children ;
			var l = ch.length ;
			for (var i = 0 ; i < l ; i++){
				var o = ch[i] ;
				var el ;
				if(!!o.nodeless){
					pdiv.innerHTML = pdiv.innerHTML + o['html'] ;
				}else{
					el = document.createElement(o.tag || 'div') ;
					for(var s in o){
						if(!!!(s in excludes)) {
							el.setAttribute(s, o[s]) ;
						}
					}
					if('html' in o) el.innerHTML = el.innerHTML + o['html'] ;
					if(!!o.children && o.children.length > 0 ) el = createChild(o, el) ;
					pdiv.appendChild(el) ;
				}
			}
			return pdiv ;
		})(obj, document.createElement('div')) ;
		
	}
	//statics
	Jade.cache = {} ;
	Jade.evalstr = '' ;
	Jade.esc = function(html){
		return String(html)
			.replace(/&(?!\w+;)/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
	}
	Jade.HTMLesc = function(html){
		return String(html)
			.replace(/(\/)/g, '/$1')
	}
	return Jade ;
})() ;
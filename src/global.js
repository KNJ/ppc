// 文字列から数字を抜き出す
String.prototype.number = function(i){
	if (i === null) {
		return this.match(/\d{1,}/g);
	}
	return Number(this.match(/\d{1,}/g)[i]);
};

// 数値にコンマを付ける
Number.prototype.comma = function(){
	return this.toString().replace(/([0-9]+?)(?=(?:[0-9]{3})+$)/g, '$1,');
};

// Cloz
var cloz = function(base, ex){
	base = base || {};
	var derived = {};
	var o = Object.create(base);

	derived.get = function(prop){
		if (typeof prop !== 'string') {
			throw new Error('The first argument of cloz.get() must be string.');
		}
		if (typeof o[prop] === 'undefined') {
			if (base.hasOwnProperty('get')) {
				return base.get.apply(this, arguments);
			}
			else {
				throw new Error('Cannot find property "' + prop + '"');
			}
		}
		else if (typeof o[prop] === 'function') {
			var args = [];
			for (var i = 1; i < arguments.length; i++) {
				args.push(arguments[i]);
			}
			return o[prop].apply(this, args);
		}
		else {
			return o[prop];
		}
	};
	derived.gain = function(prop, val){
		if (typeof prop !== 'string') {
			throw new Error('The first argument of cloz.gain() must be string');
		}
		if (typeof o[prop] === 'undefined') {
			if (base.hasOwnProperty('get')) {
				return base.gain.apply(this, arguments);
			}
			else {
				val = val || null;
				return val;
			}
		}
		else if (typeof o[prop] === 'function') {
			var args = [];
			for (var i = 2; i < arguments.length; i++) {
				args.push(arguments[i]);
			}
			return o[prop].apply(this, args);
		}
		else {
			return o[prop];
		}
	};
	derived.getAll = function(){
		return o;
	};
	derived.set = function(prop, val){
		if (typeof prop !== 'string') {
			throw new Error('The first argument of cloz.set() must be string');
		}
		o[prop] = val;
		return o[prop];
	};
	derived.extend = function(prop, obj){
		if (typeof prop !== 'string') {
			throw new Error('The first argument of cloz.extend() must be string');
		}
		o[prop] = cloz(this.get(prop), obj);
		return o[prop];
	};

	if (typeof ex === 'object' && ex !== null) {
		for (var p in ex) {
			derived.set(p, ex[p]);
		}
		if (ex.hasOwnProperty('__cloz')) {
			ex.__cloz();
		}
		if (ex.hasOwnProperty('_cloz')) {
			ex._cloz();
		}
		else {
			derived.gain('_cloz');
		}
	}
	else {
		derived.gain('_cloz');
	}

	return derived;
};

$.fn.extend({
	// HTMLの呼び出し
	appendHtml: function(page, func){
		var target = this;
		$.getJSON(ppc.uri.get('ajax') + '/page/' + page + '?callback=?', {}, function(data){
			$(data.html).appendTo(target);
			func();
		});
	},
	appendTab: function(text, anchor){
		return this.append($('<li>').prepend(($('<a>').attr('href', anchor)).prepend($('<span>').text(text))));
	}
});

var ppc = ppc || {};
var base = {};
var $ppc_result = $('<div>').attr('id', 'ppc_result');

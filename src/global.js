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

// カプセル化
var gs = function(base, ex){
	var derived = {};
	var o = Object.create(base);

	derived.get = function(prop){
		if (typeof o[prop] === 'undefined') {
			return base.get.apply(this, arguments);
		}
		else if (typeof o[prop] === 'function') {
			var arg = [];
			for (var i = 1; i < arguments.length; i++) {
				arg.push(arguments[i]);
			}

			return o[prop].apply(this, arg);
		}
		else {
			return o[prop];
		}
	};
	derived.getAll = function(){
		return o;
	};
	derived.set = function(prop, value){
		o[prop] = value;
		return o[prop];
	};

	if (typeof ex === 'object' && ex !== null) {
		for (var p in ex) {
			derived.set(p, ex[p]);
		}
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

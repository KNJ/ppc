// 方針
// input、select、およびtextareaでそれぞれ処理を分岐する
// inputはtypeによってさらに細かく処理を分岐する

var senbei;

(function($){

$.fn.extend({
	tag: function(){
		return this.get()[0].localName;
	},
	type: function(){
		return this.get()[0].type;
	},
});

senbei = function(configuration, conditions){

	// クッキーのデフォルト有効期限（1ヶ月）
	var exp = new Date();
	exp.setMonth(exp.getMonth() + 1);
	exp.toGMTString();

	// senbeiの核となるオブジェクト
	var o = {
		conf: {
			name: 'senbei',
			// 読み書き媒体（文字列または配列〉
			// 配列で複数指定した場合、
			// 読みでは、先に指定した媒体が優先され、空の場合は次に指定したものが読まれる
			// 書きでは、指定した媒体すべてに書き込む
			use: ['localStorage'],// 読み書き媒体
			read: null, // 読み込み（useより優先）
			write: null, // 書き込み (useより優先)
			cookie: {
				expires: exp,
				domain: null,
				path: null,
				secure: false,
			},
		},
	};

	// ユーザ設定で上書き
	$.extend(true, o.conf, configuration);

	// API（これから増やしていく？）
	// ストレージを抹消するAPI
	o.remove = function(storage){
		var exp = new Date();
		if (String(storage).toLowerCase() === 'localstorage') {
			localStorage.removeItem(o.conf.name);
		}
		else if (String(storage).toLowerCase() === 'cookie') {
			exp.setTime(0);
			writeCookie(o.conf.name, {}, {expires:exp});
		}
		else {
			localStorage.removeItem(o.conf.name);
			exp.setTime(0);
			writeCookie(o.conf.name, {}, {expires:exp});
		}
	};

	// ----- start reading -----

	var read = forceArray(o.conf.read), storage = null;

	// readが[null]（初期値）の場合
	if (read[0] === null && read.length === 1) {
		read = forceArray(o.conf.use);
	}

	$.each(read, function(i, v){

		if (String(v).toLowerCase() === 'localstorage') {
			storage = JSON.parse(localStorage.getItem(o.conf.name));
		}
		else if (String(v).toLowerCase() === 'cookie') {
			storage = readCookie(o.conf.name);
		}
		else if (v !== null) {
			storage = v;
		}

		if (storage !== null) {
			// storageに何かしらのデータがあればそれを採用して抜ける
			return false;
		}

	});

	storage = storage || {};

	// ----- end reading -----

	// ----- start restoring -----

	$.each(storage, function(k, v){

		var target = '.senbei[name=' + '"' + k + '"]';

		if (v.control === 'input' || v.control === 'textarea') {

			// radio or checkbox
			if (v.type === 'radio' || v.type === 'checkbox') {

				var values = forceArray(v.value);

				$.each(values, function(j, w){
					var spec =  target + '[value="' + w + '"]';
					$(spec).prop('checked', true);
				});

			}
			// the others
			else {
				$(target).val(v.value);
			}

		}
		// select
		else if (v.control === 'select') {

			$target = $(target).find('option').prop('selected', false);

			$.each(v.value, function(j, w){
				$target.filter('[value="' + w + '"]').prop('selected', true);
			});

		}

	});

	// ----- end restoring -----

	// senbeiクラスの付いた要素に変更が行われたとき
	$('.senbei').on('change', function(){

		// 変更が行われた要素
		var $self = $(this);

		var name = $self.attr('name');

		// 変更が行われた要素と同じnameをもつ要素群
		var $selves = $('[name="' + name + '"]');

		// strageに書き込み
		// ----- start writing -----

		var write = forceArray(o.conf.write);

		// writeが[null]（初期値）の場合
		if (write[0] === null && write.length === 1) {
			write = forceArray(o.conf.use);
		}

		storage[name] = {
			control: $self.tag(),
			type: $self.type(),
			value: getValue($self.tag(), $selves),
		};

		$.each(write, function(i, v){

			if (String(v).toLowerCase() === 'localstorage') {
				localStorage.setItem(o.conf.name, JSON.stringify(storage));
			}
			else if (String(v).toLowerCase() === 'cookie') {
				writeCookie(o.conf.name, storage, o.conf.cookie);
			}
			else if (v !== null) {
				v = storage;
			}

		});

		// ----- end writing -----

	});

	$.each(conditions, function(i, v){

		var w = $.extend({
			name: 'f' + i,
			base: null, // jQuery object
			conditions: function(){ return null; }, // Function returning String or Array
			connective: 'and',
			t: function(){ return null; },
			f: function(){ return null; },
			n: function(){ return null; },
			on: {},
		}, v);

		o[w.name] = function() {
			var bool = w.conditions(w.base);
			if (bool) {
				w.t(w.base);
			}
			else if (bool !== null || !bool) {
				w.f(w.base);
			}
			w.n(w.base);
		};

		o[w.name]();

		for (var k in w.on) {

			var values = forceArray(w.on[k]);

			for (var j in values) {
				if (values[j] === true) {
					w.base.on(k, o[w.name]);
				}
				else {
					$(values[j]).on(k, o[w.name]);
				}
			}

		}

	});

	return o;

	// value、チェックの入ったvalue(s)、または選択されているvalue(s)を取得
	function getValue(control, $selves){

		var type = $selves.type();
		var value = null;

		if (control === 'input' || control === 'textarea') {

			// radio or checkbox
			if (type === 'radio' || type === 'checkbox') {
				value = [];
				$selves.filter(':checked').each(function(){
					value.push($(this).val());
				});
			}
			// the others
			else {
				value = $selves.val();
			}

		}
		// select
		else if (control === 'select') {

			value = [];
			$selves.find('option').filter(':selected').each(function(){
				value.push($(this).val());
			});

		}

		return value;
	}

	function readCookie(name){
		var params = document.cookie.split(';');
		for (var i = 0; i < params.length; i++) {
			var kv = params[i].split('=');
			if (kv[0] === name) { return JSON.parse(decodeURIComponent(kv[1])); }
		}
		return null;
	}

	function writeCookie(name, value, options){
		value = JSON.stringify(value);
		value = encodeURIComponent(value);
		var cookie = name + '=' + value;
		if (options.expires) { cookie += '; expires=' + options.expires; }
		if (options.domain) { cookie += '; domain=' + options.domain; }
		if (options.path) { cookie += '; path=' + options.path; }
		if (options.secure) { cookie += '; secure'; }
		document.cookie = cookie;
	}

	function forceArray(val){
		if (Object.prototype.toString.call(val) !== '[object Array]') {
			return [val];
		}
		return val;
	}

};

})(jQuery);
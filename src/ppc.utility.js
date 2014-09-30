(function($){

// Utility (static)
ppc.utility = gs(base, {
	color: function(deviation){
		if(deviation <= 50){ return 'rgb(247,231,183)'; }
		else{
			return 'rgb(247,' + Math.ceil( 231 - (deviation - 50) * 2 ) + ',' + Math.ceil( 183 - (deviation - 50) * 2 ) + ')';
		}
	},
	tab: function(html1, html2, b){
		var h = '<div>' +
		'<div class="column-header"><div class="layout-cell"><h1 class="column-title">' + html1 + '</h1></div></div>' +
		'<div class="column-body' + (b ? ' adjusted' : '') + '">' + html2 + '</div>' +
		'</div>';
		return h;
	},
	rateWithLetter: function(n, a){
		var letters = ['S','A','B','C','D','E','F'],
			rating = '';
		$.each(a, function(i, v){
			rating = '<span class="letter letter' + letters[i] + '">' + letters[i] + '</span>';
			return (n < v);
		});
		return rating;
	},
	createArrayForTable: function(elem){
		var a = [['', (elem[0])[0]]];
		$.each(elem, function(i, value){
			if(i){
				a[0].push('/' + value[0]);
			}
		});
		var len1 = elem.length;
		for(var i=0; i < len1; i++){
			if(i){
				a.push([]);
				var len2 = len1 + 1;
				for(var j=0; j < len2; j++){
					if(!j){
						a[i].push((elem[i])[0]);
					}
					else if(j === 1){
						a[i].push(Number((elem[i])[1]) | 0);
					}
					else {
						a[i].push((ppc.math.get('div', elem[i][1], elem[j-1][1])).toFixed(2));
					}
				}
			}
		}
	return a;
	},
	createTableHtml: function(ary, bgColor, bool){
		var t = '<table>';
		$.each(ary, function(i, value1){
			if(!i){
				if (bool) {
					t += '<thead>';
					$.each(ary[i], function(j, value2){
						t += '<th>' + value2 + '</th>';
					});
					t += '</thead>';
				}
				t += '<tbody>';
			}else if(i % 2){
				t += '<tr>';
				$.each(ary[i], function(k, value3){
					t += '<td style="background:' + bgColor + ';">' + value3 + '</td>';
				});
				t += '</tr>';
			}else{
				t += '<tr>';
				$.each(ary[i], function(k, value3){
					t += '<td>' + value3 + '</td>';
				});
				t += '</tr>';
			}
		});
		t += '</table></tbody>';
		return t;
	},
	tags_num: function(total, self) {
		return total + '(' + ( total - self ) + ')';
	},
});

})(jQuery);

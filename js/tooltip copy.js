$(document).ready(function() {
	$('#test').tt({
		targetElm: 'test_tooltip',
		tipClass: 'tt_tip',
		align: 'center',
		verticalPosition: 'above'
	});
	$('#test_tooltip').hide();
});



 (function($) {
	//
	// plugin definition
	//
	$.fn.tt = function(options) {
		var doc = document.documentElement,
			body = doc.body;
		// build main options before element iteration
		var opts = $.extend({},$.fn.tt.defaults,options);
		return this.each(function() {
			// iterate and reformat each matched element
			var o = $.meta ? $.extend({},opts, $this.data()) : opts;
			var $this = $(this);
			var t_elm = $('#' + o.targetElm);
			$this.bind('mouseover',
			function(e) {
				//Create timer storage object if it does not exist.
				window._tt = window._tt ? window._tt: {};
				//Clear existing timeout functions
				clearTimeout(_tt.timer);

				//element position
				var pos = $this.position();
				//Element dimensions
				var elm_dim = {
					h: $this.outerHeight(),
					w: $this.outerWidth()
				};
				//Tooltip dimensions
				$(t_elm).addClass(o.tipClass);
				var ttDim = {
					h: t_elm.outerHeight(),
					w: t_elm.outerWidth()
				};
				//Current scroll position
				var scroll = scrollOffset();
				//Viewport dimensions
				var vp = vpDim();
				
				//Work out a modifier based on preferences
				var mod = {x:0, y:0};
				if (o.align === 'center') {
					mod.x = 0 + elm_dim.w/2 - ttDim.w/2;
				}
				if (o.verticalPosition === 'above') {
					mod.y = 0 - ttDim.h;
				}
				//Set element's position in relation to the page width
				var ttPos = {
					left: ((vp.x + scroll.x) - pos.left > ttDim.w) ? 
						pos.left + mod.x + 'px' :
						(pos.left - ttDim.w) + 'px',
					top: ((vp.y + scroll.y) - pos.top > ttDim.h) ?
						pos.top + mod.y + 'px' :
						pos.top - ttDim.h + 'px'
				};

				$(t_elm).css({
					position: 'absolute',
					left: ttPos.left,
					top: ttPos.top
				}).fadeIn(250);
			}).bind('mouseout', function(e) {
				_tt.timer = setTimeout(function() {
					hideTip(o, e);
				},
				o.timeOut);
			});
			//Bind mouseover and mouseout functions for the tooltip to the timer
			t_elm.bind('mouseover', function(e) {
				clearTimeout(_tt.timer);
			}).bind('mouseout', function(e) {
				_tt.timer = setTimeout(function() {
					hideTip(o, e);
				},
				o.timeOut);
			});
		});

		//This does the meat
		function hideTip(o, event) {
			$('#' + o.targetElm).fadeOut(250);
		}
	};

	//Get Viewport dimensions (x,y)
	function vpDim() {
		return {
			x: self.innerWidth || doc.clientWidth || (body ? body.clientWidth : 0),
			y: self.innerHeight || doc.clientHeight || (body ? body.clientHeight : 0)
		};
	}
	//Get scroll offset
	function scrollOffset() {
		return {
			x: self.pageXOffset || doc.scrollLeft || (body ? body.scrollLeft : 0),
			y: self.pageYOffset || doc.scrollTop || (body ? body.scrollTop : 0)
		};
	}

	//
	// private function for debugging
	//
	function cons(message) {
		if (window.console && window.console.log) {
			console.log(message);
		}
	};

	//
	// plugin defaults
	//
	$.fn.tt.defaults = {
		timeOut: 1000,
		tipClass: 'tt_tip'
	};
	//
	// end of closure
	//
})(jQuery);

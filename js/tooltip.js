(function($) {
	//
	// **Possible parameters:**
	//
	// _Event handler:_
	//
	// str showEvent		Defines the event that activates the tooltip.
	//							Possible values: mouseover, focus, click, dblclick, change etc.
	//							Default: "mouseover"
	// str hideEvent		Defines the event that hides the tooltip.
	//							Possible values: mouseout, blur, click, dblclick, change etc.
	//							Default: "mouseout"
	//
	// _CSS ids and classes:_
	//
	// str ttClass			Class for the tooltip for overriding and additional styling.
	//							Default: "tt_tip"
	// str activeClass	Class for the trigger element while tooltip is displayed.
	//							Default: "tt_active"
	// str ttIdPrefix 	Prefix for the element ID that identifies the tooltip ID.
	//							Example: element with id="test" looks for tooltip container with id="tt_test"
	//							Default: "tt_"
	//
	// _Positioning:_
	//
	// str align:			Preferred horizontal alignment of the tooltip. 
	//							Values: "absCenter", "center", "right", "left", "flushRight", and "flushLeft".
	//							Default: "flushLeft".
	// str vAlign:			Preferred vertical alignment of the tooltip.
	//							Values: "absCenter", "center", "above" and "below".
	//							Default: "above"
	// int windowMargin	The tooltip's minimum margin from the window's edge.
	//							Default: 5
	// int distanceX		The tooltip's horizontal distance from the trigger element.
	//							Not used if align is flushLeft, flushRight or centered.
	//							Default: 0	
	// int distanceY		The tooltip's vertical distance from the trigger element.
	//							Not used for if vAlign is centered.
	//							Default: 2
	// int nudgeX			Nudge along x axis. Use negative int to nudge left; positive int to nudge right.
	//							Default: 0
	// int nudgeY			Nudge along y axis. Use negative int to nudge up; positive int to nudge down.
	//							Default: 0
	//
	// _Timing:_
	//
	// int timeOut:		Time that tooltip is displayed after mouseout.
	//							Default: 1000
	// int delay			Delay before displaying tooltip.
	//							Default: 500
	// int fadeOut			Time it take for the tooltip to fade out.
	//							Default: 250
	// int fadeIn			Time it take for the tooltip to fade in.
	//							Default: 100
	//
	// _Styling:_
	//
	// obj css				Object with CSS rules, applied in addition to default styles.
	//							As with jQuery CSS, use JavaScript CSS syntax, or quote properties.
	//							Example: "css: {textAlign: 'left'}" or "css: {'text-align': 'left'}"
	//							Default: Empty.
	// bool zoom			Use a zoom effect to animate the tooltip from the dimensions 
	//							and point of origin of the target element.
	//							Special case: If target and tooltip are both images, the image will zoom as well
	//							Default: false
	
	var doc = document.documentElement,
		body = doc.body;
	$.fn.tt = function(options) {
		// build main options before element iteration
		var opts = $.extend({},$.fn.tt.defaults,options);
		return this.each(function() {
			// iterate and reformat each matched element
			var o = $.meta ? $.extend({},opts, $this.data()) : opts;
			var $this = $(this);
			
			//Storage object for cached positioning values
			$this.cache = {valid: false};
			
			//Support for tooltips on the title attribute
			//Either use the trigger element's title or the target element, if it exists.
			if ($this.attr('id').length === 0 || !($('#' + o.ttIdPrefix + $this.attr('id'))[0])) {
				o.useTitle = true;
				$this.ttTitle = $this.oldTitle = $this.attr('title');
				$this.attr('title', '');
				var $ttTooltip = $('<div/>').hide();
				
			} else {
				var $ttTooltip = $('#' + o.ttIdPrefix + $this.attr('id')).hide();
				var orgParent = $ttTooltip.parent();
			}
			//Set initial styles: Define standard styles if no custom class is set.
			var css = o.ttClass !== 'tt_tip' ? {position: 'absolute'} : {
				position: 'absolute',
				border: '1px solid #666',
				background: '#ffd',
				padding: '.5em',
				'-webkit-border-radius': '5px',
				'-webkit-box-shadow': '0 1px 3px rgba(0,0,0,.3)',
				'-moz-border-radius': '5px',
				'-moz-box-shadow': '0 1px 3px rgba(0,0,0,.3)'
			};
			//Extend with options css properties
			css = $.extend({},css,o.css);
			
			//Set initial styling and class names from options.
			$ttTooltip.addClass(o.ttClass).css(css);
			
			$this.bind(o.showEvent, delayShowTip);				
			
			//Bind mouseover and mouseout functions for the tooltip to the timer
			$ttTooltip.bind('mouseover', function(e) {
				clearTimeout($this.hideTimer);
				$ttTooltip.bind(o.hideEvent, hideTip);			
			});
			
			//
			// private functions
			//
			
			//A wrapper for the showTip function in order to enable delaying it.
			function delayShowTip() {
				$this.delayTimer = setTimeout(showTip, o.delay);
				$this.bind(o.hideEvent, hideTip);
			}
			
			//Hide the Tooltip and do some cleanup.
			function hideTip() {				
				clearTimeout($this.delayTimer);
				clearTimeout($this.hideTimer);
				$this.hideTimer = setTimeout(function() {
					//Don't hide tooltips that contain nested tooltips - wait for child element's activeClass to go away.
					if ($ttTooltip.find('.' + o.activeClass)[0]) {					
						hideTip();
						return;
					}					
					$this.removeClass(o.activeClass);
					$ttTooltip.fadeOut(o.fadeOut, function(){
						$ttTooltip.removeClass(o.ttClass);
						$(window).unbind('scroll').unbind('resize');
						
						//Cleanup: Put that content back where you found it!
						if (orgParent){
							$ttTooltip.appendTo(orgParent);
						}
						if ($this.oldTitle) {
							$this.attr('title', $this.oldTitle);
						}
					});
				},
				o.timeOut);
			}
			
			function showTip() {
				//If we use the target element's title, build the content.
				if (o.useTitle) {
					if ($this.ttTitle.length === 0) return;
					$this.ttTitle = $this.ttTitle.replace(/\*\*([^*]*)\*\*/g, '<strong class="highlight">$1</strong>');
					$this.ttTitle = $this.ttTitle.replace(/\*_\*([^*]*)\*_\*/g, '<strong class="example">$1</strong>');
					var parts = $this.ttTitle.split(' - ');
					for (var i=0; i < parts.length; i++) {
						var elm = i === 0 ? 'h3' : 'p';
						parts[i] = '<' + elm + '>' + parts[i] + '</' + elm + '>';
					};
					$ttTooltip.html(parts.join(''));
					$this.attr('title', '');
				}
				//Move the tooltip to the dom target element
				$ttTooltip.appendTo('body');
				
				calculatePositions();
				
				//Get target dimensions and position of the tooltip
				var tipPosition = positionTip();

				$this.addClass(o.activeClass);
				//Zoom!
				if (o.zoom) {
					//Set initial dimensions and position to be equal to the target element's
					$ttTooltip.css({
						position: 'absolute',
						opacity: 0,
						left: $this.cache.elmOffset.left,
						top: $this.cache.elmOffset.top,
						width: $this.cache.elmDim.w,
						height: $this.cache.elmDim.h
					});
					//Set the endpoint of the animation by extending the target dimensions
					var endState = $.extend({}, tipPosition, {
						width: $this.cache.ttInnerDim.w + 1, 
						height: $this.cache.ttInnerDim.h + 1,
						opacity: 1
					});
					//Experimental: Zoom image dimensions if both tooltip and target element is an image.
					if ($this.nodeName === 'IMG' && $ttTooltip.nodeName === 'IMG') {
						$ttTooltip.css({
							width: $this.cache.elmDim.w,
							height: $this.cache.elmDim.h
						}).animate({
							width: $(this).width(), //.attr('width'),
							height: $(this).height() //.attr('height')
						}, o.fadeIn);
					}
					
					//Temporarily unbind events
					$ttTooltip.unbind(o.hideEvent);
					$this.unbind(o.showEvent)
						.unbind(o.hideEvent);
					$ttTooltip.addClass(o.ttClass)
						.animate(endState, o.fadeIn, function() {
							//We're done animating. Rebind events.
							$ttTooltip.bind(o.hideEvent, hideTip);
							//we only need to bind the showEvent. The hideEvent is bound on show.
							$this.bind(o.showEvent, delayShowTip);
						}
					);
				} else {
					$ttTooltip.addClass(o.ttClass).css(tipPosition).fadeIn(o.fadeIn);
				}
				$(window).bind('scroll', function () {
					$ttTooltip.css(positionTip());
				}).bind('resize', function(){					
					$this.cache.valid = false;
					$ttTooltip.css(positionTip());
				});
			}
			function calculatePositions() {
				//If the cache has not been invalidated, don't do anything.
				if ($this.cache.valid) return;
				
				//Element offset - distance from page top/left
				$this.cache.elmOffset = $this.offset();				
				
				//Element dimensions
				$this.cache.elmDim = {
					w: $this.outerWidth(),
					h: $this.outerHeight()
				};
				
				//Tooltip dimensions
				$this.cache.ttDim = {
					w: $ttTooltip.outerWidth(),
					h: $ttTooltip.outerHeight()
				};
				//Inner dimensions of the tooltip for use in zooming.
				$this.cache.ttInnerDim = {
					w: $ttTooltip.width(),
					h: $ttTooltip.height()
				};
				
				//Viewport dimensions
				//TODO: Global.
				$this.cache.vp = {
					w: $(window).width(),
					h: $(window).height()
				};
				$this.cache.valid = true;
			}
			function positionTip() {
				calculatePositions();
				//Save as copy of the original preferences.
				var align = {
					vert: o.vAlign,
					hor: o.align
				};
				
				//Scroll position
				var scroll = {
					left: $(body).scrollLeft(),
					top: $(body).scrollTop()
				};
				
				//All the possible positions for the tooltip
				var pos = {
					top: {
						above: $this.cache.elmOffset.top - $this.cache.ttDim.h - o.distanceY + o.nudgeY, 
						below: $this.cache.elmOffset.top + $this.cache.elmDim.h + o.distanceY + o.nudgeY, 
						center: $this.cache.elmOffset.top - $this.cache.ttDim.h/2 + $this.cache.elmDim.h/2,
						flushTop: $this.cache.elmOffset.top,
						flushBottom: $this.cache.elmOffset.top + $this.cache.elmDim.h + $this.cache.ttDim.h,
						absTop: scroll.top  + o.windowMargin,
						absBottom: $this.cache.vp.h + scroll.top - $this.cache.ttDim.h - o.windowMargin,
						absCenter: scroll.top + $this.cache.vp.h/2 - $this.cache.ttDim.h/2
					},
					left: {
						left: $this.cache.elmOffset.left - $this.cache.ttDim.w - o.distanceX + o.nudgeX, 
						right: $this.cache.elmOffset.left + $this.cache.elmDim.w + o.distanceX + o.nudgeX, 
						center: $this.cache.elmOffset.left - $this.cache.ttDim.w/2 + $this.cache.elmDim.w/2, 
						flushLeft: $this.cache.elmOffset.left, 
						flushRight: $this.cache.elmOffset.left + $this.cache.elmDim.w - $this.cache.ttDim.w,
						absLeft: scroll.left + o.windowMargin,
						absRight: $this.cache.vp.w - $this.cache.ttDim.w - o.windowMargin,
						absCenter: scroll.left + $this.cache.vp.w/2 - $this.cache.ttDim.w/2
					}
				};
				
				//Booleans for whether there is space for the tooltip in a variety of positions.
				//Compares tooltip offset to the absolute top/left position keeping tooltip on-screen
				var space = {
					above: pos.top[align.vert] < pos.top.absTop ? false : true,
					below: pos.top[align.vert] > pos.top.absBottom ? false : true,
					left: pos.left[align.hor] < pos.left.absLeft ? false : true,
					right: pos.left[align.hor] > pos.left.absRight ? false : true
				};
				//Move the tooltip around if there isn't space in the current position.
				if ($this.cache.vp.h < $this.cache.ttDim.h) align.vert = 'absTop';
				else if (!space.above && !space.below && align.vert == 'below') align.vert = 'absBottom';
				else if ((align.vert === 'above' || align.vert === 'center') && !space.above) align.vert = 'absTop';
				else if ((align.vert === 'below' || align.vert === 'center') && !space.below) align.vert = 'absBottom';
				if (!space.left && !space.right) align.hor = 'absLeft';
				else if ((align.hor === 'right' || align.hor === 'flushLeft' || align.hor === 'center') && !space.right) align.hor = 'absRight';
				else if ((align.hor === 'left' || align.hor === 'flushRight' || align.hor === 'center') && !space.left) align.hor = 'absLeft';
				return {
					left: pos.left[align.hor],
					top: pos.top[align.vert]
				};
			}
		});
	};
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
		showEvent: 'mouseover',
		hideEvent: 'mouseout',
		align: 'flushLeft',
		vAlign: 'above',
		windowMargin: 5,
		distanceX: 2,
		distanceY: 2,
		nudgeX: 0,
		nudgeY: 0,
		ttClass: 'tt_tip',
		activeClass: 'tt_active',
		ttIdPrefix: 'tt_',
		timeOut: 1000,
		delay: 250,
		fadeIn: 100,
		fadeOut: 250,
		zoom: false
	};
	//
	// end of closure
	//
})(jQuery);

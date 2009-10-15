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
	// int timeOut		Time that tooltip is displayed after mouseout.
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
	$.fn.tt = function(options) {
		// build main options before element iteration
		var opts = $.extend({},$.fn.tt.defaults,options);
		return this.each(function() {
			var $this = $(this),
				$ttTooltip,
				// Support for the meta plugin
				o = $.meta ? $.extend({},opts, $this.data()) : opts,
				// Styling
				css = o.ttClass !== 'tt_tip' ? {position: 'absolute', zIndex: '1000'} : {
					position: 'absolute',
					zIndex: '1000',
					font: '11px "lucida grande", tahoma, helvetica, arial, sans-serif',
					border: '1px solid #666',
					background: '#ffd',
					padding: '.5em',
					'-webkit-border-radius': '5px',
					'-webkit-box-shadow': '0 6px 15px rgba(0,0,0,.6)',
					'-moz-border-radius': '5px',
					'-moz-box-shadow': '0 6px 15px rgba(0,0,0,.6)'
				};
			//Storage object for cached positioning values
			$this.cache = {valid: false};
			$this.isOn = false;
			$this.jqID = $.data($this);
			//Support for tooltips on the title attribute
			//Either use the trigger element's title attr or the target element, if it exists.
			if ($this.attr('id').length === 0 || !($('#' + o.ttIdPrefix + $this.attr('id'))[0])) {
				if (!($this.attr('title')) || $this.attr('title').length === 0) return;
				$this.ttTitle = $this.oldTitle = $this.attr('title');
				$this.attr('title', '');			
				$ttTooltip = $('<div/>').hide();
			} else {
				$ttTooltip = $('#' + o.ttIdPrefix + $this.attr('id')).hide();
				//Marker for the initial position of the tooltip, so we can replace it on hide.
				var orgPos = $('<i id="org_' + $.data($this) + '"/>').insertAfter($ttTooltip).hide();
			}
			//Extend with options css properties
			css = $.extend({},css,o.css);
			$ttTooltip.tooltips = {};
			//Set initial styling and class names from options.
			$ttTooltip.addClass(o.ttClass).css(css);
			$this.bind(o.showEvent, delayShowTip);
			//Make sure that we do not hide the tooltip when the mouse is over it.
			$ttTooltip.bind('mouseover', function(e) {
				clearTimers();			
				$ttTooltip.one(o.hideEvent, hideTip);
			});
			if (o.visibleOnScroll) {
				//On scroll, recalculate position so we don't go offsreen.
				$(window).bind('scroll', function () {
					//Don't do anything if the tooltip is not on!
					if (!($this.isOn)) return;
					$ttTooltip.css(getTooltipPosition());
				});
			}
			//On resize, kill cached position data and recalculate.
			$(window).bind('resize', function(){
				$this.cache.valid = false;
				//Don't reposition if tooltip isn't on!
					if (!($this.isOn)) return;
						$ttTooltip.css(getTooltipPosition());
			});
			//
			// private functions
			//
			//A wrapper for the showTip function in order to enable delaying it.
			function delayShowTip() {
				clearTimers();				
				$this.delayTimer = setTimeout(showTip, o.delay);
				$this.one(o.hideEvent, hideTip);
				callbackFn('beforeshow');
			}
			//Hide the Tooltip and do some cleanup.
			function hideTip() {
				clearTimers();			
				$this.willHide = true;
				$this.hideTimer = setTimeout(function() {
					//Don't hide tooltips that contain nested tooltips - wait for nested tooltips to go away
					for (i in $ttTooltip.tooltips) {
						$($ttTooltip.tooltips[i]).bind('hide', function() {
							if ($this.willHide) hideTip();
						});
						if ($ttTooltip.tooltips[i].isOn) return;
					}					
					$this.removeClass(o.activeClass);
					$ttTooltip.fadeOut(o.fadeOut, function(){
						$this.trigger('hide');
						$this.isOn = false;
						//Cleanup: Put that content back where you found it!
						if ($this.ttTitle) $ttTooltip.html('');
						if (orgPos){
							$ttTooltip.insertBefore(orgPos);
						}
						callbackFn('onhide');
					});
				},
				o.timeOut);
			}
			function clearTimers() {
				clearTimeout($this.delayTimer);
				clearTimeout($this.hideTimer);
				$this.willHide = false;
			};
			function showTip() {
				//Register the tooltip w/unique ID:
				$.fn.tt.tooltips[$.data($ttTooltip)] = $ttTooltip;
				$this.parents().each(function() {
					for(i in $.fn.tt.tooltips) {
						//if the parent is in the tooltip registry...
						if (this === $.fn.tt.tooltips[i][0]) {
							//register this as a nested tooltip of the parent
							$.fn.tt.tooltips[i].tooltips[$this.jqID] = $this;
						}
					}
				});
				//Move the tooltip to body to avoid issues with position and overflow CSS settings on the page.
				$ttTooltip.appendTo('body');
				$this.addClass(o.activeClass);
				$this.isOn = true;
				if ($this.ttTitle) $ttTooltip.html('<p>' + $this.ttTitle + '</p>');
				$ttTooltip.addClass(o.ttClass).css(getTooltipPosition()).fadeIn(o.fadeIn, function() {
					callbackFn('onshow');
				});			
			}
			function updateCache() {
				if ($this.cache.valid) return;
				$this.cache = {
					elmOffset: $this.offset(),
					elmDim: {
						w: $this.outerWidth(),
						h: $this.outerHeight()
					},
					ttDim: {
						w: $ttTooltip.outerWidth(),
						h: $ttTooltip.outerHeight()
					},
					ttInnerDim: {
						w: $ttTooltip.width(),
						h: $ttTooltip.height()
					},
					vp: {
						w: $(window).width(),
						h: $(window).height()
					},
					valid: true
				};
			}
			function getTooltipPosition() {
				updateCache();
				//Save as copy of the original preferences.
				var align = {
					vert: o.vAlign,
					hor: o.align
				},
				scroll = { //Scroll position
					left: $(document.documentElement.body).scrollLeft(),
					top: $(document.documentElement.body).scrollTop()
				},
				pos = { //All the possible positions for the tooltip
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
						absRight: $this.cache.vp.w + scroll.left - $this.cache.ttDim.w - o.windowMargin,
						absCenter: scroll.left + $this.cache.vp.w/2 - $this.cache.ttDim.w/2
					}
				},
				space = { //Booleans for whether there is space for the tooltip in a variety of positions.
					//Compares tooltip offset to the absolute top/left position keeping tooltip on-screen
					above: pos.top[align.vert] < pos.top.absTop ? false : true,
					below: pos.top[align.vert] > pos.top.absBottom ? false : true,
					left: pos.left[align.hor] < pos.left.absLeft ? false : true,
					right: pos.left[align.hor] > pos.left.absRight ? false : true
				};
				//Move the tooltip around if there isn't space in the current position.
				if ($this.cache.vp.h < $this.cache.ttDim.h) align.vert = 'absTop';
				else if (!space.above && !space.below && align.vert == 'below') {
					align.vert = 'absBottom';			
				} else if ((/^above|flushBottom|center$/i).test(align.vert) && !space.above) {
					align.vert = 'absTop';
				} else if ((/^below|flushTop|center$/i).test(align.vert) && !space.below) {
					align.vert = 'absBottom';
				}
				if (!space.left && !space.right) {
					align.hor = 'absLeft';
				} else if ((/^right|flushLeft|center$/i).test(align.hor) && !space.right) {
					align.hor = 'absRight';
				} else if ((/^left|flushRight|center$/i).test(align.hor) && !space.left) {
					align.hor = 'absLeft';
				}
				return {
					left: pos.left[align.hor],
					top: pos.top[align.vert]
				};
			}
			function callbackFn (name) {
				if (!o[name]) return;
				o[name]({
					elm: $this,
					tt: $ttTooltip,
					opt: o
				});
			}
			//Public destroy method which unbinds all events and tidies up if we used the title attribute.
			$this.ttDestroy = function() {
				$ttTooltip.unbind(o.hideEvent, hideTip);
				$this.unbind(o.showEvent, delayShowTip).unbind(o.hideEvent, hideTip);
				if ($this.ttTitle) {
					$ttTooltip.remove();
					$this.attr('title', $this.ttTitle);
				}
			};
		});
	};
	//
	// storage object for managing nested tooltips
	//
	$.fn.tt.tooltips = {};
	//
	// plugin defaults
	//
	$.fn.tt.defaults = {
		showEvent: 'mouseover',
		hideEvent: 'mouseout',
		align: 'flushLeft',
		vAlign: 'above',
		visibleOnScroll: true,
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

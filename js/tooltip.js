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
			$this.jqID = $.data($this),
			ttId = '#' + o.ttIdPrefix + $this.attr('id');
			//Support for tooltips on the title attribute
			//Either use the trigger element's title attr or the target element, if it exists.
			if (!o.get && ($this.attr('id').length === 0 || !($(ttId)[0]))) {			
				if (!($this.attr('title')) || $this.attr('title').length === 0) return;
				$this.ttTitle = $this.oldTitle = $this.attr('title');
				$this.attr('title', '');
				$ttTooltip = $('<div/>').hide();
			} else if (o.get) {
				$ttTooltip = $('<div>Loading...</div>').hide();				
			} else {
				$ttTooltip = $(ttId).hide();
				//Marker for the initial position of the tooltip, so we can replace it on hide.
				var orgPos = $('<i id="org_' + $this.jqId + '" style="display:none!important"/>').insertAfter($ttTooltip).hide();
			}
			//Extend with options css properties
			css = $.extend({},css,o.css);
			$ttTooltip.tooltips = {};
			//Set initial styling and class names from options.
			$ttTooltip.addClass(o.ttClass).css(css);
			$this.bind(o.showEvent, delayShowTip);
			//Make sure that we do not hide the tooltip when the mouse is over it.
			if (o.hideEvent === 'mouseout') {
				$ttTooltip.bind('mouseover', function(e) {
					clearTimers();
					$ttTooltip.one(o.hideEvent, hideTip);
				});
			}
			if (o.visibleOnScroll) {
				//On scroll, reposition tooltip so we don't go offsreen.
				$(window).bind('scroll', repositionTooltip);
			}
			//On resize, invalidate cached positionining data and reposition.
			$(window).bind('resize', function(){
				repositionTooltip(true);			
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
			function showTip() {
				//Register the tooltip w/unique ID:
				$.fn.tt.tooltips[$.data($ttTooltip)] = $ttTooltip;
				$this.parents().each(function() {
					for(i in $.fn.tt.tooltips) {
						//if the parent is in the tooltip registry...
						if (this === $.fn.tt.tooltips[i][0]) {
							//...register this as a nested tooltip of the parent
							$.fn.tt.tooltips[i].tooltips[$this.jqID] = $this;
						}
					}
				});
				//Move the tooltip to body to avoid issues with position and overflow CSS settings on the page.
				$ttTooltip.appendTo('body');
				$this.addClass(o.activeClass);
				$this.isOn = true;
				if ($this.ttTitle) $ttTooltip.html('<p>' + $this.ttTitle + '</p>');
				if (o.get) {
					if ($this.ttCont) $ttTooltip.html($this.ttCont);
					else {
						$.ajax({
							url: o.get,
							success: function(data) {
								$this.ttCont = data;
								$ttTooltip.html(data);
								repositionTooltip(true);							
							},
							error: function(req, status, err) {
								$ttTooltip.html(o.getError || 'Sorry, no luck!');
							}
						});
					}
				}
				$ttTooltip.addClass(o.ttClass).css(getTooltipPosition()).fadeIn(o.fadeIn, function() {
					callbackFn('onshow');
				});
			}
			//Hide the Tooltip and do some cleanup.
			function hideTip() {
				clearTimers();
				$this.hideIntent = true;
				$this.hideTimer = setTimeout(function() {
					//Don't hide tooltips that contain nested tooltips - wait for nested tooltips to go away
					for (i in $ttTooltip.tooltips) {
						$($ttTooltip.tooltips[i]).bind('hide', function() {
							if ($this.hideIntent) hideTip();
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
				$this.hideIntent = false;
			}
			function repositionTooltip(invalidateCache) {
				if (invalidateCache) $this.cache.valid = false;
				//Don't reposition if tooltip isn't on.
				if (!($this.isOn)) return;
				$ttTooltip.css(getTooltipPosition());
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
				var cache = $this.cache,
				align = {
					vert: o.vAlign,
					hor: o.align
				},
				scroll = { //Scroll position
					left: $(document.documentElement.body).scrollLeft(),
					top: $(document.documentElement.body).scrollTop()
				},
				pos = { //All the possible positions for the tooltip
					top: {
						above: cache.elmOffset.top - cache.ttDim.h - o.distanceY + o.nudgeY,
						below: cache.elmOffset.top + cache.elmDim.h + o.distanceY + o.nudgeY,
						center: cache.elmOffset.top - cache.ttDim.h/2 + cache.elmDim.h/2,
						flushTop: cache.elmOffset.top,
						flushBottom: cache.elmOffset.top + cache.elmDim.h + cache.ttDim.h,
						absTop: scroll.top  + o.windowMargin,
						absBottom: cache.vp.h + scroll.top - cache.ttDim.h - o.windowMargin,
						absCenter: scroll.top + cache.vp.h/2 - cache.ttDim.h/2
					},
					left: {
						left: cache.elmOffset.left - cache.ttDim.w - o.distanceX + o.nudgeX,
						right: cache.elmOffset.left + cache.elmDim.w + o.distanceX + o.nudgeX,
						center: cache.elmOffset.left - cache.ttDim.w/2 + cache.elmDim.w/2,
						flushLeft: cache.elmOffset.left,
						flushRight: cache.elmOffset.left + cache.elmDim.w - cache.ttDim.w,
						absLeft: scroll.left + o.windowMargin,
						absRight: cache.vp.w + scroll.left - cache.ttDim.w - o.windowMargin,
						absCenter: scroll.left + cache.vp.w/2 - cache.ttDim.w/2
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
				if (cache.vp.h < cache.ttDim.h) align.vert = 'absTop';
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
		fadeOut: 250
	};
	//
	// end of closure
	//
})(jQuery);

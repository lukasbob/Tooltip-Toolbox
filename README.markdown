#Tooltip-Toolkit

This is a tooltip plugin for jQuery that aspires to come out as a fully fledged, non-modal overlay solution. 

A demonstration is available at http://tooltip-toolbox.lukasbob.com, which shows capabilites spanning from a lowly tooltip to full, nested dropdown menus.

We're part-way there, providing support for a range of positioning options, and with support for nested tooltips.

Usage is straight-forward: 
    
    HTML:
    <p title="My title">This element has a title</p>
    
    JavaScript:
    $('[title]').tt();

This gives you a straight-forward tooltip, using the element's title attribute.

##Features:

* Never disappears offscreen - knows where the edges are and repositions intelligently
* Support for nested tooltips, allowing for many applications and great versatility
* Full positioning control
* Full control over timing

##Usage

		$(selector).tt(options);

##Options

Options defaults:

		{
			showEvent: 'mouseover', //Event that triggers display of tooltip
			hideEvent: 'mouseout', //Event that triggers hiding the tooltip
			align: 'flushLeft', //Horizontal positioning
			vAlign: 'above', //Vertical positioning
			visibleOnScroll: true, //Keep tooltip on-screen
			windowMargin: 5, //Tooltip margin to viewport edge
			distanceX: 2, //Horizontal distance between tooltip and trigger element
			distanceY: 2, //Vertical distance between tooltip and trigger element
			nudgeX: 0, //Nudge position along x axis
			nudgeY: 0, //Nudge position along y axis
			ttClass: 'tt_tip', //Class to apply to the tooltip for custom styling
			activeClass: 'tt_active', //Class applied to trigger element when tooltip is displayed.
			ttIdPrefix: 'tt_', //Correlates ids of trigger element and tooltip element - id="example" searches for id="tt_example"
			timeOut: 1000, //Time between hideEvent and the tooltip is hidden
			delay: 250, //Time between showEvent and tooltip is displayed.
			fadeIn: 100, //Time it takes for the tooltip to fade in.
			fadeOut: 250, //Time it takes for the tooltip to fade out.
			zoom: false //Use zoom effect to show tooltip
		};

###Positioning options:

* `align` -  Horizontal positioning:
	* `left` - to the left of the target element
	* `right` - to the right of the target element
	* `flushLeft` - The left edge of the tooltip is flush with the left edge of the target element
	* `flushRight` - The right edge of the tooltip is flush with the right edge of the target element
	* `center` - horizontally centered with the target element
	* `absCenter` - centered on screen
* `vAlign` - Vertical positioning:
	* `above` - above the target element
	* `below` - below the target element
	* `flushTop` - the top edge of the tooltip is vertically aligned with the top edge of the target element
	* `flushBottom` - the bottom edge of the tooltip is aligned with the bottom edge of the target element
	* `center` - vertically aligned with the target element	
	* `absCenter` - centered on screen
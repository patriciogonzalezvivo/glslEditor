/*
 * Original code from: https://twitter.com/blurspline / https://github.com/zz85
 * See post @ http://www.lab4games.net/zz85/blog/2014/11/15/resizing-moving-snapping-windows-with-js-css/
 */

import { subscribeMixin } from './mixin';

// Thresholds
var FULLSCREEN_MARGINS = -30;
var MARGINS = 10;

function setBounds(element, x, y, w, h) {
    element.style.left = x + 'px';
    element.style.top = y + 'px';
    element.style.width = w + 'px';
    element.style.height = h + 'px';
}

export function subscribeInteractiveDom (dom, options) {
    subscribeMixin(dom);

    options = options || {};
    options.resize = options.resize !== undefined ? options.resize : false;
    options.move = options.move !== undefined ? options.move : false;
    options.snap = options.snap !== undefined ? options.snap : false;

    // Minimum resizable area
    var minWidth = 100;
    var minHeight = 100;

    // End of what's configurable.
    var clicked = null;
    var onRightEdge, onBottomEdge, onLeftEdge, onTopEdge;

    var rightScreenEdge, bottomScreenEdge;

    var preSnapped;

    var b, x, y;

    var redraw = false;

    var ghostdom = document.createElement('div');
    ghostdom.className = 'ghostdom';

    if (options.snap) {
        dom.parentElement.appendChild(ghostdom);
    }

    // Mouse events
    dom.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    // Touch events
    dom.addEventListener('touchstart', onTouchDown, { passive: false });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: false });

    function hintHide() {
        setBounds(ghostdom, b.left, b.top, b.width, b.height);
        ghostdom.style.opacity = 0;
    }

    function onTouchDown (event) {
        event.preventDefault();
        event.stopPropagation();
        if (event.touches.length === 1) {
            onDown(event.changedTouches[0]);
        }
    }

    function onTouchMove (event) {
        event.preventDefault();
        event.stopPropagation();
        if (event.touches.length === 1) {
            onMove(event.changedTouches[0]);
        }
    }

    function onTouchEnd (event) {
        event.preventDefault();
        event.stopPropagation();
        if (event.touches.length === 0) {
            onUp(event.changedTouches[0]);
        }
    }

    function onMouseDown (event) {
        event.preventDefault();
        event.stopPropagation();
        onDown(event);
    }

    function onMouseMove (event) {
        event.preventDefault();
        event.stopPropagation();
        onMove(event);
    }

    function onMouseUp (event) {
        event.preventDefault();
        event.stopPropagation();
        onUp(event);
    }

    function onDown (event) {
        calc(event);
        var isResizing = options.resize && (onRightEdge || onBottomEdge || onTopEdge || onLeftEdge);
        clicked = {
            x: x,
            y: y,
            cx: event.clientX,
            cy: event.clientY,
            w: b.width,
            h: b.height,
            isResizing: isResizing,
            isMoving: !isResizing && canMove(),
            onTopEdge: onTopEdge,
            onLeftEdge: onLeftEdge,
            onRightEdge: onRightEdge,
            onBottomEdge: onBottomEdge
        };
    }

    function canMove() {
        return options.move && (x > 0 && x < b.width && y > 0 && y < b.height);// && y < 30;
    }

    function calc (event) {
        b = dom.getBoundingClientRect();
        x = event.clientX - b.left;
        y = event.clientY - b.top;

        onTopEdge = y < MARGINS;
        onLeftEdge = x < MARGINS;
        onRightEdge = x >= b.width - MARGINS;
        onBottomEdge = y >= b.height - MARGINS;

        rightScreenEdge = window.innerWidth - MARGINS;
        bottomScreenEdge = window.innerHeight - MARGINS;
    }

    var e;

    function onMove(event) {
        calc(event);
        e = event;
        redraw = true;
    }

    function animate() {
        requestAnimationFrame(animate);

        if (!redraw) {
            return;
        }
        redraw = false;

        if (clicked && clicked.isResizing) {
            if (clicked.onRightEdge) {
                dom.style.width = Math.max(x, minWidth) + 'px';
            }
            if (clicked.onBottomEdge) {
                dom.style.height = Math.max(y, minHeight) + 'px';
            }

            if (clicked.onLeftEdge) {
                var currentWidth = Math.max(clicked.cx - e.clientX + clicked.w, minWidth);
                if (currentWidth > minWidth) {
                    dom.style.width = currentWidth + 'px';
                    dom.style.removeProperty('right');
                    dom.style.left = e.clientX + 'px';
                }
            }

            if (clicked.onTopEdge) {
                var currentHeight = Math.max(clicked.cy - e.clientY + clicked.h, minHeight);
                if (currentHeight > minHeight) {
                    dom.style.height = currentHeight + 'px';
                    dom.style.removeProperty('bottom');
                    dom.style.top = e.clientY + 'px';
                }
            }

            hintHide();
            dom.trigger('resize', { finish: false, el: dom });
            return;
        }

        if (clicked && clicked.isMoving) {
            if (options.snap) {
                if (b.top < FULLSCREEN_MARGINS || b.left < FULLSCREEN_MARGINS || b.right > window.innerWidth - FULLSCREEN_MARGINS || b.bottom > window.innerHeight - FULLSCREEN_MARGINS) {
                    setBounds(ghostdom, 0, 0, window.innerWidth, window.innerHeight);
                    ghostdom.style.opacity = 0.2;
                }
                else if (b.top < MARGINS) {
                    setBounds(ghostdom, 0, 0, window.innerWidth, window.innerHeight / 2);
                    ghostdom.style.opacity = 0.2;
                }
                else if (b.left < MARGINS) {
                    setBounds(ghostdom, 0, 0, window.innerWidth / 2, window.innerHeight);
                    ghostdom.style.opacity = 0.2;
                }
                else if (b.right > rightScreenEdge) {
                    setBounds(ghostdom, window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight);
                    ghostdom.style.opacity = 0.2;
                }
                else if (b.bottom > bottomScreenEdge) {
                    setBounds(ghostdom, 0, window.innerHeight / 2, window.innerWidth, window.innerWidth / 2);
                    ghostdom.style.opacity = 0.2;
                }
                else {
                    hintHide();
                }

                if (preSnapped) {
                    setBounds(dom,
                        e.clientX - preSnapped.width / 2,
                        e.clientY - Math.min(clicked.y, preSnapped.height),
                        preSnapped.width,
                        preSnapped.height);
                    return;
                }

                // moving
                dom.style.removeProperty('right');
                dom.style.removeProperty('bottom');
                dom.style.top = (e.clientY - clicked.y) + 'px';
                dom.style.left = (e.clientX - clicked.x) + 'px';
            }
            else {
                let x = (e.clientX - clicked.x);
                let y = (e.clientY - clicked.y);

                if (x < 0) {
                    x = 0;
                }
                else if (y < 0) {
                    y = 0;
                }
                else if (x + dom.offsetWidth > window.innerWidth) {
                    x = window.innerWidth - dom.offsetWidth;
                }
                else if (y + dom.offsetHeight > window.innerHeight) {
                    y = window.innerHeight - dom.offsetHeight;
                }

                dom.style.removeProperty('right');
                dom.style.removeProperty('bottom');
                dom.style.left = x + 'px';
                dom.style.top = y + 'px';
            }

            dom.trigger('move', { finish: false, el: dom });
            return;
        }
        // This code executes when mouse moves without clicking

        // style cursor
        if (options.resize && (onRightEdge && onBottomEdge || onLeftEdge && onTopEdge)) {
            dom.style.cursor = 'nwse-resize';
        }
        else if (options.resize && (onRightEdge && onTopEdge || onBottomEdge && onLeftEdge)) {
            dom.style.cursor = 'nesw-resize';
        }
        else if (options.resize && (onRightEdge || onLeftEdge)) {
            dom.style.cursor = 'ew-resize';
        }
        else if (options.resize && (onBottomEdge || onTopEdge)) {
            dom.style.cursor = 'ns-resize';
        }
        else if (canMove()) {
            dom.style.cursor = 'move';
        }
        else {
            dom.style.cursor = 'default';
        }
    }
    animate();

    function onUp(e) {
        calc(e);

        if (clicked && clicked.isResizing) {
            dom.trigger('resize', { finish: true, el: dom });
        }

        if (options.snap && clicked && clicked.isMoving) {
            // Snap
            var snapped = {
                width: b.width,
                height: b.height
            };

            if (b.top < FULLSCREEN_MARGINS || b.left < FULLSCREEN_MARGINS || b.right > window.innerWidth - FULLSCREEN_MARGINS || b.bottom > window.innerHeight - FULLSCREEN_MARGINS) {
                setBounds(dom, 0, 0, window.innerWidth, window.innerHeight);
                preSnapped = snapped;
            }
            else if (b.top < MARGINS) {
                setBounds(dom, 0, 0, window.innerWidth, window.innerHeight / 2);
                preSnapped = snapped;
            }
            else if (b.left < MARGINS) {
                setBounds(dom, 0, 0, window.innerWidth / 2, window.innerHeight);
                preSnapped = snapped;
            }
            else if (b.right > rightScreenEdge) {
                setBounds(dom, window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight);
                preSnapped = snapped;
            }
            else if (b.bottom > bottomScreenEdge) {
                setBounds(dom, 0, window.innerHeight / 2, window.innerWidth, window.innerWidth / 2);
                preSnapped = snapped;
            }
            else {
                preSnapped = null;
            }
            hintHide();
            dom.trigger('move', { finish: true, el: dom });
            dom.trigger('resize', { finish: true, el: dom });
        }
        clicked = null;
    }

    dom.snapRight = function () {
        var snapped = {
            width: dom.width,
            height: dom.height
        };

        setBounds(dom, window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight);
        preSnapped = snapped;
        // hintHide();
        dom.trigger('move', { finish: true, el: dom });
        dom.trigger('resize', { finish: true, el: dom });
    };

    return dom;
}

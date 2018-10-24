export const easeInOutQuart = (t, b, c, d) => {
    if ((t /= d / 2 ) < 1) return c / 2 * t * t + b;
    return -c / 2 * ((--t) * (t - 2) - 1) + b;
};

export const supportsPassive = (() => {
    let hasSupport = false;
    try {
        let opts = Object.defineProperty({}, 'passive', {
            get: function() {
                hasSupport = true;
            }
        });
        window.addEventListener("testPassive", null, opts);
        window.removeEventListener("testPassive", null, opts);
    } catch (e) {}
    return hasSupport;
})();

export const supportsHidden = (() => {
    let hidden;
    if (typeof document.hidden !== "undefined") {
        hidden = {
            property: "hidden",
            event: "visibilitychange"
        };
    } else if (typeof document.msHidden !== "undefined") {
        hidden = {
            property: "msHidden",
            event: "msvisibilitychange"
        };
    } else if (typeof document.webkitHidden !== "undefined") {
        hidden = {
            property: "webkitHidden",
            event: "webkitvisibilitychange"
        };
    }
    return hidden;
})();
import 'intersection-observer';
import {easeInOutQuart, supportsPassive, supportsHidden} from './utils.js';

export default class Slider {
  constructor(settings = {}) {
    if (settings.node && settings.node instanceof HTMLElement) {
      this.$slider = [settings.node];
    } else {
      this.$slider = document.querySelectorAll(settings.node ? settings.node : '.slider')
    }
    if (this.$slider.length === 0) {
      return;
    }
    if (this.$slider.length > 1) {
      let sliders = [];
      [...this.$slider].forEach(slider => {
        settings.node = slider;
        sliders.push(new Slider(settings));
      });
      return sliders;
    }
    this.$slider = this.$slider[0];
    this.settings = {
      node: undefined,
      block: 'slider',
      element: {
        track: 'track',
        slide: 'slide',
        pagination: 'pagination',
        dots: 'dots',
        dot: 'dot',
        button: 'button'
      },
      modifier: {
        active: 'active',
        visible: 'visible',
        next: 'next',
        prev: 'prev',
        dot: 'dot',
        clone: 'clone',
        edge: 'edge',
        horizontal: 'horizontal',
        vertical: 'vertical',
        play: 'play',
        pause: 'pause',
        disabled: 'disabled'
      },
      clones: 3,
      transition: 250,
      multiplyTransition: true,
      ease: easeInOutQuart,
      align: 'left',
      mode: 'horizontal',
      initialSlide: 0,
      slidesToSlide: 1,
      autoplay: {
        direction: '>',
        mode: 'bounce',
        duration: 3800,
        pauseOnInteraction: true
      },
      swipeToSlide: true,
      swipeThreshold: 60,
      dragToSlide: true,
      focusOnClick: true,
      pagination: true,
      prev: true,
      next: true,
      play: true,
      loop: false,
      rewind: false,
      syncedSliders: [],
      intersection: {
        root: this.$slider,
        rootMargin: '0px',
        threshold: [0, 0.01]
      },
      l10n: {
        prev: 'Previous slide',
        next: 'Next slide',
        start: 'Start autoplay',
        pause: 'Pause autoplay',
        goto: 'Go to slide %d',
        active: 'Go to current slide',
        nav: 'Go to slider pagination'
      }
    };
    this.settings = Object.assign({}, this.settings, settings);
    this.$track = false;
    this.$pagination = false;
    this.$dots = false;
    this.$prev = false;
    this.$next = false;
    this.$play = false;
    this.trackSize = 0;
    this.referenceSize = 0;
    this.$$clones = [];
    this.$$slides = [];
    this.$$slidesAndClones = [];
    this.currentSlide = false;
    this.fps = {
      then: 0,
      interval: 1000 / 24,
      tolerance: .1
    };
    this.slideAnimation = {
      then: 0,
      start: 0,
      distance: 0,
      calculated: 0,
      transition: 0,
      rafId: null
    };
    this.intersectionObserver = null;

    if (this.settings.play) {
      this.autoplay = {
        play: this.settings.play !== false,
        stop: false,
        direction: this.settings.autoplay.direction,
        timeout: null
      };
    }

    this.drag = {
      active: false,
      dragging: false,
      disableFocusOnClick: false,
      start: 0,
      distance: 0,
      track: 0
    };

    this.onArrowKeys = this.onArrowKeys.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onEdgeJump = this.onEdgeJump.bind(this);
    this.onTransitionEnd = this.onTransitionEnd.bind(this);
    this.onIntersection = this.onIntersection.bind(this);
    this.onSlide = this.onSlide.bind(this);
    this.onSlideClick = this.onSlideClick.bind(this);
    this.onDragStart = this.onDragStart.bind(this);
    this.onDrag = this.onDrag.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
    this.onDragSlideEnd = this.onDragSlideEnd.bind(this);
    this.onAutoplay = this.onAutoplay.bind(this);
    this.onToggleAutoplay = this.onToggleAutoplay.bind(this);
    this.onVisibilityChange = this.onVisibilityChange.bind(this);
    this.to = this.to.bind(this);
    this.prev = this.prev.bind(this);
    this.next = this.next.bind(this);
    this.init = this.init.bind(this);
    this.destroy = this.destroy.bind(this);

    this.public = {
      $$slides: this.$$slides,
      settings: this.settings,
      to: this.to,
      prev: this.prev,
      next: this.next,
      reInit: this.init,
      destroy: this.destroy
    };
    this.$slider.slider = this.public;

    this.init();

    return this.public;
  }

  __element(element) {
    return `${this.settings.block}__${this.settings.element[element]}`;
  }

  __initElement(element, type = 'div') {
    this[`$${element}`] = this.$slider.querySelector(`.${this.__element(element)}`);
    if (!this[`$${element}`]) {
      this[`$${element}`] = document.createElement(type);
      this[`$${element}`].classList.add(this.__element(element));
    }
  }

  __initSlides() {
    [...this.$slider.querySelectorAll(`.${this.__element('slide')}`)].forEach($slide => {
      this.trackSize += $slide[this.__offsetSize()];
      $slide.style[this.__size()] = `${$slide[this.__offsetSize()]}px`;
      $slide.setAttribute('tabindex', '-1');
      $slide.setAttribute('aria-hidden', true);
      $slide.setAttribute('data-slide', this.$$slides.length);
      this.$track.appendChild($slide);
      this.$$slides.push($slide);
      this.$$slidesAndClones.push($slide);
    });
  }

  __initClones() {
    let slidesCount = this.$$slides.length;
    for (let i = 0; i < this.settings.clones; i++) {
      this.__initClone(this.$$slides[i % slidesCount]);
      this.__initClone(this.$$slides[Math.abs(slidesCount - (i + 1)) % slidesCount], 'prepend');
    }
  }

  __initClone($node, method = 'appendChild') {
    this.trackSize += $node[this.__offsetSize()];
    let $clone = $node.cloneNode(true);
    let slideId = parseInt(this.$$clones.length / 2, 10);
    $clone.classList.add(`${this.__element('slide')}--${this.settings.modifier.clone}`);
    $clone.setAttribute('data-slide', method === 'appendChild' ? this.$$slides.length + slideId : -1 - slideId);
    this.currentSlide = -1 - slideId;
    this.$track[method]($clone);
    this.$$clones.push($clone);
    this.$$slidesAndClones[method === 'appendChild' ? 'push' : 'unshift']($clone);
  }

  __resetTrackSize() {
    this.trackSize = 0;
    this.$track.style[this.__size()] = null;
    this.$track.style.display = 'block';
  }

  __setTrackSize(referenceSize) {
    this.$track.style.display = null;
    this.$track.style[this.__size()] = `${this.trackSize}px`;
    this.referenceSize = referenceSize;
  }

  __offsetSize() {
    return this.settings.mode === 'horizontal' ? 'offsetWidth' : 'offsetHeight';
  }

  __offsetDirection() {
    return this.settings.mode === 'horizontal' ? 'offsetLeft' : 'offsetTop';
  }

  __size() {
    return this.settings.mode === 'horizontal' ? 'width' : 'height';
  }

  __axis() {
    return this.settings.mode === 'horizontal' ? 'X' : 'Y';
  }

  onIntersection(entries, observer) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (entry.intersectionRatio >= 0.01) {
          this.__changeVisibility(entry.target);
        }
      } else {
        if (entry.intersectionRatio === 0.0) {
          this.__changeVisibility(entry.target, 'remove');
        }
      }
    });
  }

  __initObserver() {
    this.intersectionObserver = new IntersectionObserver(this.onIntersection, this.settings.intersection);
    [...this.$$slidesAndClones].forEach($slide => {
      this.intersectionObserver.observe($slide);
    });
  }

  __initSwipeToSlide() {
    if (this.settings.swipeToSlide) {
      this.$slider.addEventListener('touchstart', this.onDragStart, supportsPassive ? {passive: true} : false);
      this.$slider.addEventListener('touchmove', this.onDrag, supportsPassive ? {passive: true} : false);
      this.$slider.addEventListener('touchend', this.onDragEnd);
    }
  }

  __initDragToSlide() {
    if (this.settings.dragToSlide) {
      this.$slider.addEventListener('mousedown', this.onDragStart);
      this.$slider.addEventListener('mousemove', this.onDrag);
      this.$slider.addEventListener('mouseup', this.onDragEnd);
      document.documentElement.addEventListener('mouseout', this.onDragEnd);
    }
  }

  __initFocusOnClick() {
    if (this.settings.focusOnClick) {
      [...this.$$slidesAndClones].forEach($slide => {
        $slide.addEventListener('click', this.onSlideClick);
      });
    }
  }

  __initAutoplay() {
    if (this.settings.play) {
      this.onAutoplay(false);
      if (this.settings.autoplay.pauseOnInteraction) {
        this.$track.addEventListener('mouseenter', this.onToggleAutoplay);
        this.$track.addEventListener('mouseleave', this.onToggleAutoplay);
      }
      if (supportsHidden) {
        document.addEventListener(supportsHidden.event, this.onVisibilityChange, false);
      }
      this.__initPaginationItem('button', 'button', this.$slider, this.settings.modifier.play);
      let playClass = `${this.__element('button')}--${this.settings.modifier.play}`,
        pauseClass = `${this.__element('button')}--${this.settings.modifier.pause}`,
        sliderClass = `${this.settings.block}--${this.settings.modifier.pause}`;
      this.$play.classList.add(this.__element('button'), playClass);
      this.$play.title = this.settings.l10n.pause;
      this.$play.addEventListener('click', () => {
        this.autoplay.stop = !this.autoplay.stop;
        if (this.autoplay.stop) {
          this.$play.classList.add(pauseClass);
          this.$play.classList.remove(playClass);
          this.$play.title = this.settings.l10n.start;
        } else {
          this.$play.classList.add(playClass);
          this.$play.classList.remove(pauseClass);
          this.$play.title = this.settings.l10n.pause;
        }
        this.__resetAutoplay();
      });
      this.$slider.addEventListener('pause', () => {
        this.$slider.classList.add(sliderClass);
        this.$play.classList.add(pauseClass);
        this.$play.classList.remove(playClass);
      });
      this.$slider.addEventListener('play', () => {
        this.$slider.classList.remove(sliderClass);
        this.$play.classList.add(playClass);
        this.$play.classList.remove(pauseClass);
      });

    }
  }

  __initPaginationItem(item, type, $parent, modifier = false) {
    let node = modifier ? modifier : item;
    if (this.settings[node] instanceof HTMLElement) {
      this[`$${node}`] = this.settings[node];
    } else {
      let className = this.__element(item) + (modifier ? `--${modifier}` : '');
      this[`$${node}`] = $parent.querySelector(`.${className}`);
      if (!this[`$${node}`]) {
        this[`$${node}`] = document.createElement(type);
        if (this.settings.l10n[node]) {
          this[`$${node}`].title = this.settings.l10n[node];
        }
        $parent[node === 'pagination' ? 'prepend' : 'appendChild'](this[`$${node}`]);
      }
    }
  }

  __setActiveDot($current) {
    let className = `${this.__element('dot')}--${this.settings.modifier.active}`;
    let $previous = this.$dots.querySelector(`.${className}`);
    if ($previous) {
      $previous.classList.remove(className);
    }
    if ($current) {
      $current.classList.add(className);
    }
  }

  __initPagination() {
    if (!(this.settings.pagination || this.settings.prev || this.settings.next)) {
      return;
    }
    this.__initPaginationItem('pagination', 'nav', this.$slider);
    this.$pagination.classList.add(this.__element('pagination'));
    let disabledButtonClass = `${this.__element('button')}--${this.settings.modifier.disabled}`;
    if (this.settings.prev) {
      this.__initPaginationItem('button', 'button', this.$pagination, this.settings.modifier.prev);
      this.$prev.classList.add(`${this.__element('button')}`, `${this.__element('button')}--${this.settings.modifier.prev}`);
      this.$prev.addEventListener('click', this.prev);
      this.$slider.addEventListener('afterslide', (e) => {
        if (!this.settings.rewind && !this.settings.loop && e.detail.current === 0) {
          this.$prev.classList.add(disabledButtonClass);
        } else {
          this.$prev.classList.remove(disabledButtonClass);
        }
      });
    }
    if (this.settings.pagination) {
      this.__initPaginationItem('dots', 'ol', this.$pagination);
      this.$dots.classList.add(`${this.__element('dots')}`);
      let className = `${this.__element('dot')}--${this.settings.modifier.active}`;
      let $lis = [...this.$dots.querySelectorAll(`.${this.__element('dot')}`)];
      [...this.$$slides].forEach(($slide, index) => {
        let $li = $lis[index] || document.createElement('li');
        $li.classList.add(this.__element('dot'));
        if (index === this.settings.initialSlide) {
          this.__setActiveDot($li);
        }
        this.$dots.appendChild($li);
        let $button = $li.querySelector(`.${this.__element('button')}`) || document.createElement('button');
        $button.classList.add(`${this.__element('button')}`, `${this.__element('button')}--${this.settings.modifier.dot}`);
        $button.title = $button.title || this.settings.l10n.goto.replace('%d', index + 1);
        $li.appendChild($button);
        $button.addEventListener('click', () => {
          this.__setActiveDot($li);
          this.to(index);
        });
      });
      this.$slider.addEventListener('afterslide', (e) => {
        this.__setActiveDot([...this.$dots.children][e.detail.current]);
      });
      this.$slider.addEventListener('beforeslide', (e) => {
        this.__setActiveDot(e.detail.next !== null ? [...this.$dots.children][e.detail.next] : null);
      });
    }
    if (this.settings.next) {
      this.__initPaginationItem('button', 'button', this.$pagination, this.settings.modifier.next);
      this.$next.classList.add(`${this.__element('button')}`, `${this.__element('button')}--${this.settings.modifier.next}`);
      this.$next.addEventListener('click', this.next);
      this.$slider.addEventListener('afterslide', (e) => {
        if (!this.settings.rewind && !this.settings.loop && e.detail.current === this.$$slides.length - 1) {
          this.$next.classList.add(disabledButtonClass);
        } else {
          this.$next.classList.remove(disabledButtonClass);
        }
      });
    }
  }

  __initKeyboard() {
    this.$slider.addEventListener('keydown', this.onArrowKeys);
  }

  onArrowKeys (event) {
    let direction = null;
    if (event.keyCode === 37 || event.keyCode === 38) {
      direction = this.settings.slidesToSlide*-1;
    }
    if (event.keyCode === 39 || event.keyCode === 40) {
      direction = this.settings.slidesToSlide;
    }
    this.__slide(direction)
  }

  init() {
    this.$slider.dispatchEvent(new CustomEvent('init', {
      detail: {
        slider: this,
        current: this.currentSlide
      }
    }));
    window.addEventListener('resize', this.onResize);
    this.__initElement('track');
    this.$track.setAttribute('aria-live', 'polite');
    this.$slider.appendChild(this.$track);
    this.$slider.classList.remove(`${this.settings.block}--${this.settings.modifier.disabled}`);
    this.$slider.classList.add(`${this.settings.block}--${this.settings.modifier[this.settings.mode]}`,`${this.settings.block}--${this.settings.modifier.active}`);
    this.__resetTrackSize();
    this.__initSlides();
    if (this.$$slides.length < 1) {
      this.destroy();
    } else if (this.settings.loop) {
      this.__initClones();
    }
    this.__setTrackSize(this.$slider[this.__offsetSize()]);

    this.__initPagination();
    this.__initObserver();
    this.__initSwipeToSlide();
    this.__initDragToSlide();
    this.__initFocusOnClick();
    this.__initAutoplay();
    this.__initKeyboard();

    let direction = (this.settings.loop ? this.settings.clones + this.settings.initialSlide : this.settings.initialSlide );
    this.$track.addEventListener('slideend', this.onTransitionEnd);
    this.__slide(direction, false);
    return this.public;
  }

  __slide(direction = null, transition = true) {
    if (direction === null || !this.$track) {
      return;
    }
    let slide = this.currentSlide + direction;
    let maxSlide = this.$$slides.length - 1;
    if (this.settings.rewind && !this.settings.loop) {
      if (slide < 0) {
        slide = maxSlide;
        direction = maxSlide;
      } else if (slide > maxSlide) {
        slide = 0;
        direction = -maxSlide;
      }
    }
    let $slide = this.$track.querySelector(`[data-slide="${slide}"]`);
    if (!$slide) {
      return;
    }
    let isEdgeSlide = slide < 0 || slide > maxSlide;
    if (transition) {
      if (isEdgeSlide) {
        this.$track.addEventListener('slideend', this.onEdgeJump);
      }
      let next = this.__relativeSlide(slide);
      this.slideAnimation.transition = this.settings.multiplyTransition ? this.settings.transition * Math.abs(direction) : this.settings.transition;
      this.$slider.dispatchEvent(new CustomEvent('beforeslide', {
        detail: {
          slider: this,
          current: this.currentSlide,
          next,
          isEdgeSlide
        }
      }));
    }
    this.__setActiveSlide(slide);
    this.__slideDistance(this.__offsetByAlignment($slide[this.__offsetDirection()]), transition ? this.settings.transition * Math.abs(direction) : 0);
  }

  __setActiveSlide(slide) {
    this.currentSlide = slide;
    let $slide = this.$slider.querySelector(`[data-slide="${slide}"]`);
    if (!$slide) {
      return;
    }
    let activeClass = `${this.__element('slide')}--${this.settings.modifier.active}`;
    let previousSlide = this.$slider.querySelector(`.${activeClass}`);
    if (previousSlide) {
      previousSlide.classList.remove(activeClass);
    }
    $slide.classList.add(activeClass);
    $slide.setAttribute('aria-hidden', false);
  }

  __slideEnd() {
    this.slideAnimation.start = parseInt(this.slideAnimation.start + this.slideAnimation.distance, 10);
    this.slideAnimation.distance = 0;
    this.$track.style.transform = `translate${this.__axis()}(${this.slideAnimation.start}px)`;
    this.__resetAutoplay();
    if (this.slideAnimation.transition > 0) {
      this.$track.dispatchEvent(new CustomEvent('slideend'));
      this.slideAnimation.transition = 0;
    }
  }

  __slideDistance(distance, transition) {
    if (this.slideAnimation.start !== parseInt(this.slideAnimation.start + this.slideAnimation.distance, 10)) {
      cancelAnimationFrame(this.slideAnimation.rafId);
      let isEdgeSlide = this.currentSlide < 0 || this.currentSlide > (this.$$slides.length - 1);
      if (isEdgeSlide) {
        this.onEdgeJump();
        return;
      } else {
        this.slideAnimation.start = parseInt(this.$track.style.transform.replace(/[^-\d.]/g, ''), 10);
        this.$track.style.transform = `translate${this.__axis()}(${this.slideAnimation.start}px)`;
      }
    }
    distance = this.__applyMinMaxDistance(distance);
    this.slideAnimation.then = this.slideAnimation.time = performance.now();
    this.slideAnimation.distance = distance - this.slideAnimation.start;
    this.slideAnimation.transition = transition;
    if (transition === 0) {
      return this.__slideEnd();
    }
    this.onSlide();
  }

  __applyMinMaxDistance(distance) {
    if (!this.settings.loop && this.settings.align !== 'center') {
      if (distance > 0) {
        return 0;
      }
      let maxDistance = (this.$track[this.__offsetSize()] - this.$slider[this.__offsetSize()]) * -1;
      if (distance < maxDistance) {
        return maxDistance;
      }
    }
    return distance;
  }

  onSlide() {
    let now = performance.now();
    const DELTA = now - this.slideAnimation.then;
    if (DELTA >= this.fps.interval - this.fps.tolerance) {
      this.slideAnimation.then += DELTA;
      this.slideAnimation.calculated = this.settings.ease(now - this.slideAnimation.time, this.slideAnimation.start, this.slideAnimation.distance, this.slideAnimation.transition);
      if ((now - this.slideAnimation.time) >= this.slideAnimation.transition) {
        cancelAnimationFrame(this.slideAnimation.rafId);
        return this.__slideEnd();
      }
      this.$track.style.transform = `translate${this.__axis()}(${parseInt(this.slideAnimation.calculated, 10)}px)`;
      this.$slider.dispatchEvent(new CustomEvent('whileslide', {
        detail: {
          slider: this,
          direction: this.slideAnimation.calculated > this.slideAnimation.start ? '<' : '>',
          distance: this.slideAnimation.distance,
          distancePassed: Math.abs(parseInt(this.slideAnimation.start - this.slideAnimation.calculated,10)),
          transition: this.slideAnimation.transition,
          transitionPassed: parseInt(now - this.slideAnimation.time,10)
        }
      }));
    }
    this.slideAnimation.rafId = requestAnimationFrame(this.onSlide);
  }

  __offsetByAlignment(offset) {
    let align = this.settings.align;
    let $slide = this.$track.querySelector(`[data-slide="${this.currentSlide}"]`);
    if (align === 'left' || align === 'top') {
      return offset * -1;
    }
    if (align === 'center') {
      return offset * -1 + (this.$slider[this.__offsetSize()] / 2 - $slide[this.__offsetSize()] / 2);
    }
    if (align === 'right' || align === 'bottom') {
      return offset * -1 + (this.$slider[this.__offsetSize()] - $slide[this.__offsetSize()]);
    }
  }

  __changeVisibility(element, method = 'add') {
    let visibilityClass = `${this.__element('slide')}--${this.settings.modifier.visible}`;
    if (element) {
      element.classList[method](visibilityClass);
      element.setAttribute('aria-hidden', true);
      element.setAttribute('tabindex', method === 'add' ? 0 : -1);
    }
  }

  __relativeSlide(slideOrCloneId) {
    let cloneFactor = parseInt(this.$$clones.length / this.$$slides.length, 10) + 1;
    return (slideOrCloneId + this.$$slides.length * cloneFactor) % this.$$slides.length
  }

  to(slide, transition = true) {
    if (this.currentSlide === slide) {
      return this.public;
    }
    let direction = (this.currentSlide - slide) * -1;
    this.__slide(direction, transition);
    this.__stopAutoplay();
    return this.public;
  }

  next() {
    this.__slide(this.settings.slidesToSlide);
    this.__stopAutoplay();
    return this.public;
  }

  prev() {
    this.__slide(-this.settings.slidesToSlide);
    this.__stopAutoplay();
    return this.public;
  }

  onResize() {
    let now = performance.now();
    const DELTA = now - this.fps.then;

    if (DELTA >= this.fps.interval - this.fps.tolerance) {
      this.fps.then = now - DELTA % this.fps.interval;
      let referenceSize = this.$slider[this.__offsetSize()];
      if (referenceSize === this.referenceSize) {
        return;
      }
      this.__resetTrackSize();
      setTimeout(() => {
        this.$$slidesAndClones.forEach($slide => this.__resizeSlide($slide));
        setTimeout(() => {
          this.__setTrackSize(referenceSize)
          setTimeout(() => {
            this.__slide(0, false);
          }, 0);
        }, 0);
      },0);
    }
  }

  __resizeSlide($node) {
    $node.style[this.__size()] = null;
    let slideSize = $node[this.__offsetSize()];
    this.trackSize += slideSize;
    $node.style[this.__size()] = `${slideSize}px`
  }

  onEdgeJump() {
    this.$track.removeEventListener('slideend', this.onEdgeJump);
    this.__edgeJump();
  }

  __edgeJump() {
    this.$slider.dispatchEvent(new CustomEvent('edgejump', {
      detail: {
        slider: this,
        direction: this.currentSlide < 0 ? '<' : '>'
      }
    }));
    let edgeClass = `${this.__element('track')}--${this.settings.modifier.edge}`;
    this.$track.classList.add(edgeClass);
    let distanceFactor = parseInt(Math.abs(this.currentSlide < 0 ? this.currentSlide + 1 : this.currentSlide - 1) / this.$$slides.length, 10) + 1;
    let distanceToOriginal = this.currentSlide < 0 ? this.$$slides.length : -this.$$slides.length;
    distanceToOriginal *= distanceFactor;
    let visibleClass = `${this.__element('slide')}--${this.settings.modifier.visible}`;
    let visibleSlides = this.$$slidesAndClones.reduce((accumulator, $slide) => {
      if ($slide.classList.contains(visibleClass)) {
        accumulator.push($slide);
        $slide.classList.remove(visibleClass)
      }
      return accumulator;
    }, []);
    visibleSlides.forEach($slide => {
      let index = parseInt($slide.dataset.slide, 10);
      let otherEdgeSlide = this.$slider.querySelector(`[data-slide="${index + distanceToOriginal}"]`);
      if (otherEdgeSlide) {
        otherEdgeSlide.classList.add(`${this.__element('slide')}--${this.settings.modifier.visible}`);
      }
    });
    this.__slide(distanceToOriginal, false);
    setTimeout(() => {
      this.$track.classList.remove(edgeClass);
    },0)
  }

  onTransitionEnd() {
    let isEdgeSlide = this.currentSlide < 0 || this.currentSlide >= this.$$slides.length;
    this.$slider.dispatchEvent(new CustomEvent('afterslide', {
      detail: {
        slider: this,
        current: this.__relativeSlide(this.currentSlide),
        isEdgeSlide
      }
    }));
  }

  onDragStart() {
    this.drag.active = true;
    this.drag.start = false;
    this.drag.distance = 0;
    this.drag.track = parseInt(this.$track.style.transform.replace(/[^-\d.]/g, ''), 10);
  }

  onDrag(e) {
    if (!this.drag.active) {
      return;
    }
    let property = `screen${this.__axis()}`;
    if (typeof e.touches === 'object' && e.touches.length > 0) {
      e[property] = e.touches[0][property];
    }
    if (this.drag.start === false) {
      this.drag.start = e[property];
      this.__stopAutoplay();
      this.$slider.dispatchEvent(new CustomEvent('beforeslide', {
        detail: {
          slider: this,
          current: this.currentSlide,
          next: null,
          isEdgeSlide: null
        }
      }));
    }
    this.drag.distance = this.drag.start - e[property];
    if (Math.abs(this.drag.distance) >= this.settings.swipeThreshold || this.drag.dragging) {
      this.$track.style.transform = `translate${this.__axis()}(${this.drag.track - this.drag.distance}px)`;
      this.drag.dragging = true;
      this.drag.disableFocusOnClick = true;
      this.$slider.dispatchEvent(new CustomEvent('whiledrag', {
        detail: {
          slider: this,
          direction: this.drag.distance < 0 ? '<' : '>',
          distance: Math.abs(this.drag.distance),
          origin: this.drag.track
        }
      }));
    }
  }

  onDragEnd() {
    this.drag.active = false;
    if (!this.drag.dragging) {
      return;
    }
    this.drag.dragging = false;
    this.slideAnimation.start = this.drag.track - this.drag.distance;
    let forward = this.drag.distance > 0 ? true : false;
    let distance = false;
    let currentSlide = false;
    this.$$slidesAndClones.forEach($slide => {
      if (forward && distance !== false) {
        return;
      }
      let offset = this.__currentSlideOffset($slide);
      if (forward && this.slideAnimation.start > offset) {
        distance = offset;
      } else if (!forward && this.slideAnimation.start < offset) {
        distance = offset;
        currentSlide = this.currentSlide;
      }
    });
    if (false !== currentSlide) {
      this.currentSlide = currentSlide
    } else if (false === distance) {
      let $slide;
      if (forward) {
        $slide = this.$$slidesAndClones[this.$$slidesAndClones.length - 1]
      } else {
        $slide = this.$$slidesAndClones[0]
      }
      distance = this.__currentSlideOffset($slide);
    }
    this.__setActiveSlide(this.currentSlide);
    this.$track.addEventListener('slideend', this.onDragSlideEnd);
    this.__slideDistance(distance, this.settings.transition);
    return false;
  }

  onDragSlideEnd() {
    this.$track.removeEventListener('slideend', this.onDragSlideEnd);
    let isEdgeSlide = this.currentSlide < 0 || this.currentSlide > (this.$$slides.length - 1);
    this.__resetAutoplay();
    if (isEdgeSlide) {
      this.__edgeJump();
    }
  }

  onSlideClick(e) {
    if (this.drag.disableFocusOnClick) {
      this.drag.disableFocusOnClick = false;
      return;
    }
    let targetSlide = parseInt(e.currentTarget.dataset.slide, 10)
    this.to(targetSlide);
  }

  __currentSlideOffset($slide) {
    this.currentSlide = parseInt($slide.dataset.slide, 10);
    return this.__offsetByAlignment($slide[this.__offsetDirection()]);
  }

  __stopAutoplay() {
    if (this.settings.play) {
      clearTimeout(this.autoplay.timeout);
    }
  }

  __resetAutoplay() {
    if (!this.settings.play) {
      return;
    }
    clearTimeout(this.autoplay.timeout);
    if (this.autoplay.play && !this.autoplay.stop) {
      this.onAutoplay(false);
    }
  }

  onAutoplay(slideOnInit = true) {
    if (slideOnInit) {
      let direction = this.autoplay.direction === '>' ? this.settings.slidesToSlide : this.settings.slidesToSlide * -1;
      if (this.settings.autoplay.mode === 'rewind') {
        if ((this.currentSlide + direction) < 0) {
          direction += this.$$slides.length;
        } else if ((this.currentSlide + direction) > (this.$$slides.length - 1)) {
          direction -= this.$$slides.length;
        }
      }
      if (this.settings.autoplay.mode === 'bounce') {
        if ((this.currentSlide + direction) < 0) {
          this.autoplay.direction = '>';
          direction *= -1;
        } else if ((this.currentSlide + direction) > (this.$$slides.length - 1)) {
          this.autoplay.direction = '<';
          direction *= -1;
        }
      }
      this.__slide(direction);
    }
    this.autoplay.timeout = setTimeout(this.onAutoplay, this.settings.autoplay.duration);
  }

  onToggleAutoplay(e) {
    if (e.type.toLowerCase() === 'click') {
      this.autoplay.play = this.autoplay.stop = !this.autoplay.stop;
      if (this.autoplay.stop) {
        this.__stopAutoplay();
      }
    } else if (!this.autoplay.stop) {
      this.autoplay.play = !this.autoplay.play;
      this.$slider.dispatchEvent(new CustomEvent(this.autoplay.play ? 'play' : 'pause'));
    }
    this.__resetAutoplay();
  }

  onVisibilityChange() {
    if (document[supportsHidden.property]) {
      this.autoplay.stop = true;
    } else {
      this.autoplay.stop = false;
    }
    this.__resetAutoplay();
  }

  destroy() {
    if (this.autoplay) {
      this.autoplay.stop = true;
      clearTimeout(this.autoplay.timeout);
      this.$play.parentNode.removeChild(this.$play);
    }
    window.removeEventListener('resize', this.onResize);
    this.$$slides.forEach($slide => {
      $slide.classList.remove(`${this.__element('slide')}--${this.settings.modifier.active}`);
      $slide.removeAttribute('style');
      $slide.removeAttribute('tabindex');
      $slide.removeAttribute('aria-hidden');
      $slide.removeAttribute('data-slide');
      this.$slider.appendChild($slide);
    });
    this.$$clones.forEach($clone => $clone.remove());
    this.__resetElement(this.$pagination);
    this.__resetElement(this.$prev);
    this.__resetElement(this.$next);
    this.__resetElement(this.$track);
    this.__resetElement(this.$dots);
    if (supportsHidden) {
      document.removeEventListener(supportsHidden.event, this.onVisibilityChange, false);
    }
    this.$slider.classList.add(`${this.settings.block}--${this.settings.modifier.disabled}`);
    this.$$slidesAndClones = [];
    this.$$slides = [];
    this.$$clones = [];
    this.$slider.classList.remove(`${this.settings.block}--${this.settings.modifier.active}`);
    let $sliderClone = this.$slider.cloneNode(true);
    this.$slider.dispatchEvent(new CustomEvent('destroy', {
      detail: {
        slider: this,
        $slider: $sliderClone
      }
    }));
    this.$slider.parentNode.replaceChild($sliderClone, this.$slider);
    if (this.$slider === this.settings.intersection.root) {
      this.settings.intersection.root = $sliderClone;
    }
    this.settings.node = this.$slider = $sliderClone;
    return this.public;
  }

  __resetElement(attribute) {
    let $el = this[attribute];
    if (typeof $el === 'HTMLElement' && $el.hasOwnProperty('parentNode')) {
      $el.parentNode.removeChild($el);
      $el = false;
    }
  }
}
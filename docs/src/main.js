import de from "../../src/l10n/de";
import Sync from "../../src/plugins/sync";
import History from "../../src/plugins/history";
import Slider from "../../src/esnext-slider";
import {easeInOutQuart} from "../../src/utils";

const scrollTop = () => {
  if (typeof window.pageYOffset !== "undefined") {
    return window.pageYOffset;
  } else {
    let d = document,
      r = d.documentElement,
      b = d.body;
    return r.scrollTop || b.scrollTop || 0;
  }
};

class Scroll {
  constructor(settings) {
    this.settings = {
      start: scrollTop(),
      distance: 0,
      duration: 500,
      time: 0,
      scrollOnInit: true,
      increment: 16.5
    };
    this.settings = Object.assign({}, this.settings, settings);
    this.onInit = this.onInit.bind(this);
    if (this.settings.scrollOnInit) {
      this.onInit();
    }
  }

  onInit() {
    this.settings.time += this.settings.increment;
    let distance = easeInOutQuart(
      this.settings.time,
      this.settings.start,
      this.settings.distance,
      this.settings.duration
    );
    if (this.settings.time <= this.settings.duration) {
      window.scrollTo(0, distance);
      requestAnimationFrame(this.onInit);
    } else {
      window.scrollTo(0, this.settings.start + this.settings.distance);
    }
  }
}

class ExposeSlider {
  constructor($slider) {
    this.onInit = this.onInit.bind(this);
    this.addEventListeners = this.addEventListeners.bind(this);
    this.addEventListeners({detail: {$slider}});
  }

  addEventListeners(e) {
    let $slider = e.detail.$slider;
    $slider.addEventListener('init', this.onInit);
    $slider.addEventListener('destroy', this.addEventListeners);
  }

  onInit(e) {
    this.slider = e.detail.slider;
    e.detail.slider.public.slider = this.slider;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  let body = document.body,
    isStyleLoaded = document.createElement('img');
  body.appendChild(isStyleLoaded);
  isStyleLoaded.src = document.querySelector('#stylesheet').getAttribute('href');

  const MENU_OFFSET = 45;
  const SLIDERS = {};

  let onCssLoaded = () => {
    body.removeChild(isStyleLoaded);
    let settings = {
      paginate: {
        play: false,
        rewind: true
      },
      autoplay: {
        pagination: false,
        prev: false,
        next: false
      },
      align: {
        play: false,
        loop: true,
        pagination: false
      },
      small: {
        pagination: false,
        play: false,
        loop: true,
        align: 'center',
        syncedSliders: [document.querySelector('.slider--big')]
      },
      big: {
        prev: false,
        next: false,
        play: false,
        loop: true,
        syncedSliders: [document.querySelector('.slider--small')]
      },
      history: {
        pagination: false,
        play: false,
        loop: true,
        history: {
          base: 'slider',
          write: true,
          read: true
        }
      }
    };
    Object.keys(settings).forEach(key => {
      settings[key].node = document.querySelector(`.slider--${key}`);
      if (key === 'big' || key === 'small') {
        new Sync(settings[key].node);
      } else if (key === 'history') {
        new History(settings[key].node);
      }
      new ExposeSlider(settings[key].node);
      SLIDERS[key] = new Slider(settings[key]);
    });

    if (window.location.hash && window.location.hash.indexOf('#/') === -1) {
      let $target = document.querySelector(window.location.hash);
      if ($target) {
        setTimeout(() => {
          new Scroll({
            distance: $target.offsetTop - scrollTop() - MENU_OFFSET
          });
        }, 25);
      }
    }
  };

  isStyleLoaded.onerror = onCssLoaded;

  let eventClassName = 'event--internal';
  [...document.querySelectorAll(`.${eventClassName}`)].forEach($event => {
    $event.addEventListener('click', e => {
      let $target = e.currentTarget;
      $target.classList.toggle(eventClassName);
    })
  });

  let io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      let $menu = document.querySelector('.page__nav'),
        menuClass = 'page__nav--sticky';
      if (entry.isIntersecting) {
        $menu.classList.remove(menuClass);
      } else {
        $menu.classList.add(menuClass);
      }
    });
  });
  io.observe(document.querySelector('.page__header'));

  [...document.querySelectorAll(".menu__link")].forEach($menuLink => {
    $menuLink.addEventListener('click', e => {
      if (e.currentTarget.href.indexOf('#') === -1) {
        return;
      }
      let $target = document.querySelector(`#${e.currentTarget.href.split('#')[1]}`);
      new Scroll({
        distance: $target.offsetTop - scrollTop() - MENU_OFFSET
      });
    })
  });

  [...document.querySelectorAll('.pagination')].forEach($pagination => {
    let active = 'pagination--active',
      type = 'prev';
    if ($pagination.classList.contains('pagination--dots')) {
      type = 'pagination'
    }
    if ($pagination.classList.contains('pagination--next')) {
      type = 'next'
    }
    $pagination.addEventListener('click', () => {
      $pagination.classList.toggle(active);
      SLIDERS.paginate.slider.settings[type] = !SLIDERS.paginate.slider.settings[type];
      if (SLIDERS.paginate.slider.$pagination.parentNode) {
        SLIDERS.paginate.slider.$pagination.parentNode.removeChild(SLIDERS.paginate.slider.$pagination);
      }
      SLIDERS.paginate.slider.__initPagination();
    });
  });

  [...document.querySelectorAll('.align')].forEach($align => {
    let active = 'align--active',
      type = 'left';
    if ($align.classList.contains('align--center')) {
      type = 'center'
    }
    if ($align.classList.contains('align--right')) {
      type = 'right'
    }
    $align.addEventListener('click', () => {
      let $oldAlign = document.querySelector(`.${active}`);
      if ($oldAlign !== $align) {
        $oldAlign.classList.remove(active);
      } else {
        return;
      }
      $align.classList.add(active);
      SLIDERS.align.slider.settings.align = type;
      SLIDERS.align.slider.__slide(0);
    });
  });

  [...document.querySelectorAll('.autoplay')].forEach($autoplay => {
    let active = 'autoplay--active',
      type = 'bounce';
    if ($autoplay.classList.contains('autoplay--rewind')) {
      type = 'rewind'
    }
    if ($autoplay.classList.contains('autoplay--loop')) {
      type = 'loop'
    }
    $autoplay.addEventListener('click', () => {
      let $oldAutoplay = document.querySelector(`.${active}`);
      if ($oldAutoplay !== $autoplay) {
        $oldAutoplay.classList.remove(active);
      } else {
        return;
      }
      $autoplay.classList.add(active);
      let slider = SLIDERS.autoplay.slider;
      slider.settings.autoplay.mode = type;
      slider.settings.autoplay.direction = '>';
      slider.settings.initialSlide = slider.currentSlide;
      if (type === 'loop') {
        slider.settings.loop = true;
      } else {
        slider.settings.loop = false;
      }
      setTimeout(() => {
        slider.destroy();
        setTimeout(() => {
          slider.reInit();
        },0);
      },0);
    });
  })
});
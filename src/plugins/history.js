export default class {
  constructor($slider) {
    this.onInit = this.onInit.bind(this);
    this.addEventListeners = this.addEventListeners.bind(this);
    this.onAfterSlide = this.onAfterSlide.bind(this);
    this.onPopState = this.onPopState.bind(this);
    this.onPopStateReadonly = this.onPopStateReadonly.bind(this);

    this.addEventListeners({detail: {$slider}});
  }

  addEventListeners(e) {
    window.removeEventListener('popstate', this.onPopState);
    window.removeEventListener('popstate', this.onPopStateReadonly);

    let $slider = e.detail.$slider;
    $slider.addEventListener('init', this.onInit);
    $slider.addEventListener('destroy', this.addEventListeners);
  }

  onInit(e) {
    this.slider = e.detail.slider;
    this.slider.history = this.slider.settings.history;
    this.slider.history.writeable = true;

    if (this.slider.history.write) {
      this.slider.$slider.addEventListener('afterslide', this.onAfterSlide);
      window.addEventListener('popstate', this.onPopState);
    }
    if (this.slider.history.read && !this.slider.history.write) {
      window.addEventListener('popstate', this.onPopStateReadonly);
    }
    if (this.slider.history.read) {
      let hashParts = window.location.hash.split('/');
      if (hashParts[1] === this.slider.history.base) {
        this.slider.settings.initialSlide = parseInt(hashParts[2] - 1, 10);
      }
    }
  }

  onAfterSlide(e) {
    if (!this.slider.history.writeable) {
      this.slider.history.writeable = true;
      return;
    }
    history.pushState({
      slider: this.slider.history.base,
      current: e.detail.current
    }, this.slider.settings.l10n.goto.replace('%d', e.detail.current), `#/${this.slider.history.base}/${e.detail.current + 1}`)
  }

  onPopState(e) {
    let hashParts = window.location.hash.split('/');
    if (e.state && e.state.hasOwnProperty('slider') && e.state.slider === this.slider.history.base) {
      this.slider.history.writeable = false;
      this.slider.to(e.state.current);
    } else if (hashParts[1] === this.slider.history.base) {
      this.slider.history.writeable = false;
      this.slider.to(hashParts[2] - 1);
    }
  }

  onPopStateReadonly() {
    let hashParts = window.location.hash.split('/');
    if (hashParts[1] === this.slider.history.base) {
      this.slider.history.writeable = false;
      this.slider.to(hashParts[2] - 1);
    }
  }
}
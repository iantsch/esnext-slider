export default class {
  constructor($slider) {
    this.onInit = this.onInit.bind(this);
    this.addEventListeners = this.addEventListeners.bind(this);
    this.onBeforeSlide = this.onBeforeSlide.bind(this);
    this.onAfterSlide = this.onAfterSlide.bind(this);
    this.onForeignAfterSlide = this.onForeignAfterSlide.bind(this);

    this.addEventListeners({detail: {$slider}});
  }

  addEventListeners(e) {
    let $slider = e.detail.$slider;
    $slider.addEventListener('init', this.onInit);
    $slider.addEventListener('destroy', this.addEventListeners);
  }

  onInit(e) {
    this.slider = e.detail.slider;
    if (this.slider.settings.syncedSliders.length === 0) {
      return;
    }
    this.slider.public.synced = this.slider.synced = false;
    this.slider.$slider.addEventListener('beforeslide', this.onBeforeSlide);
    this.slider.$slider.addEventListener('afterslide', this.onAfterSlide);
    [...this.slider.settings.syncedSliders].forEach($foreignSlider => {
      $foreignSlider.addEventListener('afterslide', this.onForeignAfterSlide);
      if ($foreignSlider.hasOwnProperty('slider')) {
        $foreignSlider.slider.to(e.detail.current, false);
      }
    });
  }

  onBeforeSlide(e) {
    let slider = e.detail.slider;
    if (slider.synced) {
      return;
    }
    console.log(slider.synced, e.detail.slider.$slider.classList.contains('slider--big') ? 'big' : 'small');
    slider.synced = e.detail.next !== null;
    [...slider.settings.syncedSliders].forEach($foreignSlider => {
      $foreignSlider.slider.synced = e.detail.next !== null;
      if (e.detail.next !== null) {
        $foreignSlider.slider.to(e.detail.next);
      }
    });
  }

  onAfterSlide(e) {
    let slider = e.detail.slider;
    if (slider.synced) {
      slider.synced = false;
      return;
    }
    [...slider.settings.syncedSliders].forEach($foreignSlider => {
      $foreignSlider.slider.synced = slider.synced = true;
      $foreignSlider.slider.to(e.detail.current);
    });
  }

  onForeignAfterSlide(e) {
    let slider = e.detail.slider;
    if (!slider.synced) {
      return;
    }
    slider.synced = false;
  }
}
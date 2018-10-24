# esnext-slider

Slim modular ESnext carousel/slider ~ 5.8KB gzipped

## Features

* [ ]  BEM class names (configurable)
* [ ]  Full API access on slider HTMLElement
* [ ]  Horizontal/Vertical Mode (Fade Mode planned)
* [ ]  Carousel (Loop) / Slider ((Not) Rewind)
* [ ]  Pagination (Dots, Prev, Nav)
* [ ]  Align slides (if slides < 100%)
* [ ]  Swipe (Touch) / Drag (Mouse) Support
* [ ]  IntersectionObserver to change visibility of slides
* [ ]  FPS Throttle for slide/resize calculations
* [ ]  Custom Events `init`, `beforeslide`, `afterslide`, `edgejump`, `slideend`
* [ ]  Sync Slider instances
* [ ]  HistoryAPI
* [ ]  l10n of text strings

## Settings

| Setting | Type | Default Value | Description |
|---|---|---|---|
| **node** | `void`/`string`/`HTMLElement` | void | Either HTMLElement of Slider or selector of slider(s) |
| **block** | `string` | 'slider' | **B**EM bock class name |
| **element** | `object` | - | B**E**M elements |
| element.**track** | `string` | 'track' | B**E**M track class name part |
| element.**slide** | `string` | 'slide' | B**E**M slide class name part |
| element.**pagination** | `string` | 'pagination' | B**E**M pagination class name part |
| element.**dots** | `string` | 'dots' | B**E**M dots class name part |
| element.**dot** | `string` | 'dot' | B**E**M dot class name part |
| element.**button** | `string` | 'button' | B**E**M button class name part|
| **modifier** | `object` | - | BE**M** modifiers |
| modifier.**active** | `string` | 'active' | BE**M** active class name part |
| modifier.**visible** | `string` | 'visible' | BE**M** visible class name part |
| modifier.**next** | `string` | 'next' | BE**M** next class name part |
| modifier.**prev** | `string` | 'prev' | BE**M** prev class name part |
| modifier.**dot** | `string` | 'dot' | BE**M** dot class name part |
| modifier.**edge** | `string` | 'edge' | BE**M** edge class name part |
| modifier.**horizontal** | `string` | 'horizontal' | BE**M** horizontal class name part |
| modifier.**vertical** | `string` | 'vertical' | BE**M** vertical class name part |
| modifier.**play** | `string` | 'play' | BE**M** play class name part |
| modifier.**pause** | `string` | 'pause' | BE**M** pause class name part |
| modifier.**disabled** | `string` | 'disabled' | BE**M** disabled class name part |
| **clones** | `integer` | 3 | Number of generated clones per edge, if `loop` is enabled |
| **transition** | `integer` | 250 | Transition time |
| **ease** | `function` | `easeInOutQuart` | Transition easing |
| **align** | `enum` | `left` | Alignment of slides. Allowed values: `left`,`center`,`right` |
| **mode** | `enum` | `horizontal` | Slider mode. Allowed values: `horizontal`,`vertical`, ~~`fade`~~ |
| **initialSlide** | `integer` | 0 | Initial slide (Zero based index) |
| **slidesToSlide** | `integer` | 1 | Number of slides to slide (for `play` or `prev`/`next`) |
| **play** | `bool`/`HTMLElement` | `true` | Flag to enable autoplay. If `play` is a `HTMLElement`, it will replace the autoplay toggle button. |
| **autoplay** | `object` | - | `play` settings |
| autoplay.**direction** | `enum` | '>' | Autoplay direction. Allowed values: `<`, `>` |
| autoplay.**mode** | `enum` | 'bounce' | Autoplay mode. Allowed values: `bounce`, `rewind`, `loop` (needs `loop` enabled) |
| autoplay.**duration** | `integer` | 3800 | Duration for autoplay timeout |
| autoplay.**pauseOnInteraction** | `bool` | `true` | Flag to pause autoplay on slider interaction (hover, click) |
| **swipeToSlide** | `bool` | `true` | Flag to enable touch support |
| **swipeThreshold** | `integer` | 60 | Distance the touch has to move before swipe is initiated |
| **dragToSlide** | `bool` | `true` | Flag to enable mouse drag support |
| **focusOnClick** | `bool` | `true` | Flag to focus current slide on click/tap |
| **pagination** | `bool`/`HTMLElement` | `true` | Flag to enable pagination dots. If `pagination` is a `HTMLElement`, it will replace the overall wrapper for pagination. |
| **prev** | `bool`/`HTMLElement` | `true` | Flag to enable prev arrow. If `prev` is a `HTMLElement`, it will replace the prev button. |
| **next** | `bool`/`HTMLElement` | `true` | Flag to enable next arrow. If `next` is a `HTMLElement`, it will replace the next button. |
| **loop** | `bool` | `false` | Flag to enable carousel |
| **rewind** | `bool` | `false` | Flag to rewind posts on edges |
| **intersetction** | `object` | - | Settings for IntersectionObserver API |
| intersection.**root** | `HTMLElement` | `this.$slider` | Element to calculate the intersection against. |
| intersection.**rootMargin** | `string` | `-20px` | Adaptions to root element bounding box. |
| intersection.**threshold** | `float` | 0 | Value between 0-1, will define the percentage of intersection needed to display/hide slide. 0 = 1px |
| **l10n** | `object` | - | Language strings |
| l10n.**prev** | `string` | 'Previous slide' | Title for prev button |
| l10n.**next** | `string` | 'Next slide' | Title for next button |
| l10n.**start** | `string` | 'Start autoplay' | Title for play button, if autoplay is not enabled |
| l10n.**pause** | `string` | 'Pause autoplay' | Title for play button, if autoplay is enabled |
| l10n.**goto** | `string` | 'Go to slide %d' | Title for dot button |
| l10n.**active** | `string` | 'Go to slide %d' | Title for current slide shortcut |
| l10n.**nav** | `string` | 'Go to slider pagination' | Title for pagination shortcut |


## API
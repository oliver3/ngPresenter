(function () {
  var ngPresenter = angular.module('ngPresenter', ['ngAnimate']);

  ngPresenter.controller('PresenterController', ['$log', '$document', '$scope',
    function ($log, $document, $scope) {
      var presenter = this;

      presenter.registerSlide = registerSlide;
      presenter.nextSlide = nextSlide;
      presenter.selectSlide = selectSlide;
      presenter.fullscreen = fullscreen;
      presenter.overview = overview;
      presenter.progress = '0%';

      var currentSlide = 0;
      var slides = [];

      function registerSlide(slide) {
        $log.log('presenter.registerSlide()');
        if (slides.length === 0) {
          slide.show(0);
        }
        slides.push(slide);
        return slides.length;
      }

      function nextSlide(offset) {
        if (typeof offset === 'undefined') {
          offset = 1;
        }

        presenter.selectSlide(currentSlide + offset);
      }

      function selectSlide(nr) {
        if (nr < 0) {
          nr = 0;
        } else if (nr >= slides.length) {
          nr = slides.length - 1;
        }

        var direction = nr - currentSlide;

        if (direction !== 0) {
          slides[currentSlide].hide(direction);
          slides[nr].show(direction);

          currentSlide = nr;
          presenter.progress = (currentSlide / (slides.length - 1)) * 100 + '%';
        }
      }

      function fullscreen() {
        var element = document.documentElement;
        if (element.requestFullscreen) {
          element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
          element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
          element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
          element.msRequestFullscreen();
        }
      }

      function overview() {
        $document.find('body').toggleClass('overview');
        scrollElementIntoViewIfNeeded(slides[currentSlide].element);
      }

      $document.bind('keydown', function (event) {
        $scope.$apply(function () {
          switch (event.which) {
            case 39: // Right
              presenter.nextSlide(1);
              break;
            case 37: // Left
              presenter.nextSlide(-1);
              break;
            case 70: // F
              presenter.fullscreen();
              break;
            case 13: // Enter
              presenter.overview();
              break;
            default:
              $log.log('keydown ' + event.which);
              break;
          }
        });
      });

    }]);

  ngPresenter.directive('presentation', [function () {
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      scope: false,
      template: '<div class="presentation">' +
                '  <div class="slides" ng-transclude></div>' +
                '  <div class="progressbar-background"><div class="progressbar" style="width: {{presenter.progress}}"></div></div>' +
                '</div>',
      controller: 'PresenterController',
      controllerAs: 'presenter'
    };
  }]);

  ngPresenter.directive('group', [function () {
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      scope: true,
      template: '<div class="group" ng-transclude></div>',
      require: '^presentation'
    }
  }]);

  ngPresenter.directive('slide', ['$log', '$animate', function ($log, $animate) {
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      scope: true,
      template: '<div class="slide">' +
                '  <div class="background"></div>' +
                '  <div class="content" ng-transclude></div>' +
                '</div>',
      require: '^presentation',
      link: function ($scope, $element, $attr, presenter) {
        $scope.show = show;
        $scope.hide = hide;
        $scope.slideNumber = presenter.registerSlide($scope);
        $scope.element = $element;

        $log.log('Registered slide ' + $scope.slideNumber);

        function show(direction) {
          $log.log('Showing slide ' + $scope.slideNumber + ' direction ' + direction);

          $element.toggleClass('show-backwards', direction < 0);
          $animate.addClass($element, 'show').then(function () {
            $element.removeClass('show-backwards');
            $scope.$broadcast('slide-shown');
          });

          // For overview
          scrollElementIntoViewIfNeeded($element);
        }

        function hide(direction) {
          $log.log('Hiding slide ' + $scope.slideNumber + ' direction ' + direction);

          $element.toggleClass('hide-backwards', direction < 0);
          $animate.removeClass($element, 'show').then(function () {
            $element.removeClass('hide-backwards');
            $scope.$broadcast('slide-hidden');
          });
        }
      }
    };
  }]);

  ngPresenter.directive('image', [function () {
    return function ($scope, $element, $attr) {
      var elementStyle = $element[0].querySelector('.background').style;
      elementStyle['background-image'] = 'url(' + $attr.image + ')';
      elementStyle['background-repeat'] = 'none';
      elementStyle['background-size'] = 'cover';
    };
  }]);

  ngPresenter.directive('bgZoom', ['$log', function ($log) {
    return function ($scope, $element, $attr) {
      var xyduration = parseNumberCSV($attr['bgZoom']);
      var duration = xyduration[2] || 120;
      var x = 50 - xyduration[0];
      var y = 50 - xyduration[1];

      $scope.$on('slide-shown', function () {
        $log.log('Starting bgZoom animation');
        var elementStyle = $element[0].querySelector('.background').style;
        elementStyle['transition'] = 'transform ' + duration + 's ease-out';
        elementStyle['transform'] = 'translate(' + x + '%, ' + y + '%) scale(2,2)';
      });
      $scope.$on('slide-hidden', function () {
        $log.log('Stopping bgZoom animation');
        var elementStyle = $element[0].querySelector('.background').style;
        elementStyle['transition'] = 'none';
        elementStyle['transform'] = 'translate(0,0) scale(1,1)';
      });

    };
  }]);

  ngPresenter.directive('pos', [function () {
    return function ($scope, $element, $attr) {
      var xywh = parseNumberCSV($attr.pos);
      var x = xywh[0];
      var y = xywh[1];
      var w = xywh[2];
      var h = xywh[3];

      var elementStyle = $element[0].style;
      if (x !== undefined || y !== undefined) {
        elementStyle['position'] = 'absolute';

        if (x !== undefined) {
          if (x >= 0) {
            elementStyle['left'] = x + '%';
          } else {
            elementStyle['right'] = (-x) + '%';
          }
        }

        if (y !== undefined) {
          if (y >= 0) {
            elementStyle['top'] = y + '%';
          } else {
            elementStyle['bottom'] = (-y) + '%';
          }
        }
      }
      if (w !== undefined) {
        elementStyle['width'] = w + '%';
      }
      if (h !== undefined) {
        elementStyle['height'] = h + '%';
      }
    }
  }]);

  function parseNumberCSV(csv) {
    var result = [];
    if (csv) {
      var tuple = csv.split(',');
      for (var i = 0; i < tuple.length; i++) {
        if (tuple[i] && isFinite(tuple[i])) {
          result[i] = Number(tuple[i]);
        }
      }
    }
    return result;
  }

  function scrollElementIntoViewIfNeeded($el) {
    var MARGIN = 5;
    var el = $el[0] || $el || {};

    if (el.getBoundingClientRect && el.scrollIntoView) {
      var rect = el.getBoundingClientRect();

      if (rect.top < -MARGIN) {
        el.scrollIntoView(true);
      } else if (rect.bottom - el.parentNode.clientHeight > MARGIN) {
        el.scrollIntoView(false);
      }
    }
  }


})();
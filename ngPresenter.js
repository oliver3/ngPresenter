(function () {
  var ngPresenter = angular.module('ngPresenter', ['ngAnimate']);

  ngPresenter.controller('PresenterController', ['$log', '$document', '$scope',
      function ($log, $document, $scope) {
    var presenter = this;

    presenter.registerSlide = registerSlide;
    presenter.nextSlide = nextSlide;
    presenter.selectSlide = selectSlide;
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

    $document.bind('keydown', function (event) {
      $scope.$apply(function () {
        switch (event.which) {
          case 39:
            presenter.nextSlide(1);
            break;
          case 37:
            presenter.nextSlide(-1);
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

  ngPresenter.directive('slide', ['$log', '$animate', '$compile', function ($log, $animate, $compile) {
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      scope: true,
      template: '<div class="slide"><div class="content" ng-transclude>' +
                '</div></div>',
      require: '^presentation',
      link: function ($scope, $element, $attr, presenter, $transclude) {
        $scope.show = show;
        $scope.hide = hide;
        $scope.slideNumber = presenter.registerSlide($scope);

        var content = $element.children().eq(0);
        var html = content.html();

        html = html.replace(/^(\s*)= (.*)$/gm, '$1<h1>$2</h1>');
        html = html.replace(/^(\s*)== (.*)$/gm, '$1<h2>$2</h2>');
        html = html.replace(/^(\s*)=== (.*)$/gm, '$1<h3>$2</h3>');
        html = html.replace(/^(\s*)==== (.*)$/gm, '$1<h4>$2</h4>');
        html = html.replace(/^(\s*)===== (.*)$/gm, '$1<h5>$2</h5>');
        html = html.replace(/^(\s*)====== (.*)$/gm, '$1<h6>$2</h6>');

        html = html.replace(/^(\s*)\* (.*)$/gm, '$1<li>$2</li>');

        html = html.replace(/^(\s*)$/gm, '$1<hr style="border-width: 0">');

        var compiled = $compile(html);
        content.replaceWith(compiled($scope));

        $log.log('Registered slide ' + $scope.slideNumber);

        function show(direction) {
          $log.log('Showing slide ' + $scope.slideNumber + ' direction ' + direction);

          $element.toggleClass('show-backwards', direction < 0);
          $animate.addClass($element, 'show').then(function () {
            $element.removeClass('show-backwards');
          });
        }

        function hide(direction) {
          $log.log('Hiding slide ' + $scope.slideNumber + ' direction ' + direction);

          $element.toggleClass('hide-backwards', direction < 0);
          $animate.removeClass($element, 'show').then(function () {
            $element.removeClass('hide-backwards');
          });
        }
      }
    };
  }]);

  ngPresenter.directive('image', [function () {
    return function ($scope, $element, $attr) {
      var elementStyle = $element[0].style;
      elementStyle['background-image'] = 'url(' + $attr.image + ')';
      elementStyle['background-repeat'] = 'none';
    };
  }]);

})();
(function () {
  var ngPresenter = angular.module('ngPresenter', []);

  ngPresenter.controller('PresenterController',
      ['$log', '$document', '$scope', function ($log, $document, $scope) {
    var presenter = this;

    presenter.registerSlide = registerSlide;
    presenter.nextSlide = nextSlide;
    presenter.selectSlide = selectSlide;

    var currentSlide = 0;
    var allSlides = [];

    $document.bind('keydown', function (event) {
      $log.log(event.which);
      $scope.$apply(function () {
        switch(event.which) {
          case 39:
            presenter.nextSlide(1);
            break;
          case 37:
            presenter.nextSlide(-1);
            break;
        }
      });
    });


    function registerSlide(slide) {
      $log.log('presenter.registerSlide()');
      if (allSlides.length === 0) {
        slide.currentSlide = true;
      }
      allSlides.push(slide);
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
      } else if (nr >= allSlides.length) {
        nr = allSlides.length - 1;
      }
      allSlides[currentSlide].currentSlide = false;
      currentSlide = nr;
      allSlides[currentSlide].currentSlide = true;
    }

  }]);

  ngPresenter.directive('presentation', [function () {
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      scope: true,
      template: '<div ng-transclude></div>',
      controller: 'PresenterController',
      controllerAs: 'presenter'
    };
  }]);

  ngPresenter.directive('slide', [function () {
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      scope: true,
      template: '<div class="slide" ng-show="currentSlide" ng-transclude></div>',
      require: '^presentation',
      link: function ($scope, $element, $attr, presenter) {
        presenter.registerSlide($scope);
      }
    };
  }]);

})();
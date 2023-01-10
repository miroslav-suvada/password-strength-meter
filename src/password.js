/**
 * @author Òscar Casajuana a.k.a. elboletaire <elboletaire at underave dot net>
 * @link https://github.com/elboletaire/password-strength-meter
 * @license GPL-3.0
 */
// eslint-disable-next-line
;(function($) {
  'use strict';

  const Password = function ($object, options) {
    const defaults = {
      enterPass: 'Type your password',
      shortPass: 'The password is too short',
      containsField: 'The password contains your username',
      steps: {
        13: 'Really insecure password',
        33: 'Weak; try combining letters & numbers',
        67: 'Medium; try using special characters',
        94: 'Strong password',
      },
      showPercent: false,
      showText: true,
      animate: true,
      animateSpeed: 'fast',
      field: false,
      fieldPartialMatch: true,
      minimumLength: 4,
      closestSelector: 'div',
      useColorBarImage: false,
      customColorBarRGB: {
        red: [0, 240],
        green: [0, 240],
        blue: 10
      },
    };

    options = $.extend({}, defaults, options);

    /**
     * Returns strings based on the score given.
     *
     * @param {int} score Score base.
     * @return {string}
     */
    function scoreText(score) {
      if (score === -1) {
        return options.shortPass;
      }
      if (score === -2) {
        return options.containsField;
      }

      score = score < 0 ? 0 : score;

      let text = options.shortPass;
      const sortedStepKeys = Object.keys(options.steps).sort();
      for (const step in sortedStepKeys) {
        const stepVal = sortedStepKeys[step];
        if (stepVal < score) {
          text = options.steps[stepVal];
        }
      }

      return text;
    }

    /**
     * Returns a value between -2 and 100 to score
     * the user's password.
     *
     * @param  {string} password The password to be checked.
     * @param  {string} field The field set (if options.field).
     * @return {int}
     */
    function calculateScore(password, field) {
      let score = 0;

      // password < options.minimumLength
      if (password.length < options.minimumLength) {
        return -1;
      }

      if (options.field) {
        // password === field
        if (password.toLowerCase() === field.toLowerCase()) {
          return -2;
        }
        // password contains field (and fieldPartialMatch is set to true)
        if (options.fieldPartialMatch && field.length) {
          const user = new RegExp(field.toLowerCase());
          if (password.toLowerCase().match(user)) {
            return -2;
          }
        }
      }

      // password length
      score += password.length * 4;
      score += checkRepetition(1, password).length - password.length;
      score += checkRepetition(2, password).length - password.length;
      score += checkRepetition(3, password).length - password.length;
      score += checkRepetition(4, password).length - password.length;

      // password has 3 numbers
      if (password.match(/(.*[0-9].*[0-9].*[0-9])/)) {
        score += 5;
      }

      // password has at least 2 symbols
      let symbols = '.*[!,@,#,$,%,^,&,*,?,_,~-]';
      symbols = new RegExp('(' + symbols + symbols + ')');
      if (password.match(symbols)) {
        score += 5;
      }

      // password has Upper and Lower chars
      if (password.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)) {
        score += 10;
      }

      // password has number and chars
      if (password.match(/([a-zA-Z])/) && password.match(/([0-9])/)) {
        score += 15;
      }

      // password has number and symbol
      if (password.match(/([!@#$%^&*?_~-])/) && password.match(/([0-9])/)) {
        score += 15;
      }

      // password has char and symbol
      if (password.match(/([!@#$%^&*?_~-])/) && password.match(/([a-zA-Z])/)) {
        score += 15;
      }

      // password is just numbers or chars
      if (password.match(/^\w+$/) || password.match(/^\d+$/)) {
        score -= 10;
      }

      if (score > 100) {
        score = 100;
      }

      if (score < 0) {
        score = 0;
      }

      return score;
    }

    /**
     * Checks for repetition of characters in
     * a string
     *
     * @param {int} length Repetition length.
     * @param {string} str The string to be checked.
     * @return {string}
     */
    function checkRepetition(length, str) {
      let res = "", repeated = false;
      for (let i = 0; i < str.length; i++) {
        repeated = true;
        for (var j = 0; j < length && (j + i + length) < str.length; j++) {
          repeated = repeated && (str.charAt(j + i) === str.charAt(j + i + length));
        }
        if (j < length) {
          repeated = false;
        }
        if (repeated) {
          i += length - 1;
          repeated = false;
        }
        else {
          res += str.charAt(i);
        }
      }
      return res;
    }

    /**
     * Calculates background colors from percentage value.
     *
     * @param {int} percent The percentage strength of the password.
     * @return {object} Object with colors as keys
     */
    function calculateColorFromPercentage(percent) {
      let minRed = 0;
      let maxRed = 240;
      let minGreen = 0;
      let maxGreen = 240;
      let blue = 10;

      if (Object.prototype.hasOwnProperty.call(options.customColorBarRGB, 'red')) {
        minRed = options.customColorBarRGB.red[0];
        maxRed = options.customColorBarRGB.red[1];
      }

      if (Object.prototype.hasOwnProperty.call(options.customColorBarRGB, 'green')) {
        minGreen = options.customColorBarRGB.green[0];
        maxGreen = options.customColorBarRGB.green[1];
      }

      if (Object.prototype.hasOwnProperty.call(options.customColorBarRGB, 'blue')) {
        blue = options.customColorBarRGB.blue;
      }

      const green = (percent * maxGreen / 50);
      const red = (2 * maxRed) - (percent * maxRed / 50);

      return {
        red: Math.min(Math.max(red, minRed), maxRed),
        green: Math.min(Math.max(green, minGreen), maxGreen),
        blue: blue
      }
    }

    /**
     * Adds color styles to colorBar jQuery object.
     *
     * @param {jQuery} $colorBar The colorBar jquery object.
     * @param {int} percent The percentage strength of the password.
     * @return {jQuery}
     */
    function addColorBarStyle($colorBar, percent) {
      if (options.useColorBarImage) {
        $colorBar.css({
          backgroundPosition: "0px -" + percent + "px",
          width: percent + '%'
        });
      }
      else {
        const colors = calculateColorFromPercentage(percent);

        $colorBar.css({
          'background-image': 'none',
          'background-color': 'rgb(' + colors.red.toString() + ', ' + colors.green.toString() + ', ' + colors.blue.toString() + ')',
          width: percent + '%'
        });
      }

      return $colorBar;
    }

    /**
     * Initializes the plugin creating and binding the
     * required layers and events.
     *
     * @return {Password} Returns the Password instance.
     */
    function init() {
      let shown = true;
      let $text = options.showText;
      let $percentage = options.showPercent;
      const $greyBar = $('<div>').addClass('pass-gray-bar');
      let $colorBar = $('<div>').addClass('pass-color-bar');
      const $insert = $('<div>').addClass('pass-wrapper').append(
        $greyBar.append($colorBar)
      );

      $object.closest(options.closestSelector).addClass('pass-strength-visible');
      if (options.animate) {
        $insert.css('display', 'none');
        shown = false;
        $object.closest(options.closestSelector).removeClass('pass-strength-visible');
      }

      if (options.showPercent) {
        $percentage = $('<span>').addClass('pass-percent').text('0%');
        $insert.append($percentage);
      }

      if (options.showText) {
        $text = $('<span>').addClass('pass-text').html(options.enterPass);
        $insert.append($text);
      }

      $object.closest(options.closestSelector).append($insert);

      $object.keyup(function() {
        let field = options.field || '';
        if (field) {
          field = $(field).val();
        }

        const score = calculateScore($object.val(), field);
        $object.trigger('password.score', [score]);
        const percent = score < 0 ? 0 : score;

        $colorBar = addColorBarStyle($colorBar, percent);

        if (options.showPercent) {
          $percentage.html(percent + '%');
        }

        if (options.showText) {
          let text = scoreText(score);
          if (!$object.val().length && score <= 0) {
            text = options.enterPass;
          }

          if ($text.html() !== $('<div>').html(text).html()) {
            $text.html(text);
            $object.trigger('password.text', [text, score]);
          }
        }
      });

      if (options.animate) {
        $object.focus(function() {
          if (!shown) {
            $insert.slideDown(options.animateSpeed, function () {
              shown = true;
              $object.closest(options.closestSelector).addClass('pass-strength-visible');
            });
          }
        });

        $object.blur(function() {
          if (!$object.val().length && shown) {
            $insert.slideUp(options.animateSpeed, function () {
              shown = false;
              $object.closest(options.closestSelector).removeClass('pass-strength-visible')
            });
          }
        });
      }

      return this;
    }

    return init.call(this);
  };

  // Bind to jquery
  $.fn.password = function(options) {
    return this.each(function() {
      new Password($(this), options);
    });
  };
})(jQuery);

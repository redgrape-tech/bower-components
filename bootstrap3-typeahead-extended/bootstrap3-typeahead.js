/* =============================================================
 * bootstrap3-typeahead.js v3.0.3
 * https://github.com/bassjobsen/Bootstrap-3-Typeahead
 * =============================================================
 * Original written by @mdo and @fat
 * =============================================================
 * Copyright 2014 Bass Jobsen @bassjobsen
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */


(function(root, factory) {

  "use strict";

  // CommonJS module is defined
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory(require('jquery')(root));
  }
  // AMD module is defined
  else if (typeof define === "function" && define.amd) {
    define("bootstrap3-typeahead", ["jquery"], function($) {
      return factory($);
    });
  } else {
    factory(root.jQuery);
  }

}(this, function($) {

  "use strict";
  // jshint laxcomma: true


 /* TYPEAHEAD PUBLIC CLASS DEFINITION
  * ================================= */

  var Typeahead = function (element, options) {
    var that = this;
    that.$element = $(element);
    that.options = $.extend({}, $.fn.typeahead.defaults, options);
    that.matcher = that.options.matcher || that.matcher;
    that.sorter = that.options.sorter || that.sorter;
    that.select = that.options.select || that.select;
    that.autoSelect = typeof that.options.autoSelect == 'boolean' ? that.options.autoSelect : true;
    that.highlighter = that.options.highlighter || that.highlighter;
    that.render = that.options.render || that.render;
    that.updater = that.options.updater || that.updater;
    that.source = that.options.source;
    that.delay = typeof that.options.delay == 'number' ? that.options.delay : 250;
    that.$menu = $(that.options.menu);
    that.shown = false;
    that.listen();
    that.autocompleteTriggers = that.options.autocompleteTriggers || [9, 13];
    that.showHintOnFocus = typeof that.options.showHintOnFocus == 'boolean' ? that.options.showHintOnFocus : false;
  };

  Typeahead.prototype = {

    constructor: Typeahead

  , select: function () {
      var val = this.$menu.find('.active').data('value');
      if(this.autoSelect || val) {
        this.$element
          .val(this.updater(val))
          .change();
      }
      return this.hide();
    }

  , updater: function (item) {
      return item;
    }

  , setSource: function (source) {
      this.source = source;
    }

  , show: function () {
      var pos = $.extend({}, this.$element.position(), {
        height: this.$element[0].offsetHeight
      }), scrollHeight;

      scrollHeight = typeof this.options.scrollHeight == 'function' ?
          this.options.scrollHeight.call() :
          this.options.scrollHeight;

      this.$menu
        .insertAfter(this.$element)
        .css({
          top: pos.top + pos.height + scrollHeight
        , left: pos.left
        })
        .show();

      this.shown = true;
      return this;
    }

  , hide: function () {
      this.$menu.hide();
      this.shown = false;
      return this;
    }

  , lookup: function (query) {
      var items;
      if (typeof(query) != 'undefined' && query !== null) {
        this.query = query;
      } else {
        this.query = this.$element.val() ||  '';
      }

      if ((this.query.length < this.options.minLength) && !this.showHintOnFocus) {
        return this.shown ? this.hide() : this;
      }

      var worker = $.proxy(function() {
        items = $.isFunction(this.source) ? this.source(this.query, $.proxy(this.process, this)) : this.source;
        if (items) {
          this.process(items);
        }
      }, this)

      clearTimeout(this.lookupWorker)
      this.lookupWorker = setTimeout(worker, this.delay)
    }

  , process: function (items) {
      var that = this;

      items = $.grep(items, function (item) {
        return that.matcher(item);
      });

      items = this.sorter(items);

      if (!items.length) {
        return this.shown ? this.hide() : this;
      }

      if (this.options.items == 'all') {
        return this.render(items).show();
      } else {
        return this.render(items.slice(0, this.options.items)).show();
      }
    }

  , matcher: function (item) {
      return ~item.toLowerCase().indexOf(this.query.toLowerCase());
    }

  , sorter: function (items) {
      var beginswith = []
        , caseSensitive = []
        , caseInsensitive = []
        , item;

      while ((item = items.shift())) {
        if (!item.toLowerCase().indexOf(this.query.toLowerCase())) beginswith.push(item);
        else if (~item.indexOf(this.query)) caseSensitive.push(item);
        else caseInsensitive.push(item);
      }

      return beginswith.concat(caseSensitive, caseInsensitive);
    }

  , highlighter: function (item) {
          var html = $('<div></div>');
          var query = this.query;
          var i = item.indexOf(query);
          var len, leftPart, middlePart, rightPart, strong;
          len = query.length;
          if(len == 0){
              return html.text(item).html();
          }
          while (i > -1) {
              leftPart = item.substr(0, i);
              middlePart = item.substr(i, len);
              rightPart = item.substr(i + len);
              strong = $('<strong></strong>').text(middlePart);
              html
                  .append(document.createTextNode(leftPart))
                  .append(strong);
              item = rightPart;
              i = item.indexOf(query);
          }
          return html.append(document.createTextNode(item)).html();
    }

  , render: function (items) {
      var that = this;

      items = $(items).map(function (i, item) {
        i = $(that.options.item).data('value', item);
        i.find('a').html(that.highlighter(item));
        return i[0];
      });

      if (this.autoSelect) {
        items.first().addClass('active');
      }
      this.$menu.html(items);
      return this;
    }

  , next: function (event) {
      var active = this.$menu.find('.active').removeClass('active')
        , next = active.next();

      if (!next.length) {
        next = $(this.$menu.find('li')[0]);
      }

      next.addClass('active');
    }

  , prev: function (event) {
      var active = this.$menu.find('.active').removeClass('active')
        , prev = active.prev();

      if (!prev.length) {
        prev = this.$menu.find('li').last();
      }

      prev.addClass('active');
    }

  , listen: function () {
      this.$element
        .on('focus',    $.proxy(this.focus, this))
        .on('blur',     $.proxy(this.blur, this))
        .on('keypress', $.proxy(this.keypress, this))
        .on('keyup',    $.proxy(this.keyup, this));

      if (this.eventSupported('keydown')) {
        this.$element.on('keydown', $.proxy(this.keydown, this));
      }

      this.$menu
        .on('click', $.proxy(this.click, this))
        .on('mouseenter', 'li', $.proxy(this.mouseenter, this))
        .on('mouseleave', 'li', $.proxy(this.mouseleave, this));
    }
  , destroy : function () {
      this.$element.data('typeahead',null);
      this.$element
        .off('focus')
        .off('blur')
        .off('keypress')
        .off('keyup');

      if (this.eventSupported('keydown')) {
        this.$element.off('keydown');
      }

      this.$menu.remove();
    }
  , eventSupported: function(eventName) {
      var isSupported = eventName in this.$element;
      if (!isSupported) {
        this.$element.setAttribute(eventName, 'return;');
        isSupported = typeof this.$element[eventName] === 'function';
      }
      return isSupported;
    }

  , move: function (e) {
      if (!this.shown) return;

      switch(e.keyCode) {
        case 9: // tab
        case 13: // enter
        case 27: // escape
          e.preventDefault();
          break;

        case 38: // up arrow
          // with the shiftKey (this is actually the left parenthesis)
          if (e.shiftKey) return;
          e.preventDefault();
          this.prev();
          break;

        case 40: // down arrow
          // with the shiftKey (this is actually the right parenthesis)
          if (e.shiftKey) return;
          e.preventDefault();
          this.next();
          break;
      }

      e.stopPropagation();
    }

  , keydown: function (e) {
      this.suppressKeyPressRepeat = ~$.inArray(e.keyCode, [40,38,9,13,27]);
      if (!this.shown && e.keyCode == 40) {
        this.lookup("");
      } else {
        this.move(e);
      }
    }

  , keypress: function (e) {
      if (this.suppressKeyPressRepeat) return;
      this.move(e);
    }

  , keyup: function (e) {
    var kCode = e.keyCode;

    // Autocomplete triggers?
    if (this.autocompleteTriggers.indexOf(kCode) !== -1) {
      if (!this.shown) return;
      this.select();
    }
    else {
      switch(kCode) {
        case 40: // down arrow
        case 38: // up arrow
        case 16: // shift
        case 17: // ctrl
        case 18: // alt
          break;

        case 27: // escape
          if (!this.shown) return;
          this.hide();
          break;
        default:
          this.lookup();
      }

    }

      e.stopPropagation();
      e.preventDefault();
  }

  , focus: function (e) {
      if (!this.focused) {
        this.focused = true;
        if (this.options.minLength === 0 && !this.$element.val() || this.options.showHintOnFocus) {
          this.lookup();
        }
      }
    }

  , blur: function (e) {
      this.focused = false;
      if (!this.mousedover && this.shown) this.hide();
    }

  , click: function (e) {
      e.stopPropagation();
      e.preventDefault();
      this.select();
      this.$element.focus();
    }

  , mouseenter: function (e) {
      this.mousedover = true;
      this.$menu.find('.active').removeClass('active');
      $(e.currentTarget).addClass('active');
    }

  , mouseleave: function (e) {
      this.mousedover = false;
      if (!this.focused && this.shown) this.hide();
    }

  };


  /* TYPEAHEAD PLUGIN DEFINITION
   * =========================== */

  var old = $.fn.typeahead;

  $.fn.typeahead = function (option) {
	var arg = arguments;
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('typeahead')
        , options = typeof option == 'object' && option;
      if (!data) $this.data('typeahead', (data = new Typeahead(this, options)));
      if (typeof option == 'string') {
        if (arg.length > 1) {
          data[option].apply(data, Array.prototype.slice.call(arg ,1));
        } else {
          data[option]();
        }
      }
    });
  };

  $.fn.typeahead.defaults = {
    source: []
  , items: 8
  , menu: '<ul class="typeahead dropdown-menu"></ul>'
  , item: '<li><a href="#"></a></li>'
  , minLength: 1
  , scrollHeight: 0
  , autoSelect: true
  };

  $.fn.typeahead.Constructor = Typeahead;


 /* TYPEAHEAD NO CONFLICT
  * =================== */

  $.fn.typeahead.noConflict = function () {
    $.fn.typeahead = old;
    return this;
  };


 /* TYPEAHEAD DATA-API
  * ================== */

  $(document).on('focus.typeahead.data-api', '[data-provide="typeahead"]', function (e) {
    var $this = $(this);
    if ($this.data('typeahead')) return;
    $this.typeahead($this.data());
  });

}));

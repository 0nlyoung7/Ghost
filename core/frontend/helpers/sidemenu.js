// ### Navigation Helper
// `{{sidemenu}}`
// Outputs sidemenu menu of static urls

var proxy = require('./proxy'),
    string = require('../../server/lib/security/string'),
    _ = require('lodash'),
    SafeString = proxy.SafeString,
    createFrame = proxy.hbs.handlebars.createFrame,
    i18n = proxy.i18n,
    errors = proxy.errors,
    templates = proxy.templates;

var menuData = require('../data/menu').data;

module.exports = function sidemenu(options) {
    options = options || {};
    options.hash = options.hash || {};
    options.data = options.data || {};

    var currentUrl = options.data.root.relativeUrl,
        self = this,
        output;

    var currentGroup = _getGroup(currentUrl) || [];
    var sidemenuData = menuData[currentGroup];

    if (!_.isObject(sidemenuData) || _.isFunction(sidemenuData)) {
      return;
    }

    if (sidemenuData.filter(function (e) {
        return (_.isUndefined(e.label) || _.isUndefined(e.url));
    }).length > 0) {
      return;
    }

    // check for non-null string values
    if (sidemenuData.filter(function (e) {
        return ((!_.isNull(e.label) && !_.isString(e.label)) ||
            (!_.isNull(e.url) && !_.isString(e.url)));
    }).length > 0) {
      return;
    }

    function _slugify(label) {
        return string.safe(label);
    }

    // strips trailing slashes and compares urls
    function _isCurrentUrl(href, currentUrl) {
        if (!currentUrl) {
            return false;
        }

        var strippedHref = href.replace(/\/+$/, ''),
            strippedCurrentUrl = currentUrl.replace(/\/+$/, '');
        return strippedHref === strippedCurrentUrl;
    }

    function _getGroup(url) {
      var temp = url.replace("/docs/", "");
      return temp.substring(0, temp.indexOf("/"));
    }

    // {{sidemenu}} should no-op if no data passed in
    if (sidemenuData.length === 0) {
        return new SafeString('');
    }

    output = sidemenuData.map(function (e) {
        var out = {};
        out.current = _isCurrentUrl(e.url, currentUrl);
        out.label = e.label;
        out.slug = _slugify(e.label);
        out.url = e.url;
        out.secure = self.secure;
        out.group = _getGroup(e.url);
        out.opened = (out.group === currentGroup);

        if (e.childs) {
          out.childs = e.childs.map(function (n) {
            var node = {};
            node.url = n.url;
            node.label = n.label;
            node.current = _isCurrentUrl(n.url, currentUrl);
            return node;
          });
        }

        return out;
    });

    // CASE: The sidemenu helper should have access to the sidemenu items at the top level.
    this.sidemenu = output;
    // CASE: The sidemenu helper will forward attributes passed to it.
    _.merge(this, options.hash);
    const data = createFrame(options.data);
    return templates.execute('sidemenu', this, {data});
};

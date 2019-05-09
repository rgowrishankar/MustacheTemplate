const Mustache = require('mustache');
const objectPath = require('object-path');

const BaseTemplateController = require('./BaseTemplateController');


module.exports = class MustacheTemplateController extends BaseTemplateController {
  constructor(params) {
    params.finalizerString = params.finalizerString || 'children.mustachetemplate.kapitan.razee.io';
    super(params);
  }

  async _stringify(o) {
    return JSON.stringify(o);
  }

  async _parse(s) {
    return JSON.parse(s);
  }

  async processTemplate(templates, view) {
    let customTags = objectPath.get(this.data, ['object', 'spec', 'custom-tags']);
    let tempTags = Mustache.tags;
    if (customTags) {
      Mustache.tags = customTags;
    }
    let templatesString = await this._stringify(templates);
    let resultString = Mustache.render(templatesString, view);
    let result = await this._parse(resultString);
    Mustache.tags = tempTags;
    return result;
  }

};

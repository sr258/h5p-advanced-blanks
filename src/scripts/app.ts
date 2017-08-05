import * as $ from 'jquery';

declare var H5P: any;
declare var H5PIntegration: any;

export default class AdvancedBlanks extends (H5P.EventDispatcher as { new(): any; }) {
  /**
   * @constructor
   *
   * @param {object} config
   * @param {string} contentId
   * @param {object} contentData
   */
  constructor(config: any, contentId: string, contentData: any = {}) {
    super();
    this.element = document.createElement('div');
    this.element.innerText = '-Advanced blanks content-';
  }
  
  /**
   * Attach library to wrapper
   *
   * @param {jQuery} $wrapper
   */
  attach = function($wrapper: JQuery) {
    $wrapper.get(0).classList.add('h5p-advanced-blanks');
    $wrapper.get(0).appendChild(this.element);
  }  
}
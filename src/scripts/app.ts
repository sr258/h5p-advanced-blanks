import * as $ from 'jquery';
import { H5PDataRepository } from './data-repository';
import { MindTheGapController } from './mind-the-gap-controller';
import { H5PLocalization } from "./localization";

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

      var repository = new H5PDataRepository(config);      
      H5PLocalization.initialize(config);
      var app : MindTheGapController = new MindTheGapController(repository);
      app.initialize();
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
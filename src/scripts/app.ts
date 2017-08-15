import * as $ from 'jquery';
import { H5PDataRepository, IDataRepository } from './services/data-repository';
import { AdvancedBlanksController } from './controllers/advanced-blanks-controller';
import { H5PLocalization } from "./services/localization";
import { ISettings, H5PSettings } from "./services/settings";

export default class AdvancedBlanks extends (H5P.Question as { new(): any; }) {
  private app: AdvancedBlanksController;
  private repository: IDataRepository;
  private settings: ISettings;

  private contentContainer: JQuery;
  private jQuery: JQuery = H5P.jQuery;

  /**
   * @constructor
   *
   * @param {object} config
   * @param {string} contentId
   * @param {object} contentData
   */
  constructor(config: any, contentId: string, contentData: any = {}) {
    super();

    this.settings = new H5PSettings(config);
    this.repository = new H5PDataRepository(config, this.settings);
    H5PLocalization.getInstance(config);
  }

  /**
   * Overrides the attach method of the superclass (H5P.Question) and calls it
   * at the same time. (equivalent to super.attach($container)).
   * This is necessary, as Ractive needs to be initialized with an existing DOM
   * element. DOM elements are created in H5P.Question.attach, so initializing 
   * Ractive in registerDomElements doesn't work.
   */
  attach = (function (original) {
    return function ($container) {
      original($container);
      this.app = new AdvancedBlanksController(this.repository, $container, this.settings);
      this.app.initialize(this.container.get(0));
    }
  })(this.attach);

  /**
   * Called by H5P.Question.attach(). 
   */
  registerDomElements = function () {
    this.container = this.jQuery("<div/>", { "class": "h5p-advanced-blanks" });
    this.setContent(this.container);
  }
}
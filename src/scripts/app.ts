import * as $ from 'jquery';
import { H5PDataRepository, IDataRepository } from './data-repository';
import { MindTheGapController } from './mind-the-gap-controller';
import { H5PLocalization } from "./localization";

export default class AdvancedBlanks extends (H5P.EventDispatcher as { new(): any; }) {
  private app: MindTheGapController;
  private repository: IDataRepository;

  /**
   * @constructor
   *
   * @param {object} config
   * @param {string} contentId
   * @param {object} contentData
   */
  constructor(config: any, contentId: string, contentData: any = {}) {
    super();

    this.repository = new H5PDataRepository(config);
    H5PLocalization.initialize(config);
  }

  /**
   * Attach library to wrapper
   *
   * @param {jQuery} $wrapper
   */
  attach = function ($wrapper: JQuery) {
    $wrapper.get(0).classList.add('h5p-advanced-blanks');
    this.app = new MindTheGapController(this.repository, $wrapper);
    this.app.initialize($wrapper.get(0));
  }
}
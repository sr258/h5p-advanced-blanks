import { H5PDataRepository, IDataRepository } from './services/data-repository';
import { AdvancedBlanksController } from './controllers/advanced-blanks-controller';
import { H5PLocalization, LocalizationLabels, LocalizationStructures } from "./services/localization";
import { ISettings, H5PSettings } from "./services/settings";

enum States {
  ongoing = 'ongoing',
  checking = 'checking',
  showing_solution = 'showing-solution',
  finished = 'finished'
}

export default class AdvancedBlanks extends (H5P.Question as { new(): any; }) {

  private clozeController: AdvancedBlanksController;
  private repository: IDataRepository;
  private settings: ISettings;
  private localization: H5PLocalization;

  private contentContainer: JQuery;
  private jQuery = H5P.jQuery;

  private contentId: string;
  private state: States;

  /**
   * @constructor
   *
   * @param {object} config
   * @param {string} contentId
   * @param {object} contentData
   */
  constructor(config: any, contentId: string, contentData: any = {}) {
    super();

    this.contentId = contentId;

    this.settings = new H5PSettings(config);
    this.localization = new H5PLocalization(config);
    this.repository = new H5PDataRepository(config, this.settings, this.localization);
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
      this.clozeController = new AdvancedBlanksController(this.repository, $container, this.settings, this.localization);
      this.clozeController.initialize(this.container.get(0));
    }
  })(this.attach);

  /**
   * Called by H5P.Question.attach(). Creates all content elements and registers them
   * with H5P.Question.
   */
  registerDomElements = function () {
    this.container = this.jQuery("<div/>", { "class": "h5p-advanced-blanks" });
    this.setContent(this.container);
    this.registerButtons();

    this.moveToState(States.ongoing);
  }

  /**
   * @returns JQuery - The outer h5p container. The library can add dialogues to this
   * element. 
   */
  private getH5pContainer(): JQuery {
    var $content = this.jQuery('[data-content-id="' + this.contentId + '"].h5p-content');
    var $containerParents = $content.parents('.h5p-container');

    // select find container to attach dialogs to
    var $container;
    if ($containerParents.length !== 0) {
      // use parent highest up if any
      $container = $containerParents.last();
    }
    else if ($content.length !== 0) {
      $container = $content;
    }
    else {
      $container = this.jQuery(document.body);
    }

    return $container;
  }

  private registerButtons() {
    var $container = this.getH5pContainer();

    if (!this.settings.autoCheck) {
      // Check answer button
      this.addButton('check-answer', this.localization.getTextFromLabel(LocalizationLabels.checkAllButton),
        () => {
          this.clozeController.checkAll();
          if (this.clozeController.isSolved) {
            this.moveToState(States.finished);
          } else {
            this.moveToState(States.checking);
          }
        }, true, {}, {
          confirmationDialog: {
            enable: this.settings.confirmCheckDialog,
            l10n: this.localization.getObjectForStructure(LocalizationStructures.confirmCheck),
            instance: this,
            $parentElement: $container
          }
        });
    }

    // Show solution button
    this.addButton('show-solution', this.localization.getTextFromLabel(LocalizationLabels.showSolutionButton),
      () => { this.moveToState(States.showing_solution) }, this.settings.enableSolutionsButton);

    // Try again button
    if (this.settings.enableRetry === true) {
      this.addButton('try-again', this.localization.getTextFromLabel(LocalizationLabels.retryButton),
        () => {
          this.clozeController.reset();
          this.moveToState(States.ongoing);
        }, true, {}, {
          confirmationDialog: {
            enable: this.settings.confirmRetryDialog,
            l10n: this.localization.getObjectForStructure(LocalizationStructures.confirmRetry),
            instance: this,
            $parentElement: $container
          }
        });
    }
  }

  /**
   * Shows are hides buttons depending on the current state and settings made
   * by the content creator.
   * @param  {States} state
   */
  private moveToState(state: States) {
    this.state = state;

    if (this.settings.enableSolutionsButton) {
      if (state === States.checking) {
        this.showButton('show-solution');
      }
      else {
        this.hideButton('show-solution');
      }
    }

    if (this.settings.enableRetry) {
      if (state === States.checking || state === States.showing_solution) {
        this.showButton('try-again');
      }
      else {
        this.hideButton('try-again');
      }
    }

    if (state === States.ongoing) {
      this.showButton('check-answer');
    }
    else {
      this.hideButton('check-answer');
    }

    this.trigger('resize');
  };
}
import { BlankLoader } from './content-loaders/blank-loader';
import { H5PDataRepository, IDataRepository } from './services/data-repository';
import { ClozeController } from './controllers/cloze-controller';
import { H5PLocalization, LocalizationLabels, LocalizationStructures } from "./services/localization";
import { ISettings, H5PSettings } from "./services/settings";
import { MessageService } from './services/message-service';
import { Unrwapper } from './helpers/unwrapper';
import { XAPIActivityDefinition } from './models/xapi';
import { extend } from './helpers/extend';

enum States {
  ongoing = 'ongoing',
  checking = 'checking',
  showingSolutions = 'showing-solution',
  finished = 'finished',
  showingSolutionsEmbedded = 'showing-solution-embedded'
}

const XAPI_ALTERNATIVE_EXTENSION = 'https://h5p.org/x-api/alternatives';
const XAPI_CASE_SENSITIVITY = 'https://h5p.org/x-api/case-sensitivity';
const XAPI_REPORTING_VERSION_EXTENSION = 'https://h5p.org/x-api/h5p-reporting-version';

export default class AdvancedBlanks extends (H5P.Question as { new(): any; }) {

  private clozeController: ClozeController;
  private repository: IDataRepository;
  private settings: ISettings;
  private localization: H5PLocalization;
  private messageService: MessageService;

  private jQuery;

  private contentId: string;
  private previousState: any;
  private state: States;

  /**
   * Indicates if user has entered any answer so far.
   */
  private answered: boolean = false;

  /**
   * @constructor
   *
   * @param {object} config
   * @param {string} contentId
   * @param {object} contentData
   */
  constructor(config: any, contentId: string, contentData: any = {}) {
    super();

    // Set mandatory default values for editor widgets that create content type instances
    config = extend({
      content: {
        blanksText: ''
      },
      behaviour: {
        mode: 'typing',
        selectAlternatives: 'alternatives'
      },
      submitAnswer: 'Submit',
    }, config);

    this.jQuery = H5P.jQuery;
    this.contentId = contentId;
    this.contentData = contentData;

    let unwrapper = new Unrwapper(this.jQuery);

    this.settings = new H5PSettings(config);
    this.localization = new H5PLocalization(config);
    this.repository = new H5PDataRepository(config, this.settings, this.localization, <JQueryStatic>this.jQuery, unwrapper);
    this.messageService = new MessageService(this.jQuery);
    BlankLoader.initialize(this.settings, this.localization, this.jQuery, this.messageService);

    this.clozeController = new ClozeController(this.repository, this.settings, this.localization, this.messageService);

    this.clozeController.onScoreChanged = this.onScoreChanged;
    this.clozeController.onSolved = this.onSolved;
    this.clozeController.onTyped = this.onTyped;
    this.clozeController.onTextChanged = () => this.triggerXAPI('interacted');

    if (contentData && contentData.previousState)
      this.previousState = contentData.previousState;

    /**
    * Overrides the attach method of the superclass (H5P.Question) and calls it
    * at the same time. (equivalent to super.attach($container)).
    * This is necessary, as Ractive needs to be initialized with an existing DOM
    * element. DOM elements are created in H5P.Question.attach, so initializing
    * Ractive in registerDomElements doesn't work.
    */
    this.attach = ((original) => {
      return ($container) => {
        original($container);
        this.clozeController.initialize(this.container.get(0), $container);
        if (this.clozeController.deserializeCloze(this.previousState)) {
          this.answered = this.clozeController.isFilledOut;
          this.toggleButtonVisibility(this.state);
        }
      }
    })(this.attach);
  }

  /**
   * Called from outside when the score of the cloze has changed.
   */
  private onScoreChanged = (score: number, maxScore: number) => {
    if (this.clozeController.isFullyFilledOut) {
      this.transitionState();
      if (this.state !== States.finished)
        this.state = States.checking;
      this.showFeedback();
    }
    else {
      this.setFeedback("", score, maxScore);
    }
    this.transitionState();
    this.toggleButtonVisibility(this.state);
  }

  private onSolved() {

  }

  private onTyped = () => {
    if (this.state === States.checking) {
      this.state = States.ongoing;
      this.toggleButtonVisibility(this.state);
    }
    this.answered = true;
  }

  /**
   * Called by H5P.Question.attach(). Creates all content elements and registers them
   * with H5P.Question.
   */
  registerDomElements = function () {
    this.registerMedia();
    this.setIntroduction(this.repository.getTaskDescription());

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

  private registerMedia() {
    var media = this.repository.getMedia();
    if (!media || !media.library)
      return;

    var type = media.library.split(' ')[0];
    if (type === 'H5P.Image') {
      if (media.params.file) {
        this.setImage(media.params.file.path, {
          disableImageZooming: this.settings.disableImageZooming,
          alt: media.params.alt
        });
      }
    }
    else if (type === 'H5P.Video') {
      if (media.params.sources) {
        this.setVideo(media);
      }
    }
  }

  private registerButtons() {
    var $container = this.getH5pContainer();

    // Check answer button
    this.addButton('check-answer', this.localization.getTextFromLabel(LocalizationLabels.checkAllButton),
      this.onCheckAnswer, true, {}, {
        confirmationDialog: {
          enable: this.settings.confirmCheckDialog,
          l10n: this.localization.getObjectForStructure(LocalizationStructures.confirmCheck),
          instance: this,
          $parentElement: $container,
        },
        contentData: this.contentData,
        textIfSubmitting: this.localization.getTextFromLabel(LocalizationLabels.submitAllButton),
    });

    // Show solution button
    this.addButton('show-solution', this.localization.getTextFromLabel(LocalizationLabels.showSolutionButton),
      this.onShowSolution, this.settings.enableSolutionsButton);

    // Try again button
    if (this.settings.enableRetry === true) {
      this.addButton('try-again', this.localization.getTextFromLabel(LocalizationLabels.retryButton),
        this.onRetry, true, {}, {
        confirmationDialog: {
          enable: this.settings.confirmRetryDialog,
          l10n: this.localization.getObjectForStructure(LocalizationStructures.confirmRetry),
          instance: this,
          $parentElement: $container
        }
      });
    }
  }

  private onCheckAnswer = () => {
    this.clozeController.checkAll();

    this.triggerXAPI('interacted');
    this.triggerXAPIAnswered();

    this.transitionState();
    if (this.state !== States.finished)
      this.state = States.checking;

    this.showFeedback();

    this.toggleButtonVisibility(this.state);
  }

  private transitionState = () => {
    if (this.clozeController.isSolved) {
      this.moveToState(States.finished);
    }
  }

  private onShowSolution = () => {
    this.moveToState(States.showingSolutions);
    this.clozeController.showSolutions();
    this.showFeedback();
  }

  private onRetry = () => {
    this.removeFeedback();
    this.clozeController.reset();
    this.answered = false;
    this.moveToState(States.ongoing);
    // Reset timer
    this.setActivityStarted(true);
  }

  private showFeedback() {
    var scoreText = H5P.Question.determineOverallFeedback(this.localization.getObjectForStructure(LocalizationStructures.overallFeedback), this.clozeController.currentScore / this.clozeController.maxScore).replace('@score', this.clozeController.currentScore).replace('@total', this.clozeController.maxScore);
    this.setFeedback(scoreText, this.clozeController.currentScore, this.clozeController.maxScore, this.localization.getTextFromLabel(LocalizationLabels.scoreBarLabel));
  }

  /**
   * Shows are hides buttons depending on the current state and settings made
   * by the content creator.
   * @param  {States} state
   */
  private moveToState(state: States) {
    this.state = state;
    this.toggleButtonVisibility(state);
  }

  private toggleButtonVisibility(state: States) {
    if (this.settings.enableSolutionsButton) {
      if ((state === States.checking)
        && (!this.settings.showSolutionsRequiresInput || this.clozeController.allBlanksEntered)) {
        this.showButton('show-solution');
      }
      else {
        this.hideButton('show-solution');
      }
    }

    if (this.settings.enableRetry && (state === States.checking || state === States.finished || state === States.showingSolutions)) {
      this.showButton('try-again');
    }
    else {
      this.hideButton('try-again');
    }


    if (state === States.ongoing && this.settings.enableCheckButton) {
      this.showButton('check-answer');
    }
    else {
      this.hideButton('check-answer');
    }

    if (state === States.showingSolutionsEmbedded) {
      this.hideButton('check-answer');
      this.hideButton('try-again');
      this.hideButton('show-solution');
    }

    this.trigger('resize');
  }

  public getCurrentState = (): string[] => {
    return this.clozeController.serializeCloze();
  };

  /****************************************
   * Implementation of Question contract  *
   ****************************************/
  public getAnswerGiven = (): boolean => {
    return this.answered || this.clozeController.maxScore === 0;
  }

  public getScore = (): number => {
    return this.clozeController.currentScore;
  }

  public getMaxScore = (): number => {
    return this.clozeController.maxScore;
  }

  public showSolutions = () => {
    this.onShowSolution();
    this.moveToState(States.showingSolutionsEmbedded);
  }

  public resetTask = () => {
    this.onRetry();
  }

  /***
   * XApi implementation
   */


  /**
   * Trigger xAPI answered event
   */
  public triggerXAPIAnswered = (): void => {
    this.answered = true;
    var xAPIEvent = this.createXAPIEventTemplate('answered');
    this.addQuestionToXAPI(xAPIEvent);
    this.addResponseToXAPI(xAPIEvent);
    this.trigger(xAPIEvent);
  };

  /**
   * Get xAPI data.
   * Contract used by report rendering engine.
   *
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
   */
  public getXAPIData = () => {
    var xAPIEvent = this.createXAPIEventTemplate('answered');
    this.addQuestionToXAPI(xAPIEvent);
    this.addResponseToXAPI(xAPIEvent);
    return {
      statement: xAPIEvent.data.statement
    };
  };

  /**
   * Generate xAPI object definition used in xAPI statements.
   * @return {Object}
   */
  public getxAPIDefinition = (): XAPIActivityDefinition => {
    const definition = new XAPIActivityDefinition();

    definition.description = {
      'en-US': '<p>' + this.repository.getTaskDescription() + '</p>' + this.repository.getClozeText().replace(/__(_)+/g, '__________').replace(/!!/g, '')
    };

    definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction';
    definition.interactionType = 'fill-in'; // We use the 'fill-in' type even in select mode, as the xAPI format for selections doesn't really cater for sequences.

    const correctResponsesPatternPrefix = '{case_matters=' + this.settings.caseSensitive + '}';

    const correctAnswerList = this.clozeController.getCorrectAnswerList();

    // H5P uses extension instead of full correct responses pattern to counter complexity
    const firstAlternatives = correctAnswerList.reduce((result, list) => {
      result.push(list[0]);
      return result;
    }, []).join('[,]');
    definition.correctResponsesPattern = [`${correctResponsesPatternPrefix}${firstAlternatives}`];

    // Add the H5P Alternative extension which provides all the combinations of different answers
    // Reporting software will need to support this extension for alternatives to work.
    definition.extensions = definition.extensions || {};
    definition.extensions[XAPI_CASE_SENSITIVITY] = this.settings.caseSensitive;
    definition.extensions[XAPI_ALTERNATIVE_EXTENSION] = correctAnswerList;

    return definition;
  };

  /**
   * Add the question itself to the definition part of an xAPIEvent
   */
  public addQuestionToXAPI = (xAPIEvent) => {
    var definition = xAPIEvent.getVerifiedStatementValue(['object', 'definition']);
    this.jQuery.extend(true, definition, this.getxAPIDefinition());

    // Set reporting module version if alternative extension is used
    if (this.clozeController.hasAlternatives) {
      const context = xAPIEvent.getVerifiedStatementValue(['context']);
      context.extensions = context.extensions || {};
      context.extensions[XAPI_REPORTING_VERSION_EXTENSION] = '1.0.0';
    }
  };

  /**
   * Add the response part to an xAPI event
   *
   * @param {H5P.XAPIEvent} xAPIEvent
   *  The xAPI event we will add a response to
   */
  public addResponseToXAPI = (xAPIEvent) => {
    xAPIEvent.setScoredResult(this.clozeController.currentScore, this.clozeController.maxScore, this);
    xAPIEvent.data.statement.result.response = this.getxAPIResponse();
  };

  /**
   * Generate xAPI user response, used in xAPI statements.
   * @return {string} User answers separated by the "[,]" pattern
   */
  public getxAPIResponse = (): string => {
    var usersAnswers = this.getCurrentState();
    return usersAnswers.join('[,]');
  };
}

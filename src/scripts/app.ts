import { BlankLoader } from './content-loaders/blank-loader';
import { H5PDataRepository, IDataRepository } from './services/data-repository';
import { ClozeController } from './controllers/cloze-controller';
import { H5PLocalization, LocalizationLabels, LocalizationStructures } from "./services/localization";
import { ISettings, H5PSettings } from "./services/settings";
import { MessageService } from './services/message-service';
import { Unrwapper } from './helpers/unwrapper';


enum States {
  ongoing = 'ongoing',
  checking = 'checking',
  showingSolutions = 'showing-solution',
  finished = 'finished',
  showingSolutionsEmbedded ='showing-solution-embedded'
}

export default class AdvancedBlanks extends (H5P.Question as { new(): any; }) {

  private clozeController: ClozeController;
  private repository: IDataRepository;
  private settings: ISettings;
  private localization: H5PLocalization;
  private messageService: MessageService;

  private jQuery;

  private contentId: string;
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

    this.jQuery = H5P.jQuery;
    this.contentId = contentId;

    let unwrapper = new Unrwapper(this.jQuery);

    this.settings = new H5PSettings(config);
    this.localization = new H5PLocalization(config);
    this.repository = new H5PDataRepository(config, this.settings, this.localization, <JQueryStatic>this.jQuery, unwrapper);
    this.messageService = new MessageService(this.jQuery);
    BlankLoader.initialize(this.settings, this.localization, this.jQuery, this.messageService);

    this.clozeController = new ClozeController(this.repository, this.settings, this.localization, this.messageService);

    this.clozeController.onScoreChanged = this.onScoreChanged;
    this.clozeController.onSolved = this.onSolved;
    if (!this.settings.autoCheck)
      this.clozeController.onTyped = this.onTyped;

    if (contentData && contentData.previousState)
      this.previousState = contentData.previousState;
  }

  private onScoreChanged = (score: number, maxScore: number) => {
    this.triggerXAPI('interacted');
    this.setFeedback("", score, maxScore);
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
   * Overrides the attach method of the superclass (H5P.Question) and calls it
   * at the same time. (equivalent to super.attach($container)).
   * This is necessary, as Ractive needs to be initialized with an existing DOM
   * element. DOM elements are created in H5P.Question.attach, so initializing 
   * Ractive in registerDomElements doesn't work.
   */
  attach = (function (original) {
    return function ($container) {
      original($container);
      this.clozeController.initialize(this.container.get(0), $container);
      if (this.clozeController.deserializeCloze(this.previousState)) {
        this.transitionState();
        if (this.clozeController.allBlanksEntered && this.state !== States.finished)
          this.state = States.checking;
        this.toggleButtonVisibility(this.state);
      }
    }
  })(this.attach);

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

    if (!this.settings.autoCheck) {
      // Check answer button
      this.addButton('check-answer', this.localization.getTextFromLabel(LocalizationLabels.checkAllButton),
        this.onCheckAnswer, true, {}, {
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
    this.transitionState();
    if (this.state !== States.finished)
      this.state = States.checking;
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
  }

  private onRetry = () => {
    this.removeFeedback();
    this.clozeController.reset();
    this.moveToState(States.ongoing);
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
      if (((state === States.checking)
        || (this.settings.autoCheck && state === States.ongoing))
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


    if (state === States.ongoing) {
      this.showButton('check-answer');
    }
    else {
      this.hideButton('check-answer');
    }

    if(state === States.showingSolutionsEmbedded) {
      this.hideButton('check-answer');
      this.hideButton('try-again');
      this.hideButton('show-solution');
    }    

    this.trigger('resize');
  }

  public getCurrentState = () => {
    return this.clozeController.serializeCloze();
  };

  /****************************************
   * Implementation of Question contract  *
   ****************************************/
  public getAnswerGiven = () : boolean => {
    return this.answered || this.clozeController.maxScore === 0;
  }

  public getScore = () : number => {
    return this.clozeController.currentScore;
  }

  public getMaxScore = () : number => {
    return this.clozeController.maxScore;
  }

  public showSolutions = () => {
    this.onShowSolution();
    this.moveToState(States.showingSolutionsEmbedded);
  }

  public resetTask = () => {
    this.onRetry();
  }

  public getXAPIData = () => {
    return null;
    // TODO: implement
  }
}
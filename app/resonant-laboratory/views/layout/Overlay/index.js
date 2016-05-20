import Underscore from 'underscore';
import Backbone from 'backbone';
import d3 from 'd3';
import jQuery from 'jquery';

// Modal overlay views
import HamburgerMenu from '../../overlays/HamburgerMenu';
import LoginView from '../../overlays/LoginView';
import RegisterView from '../../overlays/RegisterView';
import ResetPasswordView from '../../overlays/ResetPasswordView';
import AchievementLibrary from '../../overlays/AchievementLibrary';
import StartingScreen from '../../overlays/StartingScreen';
import DatasetLibrary from '../../overlays/DatasetLibrary';
import VisualizationLibrary from '../../overlays/VisualizationLibrary';
import ProjectSettings from '../../overlays/ProjectSettings';

import reallyBadErrorTemplate from './reallyBadErrorTemplate.html';
import errorTemplate from './errorTemplate.html';
import userErrorTemplate from './userErrorTemplate.html';
import successTemplate from './successTemplate.html';
import loadingTemplate from './loadingTemplate.html';

let VIEWS = {
  HamburgerMenu: HamburgerMenu,
  LoginView: LoginView,
  ResetPasswordView: ResetPasswordView,
  RegisterView: RegisterView,
  AchievementLibrary: AchievementLibrary,
  ProjectSettings: ProjectSettings,
  StartingScreen: StartingScreen,
  DatasetLibrary: DatasetLibrary,
  VisualizationLibrary: VisualizationLibrary
};

import './style.css';

let Overlay = Backbone.View.extend({
  initialize: function () {
    this.template = undefined;
    this.view = null;

    this.listenTo(window.mainPage, 'rl:changeProject',
      this.handleChangeProject);
    this.listenTo(window.mainPage, 'rl:error',
      this.handleError);
  },
  handleChangeProject: function () {
    if (window.mainPage.project === null) {
      // No project is loaded; show the StartingScreen
      this.render('StartingScreen');
    }
    // Otherwise, we just stay as we are (either no
    // overlay, or the overlay that just changed stuff
    // is responsible for picking the appropriate next
    // view)
  },
  handleError: function (errorObj) {
    let message;

    // Sometimes errors are wrapped in arrays...
    if (errorObj instanceof Array && errorObj.length) {
      errorObj = errorObj[0];
    }

    if (errorObj.responseJSON && errorObj.responseJSON.message) {
      message = errorObj.responseJSON.message;
    } else if (errorObj instanceof Error) {
      message = errorObj.message;
    } else {
      // Fallback if I can't tell what it is
      message = 'Unknown error; maybe the console contains some clues';
      console.warn('Unknown error! Here\'s what I was given:', arguments);
    }
    // Let the user know something funky is up
    this.renderReallyBadErrorScreen(message);

    // Actually throw the error if it's a real one
    if (errorObj instanceof Error) {
      throw errorObj;
    }
  },
  getScreen: function (template, message) {
    let options = {
      message: message,
      bugReportLink: 'mailto:alex.bigelow@kitware.com',
      consultingLink: 'http://www.kitware.com/company/contact_kitware.php'
    };
    return Underscore.template(template)(options);
  },
  renderLoadingScreen: function (message) {
    this.render(this.getScreen(loadingTemplate, message));
  },
  renderErrorScreen: function (message) {
    this.render(this.getScreen(errorTemplate, message));
  },
  renderUserErrorScreen: function (message) {
    this.render(this.getScreen(userErrorTemplate, message));
  },
  renderReallyBadErrorScreen: function (message) {
    this.render(this.getScreen(reallyBadErrorTemplate, message));
  },
  renderSuccessScreen: function (message) {
    this.render(this.getScreen(successTemplate, message));
  },
  closeOverlay: function () {
    // If we don't have a project, jump straight to the
    // opening overlay (don't actually close)
    if (window.mainPage.project) {
      window.mainPage.overlay.render(null);
    } else {
      window.mainPage.overlay.render('StartingScreen');
    }
  },
  addCloseListeners: function () {
    // Add a bunch of ways to close out of the overlay

    // Close button:
    this.$el.find('#closeOverlay').on('click', this.closeOverlay);

    // Clicking on the area outside the overlay:
    let self = this;
    this.$el.on('click', function (event) {
      // this refers to the DOM element
      if (event.target !== this) {
        return;
      } else {
        self.closeOverlay();
      }
    });

    // Hitting the escape key:
    jQuery(window).on('keyup', e => {
      if (e.keyCode === 27) {
        this.closeOverlay();
      }
    });
  },
  removeCloseListeners: function () {
    // Remove the ways to close out of the overlay
    // (both when the overlay is hidden, and when
    // one shows up that can't be closed)
    this.$el.find('#closeOverlay').off('click');
    this.$el.off('click');
    jQuery(window).off('keyup');
  },
  render: Underscore.debounce(function (template, nofade) {
    // Don't fade if we're just switching between overlays
    nofade = nofade || (template !== null && this.template !== null);

    if (template !== undefined && this.template !== template) {
      // Because we're switching, save the setting
      // for next time we simply re-render
      this.template = template;

      if (template === null) {
        // Hide the overlay
        this.removeCloseListeners();

        // Fade out
        if (nofade !== true) {
          d3.select(this.el)
            .style('opacity', 1.0)
            .transition().duration(400)
            .style('opacity', 0.0);
          window.setTimeout(() => {
            d3.select(this.el)
              .style('display', 'none');
            this.$el.html('');
            this.view = null;
          }, 500);
        } else {
          d3.select(this.el)
            .style('display', 'none');
          this.$el.html('');
          this.view = null;
        }
      } else {
        // Instantiate and add the new view
        if (template.prototype &&
          template.prototype instanceof Backbone.View) {
          // This is a View object already
          let Template = template;
          this.$el.html('');
          this.view = new Template();
          this.el.appendChild(this.view.el);
          this.view.render();
        } else if (VIEWS.hasOwnProperty(template)) {
          // This is a named template
          this.$el.html('');
          this.view = new VIEWS[template]({
            // Some girder views expect a parent, but
            // in this app, we just run them headless
            parentView: null
          });
          this.el.appendChild(this.view.el);
          this.view.render();
        } else {
          // Okay, this is a dynamically-generated overlay
          // (probably a widget help/info screen)... so
          // the template string is the actual contents
          this.view = null;
          this.$el.html(template);
        }

        if (this.$el.find('#closeOverlay').length !== 0) {
          // Does this view have a close button? If so,
          // attach the ways to close it
          this.addCloseListeners();
        } else {
          // If it doesn't, that means this is an
          // overlay where the user needs to do
          // something special (e.g. load a project)
          // in order to dismiss it
          this.removeCloseListeners();
        }

        // Fade in
        if (nofade !== true) {
          d3.select(this.el)
            .style('display', null)
            .style('opacity', 0.0)
            .transition().duration(400)
            .style('opacity', 1.0);
        } else {
          d3.select(this.el).style('opacity', 1.0);
        }
      }
      this.trigger('rl:changeOverlay');
    } else {
      // We're just re-rendering the view
      if (this.view !== null) {
        this.view.render();
      }
    }
  }, 300)
});

Overlay.VIEWS = VIEWS;
export default Overlay;
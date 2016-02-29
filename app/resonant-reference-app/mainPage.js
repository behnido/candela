import jQuery from 'jquery';

// Layout views
import myTemplate from './views/layout/mainPage/mainPage.html';
import Overlay from './views/layout/overlay/overlay.js';
import UserView from './views/layout/user/user.js';
import ToolsView from './views/layout/tools/tools.js';

// Page-wide Styles
import './stylesheets/pure-css-custom-form-elements/style.css';
import './stylesheets/tooltip/tooltip.css';
import './views/layout/mainPage/mainPage.css';

// Root model (containing all other models)
import User from './models/user';
window.user = new User();

// Set up the page
function renderEverything () {
  window.layout.overlay.render();
  window.layout.userView.render();
  window.layout.toolsView.render();
}

jQuery('body').append(myTemplate);

window.layout = {
  overlay: new Overlay({
    el: '#Overlay'
  }),
  userView: new UserView({
    model: window.user,
    el: '#UserView'
  }),
  toolsView: new ToolsView({
    model: window.user,
    el: '#ToolsView'
  })
};

jQuery(window).on('hashchange', renderEverything);
window.onresize = renderEverything;
renderEverything();
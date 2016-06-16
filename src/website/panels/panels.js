import uiRouter from 'angular-ui-router';
import ocLazyLoad from 'oclazyload';

function requireAll(requireContext) {
  return requireContext.keys().map(requireContext);
}

var moduleDescriptionContext = require.context("./", true, /^.*\/description\.js$/);

var moduleNames = _.map(moduleDescriptionContext.keys(), (k, i) => {
  var pos = k.indexOf('/');
  var pos2 = k.lastIndexOf('/');
  return k.substr(pos+1, pos2-pos-1);
});

const panels = _.map(requireAll(moduleDescriptionContext), m => m.default);

const panelsModule = registerAngularModule('app.panels', [uiRouter, ocLazyLoad])
   .run((panelsManager, $ocLazyLoad, $q) => {

     'ngInject';

     _.each(panels, (c, i) => {
       c.load = function() {
         var loadComponent = require('bundle?lazy&name=[folder]!./'+moduleNames[i]+'/index');
         return $q((resolve) => {
           loadComponent(function(module) {
             resolve($ocLazyLoad.load({name: module.default.name}));
           });
         });
       };
       panelsManager.registerPanel(moduleNames[i], c);
     });
   })
  .config(($stateProvider, $urlRouterProvider) => {

    'ngInject';

    $urlRouterProvider.otherwise(panels[0].url);

    _.each(panels, (c, i) =>
      $stateProvider
        .state(c.url, {
          url: '/' + c.url,
          template: '<panel data-name="'+moduleNames[i]+'"></panel>',
        }
      ));
  });

export default {
  module: panelsModule,
  panelsList : panels
};

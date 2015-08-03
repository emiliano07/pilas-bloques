import Ember from 'ember';

export default Ember.Controller.extend({
  version: Ember.inject.service(),

  currentVersion: function() {
    return this.get('version').getVersion();
  }.property('version'),

  actions: {
    visitWebsite() {
      var gui = window.requireNode('nw.gui');
      gui.Shell.openExternal("http://bloques.pilas-engine.com.ar");
    },

    searchUpdates() {
    }
  }
});

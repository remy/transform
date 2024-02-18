/* global Vue */
import * as plugins from './plugins.js';

Vue.prototype.navigator = window.navigator;

function applyRule(result, rule) {
  const plugin = plugins[rule.type];

  return plugin.handler(result, rule.value);
}

new Vue({
  el: '#app',
  filters: {
    display(s) {
      return JSON.stringify(s);
    },
    labelForRule(type) {
      return plugins[type].label;
    },
  },
  data: {
    plugins,
    source: document.querySelector('#source').value,
    newRule: Object.keys(plugins)[0],
    rules: [],
    error: null,
  },
  computed: {
    result() {
      this.updateURL();
      const rules = this.rules;
      let result = this.source.split('\n');
      this.error = null;
      // noprotect
      let i = 0;
      try {
        for (i = 0; i < rules.length; i++) {
          const rule = rules[i];
          if (result) {
            result = applyRule(result, rule);
          }
        }
      } catch (e) {
        this.error = i;
        console.log('failed at rule %s', rules[i].type, e);
      }

      return result;
    },
  },
  beforeMount() {
    const url = new URL(window.location);
    this.rules = Array.from(url.searchParams.entries(), ([type, value]) => {
      return { type, value: value === 'null' ? null : value };
    }).filter((rule) => {
      return !!plugins[rule.type];
    });

    this.source = sessionStorage.getItem('source') || '';
  },
  methods: {
    save(key, value) {
      sessionStorage.setItem(key, value);
    },
    copy(value) {
      this.navigator.clipboard.writeText(value);
    },
    updateURL() {
      const p = new URLSearchParams(
        this.rules.reduce((acc, curr) => {
          acc.push([curr.type, curr.value]);
          return acc;
        }, [])
      );

      history.replaceState({}, '', '?' + p.toString());
    },
    deleteRule(index) {
      this.rules.splice(index, 1);
    },
    defaultForRule(type) {
      const defaults = plugins[type].args;
      if (!defaults) return null;
      return defaults[0];
    },
  },
});

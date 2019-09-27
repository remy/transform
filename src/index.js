import * as plugins from './plugins.js';

function applyRule(result, rule) {
  const plugin = plugins[rule.type];

  return plugin.handler(result, rule.value);

  if (plugin.takes && plugin.takes.includes(Array)) {
    result = plugin.handler(result, rule.value);
    if (result === null) {
      return null;
    }
  }

  return result.reduce((acc, curr) => {
    const isArray = Array.isArray(curr);
    const isObject = !isArray && typeof curr === 'object';
    const isElse = !isArray && !isObject;

    if (isArray) {
      //       if (plugin.takes && plugin.takes.includes(Array)) {
      //         const res = plugin.handler(curr, rule.value);
      //         if (res !== null) {
      //           acc.push(res);
      //         }
      //         return acc;
      //       }

      const res = applyRule(curr, rule);
      if (res !== null) {
        acc.push(res);
      }
      return acc;
    }

    if (isObject) {
      curr = Object.entries(curr).reduce((acc, [key, value]) => {
        const res = applyRule([value], rule);
        if (res.length) {
          acc[key] = res[0];
        }
        return acc;
      }, {});

      if (plugin.takes && plugin.takes.includes(Object)) {
        const res = plugin.handler(curr, rule.value);
        if (res === null) {
          return acc;
        }
      }

      acc.push(curr);
      return acc;
    }

    const res = plugin.handler(curr, rule.value);
    if (res !== null) {
      acc.push(res);
    }
    return acc;
  }, []);
}

const app = new Vue({
  el: '#app',
  filters: {
    display(s) {
      return JSON.stringify(s);
    },
    labelForRule(type) {
      return plugins[type].label;
    }
  },
  data: {
    plugins,
    source: document.querySelector('#source').value,
    newRule: Object.keys(plugins)[0],
    rules: [],
    error: null
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
    }
  },
  beforeMount() {
    const url = new URL(window.location);
    this.rules = Array.from(url.searchParams.entries(), ([type, value]) => {
      return { type, value: value === 'null' ? null : value };
    }).filter(rule => {
      return !!plugins[rule.type];
    });

    this.source = sessionStorage.getItem('source') || '';
  },
  methods: {
    save(key, value) {
      sessionStorage.setItem(key, value);
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
    }
  }
});

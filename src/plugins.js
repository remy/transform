function walk(source, handler) {
  if (Array.isArray(source)) {
    return source.reduce((acc, curr) => {
      const res = walk(curr, handler);
      if (res !== null) acc.push(res);
      return acc;
    }, []);
  }

  if (typeof source === 'object') {
    return Object.keys(source).reduce((acc, curr) => {
      const res = walk(source[curr], handler);
      if (res !== null) acc[curr] = res;
      return acc;
    }, {});
  }

  return handler(source);
}

export const splitter = {
  id: 'splitter',
  name: 'Splitter',
  args: ['\t'],
  label: 'Split lines by',
  handler(source, value) {
    return walk(source, source => source.split(value));
  }
};

export const ignore = {
  id: 'ignore',
  name: 'Ignore match',
  label: 'Ignore if matches',
  args: [''],
  handler(source, value) {
    return walk(source, source => {
      if (value) {
        if (value.startsWith('/')) {
          value = value.slice(1, -1);
          if (new RegExp(value).test(source)) {
            return null;
          }
        } else {
          if (source.includes(value)) {
            return null;
          }
        }
      }
      return source;
    });
  }
};

export const strip = {
  id: 'strip',
  name: 'Strip match',
  label: 'Strip matching',
  args: [''],
  handler(source, value) {
    return walk(source, source => {
      if (value.startsWith('/')) {
        value = value.slice(1, -1);
      }

      return source.replace(new RegExp(value, 'g'), '');
    });
  }
};

export const replace = {
  id: 'replace',
  name: 'Replacer',
  args: ['///'],
  label: 'Replace /source/with/',
  handler(source, value) {
    const parts = value.split('/').slice(1, -1);
    if (parts[0] === undefined) parts[0] = '';
    if (parts[1] === undefined) parts[1] = '';

    return walk(source, value =>
      value.replace(new RegExp(parts[0], 'g'), parts[1])
    );
  }
};

export const merge = {
  id: 'merge',
  name: 'Merge elements',
  label: 'Merge every N elements',
  args: [2],
  takes: [Array],
  handler(source, value) {
    value = parseInt(value, 10);

    let temp = [];
    const res = source.reduce((acc, curr, i) => {
      temp.push(curr);

      if (i % value === value - 1) {
        acc.push(temp);
        temp = [];
      }

      return acc;
    }, []);

    if (temp.length > 0) {
      res.push(temp);
    }

    return res;
  }
};

export const dropEmpty = {
  id: 'dropEmpty',
  name: 'Drop empty',
  takes: [Array, Object],
  args: null,
  label: 'Drop empty elements',
  handler(source) {
    return walk(source, source => {
      if (Array.isArray(source)) {
        const content = source.filter(Boolean);

        if (content.length === 0) {
          return null;
        }

        return source;
      }

      if (typeof source === 'object') {
        if (Object.keys(source).length === 0) {
          return null;
        }
        return source;
      }

      if (!source || (typeof source === 'string' && !source.trim())) {
        return null;
      }

      return source;
    });
  }
};

export const map = {
  id: 'map',
  takes: [Array],
  name: 'Map to object',
  args: ['prop1, prop2'],
  label: 'Map array to object',
  handler(source, value) {
    if (Array.isArray(source)) {
      const fields = value.split(',').map(_ => _.trim());
      return source.reduce((acc, curr, i) => {
        acc[fields[i]] = curr;
        return acc;
      }, {});
    }

    return { [value]: source };
  }
};

export const trim = {
  id: 'trim',
  name: 'Trim',
  args: null,
  label: 'Trim whitespace',
  handler(source) {
    return walk(source, s => s.trim());
  }
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const custom = require('@digitalroute/cz-conventional-changelog-for-jira/configurable');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const defaultTypes = require('@digitalroute/cz-conventional-changelog-for-jira/types');

const emojiMap = new Map();

emojiMap.set('feat', '✨ feat');
emojiMap.set('fix', '🐛 fix');
emojiMap.set('docs', '📝 docs');
emojiMap.set('refactor', '🎨 refactor');
emojiMap.set('test', '🔬 test');
emojiMap.set('build', '🛠️ build');
emojiMap.set('ci', '🤖 ci');
emojiMap.set('chore', '🧟 chore');
emojiMap.set('revert', '⏪ revert');

const enhancedTypes = Object.entries(defaultTypes)
  .map(([key, value]) => ({
    [emojiMap?.get(key) ?? key]: { ...value },
  }))
  .reduce((prev, curr) => {
    return { ...prev, ...curr };
  }, {});

module.exports = custom({
  types: {
    ...enhancedTypes,
  },
});

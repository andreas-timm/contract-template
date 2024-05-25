let common = [
    './features/**/steps/**/*.feature',
    '--require ./libs/workspace/steps/*.ts',
    '--require ./features/**/step_definitions/**/*.ts',
    '--tags "not @ignore"',
  ];

if (process.env.GHERKIN_TAGS !== undefined) {
    common.push(`--tags "${process.env.GHERKIN_TAGS}"`)
}

module.exports = {
    default: common.join(' ')
}

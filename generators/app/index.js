'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var _ = require('lodash');
var extend = _.merge;
var parseAuthor = require('parse-author');
var path = require('path');
var githubUsername = require('github-username');
var askName = require('inquirer-npm-name');

module.exports = yeoman.Base.extend({
  constructor: function () {
    yeoman.Base.apply(this, arguments);

    this.option('travis', {
      type: Boolean,
      required: false,
      defaults: true,
      desc: 'Include travis config'
    });

    this.option('boilerplate', {
      type: Boolean,
      required: false,
      defaults: true,
      desc: 'Include boilerplate files'
    });

    this.option('gulp', {
      type: Boolean,
      required: false,
      defaults: true,
      desc: 'Include or not a gulpfile.js'
    });

    this.option('license', {
      type: Boolean,
      required: false,
      defaults: true,
      desc: 'Include a license'
    });

    this.option('name', {
      type: String,
      required: false,
      desc: 'Project name'
    });

    this.option('githubAccount', {
      type: String,
      required: false,
      desc: 'GitHub username or organization'
    });

    this.option('projectRoot', {
      type: String,
      required: false,
      defaults: 'lib',
      desc: 'Relative path to the project code root'
    });

    this.option('readme', {
      type: String,
      required: false,
      desc: 'Content to insert in the README.md file'
    });

    this.option('styles', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'Include CSS'
    });

    this.option('scss', {
      type: Boolean,
      required: false,
      defaults: true,
      desc: 'Use SCSS extension'
    });
  },

  initializing: function () {
    this.pkg = this.fs.readJSON(this.destinationPath('package.json'), {});

    // Pre set the default props from the information we have at this point
    this.props = {
      name: this.pkg.name,
      description: this.pkg.description,
      version: this.pkg.version,
      homepage: this.pkg.homepage
    };

    if (_.isObject(this.pkg.author)) {
      this.props.authorName = this.pkg.author.name;
      this.props.authorEmail = this.pkg.author.email;
      this.props.authorUrl = this.pkg.author.url;
    } else if (_.isString(this.pkg.author)) {
      var info = parseAuthor(this.pkg.author);
      this.props.authorName = info.name;
      this.props.authorEmail = info.email;
      this.props.authorUrl = info.url;
    }
  },

  prompting: {
    askForModuleName: function () {
      if (this.pkg.name || this.options.name) {
        this.props.name = this.pkg.name || _.kebabCase(this.options.name);
        return;
      }

      var done = this.async();

      askName({
        name: 'name',
        message: 'Module Name',
        default: path.basename(process.cwd()),
        filter: _.kebabCase,
        validate: function (str) {
          return str.length > 0;
        }
      }, this, function (name) {
        this.props.name = name;
        done();
      }.bind(this));
    },

    askFor: function () {
      var done = this.async();

      var prompts = [{
        name: 'description',
        message: 'Description',
        when: !this.props.description
      }, {
        name: 'homepage',
        message: 'Project homepage url',
        when: !this.props.homepage
      }, {
        name: 'authorName',
        message: 'Author\'s Name',
        when: !this.props.authorName,
        default: this.user.git.name(),
        store: true
      }, {
        name: 'authorEmail',
        message: 'Author\'s Email',
        when: !this.props.authorEmail,
        default: this.user.git.email(),
        store: true
      }, {
        name: 'authorUrl',
        message: 'Author\'s Homepage',
        when: !this.props.authorUrl,
        store: true
      }, {
        name: 'keywords',
        message: 'Package keywords (comma to split)',
        when: !this.pkg.keywords,
        filter: function (words) {
          return words.split(/\s*,\s*/g);
        }
      }];

      this.prompt(prompts, function (props) {
        this.props = extend(this.props, props);
        done();
      }.bind(this));
    },

    askForStyleAdd : function () {
      var done = this.async();

      var prompt = {
        type: 'confirm',
        name: 'styles',
        message: 'Include CSS',
        default: false
      };

      this.prompt(prompt, function (prop) {
        this.props.styles = prop.styles;
        done();
      }.bind(this));
    },

    askForScssAdd: function () {
      var done = this.async();

      var prompt = {
        type: 'confirm',
        name: 'scss',
        message: 'Use SCSS extension',
        when: this.props.styles,
        default: true
      };

      this.prompt(prompt, function (prop) {
        this.props.scss = prop.scss;
        done();
      }.bind(this));
    },

    askForGithubAccount: function () {
      if (this.options.githubAccount) {
        this.props.githubAccount = this.options.githubAccount;
      } else {
        var done = this.async();

        githubUsername(this.props.authorEmail, function (err, username) {
          if (err) {
            username = username || '';
          }
          this.prompt({
            name: 'githubAccount',
            message: 'GitHub username or organization',
            default: username
          }, function (prompt) {
            this.props.githubAccount = prompt.githubAccount;
            done();
          }.bind(this));
        }.bind(this));
      }
    }
  },

  writing: function () {
    // Re-read the content at this point because a composed generator might modify it.
    var currentPkg = this.fs.readJSON(this.destinationPath('package.json'), {});

    var pkg = extend({
      name: _.kebabCase(this.props.name),
      version: '0.0.0',
      description: this.props.description,
      homepage: this.props.homepage,
      author: {
        name: this.props.authorName,
        email: this.props.authorEmail,
        url: this.props.authorUrl
      },
      files: [
        'lib'
      ],
      main: this.props.styles ? ['lib/' + this.props.name + '.js', 'lib/' + this.props.name + (this.props.scss? '.scss': '.css')]: 'lib/' + this.props.name + '.js',
      keywords: []
    }, currentPkg);

    // Combine the keywords
    if (this.props.keywords) {
      pkg.keywords = _.uniq(this.props.keywords.concat(pkg.keywords));
    }

    // Let's extend package.json so we're not overwriting user previous fields
    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  },

  default: function () {
    if (this.options.travis) {
      this.composeWith('travis', {}, {
        local: require.resolve('generator-travis/generators/app')
      });
    }

    this.composeWith('node:editorconfig', {}, {
      local: require.resolve('../editorconfig')
    });

    // this.composeWith('node:eslint', {
    //   options: {
    //     es2015: this.props.babel
    //   }
    // }, {
    //   local: require.resolve('../eslint')
    // });

    this.composeWith('typescript-npm-bower:git', {
      options: {
        name: this.props.name,
        githubAccount: this.props.githubAccount
      }
    }, {
      local: require.resolve('../git')
    });

    // if (this.options.gulp) {
    //   this.composeWith('node:gulp', {
    //     options: {
    //       coveralls: this.props.includeCoveralls,
    //       babel: this.props.babel,
    //       projectRoot: this.options.projectRoot,
    //       cli: this.options.cli
    //     }
    //   }, {
    //     local: require.resolve('../gulp')
    //   });
    // }
    //
    // if (this.options.boilerplate) {
    //   this.composeWith('node:boilerplate', {
    //     options: {
    //       name: this.props.name,
    //       babel: this.props.babel
    //     }
    //   }, {
    //     local: require.resolve('../boilerplate')
    //   });
    // }

    if (this.options.license && !this.pkg.license) {
      this.composeWith('license', {
        options: {
          name: this.props.authorName,
          email: this.props.authorEmail,
          website: this.props.authorUrl
        }
      }, {
        local: require.resolve('generator-license/app')
      });
    }

    // if (!this.fs.exists(this.destinationPath('README.md'))) {
    //   this.composeWith('node:readme', {
    //     options: {
    //       name: this.props.name,
    //       description: this.props.description,
    //       githubAccount: this.props.githubAccount,
    //       authorName: this.props.authorName,
    //       authorUrl: this.props.authorUrl,
    //       coveralls: this.props.includeCoveralls,
    //       content: this.options.readme
    //     }
    //   }, {
    //     local: require.resolve('../readme')
    //   });
    // }
  },

  install: function () {
    this.npmInstall();
  }
});
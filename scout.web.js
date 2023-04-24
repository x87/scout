/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.main = exports.print = void 0;
const arguments_1 = __webpack_require__(2);
const loader_1 = __webpack_require__(26);
const parser_1 = __webpack_require__(31);
const enums_1 = __webpack_require__(19);
const cfg_1 = __webpack_require__(38);
const ExpressionPrinter_1 = __webpack_require__(41);
const definitions_1 = __webpack_require__(36);
function print(functions, printer, script) {
    functions.forEach((func, i) => {
        const offset = (0, cfg_1.getOffset)(func);
        const name = offset === 0 ? script.name : `${script.name}_${offset}`;
        printer.printLine(`\n:${name.toUpperCase()}`);
        printer.indent++;
        if (arguments_1.GLOBAL_OPTIONS.printAssembly === true) {
            for (const bb of func.nodes) {
                printer.print(bb);
            }
        }
        const printGraph = (graph) => {
            for (const bb of graph.nodes) {
                if (bb instanceof cfg_1.LoopGraph) {
                    printer.printLine('');
                    switch (bb.type) {
                        case enums_1.eLoopType.PRE_TESTED: {
                            printer.printLine(`while ${printer.stringifyCondition(bb.condition)}`);
                            printer.indent++;
                            const g = (0, cfg_1.from)(bb);
                            g.nodes.splice(0, 1);
                            printGraph(g);
                            printer.indent--;
                            printer.printLine('end');
                            break;
                        }
                        case enums_1.eLoopType.POST_TESTED: {
                            printer.printLine(`repeat`);
                            printer.indent++;
                            const g = (0, cfg_1.from)(bb);
                            g.nodes.splice(g.nodes.length - 1, 1);
                            printGraph(g);
                            printer.indent--;
                            printer.printLine(`until ${printer.stringifyCondition(bb.condition)}`);
                            break;
                        }
                        case enums_1.eLoopType.ENDLESS:
                            printer.printLine(`while true`);
                            printer.indent++;
                            printGraph(bb);
                            printer.indent--;
                            printer.printLine('end');
                            break;
                    }
                    printer.printLine('');
                }
                else if (bb instanceof cfg_1.IfGraph) {
                    printer.printLine(`if ${bb.ifNumber || ''}`);
                    printer.indent++;
                    printer.print(bb.nodes[0]);
                    printer.indent--;
                    printer.printLine(`then`);
                    printer.indent++;
                    printGraph(bb.thenNode);
                    printer.indent--;
                    if (bb.elseNode) {
                        printer.printLine(`else`);
                        printer.indent++;
                        printGraph(bb.elseNode);
                        printer.indent--;
                    }
                    printer.printLine(`end`);
                }
                else {
                    bb && printer.print(bb, arguments_1.GLOBAL_OPTIONS.debugMode);
                }
            }
        };
        try {
            const loopGraph = (0, cfg_1.findLoops)(func);
            const ifGraph = (0, cfg_1.findIfs)(loopGraph);
            printGraph(ifGraph);
        }
        catch (e) {
            console.log(e);
            printer.printLine(`// can't structure this function\n`);
            printer.printLine(`--- Function ${i} Start----\n`);
            for (const bb of func.nodes) {
                printer.print(bb);
            }
            printer.printLine(`--- Function ${i} End----`);
        }
        printer.indent--;
    });
}
exports.print = print;
function main(inputFile) {
    return __awaiter(this, void 0, void 0, function* () {
        const loader = new loader_1.Loader();
        const scriptFile = yield loader.loadScript(inputFile);
        const definitionMap = yield (0, definitions_1.getDefinitions)();
        const parser = new parser_1.Parser(definitionMap);
        const scripts = yield parser.parse(scriptFile);
        const printer = new ExpressionPrinter_1.ExpressionPrinter(definitionMap);
        scripts
            .filter((script) => {
            return (!arguments_1.GLOBAL_OPTIONS.only ||
                script.name.toUpperCase() === arguments_1.GLOBAL_OPTIONS.only);
        })
            .forEach((script) => {
            const cfg = new cfg_1.CFG();
            const functions = cfg.getCallGraphs(script, scripts).sort((a, b) => {
                return (0, cfg_1.getOffset)(a) - (0, cfg_1.getOffset)(b);
            });
            print(functions, printer, script);
        });
    });
}
exports.main = main;


/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.updateArguments = exports.GLOBAL_OPTIONS = void 0;
const fs = __webpack_require__(3);
const path = __webpack_require__(4);
const browser_or_node_1 = __webpack_require__(5);
const commander_1 = __webpack_require__(6);
const errors_1 = __webpack_require__(18);
const enums_1 = __webpack_require__(19);
const log_1 = __webpack_require__(20);
const file_1 = __webpack_require__(22);
const program = new commander_1.Command();
const gameMap = {
    gta3: enums_1.eGame.GTA3,
    gtavc: enums_1.eGame.GTAVC,
    vc: enums_1.eGame.GTAVC,
    gtasa: enums_1.eGame.GTASA,
    sa: enums_1.eGame.GTASA,
};
let GLOBAL_OPTIONS = {
    inputFile: undefined,
    game: enums_1.eGame.GTA3,
    printAssembly: false,
    debugMode: false,
    only: ''
};
exports.GLOBAL_OPTIONS = GLOBAL_OPTIONS;
if (browser_or_node_1.isNode) {
    if (process.env.NODE_ENV !== 'test') {
        program
            .usage('<inputfile> [options]')
            .version((__webpack_require__(25).version), '-v, --version')
            .option('-d, --debug', 'enable the debug mode')
            .option('-p, --print', 'print the assembly')
            .option('-g, --game <game>', 'target game: gta3, vc, sa', (arg) => {
            if (!gameMap.hasOwnProperty(arg)) {
                throw log_1.Log.error(errors_1.AppError.UNKNOWN_GAME, arg);
            }
            return gameMap[arg];
        })
            .option('-o, --only <only>', 'only decompile a script with the given name')
            .parse(process.argv);
        const cli = program.opts();
        updateArguments({
            game: cli.game,
            inputFile: cli.inputFile,
            printAssembly: cli.print,
            debugMode: cli.debug,
            only: cli.only,
        });
        let stream;
        if (process.stdin instanceof fs.ReadStream && !process.stdin.isTTY) {
            stream = process.stdin;
        }
        else {
            const args = process.argv.slice(2);
            const fileName = args[0];
            if (!fileName) {
                program.help();
            }
            stream = fs.createReadStream(path.join('./', fileName));
        }
        GLOBAL_OPTIONS.inputFile = (0, file_1.readBinaryStream)(stream).then((data) => {
            const uint8arr = new Uint8Array(data.byteLength);
            data.copy(uint8arr, 0, 0, data.byteLength);
            return new DataView(uint8arr.buffer);
        });
    }
    else {
        GLOBAL_OPTIONS.inputFile = (0, file_1.emptyBuffer)();
    }
}
function updateArguments(args) {
    if (args.game !== undefined) {
        GLOBAL_OPTIONS.game = args.game;
    }
    if (args.inputFile) {
        GLOBAL_OPTIONS.inputFile = args.inputFile;
    }
    if (args.printAssembly) {
        GLOBAL_OPTIONS.printAssembly = args.printAssembly;
    }
    if (args.debugMode) {
        GLOBAL_OPTIONS.debugMode = args.debugMode;
    }
    if (args.only) {
        GLOBAL_OPTIONS.only = args.only.toUpperCase();
    }
}
exports.updateArguments = updateArguments;


/***/ }),
/* 3 */
/***/ (() => {

/* (ignored) */

/***/ }),
/* 4 */
/***/ (() => {

/* (ignored) */

/***/ }),
/* 5 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined";

var isNode = typeof process !== "undefined" && process.versions != null && process.versions.node != null;

var isWebWorker = (typeof self === "undefined" ? "undefined" : _typeof(self)) === "object" && self.constructor && self.constructor.name === "DedicatedWorkerGlobalScope";

/**
 * @see https://github.com/jsdom/jsdom/releases/tag/12.0.0
 * @see https://github.com/jsdom/jsdom/issues/1537
 */
var isJsDom = typeof window !== "undefined" && window.name === "nodejs" || typeof navigator !== "undefined" && (navigator.userAgent.includes("Node.js") || navigator.userAgent.includes("jsdom"));

var isDeno = typeof Deno !== "undefined" && typeof Deno.version !== "undefined" && typeof Deno.version.deno !== "undefined";

exports.isBrowser = isBrowser;
exports.isWebWorker = isWebWorker;
exports.isNode = isNode;
exports.isJsDom = isJsDom;
exports.isDeno = isDeno;

/***/ }),
/* 6 */
/***/ ((module, exports, __webpack_require__) => {

const { Argument } = __webpack_require__(7);
const { Command } = __webpack_require__(9);
const { CommanderError, InvalidArgumentError } = __webpack_require__(8);
const { Help } = __webpack_require__(15);
const { Option } = __webpack_require__(16);

// @ts-check

/**
 * Expose the root command.
 */

exports = module.exports = new Command();
exports.program = exports; // More explicit access to global command.
// Implicit export of createArgument, createCommand, and createOption.

/**
 * Expose classes
 */

exports.Argument = Argument;
exports.Command = Command;
exports.CommanderError = CommanderError;
exports.Help = Help;
exports.InvalidArgumentError = InvalidArgumentError;
exports.InvalidOptionArgumentError = InvalidArgumentError; // Deprecated
exports.Option = Option;


/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

const { InvalidArgumentError } = __webpack_require__(8);

// @ts-check

class Argument {
  /**
   * Initialize a new command argument with the given name and description.
   * The default is that the argument is required, and you can explicitly
   * indicate this with <> around the name. Put [] around the name for an optional argument.
   *
   * @param {string} name
   * @param {string} [description]
   */

  constructor(name, description) {
    this.description = description || '';
    this.variadic = false;
    this.parseArg = undefined;
    this.defaultValue = undefined;
    this.defaultValueDescription = undefined;
    this.argChoices = undefined;

    switch (name[0]) {
      case '<': // e.g. <required>
        this.required = true;
        this._name = name.slice(1, -1);
        break;
      case '[': // e.g. [optional]
        this.required = false;
        this._name = name.slice(1, -1);
        break;
      default:
        this.required = true;
        this._name = name;
        break;
    }

    if (this._name.length > 3 && this._name.slice(-3) === '...') {
      this.variadic = true;
      this._name = this._name.slice(0, -3);
    }
  }

  /**
   * Return argument name.
   *
   * @return {string}
   */

  name() {
    return this._name;
  }

  /**
   * @api private
   */

  _concatValue(value, previous) {
    if (previous === this.defaultValue || !Array.isArray(previous)) {
      return [value];
    }

    return previous.concat(value);
  }

  /**
   * Set the default value, and optionally supply the description to be displayed in the help.
   *
   * @param {any} value
   * @param {string} [description]
   * @return {Argument}
   */

  default(value, description) {
    this.defaultValue = value;
    this.defaultValueDescription = description;
    return this;
  }

  /**
   * Set the custom handler for processing CLI command arguments into argument values.
   *
   * @param {Function} [fn]
   * @return {Argument}
   */

  argParser(fn) {
    this.parseArg = fn;
    return this;
  }

  /**
   * Only allow argument value to be one of choices.
   *
   * @param {string[]} values
   * @return {Argument}
   */

  choices(values) {
    this.argChoices = values.slice();
    this.parseArg = (arg, previous) => {
      if (!this.argChoices.includes(arg)) {
        throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(', ')}.`);
      }
      if (this.variadic) {
        return this._concatValue(arg, previous);
      }
      return arg;
    };
    return this;
  }

  /**
   * Make argument required.
   */
  argRequired() {
    this.required = true;
    return this;
  }

  /**
   * Make argument optional.
   */
  argOptional() {
    this.required = false;
    return this;
  }
}

/**
 * Takes an argument and returns its human readable equivalent for help usage.
 *
 * @param {Argument} arg
 * @return {string}
 * @api private
 */

function humanReadableArgName(arg) {
  const nameOutput = arg.name() + (arg.variadic === true ? '...' : '');

  return arg.required
    ? '<' + nameOutput + '>'
    : '[' + nameOutput + ']';
}

exports.Argument = Argument;
exports.humanReadableArgName = humanReadableArgName;


/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, exports) => {

// @ts-check

/**
 * CommanderError class
 * @class
 */
class CommanderError extends Error {
  /**
   * Constructs the CommanderError class
   * @param {number} exitCode suggested exit code which could be used with process.exit
   * @param {string} code an id string representing the error
   * @param {string} message human-readable description of the error
   * @constructor
   */
  constructor(exitCode, code, message) {
    super(message);
    // properly capture stack trace in Node.js
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.code = code;
    this.exitCode = exitCode;
    this.nestedError = undefined;
  }
}

/**
 * InvalidArgumentError class
 * @class
 */
class InvalidArgumentError extends CommanderError {
  /**
   * Constructs the InvalidArgumentError class
   * @param {string} [message] explanation of why argument is invalid
   * @constructor
   */
  constructor(message) {
    super(1, 'commander.invalidArgument', message);
    // properly capture stack trace in Node.js
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
  }
}

exports.CommanderError = CommanderError;
exports.InvalidArgumentError = InvalidArgumentError;


/***/ }),
/* 9 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

const EventEmitter = (__webpack_require__(10).EventEmitter);
const childProcess = __webpack_require__(11);
const path = __webpack_require__(12);
const fs = __webpack_require__(13);
const process = __webpack_require__(14);

const { Argument, humanReadableArgName } = __webpack_require__(7);
const { CommanderError } = __webpack_require__(8);
const { Help } = __webpack_require__(15);
const { Option, splitOptionFlags, DualOptions } = __webpack_require__(16);
const { suggestSimilar } = __webpack_require__(17);

// @ts-check

class Command extends EventEmitter {
  /**
   * Initialize a new `Command`.
   *
   * @param {string} [name]
   */

  constructor(name) {
    super();
    /** @type {Command[]} */
    this.commands = [];
    /** @type {Option[]} */
    this.options = [];
    this.parent = null;
    this._allowUnknownOption = false;
    this._allowExcessArguments = true;
    /** @type {Argument[]} */
    this._args = [];
    /** @type {string[]} */
    this.args = []; // cli args with options removed
    this.rawArgs = [];
    this.processedArgs = []; // like .args but after custom processing and collecting variadic
    this._scriptPath = null;
    this._name = name || '';
    this._optionValues = {};
    this._optionValueSources = {}; // default, env, cli etc
    this._storeOptionsAsProperties = false;
    this._actionHandler = null;
    this._executableHandler = false;
    this._executableFile = null; // custom name for executable
    this._executableDir = null; // custom search directory for subcommands
    this._defaultCommandName = null;
    this._exitCallback = null;
    this._aliases = [];
    this._combineFlagAndOptionalValue = true;
    this._description = '';
    this._summary = '';
    this._argsDescription = undefined; // legacy
    this._enablePositionalOptions = false;
    this._passThroughOptions = false;
    this._lifeCycleHooks = {}; // a hash of arrays
    /** @type {boolean | string} */
    this._showHelpAfterError = false;
    this._showSuggestionAfterError = true;

    // see .configureOutput() for docs
    this._outputConfiguration = {
      writeOut: (str) => process.stdout.write(str),
      writeErr: (str) => process.stderr.write(str),
      getOutHelpWidth: () => process.stdout.isTTY ? process.stdout.columns : undefined,
      getErrHelpWidth: () => process.stderr.isTTY ? process.stderr.columns : undefined,
      outputError: (str, write) => write(str)
    };

    this._hidden = false;
    this._hasHelpOption = true;
    this._helpFlags = '-h, --help';
    this._helpDescription = 'display help for command';
    this._helpShortFlag = '-h';
    this._helpLongFlag = '--help';
    this._addImplicitHelpCommand = undefined; // Deliberately undefined, not decided whether true or false
    this._helpCommandName = 'help';
    this._helpCommandnameAndArgs = 'help [command]';
    this._helpCommandDescription = 'display help for command';
    this._helpConfiguration = {};
  }

  /**
   * Copy settings that are useful to have in common across root command and subcommands.
   *
   * (Used internally when adding a command using `.command()` so subcommands inherit parent settings.)
   *
   * @param {Command} sourceCommand
   * @return {Command} `this` command for chaining
   */
  copyInheritedSettings(sourceCommand) {
    this._outputConfiguration = sourceCommand._outputConfiguration;
    this._hasHelpOption = sourceCommand._hasHelpOption;
    this._helpFlags = sourceCommand._helpFlags;
    this._helpDescription = sourceCommand._helpDescription;
    this._helpShortFlag = sourceCommand._helpShortFlag;
    this._helpLongFlag = sourceCommand._helpLongFlag;
    this._helpCommandName = sourceCommand._helpCommandName;
    this._helpCommandnameAndArgs = sourceCommand._helpCommandnameAndArgs;
    this._helpCommandDescription = sourceCommand._helpCommandDescription;
    this._helpConfiguration = sourceCommand._helpConfiguration;
    this._exitCallback = sourceCommand._exitCallback;
    this._storeOptionsAsProperties = sourceCommand._storeOptionsAsProperties;
    this._combineFlagAndOptionalValue = sourceCommand._combineFlagAndOptionalValue;
    this._allowExcessArguments = sourceCommand._allowExcessArguments;
    this._enablePositionalOptions = sourceCommand._enablePositionalOptions;
    this._showHelpAfterError = sourceCommand._showHelpAfterError;
    this._showSuggestionAfterError = sourceCommand._showSuggestionAfterError;

    return this;
  }

  /**
   * Define a command.
   *
   * There are two styles of command: pay attention to where to put the description.
   *
   * @example
   * // Command implemented using action handler (description is supplied separately to `.command`)
   * program
   *   .command('clone <source> [destination]')
   *   .description('clone a repository into a newly created directory')
   *   .action((source, destination) => {
   *     console.log('clone command called');
   *   });
   *
   * // Command implemented using separate executable file (description is second parameter to `.command`)
   * program
   *   .command('start <service>', 'start named service')
   *   .command('stop [service]', 'stop named service, or all if no name supplied');
   *
   * @param {string} nameAndArgs - command name and arguments, args are `<required>` or `[optional]` and last may also be `variadic...`
   * @param {Object|string} [actionOptsOrExecDesc] - configuration options (for action), or description (for executable)
   * @param {Object} [execOpts] - configuration options (for executable)
   * @return {Command} returns new command for action handler, or `this` for executable command
   */

  command(nameAndArgs, actionOptsOrExecDesc, execOpts) {
    let desc = actionOptsOrExecDesc;
    let opts = execOpts;
    if (typeof desc === 'object' && desc !== null) {
      opts = desc;
      desc = null;
    }
    opts = opts || {};
    const [, name, args] = nameAndArgs.match(/([^ ]+) *(.*)/);

    const cmd = this.createCommand(name);
    if (desc) {
      cmd.description(desc);
      cmd._executableHandler = true;
    }
    if (opts.isDefault) this._defaultCommandName = cmd._name;
    cmd._hidden = !!(opts.noHelp || opts.hidden); // noHelp is deprecated old name for hidden
    cmd._executableFile = opts.executableFile || null; // Custom name for executable file, set missing to null to match constructor
    if (args) cmd.arguments(args);
    this.commands.push(cmd);
    cmd.parent = this;
    cmd.copyInheritedSettings(this);

    if (desc) return this;
    return cmd;
  }

  /**
   * Factory routine to create a new unattached command.
   *
   * See .command() for creating an attached subcommand, which uses this routine to
   * create the command. You can override createCommand to customise subcommands.
   *
   * @param {string} [name]
   * @return {Command} new command
   */

  createCommand(name) {
    return new Command(name);
  }

  /**
   * You can customise the help with a subclass of Help by overriding createHelp,
   * or by overriding Help properties using configureHelp().
   *
   * @return {Help}
   */

  createHelp() {
    return Object.assign(new Help(), this.configureHelp());
  }

  /**
   * You can customise the help by overriding Help properties using configureHelp(),
   * or with a subclass of Help by overriding createHelp().
   *
   * @param {Object} [configuration] - configuration options
   * @return {Command|Object} `this` command for chaining, or stored configuration
   */

  configureHelp(configuration) {
    if (configuration === undefined) return this._helpConfiguration;

    this._helpConfiguration = configuration;
    return this;
  }

  /**
   * The default output goes to stdout and stderr. You can customise this for special
   * applications. You can also customise the display of errors by overriding outputError.
   *
   * The configuration properties are all functions:
   *
   *     // functions to change where being written, stdout and stderr
   *     writeOut(str)
   *     writeErr(str)
   *     // matching functions to specify width for wrapping help
   *     getOutHelpWidth()
   *     getErrHelpWidth()
   *     // functions based on what is being written out
   *     outputError(str, write) // used for displaying errors, and not used for displaying help
   *
   * @param {Object} [configuration] - configuration options
   * @return {Command|Object} `this` command for chaining, or stored configuration
   */

  configureOutput(configuration) {
    if (configuration === undefined) return this._outputConfiguration;

    Object.assign(this._outputConfiguration, configuration);
    return this;
  }

  /**
   * Display the help or a custom message after an error occurs.
   *
   * @param {boolean|string} [displayHelp]
   * @return {Command} `this` command for chaining
   */
  showHelpAfterError(displayHelp = true) {
    if (typeof displayHelp !== 'string') displayHelp = !!displayHelp;
    this._showHelpAfterError = displayHelp;
    return this;
  }

  /**
   * Display suggestion of similar commands for unknown commands, or options for unknown options.
   *
   * @param {boolean} [displaySuggestion]
   * @return {Command} `this` command for chaining
   */
  showSuggestionAfterError(displaySuggestion = true) {
    this._showSuggestionAfterError = !!displaySuggestion;
    return this;
  }

  /**
   * Add a prepared subcommand.
   *
   * See .command() for creating an attached subcommand which inherits settings from its parent.
   *
   * @param {Command} cmd - new subcommand
   * @param {Object} [opts] - configuration options
   * @return {Command} `this` command for chaining
   */

  addCommand(cmd, opts) {
    if (!cmd._name) {
      throw new Error(`Command passed to .addCommand() must have a name
- specify the name in Command constructor or using .name()`);
    }

    opts = opts || {};
    if (opts.isDefault) this._defaultCommandName = cmd._name;
    if (opts.noHelp || opts.hidden) cmd._hidden = true; // modifying passed command due to existing implementation

    this.commands.push(cmd);
    cmd.parent = this;
    return this;
  }

  /**
   * Factory routine to create a new unattached argument.
   *
   * See .argument() for creating an attached argument, which uses this routine to
   * create the argument. You can override createArgument to return a custom argument.
   *
   * @param {string} name
   * @param {string} [description]
   * @return {Argument} new argument
   */

  createArgument(name, description) {
    return new Argument(name, description);
  }

  /**
   * Define argument syntax for command.
   *
   * The default is that the argument is required, and you can explicitly
   * indicate this with <> around the name. Put [] around the name for an optional argument.
   *
   * @example
   * program.argument('<input-file>');
   * program.argument('[output-file]');
   *
   * @param {string} name
   * @param {string} [description]
   * @param {Function|*} [fn] - custom argument processing function
   * @param {*} [defaultValue]
   * @return {Command} `this` command for chaining
   */
  argument(name, description, fn, defaultValue) {
    const argument = this.createArgument(name, description);
    if (typeof fn === 'function') {
      argument.default(defaultValue).argParser(fn);
    } else {
      argument.default(fn);
    }
    this.addArgument(argument);
    return this;
  }

  /**
   * Define argument syntax for command, adding multiple at once (without descriptions).
   *
   * See also .argument().
   *
   * @example
   * program.arguments('<cmd> [env]');
   *
   * @param {string} names
   * @return {Command} `this` command for chaining
   */

  arguments(names) {
    names.split(/ +/).forEach((detail) => {
      this.argument(detail);
    });
    return this;
  }

  /**
   * Define argument syntax for command, adding a prepared argument.
   *
   * @param {Argument} argument
   * @return {Command} `this` command for chaining
   */
  addArgument(argument) {
    const previousArgument = this._args.slice(-1)[0];
    if (previousArgument && previousArgument.variadic) {
      throw new Error(`only the last argument can be variadic '${previousArgument.name()}'`);
    }
    if (argument.required && argument.defaultValue !== undefined && argument.parseArg === undefined) {
      throw new Error(`a default value for a required argument is never used: '${argument.name()}'`);
    }
    this._args.push(argument);
    return this;
  }

  /**
   * Override default decision whether to add implicit help command.
   *
   *    addHelpCommand() // force on
   *    addHelpCommand(false); // force off
   *    addHelpCommand('help [cmd]', 'display help for [cmd]'); // force on with custom details
   *
   * @return {Command} `this` command for chaining
   */

  addHelpCommand(enableOrNameAndArgs, description) {
    if (enableOrNameAndArgs === false) {
      this._addImplicitHelpCommand = false;
    } else {
      this._addImplicitHelpCommand = true;
      if (typeof enableOrNameAndArgs === 'string') {
        this._helpCommandName = enableOrNameAndArgs.split(' ')[0];
        this._helpCommandnameAndArgs = enableOrNameAndArgs;
      }
      this._helpCommandDescription = description || this._helpCommandDescription;
    }
    return this;
  }

  /**
   * @return {boolean}
   * @api private
   */

  _hasImplicitHelpCommand() {
    if (this._addImplicitHelpCommand === undefined) {
      return this.commands.length && !this._actionHandler && !this._findCommand('help');
    }
    return this._addImplicitHelpCommand;
  }

  /**
   * Add hook for life cycle event.
   *
   * @param {string} event
   * @param {Function} listener
   * @return {Command} `this` command for chaining
   */

  hook(event, listener) {
    const allowedValues = ['preSubcommand', 'preAction', 'postAction'];
    if (!allowedValues.includes(event)) {
      throw new Error(`Unexpected value for event passed to hook : '${event}'.
Expecting one of '${allowedValues.join("', '")}'`);
    }
    if (this._lifeCycleHooks[event]) {
      this._lifeCycleHooks[event].push(listener);
    } else {
      this._lifeCycleHooks[event] = [listener];
    }
    return this;
  }

  /**
   * Register callback to use as replacement for calling process.exit.
   *
   * @param {Function} [fn] optional callback which will be passed a CommanderError, defaults to throwing
   * @return {Command} `this` command for chaining
   */

  exitOverride(fn) {
    if (fn) {
      this._exitCallback = fn;
    } else {
      this._exitCallback = (err) => {
        if (err.code !== 'commander.executeSubCommandAsync') {
          throw err;
        } else {
          // Async callback from spawn events, not useful to throw.
        }
      };
    }
    return this;
  }

  /**
   * Call process.exit, and _exitCallback if defined.
   *
   * @param {number} exitCode exit code for using with process.exit
   * @param {string} code an id string representing the error
   * @param {string} message human-readable description of the error
   * @return never
   * @api private
   */

  _exit(exitCode, code, message) {
    if (this._exitCallback) {
      this._exitCallback(new CommanderError(exitCode, code, message));
      // Expecting this line is not reached.
    }
    process.exit(exitCode);
  }

  /**
   * Register callback `fn` for the command.
   *
   * @example
   * program
   *   .command('serve')
   *   .description('start service')
   *   .action(function() {
   *      // do work here
   *   });
   *
   * @param {Function} fn
   * @return {Command} `this` command for chaining
   */

  action(fn) {
    const listener = (args) => {
      // The .action callback takes an extra parameter which is the command or options.
      const expectedArgsCount = this._args.length;
      const actionArgs = args.slice(0, expectedArgsCount);
      if (this._storeOptionsAsProperties) {
        actionArgs[expectedArgsCount] = this; // backwards compatible "options"
      } else {
        actionArgs[expectedArgsCount] = this.opts();
      }
      actionArgs.push(this);

      return fn.apply(this, actionArgs);
    };
    this._actionHandler = listener;
    return this;
  }

  /**
   * Factory routine to create a new unattached option.
   *
   * See .option() for creating an attached option, which uses this routine to
   * create the option. You can override createOption to return a custom option.
   *
   * @param {string} flags
   * @param {string} [description]
   * @return {Option} new option
   */

  createOption(flags, description) {
    return new Option(flags, description);
  }

  /**
   * Add an option.
   *
   * @param {Option} option
   * @return {Command} `this` command for chaining
   */
  addOption(option) {
    const oname = option.name();
    const name = option.attributeName();

    // store default value
    if (option.negate) {
      // --no-foo is special and defaults foo to true, unless a --foo option is already defined
      const positiveLongFlag = option.long.replace(/^--no-/, '--');
      if (!this._findOption(positiveLongFlag)) {
        this.setOptionValueWithSource(name, option.defaultValue === undefined ? true : option.defaultValue, 'default');
      }
    } else if (option.defaultValue !== undefined) {
      this.setOptionValueWithSource(name, option.defaultValue, 'default');
    }

    // register the option
    this.options.push(option);

    // handler for cli and env supplied values
    const handleOptionValue = (val, invalidValueMessage, valueSource) => {
      // val is null for optional option used without an optional-argument.
      // val is undefined for boolean and negated option.
      if (val == null && option.presetArg !== undefined) {
        val = option.presetArg;
      }

      // custom processing
      const oldValue = this.getOptionValue(name);
      if (val !== null && option.parseArg) {
        try {
          val = option.parseArg(val, oldValue);
        } catch (err) {
          if (err.code === 'commander.invalidArgument') {
            const message = `${invalidValueMessage} ${err.message}`;
            this.error(message, { exitCode: err.exitCode, code: err.code });
          }
          throw err;
        }
      } else if (val !== null && option.variadic) {
        val = option._concatValue(val, oldValue);
      }

      // Fill-in appropriate missing values. Long winded but easy to follow.
      if (val == null) {
        if (option.negate) {
          val = false;
        } else if (option.isBoolean() || option.optional) {
          val = true;
        } else {
          val = ''; // not normal, parseArg might have failed or be a mock function for testing
        }
      }
      this.setOptionValueWithSource(name, val, valueSource);
    };

    this.on('option:' + oname, (val) => {
      const invalidValueMessage = `error: option '${option.flags}' argument '${val}' is invalid.`;
      handleOptionValue(val, invalidValueMessage, 'cli');
    });

    if (option.envVar) {
      this.on('optionEnv:' + oname, (val) => {
        const invalidValueMessage = `error: option '${option.flags}' value '${val}' from env '${option.envVar}' is invalid.`;
        handleOptionValue(val, invalidValueMessage, 'env');
      });
    }

    return this;
  }

  /**
   * Internal implementation shared by .option() and .requiredOption()
   *
   * @api private
   */
  _optionEx(config, flags, description, fn, defaultValue) {
    if (typeof flags === 'object' && flags instanceof Option) {
      throw new Error('To add an Option object use addOption() instead of option() or requiredOption()');
    }
    const option = this.createOption(flags, description);
    option.makeOptionMandatory(!!config.mandatory);
    if (typeof fn === 'function') {
      option.default(defaultValue).argParser(fn);
    } else if (fn instanceof RegExp) {
      // deprecated
      const regex = fn;
      fn = (val, def) => {
        const m = regex.exec(val);
        return m ? m[0] : def;
      };
      option.default(defaultValue).argParser(fn);
    } else {
      option.default(fn);
    }

    return this.addOption(option);
  }

  /**
   * Define option with `flags`, `description` and optional
   * coercion `fn`.
   *
   * The `flags` string contains the short and/or long flags,
   * separated by comma, a pipe or space. The following are all valid
   * all will output this way when `--help` is used.
   *
   *     "-p, --pepper"
   *     "-p|--pepper"
   *     "-p --pepper"
   *
   * @example
   * // simple boolean defaulting to undefined
   * program.option('-p, --pepper', 'add pepper');
   *
   * program.pepper
   * // => undefined
   *
   * --pepper
   * program.pepper
   * // => true
   *
   * // simple boolean defaulting to true (unless non-negated option is also defined)
   * program.option('-C, --no-cheese', 'remove cheese');
   *
   * program.cheese
   * // => true
   *
   * --no-cheese
   * program.cheese
   * // => false
   *
   * // required argument
   * program.option('-C, --chdir <path>', 'change the working directory');
   *
   * --chdir /tmp
   * program.chdir
   * // => "/tmp"
   *
   * // optional argument
   * program.option('-c, --cheese [type]', 'add cheese [marble]');
   *
   * @param {string} flags
   * @param {string} [description]
   * @param {Function|*} [fn] - custom option processing function or default value
   * @param {*} [defaultValue]
   * @return {Command} `this` command for chaining
   */

  option(flags, description, fn, defaultValue) {
    return this._optionEx({}, flags, description, fn, defaultValue);
  }

  /**
  * Add a required option which must have a value after parsing. This usually means
  * the option must be specified on the command line. (Otherwise the same as .option().)
  *
  * The `flags` string contains the short and/or long flags, separated by comma, a pipe or space.
  *
  * @param {string} flags
  * @param {string} [description]
  * @param {Function|*} [fn] - custom option processing function or default value
  * @param {*} [defaultValue]
  * @return {Command} `this` command for chaining
  */

  requiredOption(flags, description, fn, defaultValue) {
    return this._optionEx({ mandatory: true }, flags, description, fn, defaultValue);
  }

  /**
   * Alter parsing of short flags with optional values.
   *
   * @example
   * // for `.option('-f,--flag [value]'):
   * program.combineFlagAndOptionalValue(true);  // `-f80` is treated like `--flag=80`, this is the default behaviour
   * program.combineFlagAndOptionalValue(false) // `-fb` is treated like `-f -b`
   *
   * @param {Boolean} [combine=true] - if `true` or omitted, an optional value can be specified directly after the flag.
   */
  combineFlagAndOptionalValue(combine = true) {
    this._combineFlagAndOptionalValue = !!combine;
    return this;
  }

  /**
   * Allow unknown options on the command line.
   *
   * @param {Boolean} [allowUnknown=true] - if `true` or omitted, no error will be thrown
   * for unknown options.
   */
  allowUnknownOption(allowUnknown = true) {
    this._allowUnknownOption = !!allowUnknown;
    return this;
  }

  /**
   * Allow excess command-arguments on the command line. Pass false to make excess arguments an error.
   *
   * @param {Boolean} [allowExcess=true] - if `true` or omitted, no error will be thrown
   * for excess arguments.
   */
  allowExcessArguments(allowExcess = true) {
    this._allowExcessArguments = !!allowExcess;
    return this;
  }

  /**
   * Enable positional options. Positional means global options are specified before subcommands which lets
   * subcommands reuse the same option names, and also enables subcommands to turn on passThroughOptions.
   * The default behaviour is non-positional and global options may appear anywhere on the command line.
   *
   * @param {Boolean} [positional=true]
   */
  enablePositionalOptions(positional = true) {
    this._enablePositionalOptions = !!positional;
    return this;
  }

  /**
   * Pass through options that come after command-arguments rather than treat them as command-options,
   * so actual command-options come before command-arguments. Turning this on for a subcommand requires
   * positional options to have been enabled on the program (parent commands).
   * The default behaviour is non-positional and options may appear before or after command-arguments.
   *
   * @param {Boolean} [passThrough=true]
   * for unknown options.
   */
  passThroughOptions(passThrough = true) {
    this._passThroughOptions = !!passThrough;
    if (!!this.parent && passThrough && !this.parent._enablePositionalOptions) {
      throw new Error('passThroughOptions can not be used without turning on enablePositionalOptions for parent command(s)');
    }
    return this;
  }

  /**
    * Whether to store option values as properties on command object,
    * or store separately (specify false). In both cases the option values can be accessed using .opts().
    *
    * @param {boolean} [storeAsProperties=true]
    * @return {Command} `this` command for chaining
    */

  storeOptionsAsProperties(storeAsProperties = true) {
    this._storeOptionsAsProperties = !!storeAsProperties;
    if (this.options.length) {
      throw new Error('call .storeOptionsAsProperties() before adding options');
    }
    return this;
  }

  /**
   * Retrieve option value.
   *
   * @param {string} key
   * @return {Object} value
   */

  getOptionValue(key) {
    if (this._storeOptionsAsProperties) {
      return this[key];
    }
    return this._optionValues[key];
  }

  /**
   * Store option value.
   *
   * @param {string} key
   * @param {Object} value
   * @return {Command} `this` command for chaining
   */

  setOptionValue(key, value) {
    return this.setOptionValueWithSource(key, value, undefined);
  }

  /**
    * Store option value and where the value came from.
    *
    * @param {string} key
    * @param {Object} value
    * @param {string} source - expected values are default/config/env/cli/implied
    * @return {Command} `this` command for chaining
    */

  setOptionValueWithSource(key, value, source) {
    if (this._storeOptionsAsProperties) {
      this[key] = value;
    } else {
      this._optionValues[key] = value;
    }
    this._optionValueSources[key] = source;
    return this;
  }

  /**
    * Get source of option value.
    * Expected values are default | config | env | cli | implied
    *
    * @param {string} key
    * @return {string}
    */

  getOptionValueSource(key) {
    return this._optionValueSources[key];
  }

  /**
    * Get source of option value. See also .optsWithGlobals().
    * Expected values are default | config | env | cli | implied
    *
    * @param {string} key
    * @return {string}
    */

  getOptionValueSourceWithGlobals(key) {
    // global overwrites local, like optsWithGlobals
    let source;
    getCommandAndParents(this).forEach((cmd) => {
      if (cmd.getOptionValueSource(key) !== undefined) {
        source = cmd.getOptionValueSource(key);
      }
    });
    return source;
  }

  /**
   * Get user arguments from implied or explicit arguments.
   * Side-effects: set _scriptPath if args included script. Used for default program name, and subcommand searches.
   *
   * @api private
   */

  _prepareUserArgs(argv, parseOptions) {
    if (argv !== undefined && !Array.isArray(argv)) {
      throw new Error('first parameter to parse must be array or undefined');
    }
    parseOptions = parseOptions || {};

    // Default to using process.argv
    if (argv === undefined) {
      argv = process.argv;
      // @ts-ignore: unknown property
      if (process.versions && process.versions.electron) {
        parseOptions.from = 'electron';
      }
    }
    this.rawArgs = argv.slice();

    // make it a little easier for callers by supporting various argv conventions
    let userArgs;
    switch (parseOptions.from) {
      case undefined:
      case 'node':
        this._scriptPath = argv[1];
        userArgs = argv.slice(2);
        break;
      case 'electron':
        // @ts-ignore: unknown property
        if (process.defaultApp) {
          this._scriptPath = argv[1];
          userArgs = argv.slice(2);
        } else {
          userArgs = argv.slice(1);
        }
        break;
      case 'user':
        userArgs = argv.slice(0);
        break;
      default:
        throw new Error(`unexpected parse option { from: '${parseOptions.from}' }`);
    }

    // Find default name for program from arguments.
    if (!this._name && this._scriptPath) this.nameFromFilename(this._scriptPath);
    this._name = this._name || 'program';

    return userArgs;
  }

  /**
   * Parse `argv`, setting options and invoking commands when defined.
   *
   * The default expectation is that the arguments are from node and have the application as argv[0]
   * and the script being run in argv[1], with user parameters after that.
   *
   * @example
   * program.parse(process.argv);
   * program.parse(); // implicitly use process.argv and auto-detect node vs electron conventions
   * program.parse(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
   *
   * @param {string[]} [argv] - optional, defaults to process.argv
   * @param {Object} [parseOptions] - optionally specify style of options with from: node/user/electron
   * @param {string} [parseOptions.from] - where the args are from: 'node', 'user', 'electron'
   * @return {Command} `this` command for chaining
   */

  parse(argv, parseOptions) {
    const userArgs = this._prepareUserArgs(argv, parseOptions);
    this._parseCommand([], userArgs);

    return this;
  }

  /**
   * Parse `argv`, setting options and invoking commands when defined.
   *
   * Use parseAsync instead of parse if any of your action handlers are async. Returns a Promise.
   *
   * The default expectation is that the arguments are from node and have the application as argv[0]
   * and the script being run in argv[1], with user parameters after that.
   *
   * @example
   * await program.parseAsync(process.argv);
   * await program.parseAsync(); // implicitly use process.argv and auto-detect node vs electron conventions
   * await program.parseAsync(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
   *
   * @param {string[]} [argv]
   * @param {Object} [parseOptions]
   * @param {string} parseOptions.from - where the args are from: 'node', 'user', 'electron'
   * @return {Promise}
   */

  async parseAsync(argv, parseOptions) {
    const userArgs = this._prepareUserArgs(argv, parseOptions);
    await this._parseCommand([], userArgs);

    return this;
  }

  /**
   * Execute a sub-command executable.
   *
   * @api private
   */

  _executeSubCommand(subcommand, args) {
    args = args.slice();
    let launchWithNode = false; // Use node for source targets so do not need to get permissions correct, and on Windows.
    const sourceExt = ['.js', '.ts', '.tsx', '.mjs', '.cjs'];

    function findFile(baseDir, baseName) {
      // Look for specified file
      const localBin = path.resolve(baseDir, baseName);
      if (fs.existsSync(localBin)) return localBin;

      // Stop looking if candidate already has an expected extension.
      if (sourceExt.includes(path.extname(baseName))) return undefined;

      // Try all the extensions.
      const foundExt = sourceExt.find(ext => fs.existsSync(`${localBin}${ext}`));
      if (foundExt) return `${localBin}${foundExt}`;

      return undefined;
    }

    // Not checking for help first. Unlikely to have mandatory and executable, and can't robustly test for help flags in external command.
    this._checkForMissingMandatoryOptions();
    this._checkForConflictingOptions();

    // executableFile and executableDir might be full path, or just a name
    let executableFile = subcommand._executableFile || `${this._name}-${subcommand._name}`;
    let executableDir = this._executableDir || '';
    if (this._scriptPath) {
      let resolvedScriptPath; // resolve possible symlink for installed npm binary
      try {
        resolvedScriptPath = fs.realpathSync(this._scriptPath);
      } catch (err) {
        resolvedScriptPath = this._scriptPath;
      }
      executableDir = path.resolve(path.dirname(resolvedScriptPath), executableDir);
    }

    // Look for a local file in preference to a command in PATH.
    if (executableDir) {
      let localFile = findFile(executableDir, executableFile);

      // Legacy search using prefix of script name instead of command name
      if (!localFile && !subcommand._executableFile && this._scriptPath) {
        const legacyName = path.basename(this._scriptPath, path.extname(this._scriptPath));
        if (legacyName !== this._name) {
          localFile = findFile(executableDir, `${legacyName}-${subcommand._name}`);
        }
      }
      executableFile = localFile || executableFile;
    }

    launchWithNode = sourceExt.includes(path.extname(executableFile));

    let proc;
    if (process.platform !== 'win32') {
      if (launchWithNode) {
        args.unshift(executableFile);
        // add executable arguments to spawn
        args = incrementNodeInspectorPort(process.execArgv).concat(args);

        proc = childProcess.spawn(process.argv[0], args, { stdio: 'inherit' });
      } else {
        proc = childProcess.spawn(executableFile, args, { stdio: 'inherit' });
      }
    } else {
      args.unshift(executableFile);
      // add executable arguments to spawn
      args = incrementNodeInspectorPort(process.execArgv).concat(args);
      proc = childProcess.spawn(process.execPath, args, { stdio: 'inherit' });
    }

    if (!proc.killed) { // testing mainly to avoid leak warnings during unit tests with mocked spawn
      const signals = ['SIGUSR1', 'SIGUSR2', 'SIGTERM', 'SIGINT', 'SIGHUP'];
      signals.forEach((signal) => {
        // @ts-ignore
        process.on(signal, () => {
          if (proc.killed === false && proc.exitCode === null) {
            proc.kill(signal);
          }
        });
      });
    }

    // By default terminate process when spawned process terminates.
    // Suppressing the exit if exitCallback defined is a bit messy and of limited use, but does allow process to stay running!
    const exitCallback = this._exitCallback;
    if (!exitCallback) {
      proc.on('close', process.exit.bind(process));
    } else {
      proc.on('close', () => {
        exitCallback(new CommanderError(process.exitCode || 0, 'commander.executeSubCommandAsync', '(close)'));
      });
    }
    proc.on('error', (err) => {
      // @ts-ignore
      if (err.code === 'ENOENT') {
        const executableDirMessage = executableDir
          ? `searched for local subcommand relative to directory '${executableDir}'`
          : 'no directory for search for local subcommand, use .executableDir() to supply a custom directory';
        const executableMissing = `'${executableFile}' does not exist
 - if '${subcommand._name}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name or path
 - ${executableDirMessage}`;
        throw new Error(executableMissing);
      // @ts-ignore
      } else if (err.code === 'EACCES') {
        throw new Error(`'${executableFile}' not executable`);
      }
      if (!exitCallback) {
        process.exit(1);
      } else {
        const wrappedError = new CommanderError(1, 'commander.executeSubCommandAsync', '(error)');
        wrappedError.nestedError = err;
        exitCallback(wrappedError);
      }
    });

    // Store the reference to the child process
    this.runningCommand = proc;
  }

  /**
   * @api private
   */

  _dispatchSubcommand(commandName, operands, unknown) {
    const subCommand = this._findCommand(commandName);
    if (!subCommand) this.help({ error: true });

    let hookResult;
    hookResult = this._chainOrCallSubCommandHook(hookResult, subCommand, 'preSubcommand');
    hookResult = this._chainOrCall(hookResult, () => {
      if (subCommand._executableHandler) {
        this._executeSubCommand(subCommand, operands.concat(unknown));
      } else {
        return subCommand._parseCommand(operands, unknown);
      }
    });
    return hookResult;
  }

  /**
   * Check this.args against expected this._args.
   *
   * @api private
   */

  _checkNumberOfArguments() {
    // too few
    this._args.forEach((arg, i) => {
      if (arg.required && this.args[i] == null) {
        this.missingArgument(arg.name());
      }
    });
    // too many
    if (this._args.length > 0 && this._args[this._args.length - 1].variadic) {
      return;
    }
    if (this.args.length > this._args.length) {
      this._excessArguments(this.args);
    }
  }

  /**
   * Process this.args using this._args and save as this.processedArgs!
   *
   * @api private
   */

  _processArguments() {
    const myParseArg = (argument, value, previous) => {
      // Extra processing for nice error message on parsing failure.
      let parsedValue = value;
      if (value !== null && argument.parseArg) {
        try {
          parsedValue = argument.parseArg(value, previous);
        } catch (err) {
          if (err.code === 'commander.invalidArgument') {
            const message = `error: command-argument value '${value}' is invalid for argument '${argument.name()}'. ${err.message}`;
            this.error(message, { exitCode: err.exitCode, code: err.code });
          }
          throw err;
        }
      }
      return parsedValue;
    };

    this._checkNumberOfArguments();

    const processedArgs = [];
    this._args.forEach((declaredArg, index) => {
      let value = declaredArg.defaultValue;
      if (declaredArg.variadic) {
        // Collect together remaining arguments for passing together as an array.
        if (index < this.args.length) {
          value = this.args.slice(index);
          if (declaredArg.parseArg) {
            value = value.reduce((processed, v) => {
              return myParseArg(declaredArg, v, processed);
            }, declaredArg.defaultValue);
          }
        } else if (value === undefined) {
          value = [];
        }
      } else if (index < this.args.length) {
        value = this.args[index];
        if (declaredArg.parseArg) {
          value = myParseArg(declaredArg, value, declaredArg.defaultValue);
        }
      }
      processedArgs[index] = value;
    });
    this.processedArgs = processedArgs;
  }

  /**
   * Once we have a promise we chain, but call synchronously until then.
   *
   * @param {Promise|undefined} promise
   * @param {Function} fn
   * @return {Promise|undefined}
   * @api private
   */

  _chainOrCall(promise, fn) {
    // thenable
    if (promise && promise.then && typeof promise.then === 'function') {
      // already have a promise, chain callback
      return promise.then(() => fn());
    }
    // callback might return a promise
    return fn();
  }

  /**
   *
   * @param {Promise|undefined} promise
   * @param {string} event
   * @return {Promise|undefined}
   * @api private
   */

  _chainOrCallHooks(promise, event) {
    let result = promise;
    const hooks = [];
    getCommandAndParents(this)
      .reverse()
      .filter(cmd => cmd._lifeCycleHooks[event] !== undefined)
      .forEach(hookedCommand => {
        hookedCommand._lifeCycleHooks[event].forEach((callback) => {
          hooks.push({ hookedCommand, callback });
        });
      });
    if (event === 'postAction') {
      hooks.reverse();
    }

    hooks.forEach((hookDetail) => {
      result = this._chainOrCall(result, () => {
        return hookDetail.callback(hookDetail.hookedCommand, this);
      });
    });
    return result;
  }

  /**
   *
   * @param {Promise|undefined} promise
   * @param {Command} subCommand
   * @param {string} event
   * @return {Promise|undefined}
   * @api private
   */

  _chainOrCallSubCommandHook(promise, subCommand, event) {
    let result = promise;
    if (this._lifeCycleHooks[event] !== undefined) {
      this._lifeCycleHooks[event].forEach((hook) => {
        result = this._chainOrCall(result, () => {
          return hook(this, subCommand);
        });
      });
    }
    return result;
  }

  /**
   * Process arguments in context of this command.
   * Returns action result, in case it is a promise.
   *
   * @api private
   */

  _parseCommand(operands, unknown) {
    const parsed = this.parseOptions(unknown);
    this._parseOptionsEnv(); // after cli, so parseArg not called on both cli and env
    this._parseOptionsImplied();
    operands = operands.concat(parsed.operands);
    unknown = parsed.unknown;
    this.args = operands.concat(unknown);

    if (operands && this._findCommand(operands[0])) {
      return this._dispatchSubcommand(operands[0], operands.slice(1), unknown);
    }
    if (this._hasImplicitHelpCommand() && operands[0] === this._helpCommandName) {
      if (operands.length === 1) {
        this.help();
      }
      return this._dispatchSubcommand(operands[1], [], [this._helpLongFlag]);
    }
    if (this._defaultCommandName) {
      outputHelpIfRequested(this, unknown); // Run the help for default command from parent rather than passing to default command
      return this._dispatchSubcommand(this._defaultCommandName, operands, unknown);
    }
    if (this.commands.length && this.args.length === 0 && !this._actionHandler && !this._defaultCommandName) {
      // probably missing subcommand and no handler, user needs help (and exit)
      this.help({ error: true });
    }

    outputHelpIfRequested(this, parsed.unknown);
    this._checkForMissingMandatoryOptions();
    this._checkForConflictingOptions();

    // We do not always call this check to avoid masking a "better" error, like unknown command.
    const checkForUnknownOptions = () => {
      if (parsed.unknown.length > 0) {
        this.unknownOption(parsed.unknown[0]);
      }
    };

    const commandEvent = `command:${this.name()}`;
    if (this._actionHandler) {
      checkForUnknownOptions();
      this._processArguments();

      let actionResult;
      actionResult = this._chainOrCallHooks(actionResult, 'preAction');
      actionResult = this._chainOrCall(actionResult, () => this._actionHandler(this.processedArgs));
      if (this.parent) {
        actionResult = this._chainOrCall(actionResult, () => {
          this.parent.emit(commandEvent, operands, unknown); // legacy
        });
      }
      actionResult = this._chainOrCallHooks(actionResult, 'postAction');
      return actionResult;
    }
    if (this.parent && this.parent.listenerCount(commandEvent)) {
      checkForUnknownOptions();
      this._processArguments();
      this.parent.emit(commandEvent, operands, unknown); // legacy
    } else if (operands.length) {
      if (this._findCommand('*')) { // legacy default command
        return this._dispatchSubcommand('*', operands, unknown);
      }
      if (this.listenerCount('command:*')) {
        // skip option check, emit event for possible misspelling suggestion
        this.emit('command:*', operands, unknown);
      } else if (this.commands.length) {
        this.unknownCommand();
      } else {
        checkForUnknownOptions();
        this._processArguments();
      }
    } else if (this.commands.length) {
      checkForUnknownOptions();
      // This command has subcommands and nothing hooked up at this level, so display help (and exit).
      this.help({ error: true });
    } else {
      checkForUnknownOptions();
      this._processArguments();
      // fall through for caller to handle after calling .parse()
    }
  }

  /**
   * Find matching command.
   *
   * @api private
   */
  _findCommand(name) {
    if (!name) return undefined;
    return this.commands.find(cmd => cmd._name === name || cmd._aliases.includes(name));
  }

  /**
   * Return an option matching `arg` if any.
   *
   * @param {string} arg
   * @return {Option}
   * @api private
   */

  _findOption(arg) {
    return this.options.find(option => option.is(arg));
  }

  /**
   * Display an error message if a mandatory option does not have a value.
   * Called after checking for help flags in leaf subcommand.
   *
   * @api private
   */

  _checkForMissingMandatoryOptions() {
    // Walk up hierarchy so can call in subcommand after checking for displaying help.
    for (let cmd = this; cmd; cmd = cmd.parent) {
      cmd.options.forEach((anOption) => {
        if (anOption.mandatory && (cmd.getOptionValue(anOption.attributeName()) === undefined)) {
          cmd.missingMandatoryOptionValue(anOption);
        }
      });
    }
  }

  /**
   * Display an error message if conflicting options are used together in this.
   *
   * @api private
   */
  _checkForConflictingLocalOptions() {
    const definedNonDefaultOptions = this.options.filter(
      (option) => {
        const optionKey = option.attributeName();
        if (this.getOptionValue(optionKey) === undefined) {
          return false;
        }
        return this.getOptionValueSource(optionKey) !== 'default';
      }
    );

    const optionsWithConflicting = definedNonDefaultOptions.filter(
      (option) => option.conflictsWith.length > 0
    );

    optionsWithConflicting.forEach((option) => {
      const conflictingAndDefined = definedNonDefaultOptions.find((defined) =>
        option.conflictsWith.includes(defined.attributeName())
      );
      if (conflictingAndDefined) {
        this._conflictingOption(option, conflictingAndDefined);
      }
    });
  }

  /**
   * Display an error message if conflicting options are used together.
   * Called after checking for help flags in leaf subcommand.
   *
   * @api private
   */
  _checkForConflictingOptions() {
    // Walk up hierarchy so can call in subcommand after checking for displaying help.
    for (let cmd = this; cmd; cmd = cmd.parent) {
      cmd._checkForConflictingLocalOptions();
    }
  }

  /**
   * Parse options from `argv` removing known options,
   * and return argv split into operands and unknown arguments.
   *
   * Examples:
   *
   *     argv => operands, unknown
   *     --known kkk op => [op], []
   *     op --known kkk => [op], []
   *     sub --unknown uuu op => [sub], [--unknown uuu op]
   *     sub -- --unknown uuu op => [sub --unknown uuu op], []
   *
   * @param {String[]} argv
   * @return {{operands: String[], unknown: String[]}}
   */

  parseOptions(argv) {
    const operands = []; // operands, not options or values
    const unknown = []; // first unknown option and remaining unknown args
    let dest = operands;
    const args = argv.slice();

    function maybeOption(arg) {
      return arg.length > 1 && arg[0] === '-';
    }

    // parse options
    let activeVariadicOption = null;
    while (args.length) {
      const arg = args.shift();

      // literal
      if (arg === '--') {
        if (dest === unknown) dest.push(arg);
        dest.push(...args);
        break;
      }

      if (activeVariadicOption && !maybeOption(arg)) {
        this.emit(`option:${activeVariadicOption.name()}`, arg);
        continue;
      }
      activeVariadicOption = null;

      if (maybeOption(arg)) {
        const option = this._findOption(arg);
        // recognised option, call listener to assign value with possible custom processing
        if (option) {
          if (option.required) {
            const value = args.shift();
            if (value === undefined) this.optionMissingArgument(option);
            this.emit(`option:${option.name()}`, value);
          } else if (option.optional) {
            let value = null;
            // historical behaviour is optional value is following arg unless an option
            if (args.length > 0 && !maybeOption(args[0])) {
              value = args.shift();
            }
            this.emit(`option:${option.name()}`, value);
          } else { // boolean flag
            this.emit(`option:${option.name()}`);
          }
          activeVariadicOption = option.variadic ? option : null;
          continue;
        }
      }

      // Look for combo options following single dash, eat first one if known.
      if (arg.length > 2 && arg[0] === '-' && arg[1] !== '-') {
        const option = this._findOption(`-${arg[1]}`);
        if (option) {
          if (option.required || (option.optional && this._combineFlagAndOptionalValue)) {
            // option with value following in same argument
            this.emit(`option:${option.name()}`, arg.slice(2));
          } else {
            // boolean option, emit and put back remainder of arg for further processing
            this.emit(`option:${option.name()}`);
            args.unshift(`-${arg.slice(2)}`);
          }
          continue;
        }
      }

      // Look for known long flag with value, like --foo=bar
      if (/^--[^=]+=/.test(arg)) {
        const index = arg.indexOf('=');
        const option = this._findOption(arg.slice(0, index));
        if (option && (option.required || option.optional)) {
          this.emit(`option:${option.name()}`, arg.slice(index + 1));
          continue;
        }
      }

      // Not a recognised option by this command.
      // Might be a command-argument, or subcommand option, or unknown option, or help command or option.

      // An unknown option means further arguments also classified as unknown so can be reprocessed by subcommands.
      if (maybeOption(arg)) {
        dest = unknown;
      }

      // If using positionalOptions, stop processing our options at subcommand.
      if ((this._enablePositionalOptions || this._passThroughOptions) && operands.length === 0 && unknown.length === 0) {
        if (this._findCommand(arg)) {
          operands.push(arg);
          if (args.length > 0) unknown.push(...args);
          break;
        } else if (arg === this._helpCommandName && this._hasImplicitHelpCommand()) {
          operands.push(arg);
          if (args.length > 0) operands.push(...args);
          break;
        } else if (this._defaultCommandName) {
          unknown.push(arg);
          if (args.length > 0) unknown.push(...args);
          break;
        }
      }

      // If using passThroughOptions, stop processing options at first command-argument.
      if (this._passThroughOptions) {
        dest.push(arg);
        if (args.length > 0) dest.push(...args);
        break;
      }

      // add arg
      dest.push(arg);
    }

    return { operands, unknown };
  }

  /**
   * Return an object containing local option values as key-value pairs.
   *
   * @return {Object}
   */
  opts() {
    if (this._storeOptionsAsProperties) {
      // Preserve original behaviour so backwards compatible when still using properties
      const result = {};
      const len = this.options.length;

      for (let i = 0; i < len; i++) {
        const key = this.options[i].attributeName();
        result[key] = key === this._versionOptionName ? this._version : this[key];
      }
      return result;
    }

    return this._optionValues;
  }

  /**
   * Return an object containing merged local and global option values as key-value pairs.
   *
   * @return {Object}
   */
  optsWithGlobals() {
    // globals overwrite locals
    return getCommandAndParents(this).reduce(
      (combinedOptions, cmd) => Object.assign(combinedOptions, cmd.opts()),
      {}
    );
  }

  /**
   * Display error message and exit (or call exitOverride).
   *
   * @param {string} message
   * @param {Object} [errorOptions]
   * @param {string} [errorOptions.code] - an id string representing the error
   * @param {number} [errorOptions.exitCode] - used with process.exit
   */
  error(message, errorOptions) {
    // output handling
    this._outputConfiguration.outputError(`${message}\n`, this._outputConfiguration.writeErr);
    if (typeof this._showHelpAfterError === 'string') {
      this._outputConfiguration.writeErr(`${this._showHelpAfterError}\n`);
    } else if (this._showHelpAfterError) {
      this._outputConfiguration.writeErr('\n');
      this.outputHelp({ error: true });
    }

    // exit handling
    const config = errorOptions || {};
    const exitCode = config.exitCode || 1;
    const code = config.code || 'commander.error';
    this._exit(exitCode, code, message);
  }

  /**
   * Apply any option related environment variables, if option does
   * not have a value from cli or client code.
   *
   * @api private
   */
  _parseOptionsEnv() {
    this.options.forEach((option) => {
      if (option.envVar && option.envVar in process.env) {
        const optionKey = option.attributeName();
        // Priority check. Do not overwrite cli or options from unknown source (client-code).
        if (this.getOptionValue(optionKey) === undefined || ['default', 'config', 'env'].includes(this.getOptionValueSource(optionKey))) {
          if (option.required || option.optional) { // option can take a value
            // keep very simple, optional always takes value
            this.emit(`optionEnv:${option.name()}`, process.env[option.envVar]);
          } else { // boolean
            // keep very simple, only care that envVar defined and not the value
            this.emit(`optionEnv:${option.name()}`);
          }
        }
      }
    });
  }

  /**
   * Apply any implied option values, if option is undefined or default value.
   *
   * @api private
   */
  _parseOptionsImplied() {
    const dualHelper = new DualOptions(this.options);
    const hasCustomOptionValue = (optionKey) => {
      return this.getOptionValue(optionKey) !== undefined && !['default', 'implied'].includes(this.getOptionValueSource(optionKey));
    };
    this.options
      .filter(option => (option.implied !== undefined) &&
        hasCustomOptionValue(option.attributeName()) &&
        dualHelper.valueFromOption(this.getOptionValue(option.attributeName()), option))
      .forEach((option) => {
        Object.keys(option.implied)
          .filter(impliedKey => !hasCustomOptionValue(impliedKey))
          .forEach(impliedKey => {
            this.setOptionValueWithSource(impliedKey, option.implied[impliedKey], 'implied');
          });
      });
  }

  /**
   * Argument `name` is missing.
   *
   * @param {string} name
   * @api private
   */

  missingArgument(name) {
    const message = `error: missing required argument '${name}'`;
    this.error(message, { code: 'commander.missingArgument' });
  }

  /**
   * `Option` is missing an argument.
   *
   * @param {Option} option
   * @api private
   */

  optionMissingArgument(option) {
    const message = `error: option '${option.flags}' argument missing`;
    this.error(message, { code: 'commander.optionMissingArgument' });
  }

  /**
   * `Option` does not have a value, and is a mandatory option.
   *
   * @param {Option} option
   * @api private
   */

  missingMandatoryOptionValue(option) {
    const message = `error: required option '${option.flags}' not specified`;
    this.error(message, { code: 'commander.missingMandatoryOptionValue' });
  }

  /**
   * `Option` conflicts with another option.
   *
   * @param {Option} option
   * @param {Option} conflictingOption
   * @api private
   */
  _conflictingOption(option, conflictingOption) {
    // The calling code does not know whether a negated option is the source of the
    // value, so do some work to take an educated guess.
    const findBestOptionFromValue = (option) => {
      const optionKey = option.attributeName();
      const optionValue = this.getOptionValue(optionKey);
      const negativeOption = this.options.find(target => target.negate && optionKey === target.attributeName());
      const positiveOption = this.options.find(target => !target.negate && optionKey === target.attributeName());
      if (negativeOption && (
        (negativeOption.presetArg === undefined && optionValue === false) ||
        (negativeOption.presetArg !== undefined && optionValue === negativeOption.presetArg)
      )) {
        return negativeOption;
      }
      return positiveOption || option;
    };

    const getErrorMessage = (option) => {
      const bestOption = findBestOptionFromValue(option);
      const optionKey = bestOption.attributeName();
      const source = this.getOptionValueSource(optionKey);
      if (source === 'env') {
        return `environment variable '${bestOption.envVar}'`;
      }
      return `option '${bestOption.flags}'`;
    };

    const message = `error: ${getErrorMessage(option)} cannot be used with ${getErrorMessage(conflictingOption)}`;
    this.error(message, { code: 'commander.conflictingOption' });
  }

  /**
   * Unknown option `flag`.
   *
   * @param {string} flag
   * @api private
   */

  unknownOption(flag) {
    if (this._allowUnknownOption) return;
    let suggestion = '';

    if (flag.startsWith('--') && this._showSuggestionAfterError) {
      // Looping to pick up the global options too
      let candidateFlags = [];
      let command = this;
      do {
        const moreFlags = command.createHelp().visibleOptions(command)
          .filter(option => option.long)
          .map(option => option.long);
        candidateFlags = candidateFlags.concat(moreFlags);
        command = command.parent;
      } while (command && !command._enablePositionalOptions);
      suggestion = suggestSimilar(flag, candidateFlags);
    }

    const message = `error: unknown option '${flag}'${suggestion}`;
    this.error(message, { code: 'commander.unknownOption' });
  }

  /**
   * Excess arguments, more than expected.
   *
   * @param {string[]} receivedArgs
   * @api private
   */

  _excessArguments(receivedArgs) {
    if (this._allowExcessArguments) return;

    const expected = this._args.length;
    const s = (expected === 1) ? '' : 's';
    const forSubcommand = this.parent ? ` for '${this.name()}'` : '';
    const message = `error: too many arguments${forSubcommand}. Expected ${expected} argument${s} but got ${receivedArgs.length}.`;
    this.error(message, { code: 'commander.excessArguments' });
  }

  /**
   * Unknown command.
   *
   * @api private
   */

  unknownCommand() {
    const unknownName = this.args[0];
    let suggestion = '';

    if (this._showSuggestionAfterError) {
      const candidateNames = [];
      this.createHelp().visibleCommands(this).forEach((command) => {
        candidateNames.push(command.name());
        // just visible alias
        if (command.alias()) candidateNames.push(command.alias());
      });
      suggestion = suggestSimilar(unknownName, candidateNames);
    }

    const message = `error: unknown command '${unknownName}'${suggestion}`;
    this.error(message, { code: 'commander.unknownCommand' });
  }

  /**
   * Set the program version to `str`.
   *
   * This method auto-registers the "-V, --version" flag
   * which will print the version number when passed.
   *
   * You can optionally supply the  flags and description to override the defaults.
   *
   * @param {string} str
   * @param {string} [flags]
   * @param {string} [description]
   * @return {this | string} `this` command for chaining, or version string if no arguments
   */

  version(str, flags, description) {
    if (str === undefined) return this._version;
    this._version = str;
    flags = flags || '-V, --version';
    description = description || 'output the version number';
    const versionOption = this.createOption(flags, description);
    this._versionOptionName = versionOption.attributeName();
    this.options.push(versionOption);
    this.on('option:' + versionOption.name(), () => {
      this._outputConfiguration.writeOut(`${str}\n`);
      this._exit(0, 'commander.version', str);
    });
    return this;
  }

  /**
   * Set the description.
   *
   * @param {string} [str]
   * @param {Object} [argsDescription]
   * @return {string|Command}
   */
  description(str, argsDescription) {
    if (str === undefined && argsDescription === undefined) return this._description;
    this._description = str;
    if (argsDescription) {
      this._argsDescription = argsDescription;
    }
    return this;
  }

  /**
   * Set the summary. Used when listed as subcommand of parent.
   *
   * @param {string} [str]
   * @return {string|Command}
   */
  summary(str) {
    if (str === undefined) return this._summary;
    this._summary = str;
    return this;
  }

  /**
   * Set an alias for the command.
   *
   * You may call more than once to add multiple aliases. Only the first alias is shown in the auto-generated help.
   *
   * @param {string} [alias]
   * @return {string|Command}
   */

  alias(alias) {
    if (alias === undefined) return this._aliases[0]; // just return first, for backwards compatibility

    /** @type {Command} */
    let command = this;
    if (this.commands.length !== 0 && this.commands[this.commands.length - 1]._executableHandler) {
      // assume adding alias for last added executable subcommand, rather than this
      command = this.commands[this.commands.length - 1];
    }

    if (alias === command._name) throw new Error('Command alias can\'t be the same as its name');

    command._aliases.push(alias);
    return this;
  }

  /**
   * Set aliases for the command.
   *
   * Only the first alias is shown in the auto-generated help.
   *
   * @param {string[]} [aliases]
   * @return {string[]|Command}
   */

  aliases(aliases) {
    // Getter for the array of aliases is the main reason for having aliases() in addition to alias().
    if (aliases === undefined) return this._aliases;

    aliases.forEach((alias) => this.alias(alias));
    return this;
  }

  /**
   * Set / get the command usage `str`.
   *
   * @param {string} [str]
   * @return {String|Command}
   */

  usage(str) {
    if (str === undefined) {
      if (this._usage) return this._usage;

      const args = this._args.map((arg) => {
        return humanReadableArgName(arg);
      });
      return [].concat(
        (this.options.length || this._hasHelpOption ? '[options]' : []),
        (this.commands.length ? '[command]' : []),
        (this._args.length ? args : [])
      ).join(' ');
    }

    this._usage = str;
    return this;
  }

  /**
   * Get or set the name of the command.
   *
   * @param {string} [str]
   * @return {string|Command}
   */

  name(str) {
    if (str === undefined) return this._name;
    this._name = str;
    return this;
  }

  /**
   * Set the name of the command from script filename, such as process.argv[1],
   * or require.main.filename, or __filename.
   *
   * (Used internally and public although not documented in README.)
   *
   * @example
   * program.nameFromFilename(require.main.filename);
   *
   * @param {string} filename
   * @return {Command}
   */

  nameFromFilename(filename) {
    this._name = path.basename(filename, path.extname(filename));

    return this;
  }

  /**
   * Get or set the directory for searching for executable subcommands of this command.
   *
   * @example
   * program.executableDir(__dirname);
   * // or
   * program.executableDir('subcommands');
   *
   * @param {string} [path]
   * @return {string|Command}
   */

  executableDir(path) {
    if (path === undefined) return this._executableDir;
    this._executableDir = path;
    return this;
  }

  /**
   * Return program help documentation.
   *
   * @param {{ error: boolean }} [contextOptions] - pass {error:true} to wrap for stderr instead of stdout
   * @return {string}
   */

  helpInformation(contextOptions) {
    const helper = this.createHelp();
    if (helper.helpWidth === undefined) {
      helper.helpWidth = (contextOptions && contextOptions.error) ? this._outputConfiguration.getErrHelpWidth() : this._outputConfiguration.getOutHelpWidth();
    }
    return helper.formatHelp(this, helper);
  }

  /**
   * @api private
   */

  _getHelpContext(contextOptions) {
    contextOptions = contextOptions || {};
    const context = { error: !!contextOptions.error };
    let write;
    if (context.error) {
      write = (arg) => this._outputConfiguration.writeErr(arg);
    } else {
      write = (arg) => this._outputConfiguration.writeOut(arg);
    }
    context.write = contextOptions.write || write;
    context.command = this;
    return context;
  }

  /**
   * Output help information for this command.
   *
   * Outputs built-in help, and custom text added using `.addHelpText()`.
   *
   * @param {{ error: boolean } | Function} [contextOptions] - pass {error:true} to write to stderr instead of stdout
   */

  outputHelp(contextOptions) {
    let deprecatedCallback;
    if (typeof contextOptions === 'function') {
      deprecatedCallback = contextOptions;
      contextOptions = undefined;
    }
    const context = this._getHelpContext(contextOptions);

    getCommandAndParents(this).reverse().forEach(command => command.emit('beforeAllHelp', context));
    this.emit('beforeHelp', context);

    let helpInformation = this.helpInformation(context);
    if (deprecatedCallback) {
      helpInformation = deprecatedCallback(helpInformation);
      if (typeof helpInformation !== 'string' && !Buffer.isBuffer(helpInformation)) {
        throw new Error('outputHelp callback must return a string or a Buffer');
      }
    }
    context.write(helpInformation);

    this.emit(this._helpLongFlag); // deprecated
    this.emit('afterHelp', context);
    getCommandAndParents(this).forEach(command => command.emit('afterAllHelp', context));
  }

  /**
   * You can pass in flags and a description to override the help
   * flags and help description for your command. Pass in false to
   * disable the built-in help option.
   *
   * @param {string | boolean} [flags]
   * @param {string} [description]
   * @return {Command} `this` command for chaining
   */

  helpOption(flags, description) {
    if (typeof flags === 'boolean') {
      this._hasHelpOption = flags;
      return this;
    }
    this._helpFlags = flags || this._helpFlags;
    this._helpDescription = description || this._helpDescription;

    const helpFlags = splitOptionFlags(this._helpFlags);
    this._helpShortFlag = helpFlags.shortFlag;
    this._helpLongFlag = helpFlags.longFlag;

    return this;
  }

  /**
   * Output help information and exit.
   *
   * Outputs built-in help, and custom text added using `.addHelpText()`.
   *
   * @param {{ error: boolean }} [contextOptions] - pass {error:true} to write to stderr instead of stdout
   */

  help(contextOptions) {
    this.outputHelp(contextOptions);
    let exitCode = process.exitCode || 0;
    if (exitCode === 0 && contextOptions && typeof contextOptions !== 'function' && contextOptions.error) {
      exitCode = 1;
    }
    // message: do not have all displayed text available so only passing placeholder.
    this._exit(exitCode, 'commander.help', '(outputHelp)');
  }

  /**
   * Add additional text to be displayed with the built-in help.
   *
   * Position is 'before' or 'after' to affect just this command,
   * and 'beforeAll' or 'afterAll' to affect this command and all its subcommands.
   *
   * @param {string} position - before or after built-in help
   * @param {string | Function} text - string to add, or a function returning a string
   * @return {Command} `this` command for chaining
   */
  addHelpText(position, text) {
    const allowedValues = ['beforeAll', 'before', 'after', 'afterAll'];
    if (!allowedValues.includes(position)) {
      throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${allowedValues.join("', '")}'`);
    }
    const helpEvent = `${position}Help`;
    this.on(helpEvent, (context) => {
      let helpStr;
      if (typeof text === 'function') {
        helpStr = text({ error: context.error, command: context.command });
      } else {
        helpStr = text;
      }
      // Ignore falsy value when nothing to output.
      if (helpStr) {
        context.write(`${helpStr}\n`);
      }
    });
    return this;
  }
}

/**
 * Output help information if help flags specified
 *
 * @param {Command} cmd - command to output help for
 * @param {Array} args - array of options to search for help flags
 * @api private
 */

function outputHelpIfRequested(cmd, args) {
  const helpOption = cmd._hasHelpOption && args.find(arg => arg === cmd._helpLongFlag || arg === cmd._helpShortFlag);
  if (helpOption) {
    cmd.outputHelp();
    // (Do not have all displayed text available so only passing placeholder.)
    cmd._exit(0, 'commander.helpDisplayed', '(outputHelp)');
  }
}

/**
 * Scan arguments and increment port number for inspect calls (to avoid conflicts when spawning new command).
 *
 * @param {string[]} args - array of arguments from node.execArgv
 * @returns {string[]}
 * @api private
 */

function incrementNodeInspectorPort(args) {
  // Testing for these options:
  //  --inspect[=[host:]port]
  //  --inspect-brk[=[host:]port]
  //  --inspect-port=[host:]port
  return args.map((arg) => {
    if (!arg.startsWith('--inspect')) {
      return arg;
    }
    let debugOption;
    let debugHost = '127.0.0.1';
    let debugPort = '9229';
    let match;
    if ((match = arg.match(/^(--inspect(-brk)?)$/)) !== null) {
      // e.g. --inspect
      debugOption = match[1];
    } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/)) !== null) {
      debugOption = match[1];
      if (/^\d+$/.test(match[3])) {
        // e.g. --inspect=1234
        debugPort = match[3];
      } else {
        // e.g. --inspect=localhost
        debugHost = match[3];
      }
    } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/)) !== null) {
      // e.g. --inspect=localhost:1234
      debugOption = match[1];
      debugHost = match[3];
      debugPort = match[4];
    }

    if (debugOption && debugPort !== '0') {
      return `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
    }
    return arg;
  });
}

/**
 * @param {Command} startCommand
 * @returns {Command[]}
 * @api private
 */

function getCommandAndParents(startCommand) {
  const result = [];
  for (let command = startCommand; command; command = command.parent) {
    result.push(command);
  }
  return result;
}

exports.Command = Command;


/***/ }),
/* 10 */
/***/ ((module) => {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



var R = typeof Reflect === 'object' ? Reflect : null
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  }

var ReflectOwnKeys
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
}

function EventEmitter() {
  EventEmitter.init.call(this);
}
module.exports = EventEmitter;
module.exports.once = once;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function _getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  checkListener(listener);

  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = _getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0)
      return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      checkListener(listener);
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      checkListener(listener);

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners !== undefined) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function once(emitter, name) {
  return new Promise(function (resolve, reject) {
    function errorListener(err) {
      emitter.removeListener(name, resolver);
      reject(err);
    }

    function resolver() {
      if (typeof emitter.removeListener === 'function') {
        emitter.removeListener('error', errorListener);
      }
      resolve([].slice.call(arguments));
    };

    eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
    if (name !== 'error') {
      addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
    }
  });
}

function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
  if (typeof emitter.on === 'function') {
    eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
  }
}

function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
  if (typeof emitter.on === 'function') {
    if (flags.once) {
      emitter.once(name, listener);
    } else {
      emitter.on(name, listener);
    }
  } else if (typeof emitter.addEventListener === 'function') {
    // EventTarget does not have `error` event semantics like Node
    // EventEmitters, we do not listen for `error` events here.
    emitter.addEventListener(name, function wrapListener(arg) {
      // IE does not have builtin `{ once: true }` support so we
      // have to do it manually.
      if (flags.once) {
        emitter.removeEventListener(name, wrapListener);
      }
      listener(arg);
    });
  } else {
    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
  }
}


/***/ }),
/* 11 */
/***/ (() => {

/* (ignored) */

/***/ }),
/* 12 */
/***/ (() => {

/* (ignored) */

/***/ }),
/* 13 */
/***/ (() => {

/* (ignored) */

/***/ }),
/* 14 */
/***/ (() => {

/* (ignored) */

/***/ }),
/* 15 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

const { humanReadableArgName } = __webpack_require__(7);

/**
 * TypeScript import types for JSDoc, used by Visual Studio Code IntelliSense and `npm run typescript-checkJS`
 * https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html#import-types
 * @typedef { import("./argument.js").Argument } Argument
 * @typedef { import("./command.js").Command } Command
 * @typedef { import("./option.js").Option } Option
 */

// @ts-check

// Although this is a class, methods are static in style to allow override using subclass or just functions.
class Help {
  constructor() {
    this.helpWidth = undefined;
    this.sortSubcommands = false;
    this.sortOptions = false;
    this.showGlobalOptions = false;
  }

  /**
   * Get an array of the visible subcommands. Includes a placeholder for the implicit help command, if there is one.
   *
   * @param {Command} cmd
   * @returns {Command[]}
   */

  visibleCommands(cmd) {
    const visibleCommands = cmd.commands.filter(cmd => !cmd._hidden);
    if (cmd._hasImplicitHelpCommand()) {
      // Create a command matching the implicit help command.
      const [, helpName, helpArgs] = cmd._helpCommandnameAndArgs.match(/([^ ]+) *(.*)/);
      const helpCommand = cmd.createCommand(helpName)
        .helpOption(false);
      helpCommand.description(cmd._helpCommandDescription);
      if (helpArgs) helpCommand.arguments(helpArgs);
      visibleCommands.push(helpCommand);
    }
    if (this.sortSubcommands) {
      visibleCommands.sort((a, b) => {
        // @ts-ignore: overloaded return type
        return a.name().localeCompare(b.name());
      });
    }
    return visibleCommands;
  }

  /**
   * Compare options for sort.
   *
   * @param {Option} a
   * @param {Option} b
   * @returns number
   */
  compareOptions(a, b) {
    const getSortKey = (option) => {
      // WYSIWYG for order displayed in help. Short used for comparison if present. No special handling for negated.
      return option.short ? option.short.replace(/^-/, '') : option.long.replace(/^--/, '');
    };
    return getSortKey(a).localeCompare(getSortKey(b));
  }

  /**
   * Get an array of the visible options. Includes a placeholder for the implicit help option, if there is one.
   *
   * @param {Command} cmd
   * @returns {Option[]}
   */

  visibleOptions(cmd) {
    const visibleOptions = cmd.options.filter((option) => !option.hidden);
    // Implicit help
    const showShortHelpFlag = cmd._hasHelpOption && cmd._helpShortFlag && !cmd._findOption(cmd._helpShortFlag);
    const showLongHelpFlag = cmd._hasHelpOption && !cmd._findOption(cmd._helpLongFlag);
    if (showShortHelpFlag || showLongHelpFlag) {
      let helpOption;
      if (!showShortHelpFlag) {
        helpOption = cmd.createOption(cmd._helpLongFlag, cmd._helpDescription);
      } else if (!showLongHelpFlag) {
        helpOption = cmd.createOption(cmd._helpShortFlag, cmd._helpDescription);
      } else {
        helpOption = cmd.createOption(cmd._helpFlags, cmd._helpDescription);
      }
      visibleOptions.push(helpOption);
    }
    if (this.sortOptions) {
      visibleOptions.sort(this.compareOptions);
    }
    return visibleOptions;
  }

  /**
   * Get an array of the visible global options. (Not including help.)
   *
   * @param {Command} cmd
   * @returns {Option[]}
   */

  visibleGlobalOptions(cmd) {
    if (!this.showGlobalOptions) return [];

    const globalOptions = [];
    for (let parentCmd = cmd.parent; parentCmd; parentCmd = parentCmd.parent) {
      const visibleOptions = parentCmd.options.filter((option) => !option.hidden);
      globalOptions.push(...visibleOptions);
    }
    if (this.sortOptions) {
      globalOptions.sort(this.compareOptions);
    }
    return globalOptions;
  }

  /**
   * Get an array of the arguments if any have a description.
   *
   * @param {Command} cmd
   * @returns {Argument[]}
   */

  visibleArguments(cmd) {
    // Side effect! Apply the legacy descriptions before the arguments are displayed.
    if (cmd._argsDescription) {
      cmd._args.forEach(argument => {
        argument.description = argument.description || cmd._argsDescription[argument.name()] || '';
      });
    }

    // If there are any arguments with a description then return all the arguments.
    if (cmd._args.find(argument => argument.description)) {
      return cmd._args;
    }
    return [];
  }

  /**
   * Get the command term to show in the list of subcommands.
   *
   * @param {Command} cmd
   * @returns {string}
   */

  subcommandTerm(cmd) {
    // Legacy. Ignores custom usage string, and nested commands.
    const args = cmd._args.map(arg => humanReadableArgName(arg)).join(' ');
    return cmd._name +
      (cmd._aliases[0] ? '|' + cmd._aliases[0] : '') +
      (cmd.options.length ? ' [options]' : '') + // simplistic check for non-help option
      (args ? ' ' + args : '');
  }

  /**
   * Get the option term to show in the list of options.
   *
   * @param {Option} option
   * @returns {string}
   */

  optionTerm(option) {
    return option.flags;
  }

  /**
   * Get the argument term to show in the list of arguments.
   *
   * @param {Argument} argument
   * @returns {string}
   */

  argumentTerm(argument) {
    return argument.name();
  }

  /**
   * Get the longest command term length.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {number}
   */

  longestSubcommandTermLength(cmd, helper) {
    return helper.visibleCommands(cmd).reduce((max, command) => {
      return Math.max(max, helper.subcommandTerm(command).length);
    }, 0);
  }

  /**
   * Get the longest option term length.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {number}
   */

  longestOptionTermLength(cmd, helper) {
    return helper.visibleOptions(cmd).reduce((max, option) => {
      return Math.max(max, helper.optionTerm(option).length);
    }, 0);
  }

  /**
   * Get the longest global option term length.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {number}
   */

  longestGlobalOptionTermLength(cmd, helper) {
    return helper.visibleGlobalOptions(cmd).reduce((max, option) => {
      return Math.max(max, helper.optionTerm(option).length);
    }, 0);
  }

  /**
   * Get the longest argument term length.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {number}
   */

  longestArgumentTermLength(cmd, helper) {
    return helper.visibleArguments(cmd).reduce((max, argument) => {
      return Math.max(max, helper.argumentTerm(argument).length);
    }, 0);
  }

  /**
   * Get the command usage to be displayed at the top of the built-in help.
   *
   * @param {Command} cmd
   * @returns {string}
   */

  commandUsage(cmd) {
    // Usage
    let cmdName = cmd._name;
    if (cmd._aliases[0]) {
      cmdName = cmdName + '|' + cmd._aliases[0];
    }
    let parentCmdNames = '';
    for (let parentCmd = cmd.parent; parentCmd; parentCmd = parentCmd.parent) {
      parentCmdNames = parentCmd.name() + ' ' + parentCmdNames;
    }
    return parentCmdNames + cmdName + ' ' + cmd.usage();
  }

  /**
   * Get the description for the command.
   *
   * @param {Command} cmd
   * @returns {string}
   */

  commandDescription(cmd) {
    // @ts-ignore: overloaded return type
    return cmd.description();
  }

  /**
   * Get the subcommand summary to show in the list of subcommands.
   * (Fallback to description for backwards compatibility.)
   *
   * @param {Command} cmd
   * @returns {string}
   */

  subcommandDescription(cmd) {
    // @ts-ignore: overloaded return type
    return cmd.summary() || cmd.description();
  }

  /**
   * Get the option description to show in the list of options.
   *
   * @param {Option} option
   * @return {string}
   */

  optionDescription(option) {
    const extraInfo = [];

    if (option.argChoices) {
      extraInfo.push(
        // use stringify to match the display of the default value
        `choices: ${option.argChoices.map((choice) => JSON.stringify(choice)).join(', ')}`);
    }
    if (option.defaultValue !== undefined) {
      // default for boolean and negated more for programmer than end user,
      // but show true/false for boolean option as may be for hand-rolled env or config processing.
      const showDefault = option.required || option.optional ||
        (option.isBoolean() && typeof option.defaultValue === 'boolean');
      if (showDefault) {
        extraInfo.push(`default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`);
      }
    }
    // preset for boolean and negated are more for programmer than end user
    if (option.presetArg !== undefined && option.optional) {
      extraInfo.push(`preset: ${JSON.stringify(option.presetArg)}`);
    }
    if (option.envVar !== undefined) {
      extraInfo.push(`env: ${option.envVar}`);
    }
    if (extraInfo.length > 0) {
      return `${option.description} (${extraInfo.join(', ')})`;
    }

    return option.description;
  }

  /**
   * Get the argument description to show in the list of arguments.
   *
   * @param {Argument} argument
   * @return {string}
   */

  argumentDescription(argument) {
    const extraInfo = [];
    if (argument.argChoices) {
      extraInfo.push(
        // use stringify to match the display of the default value
        `choices: ${argument.argChoices.map((choice) => JSON.stringify(choice)).join(', ')}`);
    }
    if (argument.defaultValue !== undefined) {
      extraInfo.push(`default: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`);
    }
    if (extraInfo.length > 0) {
      const extraDescripton = `(${extraInfo.join(', ')})`;
      if (argument.description) {
        return `${argument.description} ${extraDescripton}`;
      }
      return extraDescripton;
    }
    return argument.description;
  }

  /**
   * Generate the built-in help text.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {string}
   */

  formatHelp(cmd, helper) {
    const termWidth = helper.padWidth(cmd, helper);
    const helpWidth = helper.helpWidth || 80;
    const itemIndentWidth = 2;
    const itemSeparatorWidth = 2; // between term and description
    function formatItem(term, description) {
      if (description) {
        const fullText = `${term.padEnd(termWidth + itemSeparatorWidth)}${description}`;
        return helper.wrap(fullText, helpWidth - itemIndentWidth, termWidth + itemSeparatorWidth);
      }
      return term;
    }
    function formatList(textArray) {
      return textArray.join('\n').replace(/^/gm, ' '.repeat(itemIndentWidth));
    }

    // Usage
    let output = [`Usage: ${helper.commandUsage(cmd)}`, ''];

    // Description
    const commandDescription = helper.commandDescription(cmd);
    if (commandDescription.length > 0) {
      output = output.concat([helper.wrap(commandDescription, helpWidth, 0), '']);
    }

    // Arguments
    const argumentList = helper.visibleArguments(cmd).map((argument) => {
      return formatItem(helper.argumentTerm(argument), helper.argumentDescription(argument));
    });
    if (argumentList.length > 0) {
      output = output.concat(['Arguments:', formatList(argumentList), '']);
    }

    // Options
    const optionList = helper.visibleOptions(cmd).map((option) => {
      return formatItem(helper.optionTerm(option), helper.optionDescription(option));
    });
    if (optionList.length > 0) {
      output = output.concat(['Options:', formatList(optionList), '']);
    }

    if (this.showGlobalOptions) {
      const globalOptionList = helper.visibleGlobalOptions(cmd).map((option) => {
        return formatItem(helper.optionTerm(option), helper.optionDescription(option));
      });
      if (globalOptionList.length > 0) {
        output = output.concat(['Global Options:', formatList(globalOptionList), '']);
      }
    }

    // Commands
    const commandList = helper.visibleCommands(cmd).map((cmd) => {
      return formatItem(helper.subcommandTerm(cmd), helper.subcommandDescription(cmd));
    });
    if (commandList.length > 0) {
      output = output.concat(['Commands:', formatList(commandList), '']);
    }

    return output.join('\n');
  }

  /**
   * Calculate the pad width from the maximum term length.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {number}
   */

  padWidth(cmd, helper) {
    return Math.max(
      helper.longestOptionTermLength(cmd, helper),
      helper.longestGlobalOptionTermLength(cmd, helper),
      helper.longestSubcommandTermLength(cmd, helper),
      helper.longestArgumentTermLength(cmd, helper)
    );
  }

  /**
   * Wrap the given string to width characters per line, with lines after the first indented.
   * Do not wrap if insufficient room for wrapping (minColumnWidth), or string is manually formatted.
   *
   * @param {string} str
   * @param {number} width
   * @param {number} indent
   * @param {number} [minColumnWidth=40]
   * @return {string}
   *
   */

  wrap(str, width, indent, minColumnWidth = 40) {
    // Full \s characters, minus the linefeeds.
    const indents = ' \\f\\t\\v\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff';
    // Detect manually wrapped and indented strings by searching for line break followed by spaces.
    const manualIndent = new RegExp(`[\\n][${indents}]+`);
    if (str.match(manualIndent)) return str;
    // Do not wrap if not enough room for a wrapped column of text (as could end up with a word per line).
    const columnWidth = width - indent;
    if (columnWidth < minColumnWidth) return str;

    const leadingStr = str.slice(0, indent);
    const columnText = str.slice(indent).replace('\r\n', '\n');
    const indentString = ' '.repeat(indent);
    const zeroWidthSpace = '\u200B';
    const breaks = `\\s${zeroWidthSpace}`;
    // Match line end (so empty lines don't collapse),
    // or as much text as will fit in column, or excess text up to first break.
    const regex = new RegExp(`\n|.{1,${columnWidth - 1}}([${breaks}]|$)|[^${breaks}]+?([${breaks}]|$)`, 'g');
    const lines = columnText.match(regex) || [];
    return leadingStr + lines.map((line, i) => {
      if (line === '\n') return ''; // preserve empty lines
      return ((i > 0) ? indentString : '') + line.trimEnd();
    }).join('\n');
  }
}

exports.Help = Help;


/***/ }),
/* 16 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

const { InvalidArgumentError } = __webpack_require__(8);

// @ts-check

class Option {
  /**
   * Initialize a new `Option` with the given `flags` and `description`.
   *
   * @param {string} flags
   * @param {string} [description]
   */

  constructor(flags, description) {
    this.flags = flags;
    this.description = description || '';

    this.required = flags.includes('<'); // A value must be supplied when the option is specified.
    this.optional = flags.includes('['); // A value is optional when the option is specified.
    // variadic test ignores <value,...> et al which might be used to describe custom splitting of single argument
    this.variadic = /\w\.\.\.[>\]]$/.test(flags); // The option can take multiple values.
    this.mandatory = false; // The option must have a value after parsing, which usually means it must be specified on command line.
    const optionFlags = splitOptionFlags(flags);
    this.short = optionFlags.shortFlag;
    this.long = optionFlags.longFlag;
    this.negate = false;
    if (this.long) {
      this.negate = this.long.startsWith('--no-');
    }
    this.defaultValue = undefined;
    this.defaultValueDescription = undefined;
    this.presetArg = undefined;
    this.envVar = undefined;
    this.parseArg = undefined;
    this.hidden = false;
    this.argChoices = undefined;
    this.conflictsWith = [];
    this.implied = undefined;
  }

  /**
   * Set the default value, and optionally supply the description to be displayed in the help.
   *
   * @param {any} value
   * @param {string} [description]
   * @return {Option}
   */

  default(value, description) {
    this.defaultValue = value;
    this.defaultValueDescription = description;
    return this;
  }

  /**
   * Preset to use when option used without option-argument, especially optional but also boolean and negated.
   * The custom processing (parseArg) is called.
   *
   * @example
   * new Option('--color').default('GREYSCALE').preset('RGB');
   * new Option('--donate [amount]').preset('20').argParser(parseFloat);
   *
   * @param {any} arg
   * @return {Option}
   */

  preset(arg) {
    this.presetArg = arg;
    return this;
  }

  /**
   * Add option name(s) that conflict with this option.
   * An error will be displayed if conflicting options are found during parsing.
   *
   * @example
   * new Option('--rgb').conflicts('cmyk');
   * new Option('--js').conflicts(['ts', 'jsx']);
   *
   * @param {string | string[]} names
   * @return {Option}
   */

  conflicts(names) {
    this.conflictsWith = this.conflictsWith.concat(names);
    return this;
  }

  /**
   * Specify implied option values for when this option is set and the implied options are not.
   *
   * The custom processing (parseArg) is not called on the implied values.
   *
   * @example
   * program
   *   .addOption(new Option('--log', 'write logging information to file'))
   *   .addOption(new Option('--trace', 'log extra details').implies({ log: 'trace.txt' }));
   *
   * @param {Object} impliedOptionValues
   * @return {Option}
   */
  implies(impliedOptionValues) {
    this.implied = Object.assign(this.implied || {}, impliedOptionValues);
    return this;
  }

  /**
   * Set environment variable to check for option value.
   *
   * An environment variable is only used if when processed the current option value is
   * undefined, or the source of the current value is 'default' or 'config' or 'env'.
   *
   * @param {string} name
   * @return {Option}
   */

  env(name) {
    this.envVar = name;
    return this;
  }

  /**
   * Set the custom handler for processing CLI option arguments into option values.
   *
   * @param {Function} [fn]
   * @return {Option}
   */

  argParser(fn) {
    this.parseArg = fn;
    return this;
  }

  /**
   * Whether the option is mandatory and must have a value after parsing.
   *
   * @param {boolean} [mandatory=true]
   * @return {Option}
   */

  makeOptionMandatory(mandatory = true) {
    this.mandatory = !!mandatory;
    return this;
  }

  /**
   * Hide option in help.
   *
   * @param {boolean} [hide=true]
   * @return {Option}
   */

  hideHelp(hide = true) {
    this.hidden = !!hide;
    return this;
  }

  /**
   * @api private
   */

  _concatValue(value, previous) {
    if (previous === this.defaultValue || !Array.isArray(previous)) {
      return [value];
    }

    return previous.concat(value);
  }

  /**
   * Only allow option value to be one of choices.
   *
   * @param {string[]} values
   * @return {Option}
   */

  choices(values) {
    this.argChoices = values.slice();
    this.parseArg = (arg, previous) => {
      if (!this.argChoices.includes(arg)) {
        throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(', ')}.`);
      }
      if (this.variadic) {
        return this._concatValue(arg, previous);
      }
      return arg;
    };
    return this;
  }

  /**
   * Return option name.
   *
   * @return {string}
   */

  name() {
    if (this.long) {
      return this.long.replace(/^--/, '');
    }
    return this.short.replace(/^-/, '');
  }

  /**
   * Return option name, in a camelcase format that can be used
   * as a object attribute key.
   *
   * @return {string}
   * @api private
   */

  attributeName() {
    return camelcase(this.name().replace(/^no-/, ''));
  }

  /**
   * Check if `arg` matches the short or long flag.
   *
   * @param {string} arg
   * @return {boolean}
   * @api private
   */

  is(arg) {
    return this.short === arg || this.long === arg;
  }

  /**
   * Return whether a boolean option.
   *
   * Options are one of boolean, negated, required argument, or optional argument.
   *
   * @return {boolean}
   * @api private
   */

  isBoolean() {
    return !this.required && !this.optional && !this.negate;
  }
}

/**
 * This class is to make it easier to work with dual options, without changing the existing
 * implementation. We support separate dual options for separate positive and negative options,
 * like `--build` and `--no-build`, which share a single option value. This works nicely for some
 * use cases, but is tricky for others where we want separate behaviours despite
 * the single shared option value.
 */
class DualOptions {
  /**
   * @param {Option[]} options
   */
  constructor(options) {
    this.positiveOptions = new Map();
    this.negativeOptions = new Map();
    this.dualOptions = new Set();
    options.forEach(option => {
      if (option.negate) {
        this.negativeOptions.set(option.attributeName(), option);
      } else {
        this.positiveOptions.set(option.attributeName(), option);
      }
    });
    this.negativeOptions.forEach((value, key) => {
      if (this.positiveOptions.has(key)) {
        this.dualOptions.add(key);
      }
    });
  }

  /**
   * Did the value come from the option, and not from possible matching dual option?
   *
   * @param {any} value
   * @param {Option} option
   * @returns {boolean}
   */
  valueFromOption(value, option) {
    const optionKey = option.attributeName();
    if (!this.dualOptions.has(optionKey)) return true;

    // Use the value to deduce if (probably) came from the option.
    const preset = this.negativeOptions.get(optionKey).presetArg;
    const negativeValue = (preset !== undefined) ? preset : false;
    return option.negate === (negativeValue === value);
  }
}

/**
 * Convert string from kebab-case to camelCase.
 *
 * @param {string} str
 * @return {string}
 * @api private
 */

function camelcase(str) {
  return str.split('-').reduce((str, word) => {
    return str + word[0].toUpperCase() + word.slice(1);
  });
}

/**
 * Split the short and long flag out of something like '-m,--mixed <value>'
 *
 * @api private
 */

function splitOptionFlags(flags) {
  let shortFlag;
  let longFlag;
  // Use original very loose parsing to maintain backwards compatibility for now,
  // which allowed for example unintended `-sw, --short-word` [sic].
  const flagParts = flags.split(/[ |,]+/);
  if (flagParts.length > 1 && !/^[[<]/.test(flagParts[1])) shortFlag = flagParts.shift();
  longFlag = flagParts.shift();
  // Add support for lone short flag without significantly changing parsing!
  if (!shortFlag && /^-[^-]$/.test(longFlag)) {
    shortFlag = longFlag;
    longFlag = undefined;
  }
  return { shortFlag, longFlag };
}

exports.Option = Option;
exports.splitOptionFlags = splitOptionFlags;
exports.DualOptions = DualOptions;


/***/ }),
/* 17 */
/***/ ((__unused_webpack_module, exports) => {

const maxDistance = 3;

function editDistance(a, b) {
  // https://en.wikipedia.org/wiki/Damerau–Levenshtein_distance
  // Calculating optimal string alignment distance, no substring is edited more than once.
  // (Simple implementation.)

  // Quick early exit, return worst case.
  if (Math.abs(a.length - b.length) > maxDistance) return Math.max(a.length, b.length);

  // distance between prefix substrings of a and b
  const d = [];

  // pure deletions turn a into empty string
  for (let i = 0; i <= a.length; i++) {
    d[i] = [i];
  }
  // pure insertions turn empty string into b
  for (let j = 0; j <= b.length; j++) {
    d[0][j] = j;
  }

  // fill matrix
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      let cost = 1;
      if (a[i - 1] === b[j - 1]) {
        cost = 0;
      } else {
        cost = 1;
      }
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );
      // transposition
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }

  return d[a.length][b.length];
}

/**
 * Find close matches, restricted to same number of edits.
 *
 * @param {string} word
 * @param {string[]} candidates
 * @returns {string}
 */

function suggestSimilar(word, candidates) {
  if (!candidates || candidates.length === 0) return '';
  // remove possible duplicates
  candidates = Array.from(new Set(candidates));

  const searchingOptions = word.startsWith('--');
  if (searchingOptions) {
    word = word.slice(2);
    candidates = candidates.map(candidate => candidate.slice(2));
  }

  let similar = [];
  let bestDistance = maxDistance;
  const minSimilarity = 0.4;
  candidates.forEach((candidate) => {
    if (candidate.length <= 1) return; // no one character guesses

    const distance = editDistance(word, candidate);
    const length = Math.max(word.length, candidate.length);
    const similarity = (length - distance) / length;
    if (similarity > minSimilarity) {
      if (distance < bestDistance) {
        // better edit distance, throw away previous worse matches
        bestDistance = distance;
        similar = [candidate];
      } else if (distance === bestDistance) {
        similar.push(candidate);
      }
    }
  });

  similar.sort((a, b) => a.localeCompare(b));
  if (searchingOptions) {
    similar = similar.map(candidate => `--${candidate}`);
  }

  if (similar.length > 1) {
    return `\n(Did you mean one of ${similar.join(', ')}?)`;
  }
  if (similar.length === 1) {
    return `\n(Did you mean ${similar[0]}?)`;
  }
  return '';
}

exports.suggestSimilar = suggestSimilar;


/***/ }),
/* 18 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppError = void 0;
var AppError;
(function (AppError) {
    AppError["INVALID_INPUT_FILE"] = "Can not read from input file, file is either broken or its format is not supported";
    AppError["EMPTY_SCM"] = "SCM file can not be empty";
    AppError["NO_OPCODE"] = "Can not read opcode definitions from <%s>, disassembling is impossible";
    AppError["UNKNOWN_GAME"] = "Unknown game alias <%s> passed as command-line argument";
    AppError["UNKNOWN_PARAM"] = "Unknown data type %s found at offset %s";
    AppError["NO_PARAM"] = "No parameters found for opcode %s at %s";
    AppError["END_OF_BUFFER"] = "Unexpectedly reached the end of the buffer while reading %s bytes";
    AppError["INVALID_REL_OFFSET"] = "Relative offset found in the main section at %s";
    AppError["INVALID_ABS_OFFSET"] = "Absolute offset found in a CLEO file at %s";
    AppError["NO_TARGET"] = "WARNING: No target instruction found for branch %s at %s";
    AppError["NO_BRANCH"] = "WARNING: No branch found at offset %s during linkage";
    AppError["NOT_NUMERIC_INSTRUCTION"] = "Expected a numeric argument in instruction at %s";
    AppError["NOT_STRING_INSTRUCTION"] = "Expected a string argument in instruction at %s";
    AppError["UNKNOWN_LOOP_TYPE"] = "WARNING: Unknown loop type with header nodes %s and latching nodes %s";
    AppError["INVALID_BB_TYPE"] = "Invalid block type %s";
    AppError["NODE_NOT_FOUND"] = "Internal error: node not found";
    AppError["NO_IF_PREDICATE"] = "No IF instruction found for the condition at %s";
})(AppError = exports.AppError || (exports.AppError = {}));


/***/ }),
/* 19 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.eIfType = exports.eLoopType = exports.eBasicBlockType = exports.eScriptType = exports.eScriptFileSegments = exports.eGame = exports.eParamType = void 0;
var eParamType;
(function (eParamType) {
    eParamType[eParamType["EOL"] = 0] = "EOL";
    // immediate values
    eParamType[eParamType["NUM8"] = 1] = "NUM8";
    eParamType[eParamType["NUM16"] = 2] = "NUM16";
    eParamType[eParamType["NUM32"] = 3] = "NUM32";
    eParamType[eParamType["FLOAT"] = 4] = "FLOAT";
    eParamType[eParamType["STR"] = 5] = "STR";
    eParamType[eParamType["STR8"] = 6] = "STR8";
    eParamType[eParamType["STR16"] = 7] = "STR16";
    eParamType[eParamType["STR128"] = 8] = "STR128";
    // variables
    eParamType[eParamType["GVARNUM32"] = 9] = "GVARNUM32";
    eParamType[eParamType["LVARNUM32"] = 10] = "LVARNUM32";
    eParamType[eParamType["GVARSTR8"] = 11] = "GVARSTR8";
    eParamType[eParamType["LVARSTR8"] = 12] = "LVARSTR8";
    eParamType[eParamType["GVARSTR16"] = 13] = "GVARSTR16";
    eParamType[eParamType["LVARSTR16"] = 14] = "LVARSTR16";
    // arrays
    eParamType[eParamType["GARRSTR8"] = 15] = "GARRSTR8";
    eParamType[eParamType["LARRSTR8"] = 16] = "LARRSTR8";
    eParamType[eParamType["GARRSTR16"] = 17] = "GARRSTR16";
    eParamType[eParamType["LARRSTR16"] = 18] = "LARRSTR16";
    eParamType[eParamType["GARRNUM32"] = 19] = "GARRNUM32";
    eParamType[eParamType["LARRNUM32"] = 20] = "LARRNUM32";
})(eParamType = exports.eParamType || (exports.eParamType = {}));
var eGame;
(function (eGame) {
    eGame[eGame["GTA3"] = 0] = "GTA3";
    eGame[eGame["GTAVC"] = 1] = "GTAVC";
    eGame[eGame["GTASA"] = 2] = "GTASA";
})(eGame = exports.eGame || (exports.eGame = {}));
var eScriptFileSegments;
(function (eScriptFileSegments) {
    eScriptFileSegments[eScriptFileSegments["GLOBAL_VARS"] = 0] = "GLOBAL_VARS";
    eScriptFileSegments[eScriptFileSegments["MODELS"] = 1] = "MODELS";
    eScriptFileSegments[eScriptFileSegments["MISSIONS"] = 2] = "MISSIONS";
    eScriptFileSegments[eScriptFileSegments["EXTERNALS"] = 3] = "EXTERNALS";
    eScriptFileSegments[eScriptFileSegments["SASEG5"] = 4] = "SASEG5";
    eScriptFileSegments[eScriptFileSegments["SASEG6"] = 5] = "SASEG6";
    eScriptFileSegments[eScriptFileSegments["MAIN"] = 6] = "MAIN";
})(eScriptFileSegments = exports.eScriptFileSegments || (exports.eScriptFileSegments = {}));
var eScriptType;
(function (eScriptType) {
    eScriptType[eScriptType["MAIN"] = 0] = "MAIN";
    eScriptType[eScriptType["MISSION"] = 1] = "MISSION";
    eScriptType[eScriptType["EXTERNAL"] = 2] = "EXTERNAL";
    eScriptType[eScriptType["CLEO"] = 3] = "CLEO";
})(eScriptType = exports.eScriptType || (exports.eScriptType = {}));
var eBasicBlockType;
(function (eBasicBlockType) {
    eBasicBlockType[eBasicBlockType["UNDEFINED"] = 0] = "UNDEFINED";
    eBasicBlockType[eBasicBlockType["RETURN"] = 1] = "RETURN";
    eBasicBlockType[eBasicBlockType["ONE_WAY"] = 2] = "ONE_WAY";
    eBasicBlockType[eBasicBlockType["TWO_WAY"] = 3] = "TWO_WAY";
    eBasicBlockType[eBasicBlockType["FALL"] = 4] = "FALL";
    eBasicBlockType[eBasicBlockType["N_WAY"] = 5] = "N_WAY";
    eBasicBlockType[eBasicBlockType["BREAK"] = 6] = "BREAK";
    eBasicBlockType[eBasicBlockType["CONTINUE"] = 7] = "CONTINUE";
    eBasicBlockType[eBasicBlockType["UNSTRUCTURED"] = 8] = "UNSTRUCTURED";
    eBasicBlockType[eBasicBlockType["LOOP_COND"] = 9] = "LOOP_COND";
})(eBasicBlockType = exports.eBasicBlockType || (exports.eBasicBlockType = {}));
var eLoopType;
(function (eLoopType) {
    eLoopType["PRE_TESTED"] = "PRE_TESTED";
    eLoopType["POST_TESTED"] = "POST_TESTED";
    eLoopType["ENDLESS"] = "ENDLESS";
})(eLoopType = exports.eLoopType || (exports.eLoopType = {}));
var eIfType;
(function (eIfType) {
    eIfType["IF_THEN"] = "IF_THEN";
    eIfType["IF_THEN_ELSE"] = "IF_THEN_ELSE";
})(eIfType = exports.eIfType || (exports.eIfType = {}));


/***/ }),
/* 20 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Log = void 0;
const format_1 = __webpack_require__(21);
const browser_or_node_1 = __webpack_require__(5);
const arguments_1 = __webpack_require__(2);
class Log {
    static error(error, ...args) {
        return new Error((0, format_1.vsprintf)(error, ...args));
    }
    static warn(warning, ...args) {
        return this.msg((0, format_1.vsprintf)(warning, ...args));
    }
    static msg(...msg) {
        if (browser_or_node_1.isBrowser) {
            const text = document.getElementById('text');
            text.value += msg.join('\n') + '\n';
        }
        else {
            console.log(...msg);
        }
    }
    static debug(...msg) {
        if (arguments_1.GLOBAL_OPTIONS.debugMode) {
            console.log(...msg);
        }
    }
    static format(format, ...args) {
        return (0, format_1.vsprintf)(format, ...args);
    }
}
exports.Log = Log;


/***/ }),
/* 21 */
/***/ ((module) => {

//
// format - printf-like string formatting for JavaScript
// github.com/samsonjs/format
// @_sjs
//
// Copyright 2010 - 2013 Sami Samhuri <sami@samhuri.net>
//
// MIT License
// http://sjs.mit-license.org
//

;(function() {

  //// Export the API
  var namespace;

  // CommonJS / Node module
  if (true) {
    namespace = module.exports = format;
  }

  // Browsers and other environments
  else {}

  namespace.format = format;
  namespace.vsprintf = vsprintf;

  if (typeof console !== 'undefined' && typeof console.log === 'function') {
    namespace.printf = printf;
  }

  function printf(/* ... */) {
    console.log(format.apply(null, arguments));
  }

  function vsprintf(fmt, replacements) {
    return format.apply(null, [fmt].concat(replacements));
  }

  function format(fmt) {
    var argIndex = 1 // skip initial format argument
      , args = [].slice.call(arguments)
      , i = 0
      , n = fmt.length
      , result = ''
      , c
      , escaped = false
      , arg
      , tmp
      , leadingZero = false
      , precision
      , nextArg = function() { return args[argIndex++]; }
      , slurpNumber = function() {
          var digits = '';
          while (/\d/.test(fmt[i])) {
            digits += fmt[i++];
            c = fmt[i];
          }
          return digits.length > 0 ? parseInt(digits) : null;
        }
      ;
    for (; i < n; ++i) {
      c = fmt[i];
      if (escaped) {
        escaped = false;
        if (c == '.') {
          leadingZero = false;
          c = fmt[++i];
        }
        else if (c == '0' && fmt[i + 1] == '.') {
          leadingZero = true;
          i += 2;
          c = fmt[i];
        }
        else {
          leadingZero = true;
        }
        precision = slurpNumber();
        switch (c) {
        case 'b': // number in binary
          result += parseInt(nextArg(), 10).toString(2);
          break;
        case 'c': // character
          arg = nextArg();
          if (typeof arg === 'string' || arg instanceof String)
            result += arg;
          else
            result += String.fromCharCode(parseInt(arg, 10));
          break;
        case 'd': // number in decimal
          result += parseInt(nextArg(), 10);
          break;
        case 'f': // floating point number
          tmp = String(parseFloat(nextArg()).toFixed(precision || 6));
          result += leadingZero ? tmp : tmp.replace(/^0/, '');
          break;
        case 'j': // JSON
          result += JSON.stringify(nextArg());
          break;
        case 'o': // number in octal
          result += '0' + parseInt(nextArg(), 10).toString(8);
          break;
        case 's': // string
          result += nextArg();
          break;
        case 'x': // lowercase hexadecimal
          result += '0x' + parseInt(nextArg(), 10).toString(16);
          break;
        case 'X': // uppercase hexadecimal
          result += '0x' + parseInt(nextArg(), 10).toString(16).toUpperCase();
          break;
        default:
          result += c;
          break;
        }
      } else if (c === '%') {
        escaped = true;
      } else {
        result += c;
      }
    }
    return result;
  }

}());


/***/ }),
/* 22 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.bufferFromHex = exports.emptyBuffer = exports.readBinaryStream = exports.saveToFile = exports.fileExists = exports.loadJson = exports.loadText = void 0;
const fs_1 = __webpack_require__(23);
const promises_1 = __webpack_require__(24);
function loadText(fileName, encoding = 'utf8') {
    return __awaiter(this, void 0, void 0, function* () {
        const buf = yield (0, promises_1.readFile)(fileName, { encoding });
        return buf.toString();
    });
}
exports.loadText = loadText;
function loadJson(fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        const text = yield loadText(fileName);
        return JSON.parse(text);
    });
}
exports.loadJson = loadJson;
function fileExists(fileName) {
    return (0, fs_1.existsSync)(fileName);
}
exports.fileExists = fileExists;
function saveToFile(fileName, content) {
    (0, fs_1.writeFileSync)(fileName, content, { encoding: 'utf8' });
}
exports.saveToFile = saveToFile;
function readBinaryStream(stream) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const chunks = [];
            stream.on('readable', () => {
                const chunk = stream.read();
                if (chunk !== null) {
                    chunks.push(chunk);
                }
            });
            stream.on('end', () => {
                resolve(Buffer.concat(chunks));
            });
            stream.on('error', (e) => {
                reject(e);
            });
        });
    });
}
exports.readBinaryStream = readBinaryStream;
function emptyBuffer() {
    return new DataView(new ArrayBuffer(0));
}
exports.emptyBuffer = emptyBuffer;
function bufferFromHex(hex) {
    const { buffer } = new Uint8Array(hex.match(/[\da-f]{2}/gi).map((h) => parseInt(h, 16)));
    return new DataView(buffer);
}
exports.bufferFromHex = bufferFromHex;


/***/ }),
/* 23 */
/***/ (() => {

/* (ignored) */

/***/ }),
/* 24 */
/***/ (() => {

/* (ignored) */

/***/ }),
/* 25 */
/***/ ((module) => {

"use strict";
module.exports = JSON.parse('{"name":"scout","version":"0.5.2","description":"Scout Decompiler","main":"scout.js","repository":{"type":"git","url":"https://github.com/x87/scout.git"},"scripts":{"lint":"eslint ./src","build":"webpack --config webpack.node.config.js","build-web":"webpack --config webpack.web.config.js","dev":"npm run build -- --watch","test":"jest"},"keywords":[],"author":"Seemann","license":"MIT","devDependencies":{"@types/jest":"29.4.0","@types/node":"18.14.6","@typescript-eslint/eslint-plugin":"^5.54.0","@typescript-eslint/parser":"^5.54.0","eslint":"^8.35.0","jest":"29.4.3","jest-extended":"3.2.4","ts-jest":"29.0.5","ts-loader":"9.4.2","ts-node":"10.9.1","typescript":"4.9.5","webpack":"^5.76.2","webpack-cli":"5.0.1"},"dependencies":{"browser-or-node":"^2.1.1","commander":"10.0.0","eol":"0.9.1","format":"^0.2.2","node-fetch":"2.6.9"}}');

/***/ }),
/* 26 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Loader = void 0;
const log_1 = __webpack_require__(20);
const ScriptFile_1 = __webpack_require__(27);
const ScriptMultifile_1 = __webpack_require__(28);
const errors_1 = __webpack_require__(18);
const enums_1 = __webpack_require__(19);
class Loader {
    loadScript(stream) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let buffer = yield stream;
                if (this.hasCustomFooter(buffer)) {
                    // SB's Extra info is not supported yet
                    const offset = buffer.getUint32(buffer.byteLength - 12, true);
                    buffer = new DataView(buffer.buffer.slice(0, offset));
                }
                return this.hasHeader(buffer)
                    ? new ScriptMultifile_1.ScriptMultifile(buffer)
                    : new ScriptFile_1.ScriptFile(buffer, enums_1.eScriptType.CLEO);
            }
            catch (e) {
                console.log(e);
                throw log_1.Log.error(errors_1.AppError.INVALID_INPUT_FILE);
            }
        });
    }
    hasHeader(buf) {
        // todo: count jumps
        const firstOp = buf.getInt16(0, true);
        return firstOp === 2;
    }
    hasCustomFooter(buf) {
        // https://github.com/sannybuilder/dev/wiki/Extra-Info-Format
        const magic = '__SBFTR\0';
        try {
            const initialOffset = buf.byteLength - magic.length;
            for (let i = 0; i < magic.length; i++) {
                const char = buf.getUint8(initialOffset + i);
                if (char !== magic.charCodeAt(i))
                    return false;
            }
            return true;
        }
        catch (_a) {
            return false;
        }
    }
}
exports.Loader = Loader;


/***/ }),
/* 27 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ScriptFile = void 0;
class ScriptFile {
    constructor(buffer, type) {
        this.buffer = buffer;
        this.type = type;
    }
    get baseOffset() {
        return 0;
    }
}
exports.ScriptFile = ScriptFile;


/***/ }),
/* 28 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ScriptMultifile = void 0;
const enums_1 = __webpack_require__(19);
const ScriptFile_1 = __webpack_require__(27);
const MultifileMeta_1 = __webpack_require__(29);
class ScriptMultifile extends ScriptFile_1.ScriptFile {
    constructor(data) {
        super(data, enums_1.eScriptType.MAIN);
        this.meta = new MultifileMeta_1.MultifileMeta(data);
        this.buffer = new DataView(data.buffer.slice(this.baseOffset, this.meta.mainSize));
        const len = this.meta.missions.length;
        const missions = this.meta.missions.map((offset, i, arr) => {
            const nextMissionOffset = i === len - 1 ? data.byteLength : arr[i + 1];
            return new ScriptFile_1.ScriptFile(new DataView(data.buffer.slice(offset, nextMissionOffset)), enums_1.eScriptType.MISSION);
        });
        // todo: externals
        this.scripts = missions;
    }
    get baseOffset() {
        return this.meta.size;
    }
}
exports.ScriptMultifile = ScriptMultifile;


/***/ }),
/* 29 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MultifileMeta = void 0;
const utils = __webpack_require__(30);
const arguments_1 = __webpack_require__(2);
const errors_1 = __webpack_require__(18);
const log_1 = __webpack_require__(20);
const enums_1 = __webpack_require__(19);
const MultifileHeaderMap = {
    [enums_1.eGame.GTA3]: {
        [enums_1.eScriptFileSegments.GLOBAL_VARS]: 0,
        [enums_1.eScriptFileSegments.MODELS]: 1,
        [enums_1.eScriptFileSegments.MISSIONS]: 2,
        [enums_1.eScriptFileSegments.MAIN]: 3,
    },
    [enums_1.eGame.GTAVC]: {
        [enums_1.eScriptFileSegments.GLOBAL_VARS]: 0,
        [enums_1.eScriptFileSegments.MODELS]: 1,
        [enums_1.eScriptFileSegments.MISSIONS]: 2,
        [enums_1.eScriptFileSegments.MAIN]: 3,
    },
    [enums_1.eGame.GTASA]: {
        [enums_1.eScriptFileSegments.GLOBAL_VARS]: 0,
        [enums_1.eScriptFileSegments.MODELS]: 1,
        [enums_1.eScriptFileSegments.MISSIONS]: 2,
        [enums_1.eScriptFileSegments.EXTERNALS]: 3,
        [enums_1.eScriptFileSegments.SASEG5]: 4,
        [enums_1.eScriptFileSegments.SASEG6]: 5,
        [enums_1.eScriptFileSegments.MAIN]: 6,
    },
};
class MultifileMeta {
    constructor(data) {
        if (data.byteLength === 0) {
            throw log_1.Log.error(errors_1.AppError.EMPTY_SCM);
        }
        this.loadModelSegment(data);
        this.loadMissionSegment(data);
        if (utils.isGameSA()) {
            this.loadExternalSegment(data);
        }
        const segmentId = MultifileHeaderMap[arguments_1.GLOBAL_OPTIONS.game][enums_1.eScriptFileSegments.MAIN];
        this.size = this.getSegmentOffset(data, segmentId, false);
    }
    loadModelSegment(data) {
        const segmentId = MultifileHeaderMap[arguments_1.GLOBAL_OPTIONS.game][enums_1.eScriptFileSegments.MODELS];
        this.offset = this.getSegmentOffset(data, segmentId);
        const numModels = this.read32Bit(data);
        this.modelIds = [];
        this.offset += 24; // skip first model (empty)
        for (let i = 1; i < numModels; i += 1) {
            this.modelIds.push(this.readString(data, 24));
        }
    }
    loadMissionSegment(data) {
        const segmentId = MultifileHeaderMap[arguments_1.GLOBAL_OPTIONS.game][enums_1.eScriptFileSegments.MISSIONS];
        this.offset = this.getSegmentOffset(data, segmentId);
        this.mainSize = this.read32Bit(data);
        this.largestMission = this.read32Bit(data);
        const numMissions = this.read16Bit(data);
        this.numExclusiveMissions = this.read16Bit(data);
        if (utils.isGameSA()) {
            this.highestLocalInMission = this.read32Bit(data);
        }
        this.missions = [];
        for (let i = 0; i < numMissions; i += 1) {
            this.missions.push(this.read32Bit(data));
        }
    }
    loadExternalSegment(data) {
        const segmentId = MultifileHeaderMap[arguments_1.GLOBAL_OPTIONS.game][enums_1.eScriptFileSegments.EXTERNALS];
        this.offset = this.getSegmentOffset(data, segmentId);
        this.largestExternalSize = this.read32Bit(data);
        const numExternals = this.read32Bit(data);
        this.externals = [];
        for (let i = 0; i < numExternals; i += 1) {
            this.externals.push({
                name: this.readString(data, 20),
                offset: this.read32Bit(data),
                size: this.read32Bit(data),
            });
        }
    }
    getSegmentOffset(data, segmentId, skipJumpOpcode = true) {
        let result = 0;
        while (segmentId--) {
            result = data.getInt32(result + 3, true);
        }
        return result + (skipJumpOpcode ? 8 : 0);
    }
    readString(data, len) {
        let s = '';
        for (let i = 0; i < len; i++) {
            const char = data.getUint8(this.offset + i);
            if (char == 0)
                break;
            s += String.fromCharCode(char);
        }
        this.offset += len;
        return s;
    }
    read32Bit(data) {
        this.offset += 4;
        return data.getInt32(this.offset - 4, true);
    }
    read16Bit(data) {
        this.offset += 2;
        return data.getInt16(this.offset - 2, true);
    }
}
exports.MultifileMeta = MultifileMeta;


/***/ }),
/* 30 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.hexToOpcode = exports.opcodeToHex = exports.strPadLeft = exports.checkArrayIncludeItemFromArray = exports.checkArrayIncludesArray = exports.getArrayIntersection = exports.removeFromArray = exports.isEqual = exports.isArrayParam = exports.isGameSA = exports.isGameVC = exports.isGameGTA3 = void 0;
const arguments_1 = __webpack_require__(2);
const enums_1 = __webpack_require__(19);
const isGameGTA3 = () => arguments_1.GLOBAL_OPTIONS.game === enums_1.eGame.GTA3;
exports.isGameGTA3 = isGameGTA3;
const isGameVC = () => arguments_1.GLOBAL_OPTIONS.game === enums_1.eGame.GTAVC;
exports.isGameVC = isGameVC;
const isGameSA = () => arguments_1.GLOBAL_OPTIONS.game === enums_1.eGame.GTASA;
exports.isGameSA = isGameSA;
const isArrayParam = (param) => [
    enums_1.eParamType.GARRSTR8,
    enums_1.eParamType.LARRSTR8,
    enums_1.eParamType.GARRSTR16,
    enums_1.eParamType.LARRSTR16,
    enums_1.eParamType.GARRNUM32,
    enums_1.eParamType.LARRNUM32,
].includes(param);
exports.isArrayParam = isArrayParam;
const isEqual = (a1, a2) => {
    return a1.length === a2.length && (0, exports.checkArrayIncludesArray)(a1, a2);
};
exports.isEqual = isEqual;
const removeFromArray = (a1, iteratee) => {
    const indexes = [];
    const removed = a1.filter((item, i) => iteratee(item) && indexes.push(i));
    for (let i = indexes.length - 1; i >= 0; i--) {
        a1.splice(indexes[i], 1);
    }
    return removed;
};
exports.removeFromArray = removeFromArray;
const getArrayIntersection = (...arrays) => {
    if (arrays.length === 0) {
        return [];
    }
    if (arrays.length === 1) {
        return arrays[0];
    }
    const others = arrays.slice(1);
    return arrays[0].filter((item) => others.every((arr) => arr.includes(item)));
};
exports.getArrayIntersection = getArrayIntersection;
const checkArrayIncludesArray = (a1, a2) => {
    return (0, exports.getArrayIntersection)(a2, a1).length === a2.length;
};
exports.checkArrayIncludesArray = checkArrayIncludesArray;
const checkArrayIncludeItemFromArray = (a1, a2) => {
    return !!(0, exports.getArrayIntersection)(a2, a1).length;
};
exports.checkArrayIncludeItemFromArray = checkArrayIncludeItemFromArray;
const strPadLeft = (str, length, char = '0') => {
    return str.padStart(length, char);
};
exports.strPadLeft = strPadLeft;
const opcodeToHex = (opcode) => {
    return (0, exports.strPadLeft)(opcode.toString(16).toUpperCase(), 4);
};
exports.opcodeToHex = opcodeToHex;
const hexToOpcode = (id) => {
    return parseInt(id, 16);
};
exports.hexToOpcode = hexToOpcode;


/***/ }),
/* 31 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Parser = exports.PARAM_LABEL = exports.PARAM_ARGUMENTS = exports.PARAM_ANY = void 0;
const utils = __webpack_require__(30);
const log_1 = __webpack_require__(20);
const errors_1 = __webpack_require__(18);
const ScriptMultifile_1 = __webpack_require__(28);
const enums_1 = __webpack_require__(19);
const instructions_1 = __webpack_require__(32);
const cfg_1 = __webpack_require__(33);
const definitions_1 = __webpack_require__(36);
exports.PARAM_ANY = definitions_1.PrimitiveType.any;
exports.PARAM_ARGUMENTS = definitions_1.PrimitiveType.arguments;
exports.PARAM_LABEL = definitions_1.PrimitiveType.label;
class Parser {
    constructor(definitionMap) {
        this.nonameCounter = 0;
        this.definitionMap = definitionMap;
        this.paramValuesHandlers = {
            [enums_1.eParamType.NUM8]: () => this.nextInt8(),
            [enums_1.eParamType.NUM16]: () => this.nextInt16(),
            [enums_1.eParamType.NUM32]: () => this.nextInt32(),
            [enums_1.eParamType.FLOAT]: () => this.getFloat(),
            [enums_1.eParamType.STR]: () => this.getString(this.nextUInt8()),
            [enums_1.eParamType.STR8]: () => this.getString(8),
            [enums_1.eParamType.STR16]: () => this.getString(16),
            [enums_1.eParamType.STR128]: () => this.getString(128),
            [enums_1.eParamType.GVARNUM32]: () => this.nextUInt16(),
            [enums_1.eParamType.LVARNUM32]: () => this.nextUInt16(),
            [enums_1.eParamType.GVARSTR8]: () => this.nextUInt16(),
            [enums_1.eParamType.LVARSTR8]: () => this.nextUInt16(),
            [enums_1.eParamType.GVARSTR16]: () => this.nextUInt16(),
            [enums_1.eParamType.LVARSTR16]: () => this.nextUInt16(),
            [enums_1.eParamType.GARRNUM32]: () => this.getArray(),
            [enums_1.eParamType.LARRNUM32]: () => this.getArray(),
            [enums_1.eParamType.GARRSTR8]: () => this.getArray(),
            [enums_1.eParamType.LARRSTR8]: () => this.getArray(),
            [enums_1.eParamType.GARRSTR16]: () => this.getArray(),
            [enums_1.eParamType.LARRSTR16]: () => this.getArray(),
        };
        this.paramTypesHandlers = [...Array(256)].map((v, i) => {
            switch (i) {
                case 0:
                    return () => enums_1.eParamType.EOL;
                case 1:
                    return () => enums_1.eParamType.NUM32;
                case 2:
                    return () => enums_1.eParamType.GVARNUM32;
                case 3:
                    return () => enums_1.eParamType.LVARNUM32;
                case 4:
                    return () => enums_1.eParamType.NUM8;
                case 5:
                    return () => enums_1.eParamType.NUM16;
                case 6:
                    return () => enums_1.eParamType.FLOAT;
                case 7:
                    if (utils.isGameSA()) {
                        return () => enums_1.eParamType.GARRNUM32;
                    }
                case 8:
                    if (utils.isGameSA()) {
                        return () => enums_1.eParamType.LARRNUM32;
                    }
                case 9:
                    if (utils.isGameSA()) {
                        return () => enums_1.eParamType.STR8;
                    }
                case 0xa:
                    if (utils.isGameSA()) {
                        return () => enums_1.eParamType.GVARSTR8;
                    }
                case 0xb:
                    if (utils.isGameSA()) {
                        return () => enums_1.eParamType.LVARSTR8;
                    }
                case 0xc:
                    if (utils.isGameSA()) {
                        return () => enums_1.eParamType.GARRSTR8;
                    }
                case 0xd:
                    if (utils.isGameSA()) {
                        return () => enums_1.eParamType.LARRSTR8;
                    }
                case 0xe:
                    if (utils.isGameSA()) {
                        return () => enums_1.eParamType.STR;
                    }
                case 0xf:
                    if (utils.isGameSA()) {
                        return () => enums_1.eParamType.STR16;
                    }
                case 0x10:
                    if (utils.isGameSA()) {
                        return () => enums_1.eParamType.GVARSTR16;
                    }
                case 0x11:
                    if (utils.isGameSA()) {
                        return () => enums_1.eParamType.LVARSTR16;
                    }
                case 0x12:
                    if (utils.isGameSA()) {
                        return () => enums_1.eParamType.GARRSTR16;
                    }
                case 0x13:
                    if (utils.isGameSA()) {
                        return () => enums_1.eParamType.LARRSTR16;
                    }
                default:
                    if (utils.isGameSA()) {
                        return () => {
                            this.offset--;
                            return enums_1.eParamType.STR128;
                        };
                    }
                    return () => {
                        this.offset--;
                        return enums_1.eParamType.STR8;
                    };
            }
        });
    }
    parse(scriptFile) {
        const main = {
            instructionMap: this.getInstructions(scriptFile),
            type: scriptFile.type,
            name: scriptFile.name || 'noname_' + this.nonameCounter++,
        };
        const scripts = [main];
        if (scriptFile instanceof ScriptMultifile_1.ScriptMultifile) {
            for (const script of scriptFile.scripts) {
                scripts.push(this.parse(script)[0]);
            }
        }
        return scripts;
    }
    getInstructions(scriptFile) {
        var _a;
        const map = new Map();
        this.offset = 0;
        this.data = scriptFile.buffer;
        for (const instruction of this) {
            instruction.offset += scriptFile.baseOffset;
            map.set(instruction.offset, instruction);
            if (instruction.opcode === cfg_1.OP_NAME) {
                (_a = scriptFile.name) !== null && _a !== void 0 ? _a : (scriptFile.name = (0, instructions_1.getString8Param)(instruction));
            }
        }
        return map;
    }
    [Symbol.iterator]() {
        const self = this;
        return {
            next() {
                if (self.offset >= self.data.byteLength) {
                    return { value: undefined, done: true };
                }
                return {
                    value: self.getInstruction(),
                    done: false,
                };
            },
        };
    }
    nextUInt8() {
        let result;
        try {
            result = this.data.getUint8(this.offset);
            this.offset += 1;
        }
        catch (_a) {
            throw log_1.Log.error(errors_1.AppError.END_OF_BUFFER, 1);
        }
        return result;
    }
    nextInt8() {
        let result;
        try {
            result = this.data.getInt8(this.offset);
            this.offset += 1;
        }
        catch (_a) {
            throw log_1.Log.error(errors_1.AppError.END_OF_BUFFER, 1);
        }
        return result;
    }
    nextUInt16() {
        let result;
        try {
            result = this.data.getUint16(this.offset, true);
            this.offset += 2;
        }
        catch (_a) {
            throw log_1.Log.error(errors_1.AppError.END_OF_BUFFER, 2);
        }
        return result;
    }
    nextInt16() {
        let result;
        try {
            result = this.data.getInt16(this.offset, true);
            this.offset += 2;
        }
        catch (_a) {
            throw log_1.Log.error(errors_1.AppError.END_OF_BUFFER, 2);
        }
        return result;
    }
    nextUInt32() {
        let result;
        try {
            result = this.data.getUint32(this.offset, true);
            this.offset += 4;
        }
        catch (_a) {
            throw log_1.Log.error(errors_1.AppError.END_OF_BUFFER, 4);
        }
        return result;
    }
    nextInt32() {
        let result;
        try {
            result = this.data.getInt32(this.offset, true);
            this.offset += 4;
        }
        catch (_a) {
            throw log_1.Log.error(errors_1.AppError.END_OF_BUFFER, 4);
        }
        return result;
    }
    nextFloat() {
        let result;
        try {
            result = this.data.getFloat32(this.offset, true);
            this.offset += 4;
        }
        catch (_a) {
            throw log_1.Log.error(errors_1.AppError.END_OF_BUFFER, 4);
        }
        return result;
    }
    getFloat() {
        if (utils.isGameGTA3()) {
            const val = this.nextInt16();
            return val / 16.0;
        }
        return this.nextFloat();
    }
    getString(length) {
        try {
            let s = '';
            for (let i = 0; i < length; i++) {
                const char = this.data.getUint8(this.offset + i);
                if (char == 0)
                    break;
                s += String.fromCharCode(char);
            }
            this.offset += length;
            return s;
        }
        catch (_a) {
            throw log_1.Log.error(errors_1.AppError.END_OF_BUFFER, length);
        }
    }
    getArray() {
        return {
            offset: this.nextUInt16(),
            varIndex: this.nextUInt16(),
            size: this.nextUInt8(),
            props: this.nextUInt8(),
        };
    }
    getInstruction() {
        const offset = this.offset;
        const opcode = this.nextUInt16();
        return {
            opcode,
            offset,
            params: this.getInstructionParams(opcode),
        };
    }
    getParamType() {
        const dataType = this.nextUInt8();
        return this.paramTypesHandlers[dataType]();
    }
    getInstructionParams(opcode) {
        const params = [];
        const definition = this.definitionMap.get(opcode & 0x7fff);
        if (!definition || !definition.params) {
            throw log_1.Log.error(errors_1.AppError.NO_PARAM, definition, this.offset);
        }
        definition.params.forEach((opcodeParam) => {
            while (true) {
                const paramType = this.getParamType();
                if (paramType === enums_1.eParamType.EOL) {
                    if (opcodeParam.type !== exports.PARAM_ARGUMENTS) {
                        throw log_1.Log.error(errors_1.AppError.UNKNOWN_PARAM, paramType, this.offset);
                    }
                    return params;
                }
                params.push(this.getParam(paramType));
                if (opcodeParam.type !== exports.PARAM_ARGUMENTS) {
                    break;
                }
            }
        });
        return params;
    }
    getParam(paramType) {
        return {
            type: paramType,
            value: this.paramValuesHandlers[paramType](),
        };
    }
}
exports.Parser = Parser;


/***/ }),
/* 32 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getString8Param = exports.getNumericParam = exports.isString8 = exports.isNumeric = void 0;
const enums_1 = __webpack_require__(19);
const log_1 = __webpack_require__(20);
const errors_1 = __webpack_require__(18);
const isNumeric = (instruction) => {
    return [enums_1.eParamType.NUM32, enums_1.eParamType.NUM16, enums_1.eParamType.NUM8].includes(instruction.params[0].type);
};
exports.isNumeric = isNumeric;
const isString8 = (instruction) => {
    return [enums_1.eParamType.STR8].includes(instruction.params[0].type);
};
exports.isString8 = isString8;
const getNumericParam = (instruction) => {
    if (!(0, exports.isNumeric)(instruction)) {
        throw log_1.Log.error(errors_1.AppError.NOT_NUMERIC_INSTRUCTION, instruction.offset);
    }
    return Number(instruction.params[0].value);
};
exports.getNumericParam = getNumericParam;
const getString8Param = (instruction) => {
    if (!(0, exports.isString8)(instruction)) {
        throw log_1.Log.error(errors_1.AppError.NOT_STRING_INSTRUCTION, instruction.offset);
    }
    return instruction.params[0].value;
};
exports.getString8Param = getString8Param;


/***/ }),
/* 33 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CFG = exports.OP_IF = exports.OP_NAME = exports.OP_JF = exports.OP_JMP = void 0;
const log_1 = __webpack_require__(20);
const arguments_1 = __webpack_require__(2);
const errors_1 = __webpack_require__(18);
const graph_1 = __webpack_require__(34);
const Instruction = __webpack_require__(32);
const graphUtils = __webpack_require__(35);
const enums_1 = __webpack_require__(19);
exports.OP_JMP = 0x0002;
const OP_JT = 0x004c;
exports.OP_JF = 0x004d;
const OP_END = 0x004e;
const OP_CLEO_END = 0x0a93;
const OP_CALL = 0x004f;
const OP_GOSUB = 0x0050;
const OP_RETURN = 0x0051;
exports.OP_NAME = 0x03a4;
exports.OP_IF = 0x00d6;
const blockEndOpcodes = [OP_END, OP_CLEO_END, OP_RETURN];
const callOpcodes = [OP_GOSUB, OP_CALL];
const branchOpcodesMap = {
    [enums_1.eGame.GTA3]: {
        [exports.OP_JMP]: enums_1.eBasicBlockType.ONE_WAY,
        [exports.OP_IF]: enums_1.eBasicBlockType.FALL,
        [exports.OP_JF]: enums_1.eBasicBlockType.TWO_WAY,
        // [OP_JT]: eBasicBlockType.TWO_WAY, // todo: different order of successor nodes
    },
    [enums_1.eGame.GTAVC]: {
        [exports.OP_JMP]: enums_1.eBasicBlockType.ONE_WAY,
        [exports.OP_IF]: enums_1.eBasicBlockType.FALL,
        [exports.OP_JF]: enums_1.eBasicBlockType.TWO_WAY,
    },
    [enums_1.eGame.GTASA]: {
        [exports.OP_JMP]: enums_1.eBasicBlockType.ONE_WAY,
        [exports.OP_IF]: enums_1.eBasicBlockType.FALL,
        [exports.OP_JF]: enums_1.eBasicBlockType.TWO_WAY,
    },
};
class CFG {
    getCallGraphs(script, allScripts) {
        const functions = [
            script.instructionMap.keys().next().value,
            ...this.findFunctions(script),
        ];
        if (script.type === enums_1.eScriptType.MAIN) {
            // some functions in MAIN are referenced only by missions/externals
            allScripts.forEach((s) => {
                if (s.type !== enums_1.eScriptType.MAIN) {
                    functions.push(...this.findGlobalFunctions(s, script));
                }
            });
        }
        const entries = [...new Set(functions)].sort();
        const basicBlocks = this.findBasicBlocks(script, entries);
        return entries.map((offset) => {
            return this.buildGraph(basicBlocks, offset, entries);
        });
    }
    buildGraph(basicBlocks, startOffset, entries) {
        const graph = new graph_1.Graph();
        const visited = [];
        const startIndex = this.findBasicBlockIndex(basicBlocks, startOffset);
        if (startIndex === -1) {
            log_1.Log.warn(errors_1.AppError.NO_BRANCH, startOffset);
            return;
        }
        const traverse = (index) => {
            if (visited[index])
                return;
            visited[index] = true;
            const bb = basicBlocks[index];
            bb.start = startOffset;
            graph.addNode(bb);
            const lastInstruction = bb.instructions[bb.instructions.length - 1];
            bb.type = this.getBasicBlockType(lastInstruction);
            switch (bb.type) {
                case enums_1.eBasicBlockType.RETURN:
                    break;
                case enums_1.eBasicBlockType.TWO_WAY:
                case enums_1.eBasicBlockType.ONE_WAY: {
                    // todo: argument could be a variable
                    const targetOffset = Instruction.getNumericParam(lastInstruction);
                    const targetOffsetAbs = Math.abs(targetOffset);
                    const targetIndex = this.findBasicBlockIndex(basicBlocks, targetOffsetAbs);
                    if (targetIndex === -1) {
                        log_1.Log.warn(errors_1.AppError.NO_BRANCH, targetOffset);
                        return;
                    }
                    if (entries.includes(targetOffsetAbs) &&
                        bb.start !== targetOffsetAbs) {
                        // one-way jump into another function is always an unstructured jump
                        // two-way jump into another function could however be legit if the IF statement is the last block of the function that naturally falls into the next function
                        // todo: unstructured jf to another function
                        if (bb.type === enums_1.eBasicBlockType.ONE_WAY) {
                            bb.type = enums_1.eBasicBlockType.UNSTRUCTURED; // jump into another function
                            break;
                        }
                        else {
                            // insert an intermediate return block as destination for this edge
                            // this guarantees that the node is 2-way, yet does not fall into the function
                            const empty = this.createBasicBlock([], enums_1.eBasicBlockType.RETURN, startOffset);
                            graph.addNode(empty);
                            graph.addEdge(bb, empty);
                        }
                    }
                    else {
                        graph.addEdge(bb, basicBlocks[targetIndex]);
                        traverse(targetIndex);
                    }
                    if (bb.type === enums_1.eBasicBlockType.ONE_WAY)
                        break; // else fallthrough
                }
                case enums_1.eBasicBlockType.FALL:
                    graph.addEdge(bb, basicBlocks[index + 1]);
                    traverse(index + 1);
                    break;
                default:
                    log_1.Log.warn(`${bb.type} is not implemented`);
            }
        };
        traverse(startIndex);
        // todo: add unvisited nodes as separate entries
        return this.patchSelfLoops(graphUtils.reversePostOrder(graph));
    }
    findBasicBlocks(script, entries) {
        let currentLeader = null;
        let instructions = [];
        const result = [];
        const leaderOffsets = [
            ...new Set(entries.concat(this.findLeaderOffsets(script))),
        ].sort((a, b) => a - b);
        if (leaderOffsets.length) {
            for (const [offset, instruction] of script.instructionMap) {
                if (leaderOffsets.includes(offset)) {
                    if (currentLeader) {
                        result.push(this.createBasicBlock(instructions));
                    }
                    currentLeader = instruction;
                    instructions = [];
                }
                instructions.push(instruction);
            }
        }
        // add last bb in the file
        result.push(this.createBasicBlock(instructions));
        return result;
    }
    findGlobalFunctions(innerScript, mainScript) {
        const res = [];
        for (const [offset, instruction] of innerScript.instructionMap) {
            if (callOpcodes.includes(instruction.opcode)) {
                const targetOffset = Instruction.getNumericParam(instruction);
                if (targetOffset >= 0) {
                    const target = mainScript.instructionMap.get(targetOffset);
                    if (!target) {
                        log_1.Log.warn(errors_1.AppError.NO_TARGET, targetOffset, offset);
                        continue;
                    }
                    res.push(targetOffset);
                }
            }
        }
        return res;
    }
    findFunctions(script) {
        const res = [];
        for (const [offset, instruction] of script.instructionMap) {
            if (callOpcodes.includes(instruction.opcode)) {
                const targetOffset = Instruction.getNumericParam(instruction);
                if (targetOffset >= 0) {
                    if (script.type !== enums_1.eScriptType.MAIN) {
                        continue;
                    }
                }
                else {
                    if (script.type === enums_1.eScriptType.MAIN) {
                        log_1.Log.warn(errors_1.AppError.INVALID_REL_OFFSET, offset);
                        continue;
                    }
                }
                const absTargetOffset = Math.abs(targetOffset);
                const target = script.instructionMap.get(absTargetOffset);
                if (!target) {
                    log_1.Log.warn(errors_1.AppError.NO_TARGET, targetOffset, offset);
                    continue;
                }
                res.push(absTargetOffset);
            }
        }
        return res;
    }
    findLeaderOffsets(script) {
        let doesThisFollowBranchInstruction = false;
        const offsets = [];
        for (const [offset, instruction] of script.instructionMap) {
            if (doesThisFollowBranchInstruction || offsets.length === 0) {
                offsets.push(offset);
            }
            if (blockEndOpcodes.includes(instruction.opcode)) {
                doesThisFollowBranchInstruction = true;
                continue;
            }
            doesThisFollowBranchInstruction = false;
            const branchType = this.getBranchType(instruction);
            if (!branchType) {
                continue;
            }
            if (branchType === enums_1.eBasicBlockType.FALL) {
                offsets.push(offset);
                // doesThisFollowBranchInstruction = true;
                continue;
            }
            const targetOffset = Instruction.getNumericParam(instruction);
            const absTargetOffset = Math.abs(targetOffset);
            const target = script.instructionMap.get(absTargetOffset);
            if (!target) {
                log_1.Log.warn(errors_1.AppError.NO_TARGET, targetOffset, offset);
                continue;
            }
            offsets.push(absTargetOffset);
            doesThisFollowBranchInstruction = true;
        }
        return offsets;
    }
    createBasicBlock(instructions, type = enums_1.eBasicBlockType.UNDEFINED, start) {
        return { type, instructions, start };
    }
    findBasicBlockIndex(basicBlocks, offset) {
        return basicBlocks.findIndex((bb) => bb.instructions[0].offset === offset);
    }
    getBranchType(instruction) {
        return branchOpcodesMap[arguments_1.GLOBAL_OPTIONS.game][instruction.opcode];
    }
    getBasicBlockType(instruction) {
        const type = this.getBranchType(instruction);
        if (type) {
            return type;
        }
        if (blockEndOpcodes.includes(instruction.opcode)) {
            return enums_1.eBasicBlockType.RETURN;
        }
        return enums_1.eBasicBlockType.FALL;
    }
    // split self-loop blocks on two blocks to provide better analysis of the CFG
    patchSelfLoops(graph) {
        const selfLoopNodes = graph.nodes.filter((node) => {
            const successors = graph.getImmSuccessors(node);
            return successors.includes(node);
        });
        if (!selfLoopNodes.length)
            return graph;
        const newGraph = graphUtils.from(graph);
        selfLoopNodes.forEach((node) => {
            const newNode = this.createBasicBlock(node.instructions.slice(1), node.type);
            node.type = enums_1.eBasicBlockType.FALL;
            node.instructions = [node.instructions[0]];
            const index = newGraph.getNodeIndex(node);
            newGraph.nodes.splice(index + 1, 0, newNode);
            newGraph.edges.forEach((edge) => {
                if (edge.from === node)
                    edge.from = newNode;
            });
            newGraph.addEdge(node, newNode);
        });
        return newGraph;
    }
}
exports.CFG = CFG;


/***/ }),
/* 34 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LoopGraph = exports.IfGraph = exports.Graph = void 0;
const arguments_1 = __webpack_require__(2);
const log_1 = __webpack_require__(20);
const graph_utils_1 = __webpack_require__(35);
class Graph {
    constructor() {
        this.nodes = [];
        this.edges = [];
    }
    addNode(...nodes) {
        nodes.forEach((node) => {
            if (!this.hasNode(node))
                this.nodes.push(node);
        });
    }
    removeNode(node) {
        this.nodes = this.nodes.filter((n) => n !== node);
        this.edges = this.edges.filter((edge) => edge.from !== node && edge.to !== node);
    }
    hasNode(node) {
        return this.nodes.includes(node);
    }
    hasEdge(from, to) {
        return this.edges.some((edge) => edge.from === from && edge.to === to);
    }
    addEdge(from, to) {
        if (!this.hasEdge(from, to))
            this.edges.push({ from, to });
    }
    getImmPredecessors(to) {
        const edges = this.edges.filter((edge) => edge.to === to);
        return edges.map((edge) => edge.from);
    }
    getImmSuccessors(from) {
        const edges = this.edges.filter((edge) => edge.from === from);
        return edges.map((edge) => edge.to);
    }
    getNodeIndex(node) {
        return this.nodes.findIndex((n) => n === node);
    }
    get hasLoop() {
        return this.latchingNodes.length > 0;
    }
    get root() {
        // todo: think of a definition of the root node
        // given graph G(N), root(G) = n in N && getImmPredecessors(n) = []
        // or given graph G(N), root(G) = n in N && n.offset = 0
        return this.nodes[0];
    }
    get latchingNodes() {
        const header = this.root;
        return this.nodes.filter((node) => {
            return (!(node instanceof Graph) && this.getImmSuccessors(node).includes(header));
        });
    }
    print(header = '') {
        if (!arguments_1.GLOBAL_OPTIONS.debugMode) {
            return;
        }
        console.group(header);
        try {
            if (this instanceof LoopGraph) {
                log_1.Log.debug('Loop type:', this.type);
                log_1.Log.debug('Follow node:');
                if (this.followNode) {
                    (0, graph_utils_1.printNode)(this.followNode, 0);
                }
                else {
                    log_1.Log.debug('undefined');
                }
                if (this.condition) {
                    log_1.Log.debug('Condition:');
                    (0, graph_utils_1.printNode)(this.condition, 0);
                }
            }
            if (this instanceof IfGraph) {
                log_1.Log.debug(`${this.type} with follow node at ${(0, graph_utils_1.getOffset)(this.followNode)}`);
                // this.thenNode.print('thenNode:');
                // this.elseNode?.print('elseNode:');
            }
            if (this.nodes.length) {
                console.group('Nodes: ');
            }
            for (let i = 0; i < this.nodes.length; i++) {
                const node = this.nodes[i];
                (0, graph_utils_1.printNode)(node, i);
            }
            if (this.nodes.length) {
                console.groupEnd();
            }
            if (this.edges.length) {
                console.group('Edges: ');
            }
            const edgesSorted = [...this.edges].sort((a, b) => {
                const aFrom = this.getNodeIndex(a.from);
                const bFrom = this.getNodeIndex(b.from);
                const aTo = this.getNodeIndex(a.to);
                const bTo = this.getNodeIndex(b.to);
                if (aFrom === bFrom)
                    return aTo - bTo;
                return aFrom - bFrom;
            });
            for (let i = 0; i < edgesSorted.length; i++) {
                const edge = edgesSorted[i];
                log_1.Log.debug(`${i}: [${(0, graph_utils_1.nodeType)(edge.from)}] ${this.getNodeIndex(edge.from)} -> ${this.getNodeIndex(edge.to)}`);
            }
            if (this.edges.length) {
                console.groupEnd();
            }
        }
        catch (e) {
            console.error(e);
        }
        console.groupEnd();
    }
}
exports.Graph = Graph;
class IfGraph extends Graph {
    constructor() {
        super(...arguments);
        this.ifNumber = 0;
    }
}
exports.IfGraph = IfGraph;
class LoopGraph extends Graph {
}
exports.LoopGraph = LoopGraph;


/***/ }),
/* 35 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.nodeType = exports.printNode = exports.getOffset = exports.transpose = exports.findIPDom = exports.findSPDom = exports.findPDom = exports.findIDom = exports.findSDom = exports.findDom = exports.from = exports.reversePostOrder = exports.split = void 0;
const utils = __webpack_require__(30);
const utils_1 = __webpack_require__(30);
const log_1 = __webpack_require__(20);
const graph_1 = __webpack_require__(34);
function split(graph) {
    if (graph.nodes.length < 1) {
        return [];
    }
    const headers = [graph.root];
    const intervals = [];
    const visited = [];
    const isCandidateNode = (g, n) => {
        return !visited[graph.getNodeIndex(n)] && !g.hasNode(n);
    };
    const markVisited = (node) => {
        visited[graph.getNodeIndex(node)] = true;
    };
    const addNode = (interval, node) => {
        interval.addNode(node);
        const succ = graph.getImmSuccessors(node);
        for (const s of succ) {
            interval.addEdge(node, s);
        }
        const pred = graph.getImmPredecessors(node);
        for (const p of pred) {
            interval.addEdge(p, node);
        }
    };
    while (headers.length) {
        const header = headers.shift();
        const interval = new graph_1.Graph();
        markVisited(header);
        addNode(interval, header);
        for (const node of graph.nodes) {
            if (isCandidateNode(interval, node)) {
                const pred = graph.getImmPredecessors(node);
                if (pred.length &&
                    utils.checkArrayIncludesArray(interval.nodes, pred)) {
                    addNode(interval, node);
                    markVisited(node);
                }
            }
        }
        for (const node of graph.nodes) {
            if (isCandidateNode(interval, node)) {
                const pred = graph.getImmPredecessors(node);
                if (pred.length &&
                    utils.checkArrayIncludeItemFromArray(interval.nodes, pred)) {
                    headers.push(node);
                    markVisited(node);
                }
            }
        }
        intervals.push(interval);
    }
    return intervals;
}
exports.split = split;
function reversePostOrder(graph) {
    const res = new graph_1.Graph();
    const visited = [];
    const traverse = (node) => {
        const index = graph.getNodeIndex(node);
        visited[index] = true;
        const successors = graph.getImmSuccessors(node);
        successors.forEach((bb) => {
            const nextIndex = graph.getNodeIndex(bb);
            if (!visited[nextIndex]) {
                traverse(bb);
            }
            res.addEdge(node, bb);
        });
        res.addNode(node);
    };
    traverse(graph.root);
    res.nodes = res.nodes.reverse();
    return res;
}
exports.reversePostOrder = reversePostOrder;
function from(graph) {
    const res = new graph_1.Graph();
    for (const node of graph.nodes) {
        res.addNode(node);
    }
    for (const edge of graph.edges) {
        res.addEdge(edge.from, edge.to);
    }
    return res;
}
exports.from = from;
/**
 * find dominators for each node in the given graph
 */
function findDom(graph) {
    const dom = graph.nodes.map((node) => {
        return node === graph.root ? [graph.root] : graph.nodes;
    });
    let isDirty;
    do {
        isDirty = false;
        graph.nodes.forEach((node, index) => {
            if (node === graph.root)
                return;
            const pred = graph.getImmPredecessors(node);
            const newDom = [
                node,
                ...utils
                    .getArrayIntersection(...pred.map((p) => dom[graph.getNodeIndex(p)]))
                    .filter((n) => n !== node),
            ];
            isDirty = isDirty || !utils.isEqual(newDom, dom[index]);
            dom[index] = newDom;
        });
    } while (isDirty);
    return dom;
}
exports.findDom = findDom;
/**
 * find strict dominators for each node in the given graph
 */
function findSDom(graph) {
    const sdom = findDom(graph);
    return sdom.map((s) => s.slice(1));
}
exports.findSDom = findSDom;
/**
 * find immediate dominators for each node in the given graph
 */
function findIDom(graph) {
    const sdom = findSDom(graph);
    const dominates = (a, b) => {
        const indexB = graph.getNodeIndex(b);
        return sdom[indexB].includes(a);
    };
    return sdom.map((dominators) => {
        return dominators.find((dominator) => {
            const otherDominators = dominators.filter((d) => d !== dominator);
            return otherDominators.every((d) => dominates(d, dominator));
        });
    });
}
exports.findIDom = findIDom;
/**
 * find post-dominators for each node in the given graph
 */
function findPDom(graph) {
    const transposed = transpose(graph);
    return findDom(transposed).reverse();
}
exports.findPDom = findPDom;
/**
 * find strict post-dominators for each node in the given graph
 */
function findSPDom(graph) {
    const sdom = findPDom(graph);
    return sdom.map((s) => s.slice(1));
}
exports.findSPDom = findSPDom;
function findIPDom(graph) {
    const sdom = findSPDom(graph);
    const dominates = (a, b) => {
        const indexB = graph.getNodeIndex(b);
        return sdom[indexB].includes(a);
    };
    return sdom.map((dominators) => {
        return dominators.find((dominator) => {
            const otherDominators = dominators.filter((d) => d !== dominator);
            return otherDominators.every((d) => dominates(d, dominator));
        });
    });
}
exports.findIPDom = findIPDom;
// todo: duplicate of reversePostOrder function
// todo: implement a common traverse method on graph level
// todo: caching? _.memoize?
function transpose(graph) {
    const res = new graph_1.Graph();
    const visited = [];
    const traverse = (node) => {
        const index = graph.getNodeIndex(node);
        visited[index] = true;
        const successors = graph.getImmSuccessors(node);
        successors.forEach((bb) => {
            const nextIndex = graph.getNodeIndex(bb);
            if (nextIndex === -1) {
                return;
            }
            if (!visited[nextIndex]) {
                traverse(bb);
            }
            // res.addEdge(node, bb);
            res.addEdge(bb, node);
        });
        res.addNode(node);
    };
    traverse(graph.root);
    // res.nodes = res.nodes.reverse();
    return res;
}
exports.transpose = transpose;
function getOffset(node) {
    var _a, _b;
    if (node instanceof graph_1.Graph) {
        if (node.nodes.length) {
            return getOffset(node.nodes[0]);
        }
        return -1;
    }
    return (_b = (_a = node.instructions[0]) === null || _a === void 0 ? void 0 : _a.offset) !== null && _b !== void 0 ? _b : -1;
}
exports.getOffset = getOffset;
function printNode(node, index) {
    var _a, _b, _c;
    if (node instanceof graph_1.Graph) {
        log_1.Log.debug(`${index}: [${getOffset(node)}] ${nodeType(node)}`);
    }
    else {
        const type = nodeType(node);
        const { instructions } = node;
        const { offset, opcode } = (_a = instructions[0]) !== null && _a !== void 0 ? _a : { offset: -1, opcode: -1 };
        log_1.Log.debug(`${index}: [${offset}] ${type}. ${(0, utils_1.opcodeToHex)(opcode)}...${(0, utils_1.opcodeToHex)((_c = (_b = instructions.at(-1)) === null || _b === void 0 ? void 0 : _b.opcode) !== null && _c !== void 0 ? _c : -1)}`);
    }
}
exports.printNode = printNode;
function nodeType(node) {
    if (node instanceof graph_1.LoopGraph)
        return 'LOOP';
    if (node instanceof graph_1.IfGraph)
        return 'IF';
    switch (node.type) {
        case 0:
            return 'UNDEFINED';
        case 1:
            return 'RETURN';
        case 2:
            return 'ONE_WAY';
        case 3:
            return 'TWO_WAY';
        case 4:
            return 'FALL';
        case 5:
            return 'N_WAY';
        case 6:
            return 'BREAK';
        case 7:
            return 'CONTINUE';
        case 8:
            return 'UNSTRUCTURED';
        default:
            return `UNKNOWN`;
    }
}
exports.nodeType = nodeType;


/***/ }),
/* 36 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getDefinitions = exports.CommandAttributes = exports.PrimitiveType = void 0;
const arguments_1 = __webpack_require__(2);
const enums_1 = __webpack_require__(19);
const file = __webpack_require__(22);
const utils = __webpack_require__(30);
const errors_1 = __webpack_require__(18);
const log_1 = __webpack_require__(20);
const browser_or_node_1 = __webpack_require__(5);
const node_fetch_1 = __webpack_require__(37);
var PrimitiveType;
(function (PrimitiveType) {
    PrimitiveType["any"] = "any";
    PrimitiveType["arguments"] = "arguments";
    PrimitiveType["boolean"] = "bool";
    PrimitiveType["float"] = "float";
    PrimitiveType["int"] = "int";
    PrimitiveType["label"] = "label";
    PrimitiveType["string"] = "string";
    PrimitiveType["string128"] = "string128";
    PrimitiveType["gxt_key"] = "gxt_key";
    PrimitiveType["zone_key"] = "zone_key";
    PrimitiveType["model_any"] = "model_any";
    PrimitiveType["model_char"] = "model_char";
    PrimitiveType["model_object"] = "model_object";
    PrimitiveType["model_vehicle"] = "model_vehicle";
    PrimitiveType["int_script_id"] = "script_id";
    PrimitiveType["vector3"] = "Vector3";
})(PrimitiveType = exports.PrimitiveType || (exports.PrimitiveType = {}));
exports.CommandAttributes = [
    'is_branch',
    'is_condition',
    'is_constructor',
    'is_destructor',
    'is_keyword',
    'is_nop',
    'is_overload',
    'is_segment',
    'is_static',
    'is_unsupported',
];
function getDefinitions() {
    return __awaiter(this, void 0, void 0, function* () {
        const definitionMap = {
            [enums_1.eGame.GTA3]: 'gta3.json',
            [enums_1.eGame.GTAVC]: 'vc.json',
            [enums_1.eGame.GTASA]: 'sa.json',
        };
        const definitionMapSBL = {
            [enums_1.eGame.GTA3]: 'https://raw.githubusercontent.com/sannybuilder/library/master/gta3/gta3.json',
            [enums_1.eGame.GTAVC]: 'https://raw.githubusercontent.com/sannybuilder/library/master/vc/vc.json',
            [enums_1.eGame.GTASA]: 'https://raw.githubusercontent.com/sannybuilder/library/master/sa/sa.json',
        };
        const definitionFile = browser_or_node_1.isBrowser
            ? definitionMapSBL[arguments_1.GLOBAL_OPTIONS.game]
            : definitionMap[arguments_1.GLOBAL_OPTIONS.game];
        try {
            let data;
            if (browser_or_node_1.isBrowser) {
                const response = yield fetch(definitionFile);
                data = yield response.json();
            }
            else {
                if (file.fileExists(definitionFile)) {
                    data = yield file.loadJson(definitionFile);
                }
                else {
                    const response = yield (0, node_fetch_1.default)(definitionMapSBL[arguments_1.GLOBAL_OPTIONS.game]);
                    data = (yield response.json());
                    file.saveToFile(definitionFile, JSON.stringify(data, null, 2));
                }
            }
            const map = new Map();
            data.extensions.forEach((extension) => {
                extension.commands.forEach((command) => {
                    const { name, input, id, output } = command;
                    const params = [...(input || []), ...(output || [])].map((param) => {
                        return { type: param.type };
                    });
                    map.set(utils.hexToOpcode(id), { name, params });
                });
            });
            return map;
        }
        catch (_a) {
            throw log_1.Log.error(errors_1.AppError.NO_OPCODE, definitionFile);
        }
    });
}
exports.getDefinitions = getDefinitions;


/***/ }),
/* 37 */
/***/ ((module, exports, __webpack_require__) => {

"use strict";


// ref: https://github.com/tc39/proposal-global
var getGlobal = function () {
	// the only reliable means to get the global object is
	// `Function('return this')()`
	// However, this causes CSP violations in Chrome apps.
	if (typeof self !== 'undefined') { return self; }
	if (typeof window !== 'undefined') { return window; }
	if (typeof __webpack_require__.g !== 'undefined') { return __webpack_require__.g; }
	throw new Error('unable to locate global object');
}

var globalObject = getGlobal();

module.exports = exports = globalObject.fetch;

// Needed for TypeScript and Webpack.
if (globalObject.fetch) {
	exports["default"] = globalObject.fetch.bind(globalObject);
}

exports.Headers = globalObject.Headers;
exports.Request = globalObject.Request;
exports.Response = globalObject.Response;


/***/ }),
/* 38 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
__exportStar(__webpack_require__(33), exports);
__exportStar(__webpack_require__(35), exports);
__exportStar(__webpack_require__(39), exports);
__exportStar(__webpack_require__(40), exports);
__exportStar(__webpack_require__(34), exports);


/***/ }),
/* 39 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.findIfs = exports.getIfType = void 0;
const graphUtils = __webpack_require__(35);
const graph_1 = __webpack_require__(34);
const enums_1 = __webpack_require__(19);
const log_1 = __webpack_require__(20);
const errors_1 = __webpack_require__(18);
const cfg_1 = __webpack_require__(33);
const instructions_1 = __webpack_require__(32);
const graph_utils_1 = __webpack_require__(35);
function getIfType(graph, ifHeader, followNode) {
    const headerSuccessors = graph.getImmSuccessors(ifHeader);
    return headerSuccessors.includes(followNode)
        ? enums_1.eIfType.IF_THEN
        : enums_1.eIfType.IF_THEN_ELSE;
}
exports.getIfType = getIfType;
function findIfs(graph) {
    const twoWayNodes = graph.nodes.filter((node) => {
        if (node instanceof graph_1.Graph)
            return false;
        // const successors = graph.getImmSuccessors(node);
        // return successors.length === 2;
        return node.type === enums_1.eBasicBlockType.TWO_WAY;
    });
    if (twoWayNodes.length === 0) {
        log_1.Log.debug('No 2-way nodes found. Stopping.');
        return graph;
    }
    const findFollowNode = (header) => {
        const pdom = graphUtils.findIPDom(graph);
        const index = graph.getNodeIndex(header);
        if (pdom[index])
            return pdom[index];
        /*
                once we reach this point we must have found a IF..THEN construct
                and the flow graph has an exit node in its THEN clause
    
                if (cond) {
                    exit
                }
    
                the follow node must be determined as the target of the JF instruction
    
                IF..THEN..ELSE.. construct could not be there as
                the compiler must put a JMP instruction between THEN and ELSE clauses
                meaning the flow won't interrupt here
    
                it could be possible a follow node is not found
                when IF is the last instruction of a script
                but this is a malformed script and not covered by the decompiler yet
    
            */
        const succ = graph.getImmSuccessors(header);
        return succ[0];
    };
    const replaceIf = (header, followNode) => {
        var _a, _b, _c;
        const ifHeaderSuccessors = graph.getImmSuccessors(header);
        const ifGraph = new graph_1.IfGraph();
        ifGraph.followNode = followNode;
        const followIndex = graph.getNodeIndex(followNode);
        const ifType = getIfType(graph, header, followNode);
        ifGraph.type = ifType;
        ifGraph.ifNumber = getIfCondNumber(header);
        ifGraph.print(`New IF graph`);
        if (ifType === enums_1.eIfType.IF_THEN) {
            const thenHeader = ifHeaderSuccessors.at(-1);
            const thenIndex = graph.getNodeIndex(thenHeader);
            ifGraph.thenNode = new graph_1.Graph();
            for (let i = thenIndex; i < followIndex; i++) {
                ifGraph.thenNode.addNode(graph.nodes[i]);
            }
            if (ifGraph.thenNode.nodes.length === 0) {
                log_1.Log.debug(`IF..THEN construct without THEN clause`);
            }
        }
        else {
            const [elseHeader, thenHeader] = ifHeaderSuccessors;
            ifGraph.thenNode = new graph_1.Graph();
            ifGraph.elseNode = new graph_1.Graph();
            const thenIndex = graph.getNodeIndex(thenHeader);
            const elseIndex = graph.getNodeIndex(elseHeader);
            for (let i = thenIndex; i < elseIndex; i++) {
                ifGraph.thenNode.addNode(graph.nodes[i]);
            }
            for (let i = elseIndex; i < followIndex; i++) {
                ifGraph.elseNode.addNode(graph.nodes[i]);
            }
            if (ifGraph.thenNode.nodes.length === 0) {
                log_1.Log.debug(`IF..THEN construct without THEN clause`);
            }
            if (ifGraph.elseNode.nodes.length === 0) {
                log_1.Log.warn(`IF..THEN construct without ELSE clause`);
            }
        }
        ifGraph.addNode(header);
        const reduced = new graph_1.Graph();
        for (const node of graph.nodes) {
            if (!ifGraph.thenNode.hasNode(node) &&
                !((_a = ifGraph.elseNode) === null || _a === void 0 ? void 0 : _a.hasNode(node)) &&
                node !== header) {
                reduced.addNode(node);
            }
            if (node == header) {
                reduced.addNode(ifGraph);
            }
        }
        reduced.addEdge(ifGraph, ifGraph.followNode);
        for (const edge of graph.edges) {
            if (ifGraph.thenNode.hasNode(edge.from) ||
                ((_b = ifGraph.elseNode) === null || _b === void 0 ? void 0 : _b.hasNode(edge.from))) {
                if (edge.from.type === enums_1.eBasicBlockType.UNSTRUCTURED) {
                    reduced.addEdge(ifGraph, edge.to);
                }
                // if another edge originates from the loop, it is either BREAK or CONTINUE
                // we don't need to add it to the new graph
                continue;
            }
            if (!ifGraph.thenNode.hasEdge(edge.from, edge.to) &&
                !((_c = ifGraph.elseNode) === null || _c === void 0 ? void 0 : _c.hasEdge(edge.from, edge.to)) &&
                edge.from !== header) {
                if (edge.to === header) {
                    edge.to = ifGraph;
                }
                reduced.addEdge(edge.from, edge.to);
            }
        }
        return reduced;
    };
    const head = twoWayNodes.at(-1);
    log_1.Log.debug("Finding follow node for node at " + (0, graph_utils_1.getOffset)(head));
    const tail = findFollowNode(head);
    if (!tail) {
        throw log_1.Log.error(errors_1.AppError.NODE_NOT_FOUND);
    }
    let res = replaceIf(head, tail);
    res.print(`New graph after replacing IF node (${twoWayNodes.length - 1} left)`);
    // recursively structure until no more 2-way nodes are found
    return findIfs(res);
}
exports.findIfs = findIfs;
function getIfCondNumber(header) {
    // const pred = res.getImmPredecessors(header);
    // if (
    //   pred.length === 1 &&
    //   (pred[0] as IBasicBlock).type === eBasicBlockType.FALL
    // ) {
    //   const { instructions } = pred[0] as IBasicBlock;
    //   if (instructions.length === 1 && instructions[0].opcode === OP_IF) {
    //     return getNumericParam(instructions[0]);
    //   }
    // }
    const { instructions } = header;
    if (instructions.length > 1 && instructions[0].opcode === cfg_1.OP_IF) {
        return (0, instructions_1.getNumericParam)(instructions[0]);
    }
    log_1.Log.debug(errors_1.AppError.NO_IF_PREDICATE, (0, graph_utils_1.getOffset)(header));
    return 0;
}


/***/ }),
/* 40 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.findLoops = exports.findFollowNode = exports.getLoopType = void 0;
const graphUtils = __webpack_require__(35);
const graph_1 = __webpack_require__(34);
const enums_1 = __webpack_require__(19);
const conditions_utils_1 = __webpack_require__(39);
const log_1 = __webpack_require__(20);
const graph_utils_1 = __webpack_require__(35);
function getLoopType(graph, loop, loopHeader, latchingNode) {
    const headerSuccessors = graph.getImmSuccessors(loopHeader);
    const latchingNodeSuccessors = graph.getImmSuccessors(latchingNode);
    if (latchingNodeSuccessors.length === 2) {
        return enums_1.eLoopType.POST_TESTED;
    }
    if (headerSuccessors.length === 2) {
        if (!loop.hasNode(headerSuccessors[0]) ||
            !loop.hasNode(headerSuccessors[1])) {
            return enums_1.eLoopType.PRE_TESTED;
        }
    }
    return enums_1.eLoopType.ENDLESS;
}
exports.getLoopType = getLoopType;
function findFollowNode(graph, loop, loopHeader, latchingNode) {
    if (loop.type === enums_1.eLoopType.PRE_TESTED) {
        const headerSuccessors = graph.getImmSuccessors(loopHeader);
        if (loop.hasNode(headerSuccessors[0])) {
            return headerSuccessors[1];
        }
        return headerSuccessors[0];
    }
    if (loop.type === enums_1.eLoopType.POST_TESTED) {
        const latchingNodeSuccessors = graph.getImmSuccessors(latchingNode);
        if (loop.hasNode(latchingNodeSuccessors[0])) {
            return latchingNodeSuccessors[1];
        }
        return latchingNodeSuccessors[0];
    }
    if (loop.type === enums_1.eLoopType.ENDLESS) {
        const loopNodes = loop.nodes;
        let minIndex = graph.nodes.length;
        const headerIndex = graph.getNodeIndex(loopHeader);
        for (const node of loopNodes) {
            // find a closest node that is not in the loop
            graph
                .getImmSuccessors(node)
                .filter((s) => !loop.hasNode(s))
                .forEach((s) => {
                const index = graph.getNodeIndex(s);
                if (index > headerIndex) {
                    minIndex = Math.min(minIndex, index);
                }
            });
        }
        if (minIndex !== graph.nodes.length) {
            return graph.nodes[minIndex];
        }
    }
}
exports.findFollowNode = findFollowNode;
function findLoops(graph) {
    graph.print('Finding loops in this graph:');
    const intervals = graphUtils.split(graph);
    log_1.Log.debug(`Found ${intervals.filter((i) => i.hasLoop).length} loop(s) in ${intervals.length} interval(s).`);
    // for (let i = 0; i < intervals.length; i++) {
    //   if (intervals[i].hasLoop) {
    //     intervals[i].print(`LOOP INTERVAL ${i}:`);
    //   }
    // }
    const index = intervals.findIndex((i) => i.hasLoop);
    if (index === -1) {
        // todo: should we run ifStructure there?
        return graph;
    }
    const reducible = intervals[index];
    reducible.print(`\nPicked interval ${index} for structuring.`);
    // there could be multiple latching nodes (Continue statements) referencing the loop root
    // therefore picking up the last one
    const lastNode = reducible.latchingNodes.at(-1);
    const lastNodeIndex = reducible.getNodeIndex(lastNode);
    // populating loop with inner nodes and
    // replacing nodes in the original graph with a single node
    // producing a new graph for the next iteration
    const loop = new graph_1.LoopGraph();
    loop.nodes = reducible.nodes.filter((n, i) => i <= lastNodeIndex);
    loop.edges = reducible.edges.filter((e) => loop.hasNode(e.from) //&& loop.hasNode(e.to)
    );
    loop.type = getLoopType(graph, loop, reducible.root, lastNode);
    loop.followNode = findFollowNode(graph, loop, reducible.root, lastNode);
    // now it is time to find exit nodes and identify them as Break, Continue or Unstructured jumps
    // ONE_WAY -> exit are BREAKs;
    // ONE_WAY -> last node or header are CONTINUEs;
    // TWO_WAY exit nodes:
    // - loop is POST_TESTED && node is last: jf->header; make it the loop condition and delete from the loop
    // - loop is PRE_TESTED && node is first: jf->exit; make it the loop condition and delete from the loop
    // - else: abnormal exit, should not be structured as if block; change to UNSTRUCTURED
    if (loop.type === enums_1.eLoopType.PRE_TESTED) {
        loop.condition = loop.root;
    }
    if (loop.type === enums_1.eLoopType.POST_TESTED) {
        loop.condition = lastNode;
    }
    for (const node of loop.nodes) {
        if (node === loop.root || node === lastNode) {
            continue;
        }
        if (node.type !== enums_1.eBasicBlockType.ONE_WAY) {
            continue;
        }
        const successors = graph.getImmSuccessors(node);
        const next = successors[0];
        if (next === loop.followNode) {
            log_1.Log.debug(`Found 'BREAK' at ${(0, graph_utils_1.getOffset)(node)}`);
            node.type = enums_1.eBasicBlockType.BREAK;
        }
        else if (next === loop.root || next === lastNode) {
            if (next === loop.root && loop.type === enums_1.eLoopType.POST_TESTED) {
                log_1.Log.debug(`Found 'JUMP' from ${(0, graph_utils_1.getOffset)(node)} to ${(0, graph_utils_1.getOffset)(next)}`);
                node.type = enums_1.eBasicBlockType.UNSTRUCTURED;
            }
            else {
                log_1.Log.debug(`Found 'CONTINUE' at ${(0, graph_utils_1.getOffset)(node)}`);
                node.type = enums_1.eBasicBlockType.CONTINUE;
            }
        }
        else {
            log_1.Log.debug(`Found 'JUMP' from ${(0, graph_utils_1.getOffset)(node)} to ${(0, graph_utils_1.getOffset)(next)}`);
            node.type = enums_1.eBasicBlockType.UNSTRUCTURED;
        }
    }
    // loop.edges = loop.edges.filter(({ to }) => loop.hasNode(to));
    loop.print('Creating a loop node');
    let reduced = new graph_1.Graph();
    for (const node of graph.nodes) {
        if (!loop.hasNode(node)) {
            reduced.addNode(node);
        }
        if (node === loop.root) {
            reduced.addNode(loop);
        }
    }
    // follow node could be undefined if the loop is the last node in the graph
    if (loop.followNode) {
        reduced.addEdge(loop, loop.followNode);
    }
    for (const edge of graph.edges) {
        if (loop.hasNode(edge.from) && !loop.hasNode(edge.to)) {
            if (edge.from.type === enums_1.eBasicBlockType.UNSTRUCTURED) {
                // when there is an unstructured jump from the loop we must add it,
                // otherwise the nodes that the jump is pointing to could become unreachable
                // todo: rethink RPO algo to iterate over all nodes and create multiple disjoint graphs
                // // line below breaks TAXI script
                reduced.addEdge(loop, edge.to);
            }
            // if another edge originates from the loop, it is a BREAK
            // we don't need to add it to the new graph
            continue;
        }
        if (!loop.hasEdge(edge.from, edge.to)) {
            if (edge.to === loop.root) {
                edge.to = loop;
            }
            reduced.addEdge(edge.from, edge.to);
        }
    }
    // sort nodes in the new graph in topological order
    reduced = graphUtils.reversePostOrder(reduced);
    reduced.print('Replacing loop with a single node. New graph:');
    const loopBody = (0, conditions_utils_1.findIfs)(loop);
    loop.nodes = loopBody.nodes;
    return findLoops(reduced);
}
exports.findLoops = findLoops;


/***/ }),
/* 41 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ExpressionPrinter = void 0;
const SimplePrinter_1 = __webpack_require__(42);
const utils = __webpack_require__(30);
const log_1 = __webpack_require__(20);
const cfg_1 = __webpack_require__(33);
const arguments_1 = __webpack_require__(2);
const enums_1 = __webpack_require__(19);
class ExpressionPrinter extends SimplePrinter_1.SimplePrinter {
    constructor(definitionMap) {
        super(definitionMap);
        this.indent = 0;
    }
    get indentation() {
        return utils.strPadLeft('', this.indent * 4, ' ');
    }
    printLine(line) {
        log_1.Log.msg(this.indentation + line);
    }
    print(bb, printComments = false) {
        var _a;
        let output = '';
        const append = (format, ...args) => (output += log_1.Log.format(format, ...args));
        if (printComments && bb.instructions.length) {
            const offset = utils.strPadLeft((_a = bb.instructions[0]) === null || _a === void 0 ? void 0 : _a.offset.toString(), 6);
            // append(`// %s:%s\n`, offset, eBasicBlockType[bb.type]);
        }
        bb.instructions.forEach((instruction) => {
            const id = instruction.opcode;
            if (id > 0x7fff) {
                append('NOT ');
            }
            if (!arguments_1.GLOBAL_OPTIONS.debugMode && [cfg_1.OP_JF, cfg_1.OP_IF].includes(id)) {
                return;
            }
            if (!arguments_1.GLOBAL_OPTIONS.debugMode &&
                id === cfg_1.OP_JMP &&
                bb.type !== enums_1.eBasicBlockType.UNSTRUCTURED) {
                return;
            }
            const definition = this.definitionMap.get(instruction.opcode & 0x7fff);
            output += definition.name;
            for (const param of instruction.params) {
                if (utils.isArrayParam(param.type)) {
                    const a = param.value;
                    append(`(%s %s %s %s)`, a.varIndex, a.offset, a.size, a.props);
                }
                else {
                    append(' ' + param.value);
                }
            }
            this.printLine(output);
            output = '';
        });
        if (bb.type === enums_1.eBasicBlockType.BREAK) {
            this.printLine('break');
        }
        if (bb.type === enums_1.eBasicBlockType.CONTINUE) {
            this.printLine('continue');
        }
    }
    stringifyCondition(bb) {
        this.indent++;
        const result = bb.instructions
            .map(({ opcode, params }) => {
            let output = '';
            const append = (format, ...args) => (output += log_1.Log.format(format, ...args));
            const id = opcode;
            if (id > 0x7fff) {
                append('NOT ');
            }
            if ([cfg_1.OP_JF, cfg_1.OP_IF, cfg_1.OP_JMP].includes(id)) {
                return '';
            }
            const definition = this.definitionMap.get(opcode & 0x7fff);
            append(definition.name);
            for (let i = 0; i < params.length; i++) {
                const param = params[i];
                if (utils.isArrayParam(param.type)) {
                    const a = param.value;
                    append(`(%s %s %s %s)`, a.varIndex, a.offset, a.size, a.props);
                }
                else {
                    append(' ' + param.value);
                }
            }
            return output;
        })
            .filter(Boolean)
            .join(`\n${this.indentation}`);
        this.indent--;
        return result;
    }
}
exports.ExpressionPrinter = ExpressionPrinter;


/***/ }),
/* 42 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SimplePrinter = void 0;
const utils = __webpack_require__(30);
const log_1 = __webpack_require__(20);
const enums_1 = __webpack_require__(19);
class SimplePrinter {
    constructor(definitionMap) {
        this.definitionMap = definitionMap;
    }
    printLine(line) {
        log_1.Log.msg(line);
    }
    print(bb, printComments = false) {
        let output = '';
        const append = (format, ...args) => (output += log_1.Log.format(format, ...args));
        if (printComments) {
            append(`// BB type: %s\n`, enums_1.eBasicBlockType[bb.type]);
        }
        bb.instructions.forEach((instruction, i) => {
            const id = instruction.opcode;
            if (printComments) {
                append(`/* %s */ `, utils.strPadLeft(instruction.offset.toString(), 6));
            }
            append(`%s: `, utils.opcodeToHex(id));
            if (id > 0x7fff) {
                append('NOT ');
            }
            const definition = this.definitionMap.get(instruction.opcode & 0x7fff);
            output += definition.name;
            for (const param of instruction.params) {
                if (utils.isArrayParam(param.type)) {
                    const a = param.value;
                    append(`(%s %s %s %s)`, a.varIndex, a.offset, a.size, a.props);
                }
                else {
                    append(' ' + param.value);
                }
            }
            if (i < bb.instructions.length - 1) {
                append('\n');
            }
        });
        append('\n');
        this.printLine(output);
    }
}
exports.SimplePrinter = SimplePrinter;


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
const main_1 = __webpack_require__(1);
const browser_or_node_1 = __webpack_require__(5);
const arguments_1 = __webpack_require__(2);
if (browser_or_node_1.isBrowser) {
    globalThis.decompile = main_1.main;
    globalThis.updateArguments = arguments_1.updateArguments;
}
else {
    (0, main_1.main)(arguments_1.GLOBAL_OPTIONS.inputFile).catch((e) => {
        console.error(e.stack || `[CUSTOM ERROR]: ${e}`);
    });
}

})();

/******/ })()
;
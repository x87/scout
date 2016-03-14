/// <reference path="../typings/tsd.d.ts"/>
/// <reference path="common/enums.ts"/>
/// <reference path="common/errors.ts"/>
/// <reference path="utils/Log.ts"/>
/// <reference path="common/arguments.ts"/>
/// <reference path="common/paths.ts"/>
/// <reference path="common/interfaces.ts"/>
/// <reference path="frontend/ScriptFile.ts"/>
/// <reference path="frontend/CFGProcessor.ts"/>
/// <reference path="frontend/OpcodeParser.ts"/>
/// <reference path="frontend/Loader.ts"/>
/// <reference path="frontend/Disassembler.ts"/>
/// <reference path="utils/fsHelpers.ts"/>
/// <reference path="utils/helpers.ts"/>
/// <reference path="utils/helpers.ts"/>

import eParamType = scout.common.eParamType;
import eGame = scout.common.eGame;
import eScriptFileSegments = scout.common.eScriptFileSegments;
import eCompiledFileType = scout.common.eCompiledFileType;
import eBasicBlockType = scout.common.eBasicBlockType;

import Arguments = scout.common.Arguments;
import Paths = scout.common.paths;
import IOpcodeData = scout.common.IOpcodeData;
import IOpcodeDataParam = scout.common.IOpcodeDataParam;
import IOpcode = scout.common.IOpcode;
import IOpcodeParam = scout.common.IOpcodeParam;
import IOpcodeParamArray = scout.common.IOpcodeParamArray;
import IScriptFileHeader = scout.common.IScriptFileHeader;
import ICompiledFile = scout.common.ICompiledFile;
import IBasicBlock = scout.common.IBasicBlock;

import CScriptFile = scout.frontend.CScriptFile;
import CScriptFileSCM = scout.frontend.CScriptFileSCM;
import CScriptFileHeader = scout.frontend.CScriptFileHeader;
import CDisassembler = scout.frontend.CDisassembler;
import COpcodeParser = scout.frontend.COpcodeParser;
import CCFGProcessor = scout.frontend.CCFGProcessor;
import Loader = scout.frontend.Loader;

import TOpcodesMap = scout.common.TOpcodesMap;
import helpers = scout.utils.Helpers;
import fsHelpers = scout.fsHelpers;
import Log = scout.utils.Log;

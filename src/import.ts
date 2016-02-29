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
import CExternalScriptHeader = scout.frontend.CExternalScriptHeader;
import CDisassembler = scout.frontend.CDisassembler;
import COpcodeParser = scout.frontend.COpcodeParser;
import CCFGProcessor = scout.frontend.CCFGProcessor;
import CLoader = scout.frontend.CLoader;

import TOpcodesMap = scout.common.TOpcodesMap;
import helpers = scout.utils.Helpers;
import fsHelpers = scout.fsHelpers;
import Log = scout.utils.Log;

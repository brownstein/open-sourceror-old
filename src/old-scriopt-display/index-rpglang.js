import {
  createText,
  createRunicText,
  loadAllFonts
} from "./text";
import {
  convertScriptToSlices
} from "./js-to-runes";
import {
  CircleGroupSlice,
  CircleStackSlice,
  CircleTextSlice,
  runLayout
} from "./text-circles";

const RPGLangLib = {
  createText,
  createRunicText,
  loadAllFonts,

  CircleGroupSlice,
  CircleStackSlice,
  CircleTextSlice,

  runLayout,

  convertScriptToSlices
};

export default RPGLangLib;

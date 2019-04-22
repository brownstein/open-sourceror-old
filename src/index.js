import {
  createText,
  createRunicText,
  loadAllFonts
} from "./text";
import {
  scriptToCircle
} from "./js-to-runes";
import {
  convertScriptToSlices
} from "./js-to-runes-2";
import {
  CircleGroupSlice,
  CircleStackSlice,
  CircleTextSlice,
  runLayout
} from "./text-circles";

console.log({ CircleGroupSlice });

const RPGLangLib = {
  createText,
  createRunicText,
  loadAllFonts,

  scriptToCircle,

  CircleGroupSlice,
  CircleStackSlice,
  CircleTextSlice,

  runLayout,

  convertScriptToSlices
};

export default RPGLangLib;

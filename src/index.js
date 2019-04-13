import {
  createText,
  createRunicText,
  loadAllFonts
} from "./text";
import {
  CircleSlice,
  SymbolText,
  SymbolTextCircleSlice,
  applyCircularLayout
} from "./lang-shapes";
import {
  scriptToCircle
} from "./js-to-runes";
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

  CircleSlice,
  SymbolText,
  SymbolTextCircleSlice,
  applyCircularLayout,

  scriptToCircle,

  CircleGroupSlice,
  CircleStackSlice,
  CircleTextSlice,

  runLayout
};

export default RPGLangLib;

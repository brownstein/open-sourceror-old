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


const RPGLangLib = {
  createText,
  createRunicText,
  loadAllFonts,

  CircleSlice,
  SymbolText,
  SymbolTextCircleSlice,
  applyCircularLayout,

  scriptToCircle
};

export default RPGLangLib;

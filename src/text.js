import createTextGeometry from "three-bmfont-text";
import loadBMFont from "load-bmfont/browser";
import SDFShader from 'three-bmfont-text/shaders/sdf';
import menloFnt from "./fonts/menlo-sdf.fnt";
import menloPng from "./fonts/menlo-sdf.png";
import graceOfEtroFnt from "./fonts/grace-of-etro-sdf.fnt";
import graceOfEtroPng from "./fonts/grace-of-etro-sdf.png";
import {
  DoubleSide,
  TextureLoader,
  RawShaderMaterial,
  Mesh
} from "three";

var texLoader = new TextureLoader();
var _normalFont = null;
var _normalTexture = null;
var _runicFont = null;
var _runicTexture = null;

export async function loadNormalFont () {
  if (!_normalFont) {
    _normalFont = await new Promise ((resolve, reject) =>
      loadBMFont(menloFnt, (err, fnt) => {
        if (err) {
          return reject(err);
        }
        resolve(fnt);
      })
    );
  }
  if (!_normalTexture) {
    _normalTexture = await new Promise ((resolve, reject) =>
      texLoader.load(menloPng, tex => {
        resolve(tex);
      })
    );
  }
}

export async function loadRunicFont () {
  if (!_runicFont) {
    _runicFont = await new Promise ((resolve, reject) =>
      loadBMFont(graceOfEtroFnt, (err, fnt) => {
        if (err) {
          return reject(err);
        }
        resolve(fnt);
      })
    );
  }
  if (!_runicTexture) {
    _runicTexture = await new Promise ((resolve, reject) =>
      texLoader.load(graceOfEtroPng, tex => {
        resolve(tex);
      })
    );
  }
}

export async function loadAllFonts () {
  await loadNormalFont();
  await loadRunicFont();
}

export function createText (text, { color } = {}) {
  const geom = createTextGeometry({
    align: "left",
    font: _normalFont
  });
  geom.update(text);
  const material = new RawShaderMaterial(SDFShader({
    map: _normalTexture,
    transparent: true,
    color: color || 0xffffff,
    side: DoubleSide
  }));
  return new Mesh(geom, material);
}

export function createRunicText (text, { color } = {}) {
  const geom = createTextGeometry({
    align: "left",
    font: _runicFont
  });
  geom.update(text);
  const material = new RawShaderMaterial(SDFShader({
    map: _runicTexture,
    transparent: true,
    color: color || 0xffffff,
    side: DoubleSide
  }));
  return new Mesh(geom, material);
}

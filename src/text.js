import createTextGeometry from "three-bmfont-text";
import loadBMFont from "load-bmfont/browser";
import SDFShader from 'three-bmfont-text/shaders/sdf';
import graceOfEtroFnt from "./fonts/bmf-grace-of-etro-sdf.fnt";
import graceOfEtroPng from "./fonts/bmf-grace-of-etro-sdf.png";
import {
  DoubleSide,
  TextureLoader,
  RawShaderMaterial,
  Mesh
} from "three";

var texLoader = new TextureLoader();
var _runicFont = null;
var _runicTexture = null;

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

export async function createRunicText (text) {
  const geom = createTextGeometry({
    align: "left",
    font: _runicFont
  });
  geom.update(text);
  console.log({ _runicFont, geom });
  // const mat = new RawShaderMaterial(SDFShader({
  //   map: _runicTexture,
  //   transparent: true,
  //   side: DoubleSide,
  //   color: 'rgb(230, 230, 230)'
  // }));
  const material = new RawShaderMaterial(SDFShader({
    map: _runicTexture,
    transparent: true,
    color: 0xaa0000,
    side: DoubleSide
  }));
  console.log(material);
  return new Mesh(geom, material);
}

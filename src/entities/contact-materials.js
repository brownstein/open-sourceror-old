import { ContactMaterial } from "p2";

import { characterMaterial } from "./character/base";
import { terrainMaterial } from "./terrain";

export default function getContactMaterialPairs () {
  return [
    // friction between player and world
    new ContactMaterial(characterMaterial, terrainMaterial, {
      friction: 1
    })
  ];
}
